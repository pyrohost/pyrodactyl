<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Servers\StartupCommandService;
use Pterodactyl\Services\Servers\StartupCommandUpdateService;
use Pterodactyl\Repositories\Eloquent\ServerVariableRepository;
use Pterodactyl\Transformers\Api\Client\EggVariableTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\GetStartupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\UpdateStartupVariableRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\UpdateStartupCommandRequest;

class StartupController extends ClientApiController
{
    /**
     * StartupController constructor.
     */
    public function __construct(
        private StartupCommandService $startupCommandService,
        private StartupCommandUpdateService $startupCommandUpdateService,
        private ServerVariableRepository $repository,
    ) {
        parent::__construct();
    }

    /**
     * Returns the startup information for the server including all the variables.
     */
    public function index(GetStartupRequest $request, Server $server): array
    {
        $startup = $this->startupCommandService->handle($server);

        return $this->fractal->collection(
            $server->variables()->where('user_viewable', true)->get()
        )
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'docker_images' => $server->egg->docker_images,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }

    /**
     * Updates a single variable for a server.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateStartupVariableRequest $request, Server $server): array
    {
        /** @var \Pterodactyl\Models\EggVariable $variable */
        $variable = $server->variables()->where('env_variable', $request->input('key'))->first();
        $original = $variable->server_value;

        if (is_null($variable) || !$variable->user_viewable) {
            throw new BadRequestHttpException('The environment variable you are trying to edit does not exist.');
        } elseif (!$variable->user_editable) {
            throw new BadRequestHttpException('The environment variable you are trying to edit is read-only.');
        }

        // Revalidate the variable value using the egg variable specific validation rules for it.
        $this->validate($request, ['value' => $variable->rules]);

        $this->repository->updateOrCreate([
            'server_id' => $server->id,
            'variable_id' => $variable->id,
        ], [
            'variable_value' => $request->input('value') ?? '',
        ]);

        $variable = $variable->refresh();
        $variable->server_value = $request->input('value');

        $startup = $this->startupCommandService->handle($server);

        if ($variable->env_variable !== $request->input('value')) {
            Activity::event('server:startup.edit')
                ->subject($variable)
                ->property([
                    'variable' => $variable->env_variable,
                    'old' => $original,
                    'new' => $request->input('value'),
                ])
                ->log();
        }

        return $this->fractal->item($variable)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }

    /**
     * Updates the startup command for a server.
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     * @throws \Throwable
     */
    public function updateCommand(UpdateStartupCommandRequest $request, Server $server): array
    {
        $this->startupCommandUpdateService->handle($server, $request->input('startup'));

        $startup = $this->startupCommandService->handle($server);

        return $this->fractal->collection(
            $server->variables()->where('user_viewable', true)->get()
        )
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'docker_images' => $server->egg->docker_images,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }

    /**
     * Returns the default startup command for the server's egg.
     */
    public function getDefaultCommand(GetStartupRequest $request, Server $server): array
    {
        return [
            'default_startup_command' => $server->egg->startup,
        ];
    }

    /**
     * Process a startup command with variables for live preview.
     */
    public function processCommand(GetStartupRequest $request, Server $server): array
    {
        $command = $request->input('command', $server->startup);
        
        // Temporarily update the server's startup command for processing
        $originalStartup = $server->startup;
        $server->startup = $command;
        
        $processedCommand = $this->startupCommandService->handle($server, false);
        
        // Restore original startup command
        $server->startup = $originalStartup;
        
        return [
            'processed_command' => $processedCommand,
        ];
    }
}
