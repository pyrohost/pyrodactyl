<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Repositories\Eloquent\ServerRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\RenameServerRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetDockerImageRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\SetEggRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Settings\ReinstallServerRequest;

class SettingsController extends ClientApiController
{
  /**
   * SettingsController constructor.
   */
  public function __construct(
    private ServerRepository $repository,
    private ReinstallServerService $reinstallServerService,
  ) {
    parent::__construct();
  }

  /**
   * Renames a server.
   *
   * @throws \Pterodactyl\Exceptions\Model\DataValidationException
   * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
   */
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

  /**
   * Reinstalls the server on the daemon.
   *
   * @throws \Throwable
   */
  public function reinstall(ReinstallServerRequest $request, Server $server): JsonResponse
  {
    $this->reinstallServerService->handle($server);

    Activity::event('server:reinstall')->log();

    return new JsonResponse([], Response::HTTP_ACCEPTED);
  }

  /**
   * Changes the Docker image in use by the server.
   *
   * @throws \Throwable
   */
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

  /**
   * Reset Startup Command
   */
  private function resetStartupCommand(Server $server): JsonResponse
  {
    $server->startup = $server->egg->startup;
    $server->save();

    return new JsonResponse([], Response::HTTP_NO_CONTENT);
  }

  /**
   * Changes the egg for a server.
   *
   * @throws \Throwable
   */
  public function changeEgg(SetEggRequest $request, Server $server): JsonResponse
  {
    $eggId = $request->input('egg_id');
    $nestId = $request->input('nest_id');
    $originalEggId = $server->egg_id;
    $originalNestId = $server->nest_id;

    // Check if the new Egg and Nest IDs are different from the current ones
    if ($originalEggId !== $eggId || $originalNestId !== $nestId) {
      // Update the server's Egg and Nest IDs
      $server->egg_id = $eggId;
      $server->nest_id = $nestId;
      $server->save();

      // Log an activity event for the Egg change
      Activity::event('server:settings.egg')
        ->property(['original_egg_id' => $originalEggId, 'new_egg_id' => $eggId, 'original_nest_id' => $originalNestId, 'new_nest_id' => $nestId])
        ->log();

      // Reset the server's startup command
      $this->resetStartupCommand($server);
    }

    return new JsonResponse([], Response::HTTP_NO_CONTENT);
  }
}
