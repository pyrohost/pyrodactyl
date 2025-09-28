<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Permission;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Services\Backups\DownloadLinkService;
use Pterodactyl\Transformers\Api\Client\BackupTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\StoreBackupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\RestoreBackupRequest;

class BackupsController extends ClientApiController
{
    public function __construct(
        private ElytraJobService $elytraJobService,
        private DownloadLinkService $downloadLinkService,
        private BackupTransformer $transformer,
    ) {
        parent::__construct();
    }

    public function index(Request $request, Server $server): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_READ, $server)) {
            throw new AuthorizationException();
        }

        $limit = min($request->query('per_page') ?? 20, 50);

        $backups = $server->backups()
            ->orderByRaw('is_locked DESC, created_at DESC')
            ->paginate($limit);

        return $this->fractal->collection($backups)
            ->transformWith($this->transformer)
            ->addMeta([
                'backup_count' => $server->backups()->count(),
                'storage' => [
                    'used_mb' => round($server->backups()->where('is_successful', true)->sum('bytes') / 1024 / 1024, 2),
                    'limit_mb' => null,
                    'has_limit' => false,
                    'usage_percentage' => null,
                    'available_mb' => null,
                    'is_over_limit' => false,
                ],
                'limits' => [
                    'count_limit' => null,
                    'has_count_limit' => false,
                    'storage_limit_mb' => null,
                    'has_storage_limit' => false,
                ],
            ])
            ->toArray();
    }

    public function store(StoreBackupRequest $request, Server $server): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_CREATE, $server)) {
            throw new AuthorizationException();
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_create',
            [
                'operation' => 'create',
                'adapter' => $request->input('adapter', config('backups.default')),
                'ignored' => $request->input('ignored', ''),
                'name' => $request->input('name'),
            ],
            $request->user()
        );

        Activity::event('backup:create')
            ->subject($server)
            ->property(['backup_name' => $request->input('name'), 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    public function show(Request $request, Server $server, Backup $backup): array
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_READ, $server)) {
            throw new AuthorizationException();
        }

        return $this->fractal->item($backup)
            ->transformWith($this->transformer)
            ->toArray();
    }

    public function destroy(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_delete',
            [
                'operation' => 'delete',
                'backup_uuid' => $backup->uuid,
            ],
            $request->user()
        );

        Activity::event('backup:delete')
            ->subject($server)
            ->property(['backup_name' => $backup->name, 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    public function restore(RestoreBackupRequest $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_RESTORE, $server)) {
            throw new AuthorizationException();
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_restore',
            [
                'operation' => 'restore',
                'backup_uuid' => $backup->uuid,
                'truncate_directory' => $request->boolean('truncate_directory'),
            ],
            $request->user()
        );

        Activity::event('backup:restore')
            ->subject($server)
            ->property(['backup_name' => $backup->name, 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    public function download(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DOWNLOAD, $server)) {
            throw new AuthorizationException();
        }

        if (!$backup->is_successful) {
            throw new \Exception('Cannot download an incomplete backup.');
        }

        $url = $this->downloadLinkService->handle($backup, $request->user());

        Activity::event('backup:download')
            ->subject($server)
            ->property(['backup_name' => $backup->name])
            ->log();

        return new JsonResponse([
            'object' => 'signed_url',
            'attributes' => ['url' => $url],
        ]);
    }

    public function rename(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $request->validate([
            'name' => 'required|string|max:191',
        ]);

        $backup->update([
            'name' => $request->input('name'),
        ]);

        Activity::event('backup:rename')
            ->subject($server)
            ->property(['old_name' => $backup->getOriginal('name'), 'new_name' => $backup->name])
            ->log();

        $transformed = $this->fractal->item($backup)
            ->transformWith($this->transformer)
            ->toArray();

        return new JsonResponse($transformed);
    }

    public function toggleLock(Request $request, Server $server, Backup $backup): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        $backup->update([
            'is_locked' => !$backup->is_locked,
        ]);

        Activity::event('backup:lock')
            ->subject($server)
            ->property(['backup_name' => $backup->name, 'locked' => $backup->is_locked])
            ->log();

        $transformed = $this->fractal->item($backup)
            ->transformWith($this->transformer)
            ->toArray();

        return new JsonResponse($transformed);
    }
}