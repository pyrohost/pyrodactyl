<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Exception;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\ServerOperations\ServerOperationService;
use Pterodactyl\Services\ServerOperations\ServerStateValidationService;
use Pterodactyl\Services\ServerOperations\EggChangeService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\RenameServerRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetDockerImageRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\RevertDockerImageRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetEggRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\PreviewEggRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\ApplyEggChangeRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\ReinstallServerRequest;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class SettingsController extends ClientApiController
{
    public function __construct(
        private ServerRepository $repository,
        private ReinstallServerService $reinstallServerService,
        private StartupModificationService $startupModificationService,
        private DaemonFileRepository $fileRepository,
        private ServerOperationService $operationService,
        private ServerStateValidationService $validationService,
        private EggChangeService $eggChangeService,
    ) {
        parent::__construct();
    }

    public function rename(RenameServerRequest $request, Server $server): JsonResponse
    {
        $name = $request->input('name');
        $description = $request->has('description') ? (string) $request->input('description') : $server->description;
        $this->repository->update($server->id, [
            'name' => $name,
            'description' => $description,
        ]);

        if ($server->name !== $name) {
            Activity::event('server:settings.rename')
                ->property(['old' => $server->name, 'new' => $name])
                ->log();
        }

        if ($server->description !== $description) {
            Activity::event('server:settings.description')
                ->property(['old' => $server->description, 'new' => $description])
                ->log();
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    public function reinstall(ReinstallServerRequest $request, Server $server): JsonResponse
    {
        $this->reinstallServerService->handle($server);
        Activity::event('server:reinstall')->log();
        return new JsonResponse([], Response::HTTP_ACCEPTED);
    }

    public function dockerImage(SetDockerImageRequest $request, Server $server): JsonResponse
    {
        if (!in_array($request->input('docker_image'), array_values($server->egg->docker_images))) {
            throw new BadRequestHttpException('The requested Docker image is not allowed for this server.');
        }

        $original = $server->image;
        $server->forceFill(['image' => $request->input('docker_image')])->saveOrFail();

        if ($original !== $server->image) {
            Activity::event('server:startup.image')
                ->property(['old' => $original, 'new' => $request->input('docker_image')])
                ->log();
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    public function revertDockerImage(RevertDockerImageRequest $request, Server $server): JsonResponse
    {
        $server->validateCurrentState();

        $original = $server->image;
        $defaultImage = $server->getDefaultDockerImage();

        if (empty($defaultImage)) {
            throw new BadRequestHttpException('No default docker image available for this server\'s egg.');
        }

        $server->forceFill(['image' => $defaultImage])->saveOrFail();

        Activity::event('server:startup.image.reverted')
            ->property([
                'old' => $original,
                'new' => $defaultImage,
                'reverted_to_egg_default' => true,
            ])
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    private function resetStartupCommand(Server $server): JsonResponse
    {
        $server->startup = $server->egg->startup;
        $server->save();
        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    public function changeEgg(SetEggRequest $request, Server $server): JsonResponse
    {
        $eggId = $request->input('egg_id');
        $nestId = $request->input('nest_id');
        $originalEggId = $server->egg_id;
        $originalNestId = $server->nest_id;

        if ($originalEggId !== $eggId || $originalNestId !== $nestId) {
            $server->egg_id = $eggId;
            $server->nest_id = $nestId;
            $server->save();

            Activity::event('server:settings.egg')
                ->property(['original_egg_id' => $originalEggId, 'new_egg_id' => $eggId, 'original_nest_id' => $originalNestId, 'new_nest_id' => $nestId])
                ->log();

            $this->resetStartupCommand($server);
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
    public function previewEggChange(PreviewEggRequest $request, Server $server): JsonResponse
    {
        try {
            $eggId = $request->input('egg_id');
            $nestId = $request->input('nest_id');

            $previewData = $this->eggChangeService->previewEggChange($server, $eggId, $nestId);

            // Log the preview action
            Activity::event('server:settings.egg-preview')
                ->property([
                    'current_egg_id' => $server->egg_id,
                    'preview_egg_id' => $eggId,
                    'preview_nest_id' => $nestId,
                ])
                ->log();

            return new JsonResponse($previewData);
        } catch (Exception $e) {
            Log::error('Failed to preview egg change', [
                'server_id' => $server->id,
                'egg_id' => $request->input('egg_id'),
                'nest_id' => $request->input('nest_id'),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Apply egg configuration changes asynchronously.
     * This dispatches a background job to handle the complete egg change process.
     *
     * @throws \Throwable
     */
    public function applyEggChange(ApplyEggChangeRequest $request, Server $server): JsonResponse
    {
        try {
            $eggId = $request->input('egg_id');
            $nestId = $request->input('nest_id');
            $dockerImage = $request->input('docker_image');
            $startupCommand = $request->input('startup_command');
            $environment = $request->input('environment', []);
            $shouldBackup = $request->input('should_backup', false);
            $shouldWipe = $request->input('should_wipe', false);

            $result = $this->eggChangeService->applyEggChangeAsync(
                $server,
                $request->user(),
                $eggId,
                $nestId,
                $dockerImage,
                $startupCommand,
                $environment,
                $shouldBackup,
                $shouldWipe
            );

            Activity::event('server:software.change-queued')
                ->property([
                    'operation_id' => $result['operation_id'],
                    'from_egg' => $server->egg_id,
                    'to_egg' => $eggId,
                    'should_backup' => $shouldBackup,
                    'should_wipe' => $shouldWipe,
                ])
                ->log();

            return new JsonResponse($result, Response::HTTP_ACCEPTED);
        } catch (Exception $e) {
            Log::error('Failed to apply egg change', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function getOperationStatus(Server $server, string $operationId): JsonResponse
    {
        $operation = $this->operationService->getOperation($server, $operationId);
        return new JsonResponse($this->operationService->formatOperationResponse($operation));
    }

    public function getServerOperations(Server $server): JsonResponse
    {
        $operations = $this->operationService->getServerOperations($server);
        return new JsonResponse(['operations' => $operations]);
    }
}
