<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Illuminate\Http\Request;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Permission;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Services\Backups\DownloadLinkService;
use Pterodactyl\Transformers\Api\Client\BackupTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\StoreBackupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Backups\RestoreBackupRequest;

class BackupsController extends ClientApiController
{
    public function __construct(
        private ElytraJobService $elytraJobService,
        private DownloadLinkService $downloadLinkService,
        private BackupTransformer $transformer,
        private Google2FA $google2FA,
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

        $rusticBackupSum = $server->backups()
            ->where('is_successful', true)
            ->whereIn('disk', [Backup::ADAPTER_RUSTIC_LOCAL, Backup::ADAPTER_RUSTIC_S3])
            ->sum('bytes');

        $rusticSumMb = round($rusticBackupSum / 1024 / 1024, 2);

        $legacyBackupSum = $server->backups()
            ->where('is_successful', true)
            ->whereNotIn('disk', [Backup::ADAPTER_RUSTIC_LOCAL, Backup::ADAPTER_RUSTIC_S3])
            ->sum('bytes');

        $legacyUsageMb = round($legacyBackupSum / 1024 / 1024, 2);

        $repositoryUsageMb = round($server->repository_backup_bytes / 1024 / 1024, 2);

        $overheadMb = max(0, $repositoryUsageMb - $rusticSumMb);

        $totalUsedMb = $legacyUsageMb + $repositoryUsageMb;

        return $this->fractal->collection($backups)
            ->transformWith($this->transformer)
            ->addMeta([
                'backup_count' => $server->backups()->count(),
                'storage' => [
                    'used_mb' => $totalUsedMb,
                    'legacy_usage_mb' => $legacyUsageMb,
                    'repository_usage_mb' => $repositoryUsageMb,
                    'rustic_backup_sum_mb' => $rusticSumMb,
                    'overhead_mb' => $overheadMb,
                    'overhead_percent' => $rusticSumMb > 0 ? round(($overheadMb / $rusticSumMb) * 100, 1) : 0,
                    'needs_pruning' => $overheadMb > $rusticSumMb * 0.1,
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

        // Only require password/2FA for web session requests, not API keys
        if (!$request->user()->currentAccessToken()) {
            // Require password confirmation for this destructive operation
            $password = $request->input('password');
            if (empty($password) || !password_verify($password, $request->user()->password)) {
                throw new BadRequestHttpException('The password provided was not valid.');
            }

            // If user has 2FA enabled, require TOTP code
            if ($request->user()->use_totp) {
                $totpCode = $request->input('totp_code');
                if (empty($totpCode)) {
                    throw new BadRequestHttpException('Two-factor authentication code is required.');
                }

                $secret = Crypt::decrypt($request->user()->totp_secret);
                if (!$this->google2FA->verifyKey($secret, $totpCode)) {
                    throw new BadRequestHttpException('The two-factor authentication code provided was not valid.');
                }
            }
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_delete',
            [
                'operation' => 'delete',
                'backup_uuid' => $backup->uuid,
                'snapshot_id' => $backup->snapshot_id,
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

        // Only require password/2FA for web session requests, not API keys
        if (!$request->user()->currentAccessToken()) {
            // Require password confirmation for this destructive operation
            $password = $request->input('password');
            if (empty($password) || !password_verify($password, $request->user()->password)) {
                throw new BadRequestHttpException('The password provided was not valid.');
            }

            // If user has 2FA enabled, require TOTP code
            if ($request->user()->use_totp) {
                $totpCode = $request->input('totp_code');
                if (empty($totpCode)) {
                    throw new BadRequestHttpException('Two-factor authentication code is required.');
                }

                $secret = Crypt::decrypt($request->user()->totp_secret);
                if (!$this->google2FA->verifyKey($secret, $totpCode)) {
                    throw new BadRequestHttpException('The two-factor authentication code provided was not valid.');
                }
            }
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_restore',
            [
                'operation' => 'restore',
                'backup_uuid' => $backup->uuid,
                'snapshot_id' => $backup->snapshot_id,
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

    public function deleteAll(Request $request, Server $server): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        // Only require password/2FA for web session requests, not API keys
        if (!$request->user()->currentAccessToken()) {
            // Require password confirmation for this destructive operation
            $password = $request->input('password');
            if (empty($password) || !password_verify($password, $request->user()->password)) {
                throw new BadRequestHttpException('The password provided was not valid.');
            }

            // If user has 2FA enabled, require TOTP code
            if ($request->user()->use_totp) {
                $totpCode = $request->input('totp_code');
                if (empty($totpCode)) {
                    throw new BadRequestHttpException('Two-factor authentication code is required.');
                }

                $secret = Crypt::decrypt($request->user()->totp_secret);
                if (!$this->google2FA->verifyKey($secret, $totpCode)) {
                    throw new BadRequestHttpException('The two-factor authentication code provided was not valid.');
                }
            }
        }

        $backupCount = $server->backups()->count();

        if ($backupCount === 0) {
            return new JsonResponse([
                'error' => 'No backups to delete.',
            ], 400);
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            'backup_delete_all',
            [
                'operation' => 'delete_all',
            ],
            $request->user()
        );

        Activity::event('backup:delete_all')
            ->subject($server)
            ->property(['backup_count' => $backupCount, 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    public function bulkDelete(Request $request, Server $server): JsonResponse
    {
        if (!$request->user()->can(Permission::ACTION_BACKUP_DELETE, $server)) {
            throw new AuthorizationException();
        }

        // Only require password/2FA for web session requests, not API keys
        if (!$request->user()->currentAccessToken()) {
            // Require password confirmation for this destructive operation
            $password = $request->input('password');
            if (empty($password) || !password_verify($password, $request->user()->password)) {
                throw new BadRequestHttpException('The password provided was not valid.');
            }

            // If user has 2FA enabled, require TOTP code
            if ($request->user()->use_totp) {
                $totpCode = $request->input('totp_code');
                if (empty($totpCode)) {
                    throw new BadRequestHttpException('Two-factor authentication code is required.');
                }

                $secret = Crypt::decrypt($request->user()->totp_secret);
                if (!$this->google2FA->verifyKey($secret, $totpCode)) {
                    throw new BadRequestHttpException('The two-factor authentication code provided was not valid.');
                }
            }
        }

        // Validate backup_uuids
        $backupUuids = $request->input('backup_uuids', []);
        if (empty($backupUuids) || !is_array($backupUuids)) {
            return new JsonResponse([
                'error' => 'No backups specified for deletion.',
            ], 400);
        }

        // Limit to reasonable number of backups at once
        if (count($backupUuids) > 50) {
            return new JsonResponse([
                'error' => 'Cannot delete more than 50 backups at once. Use Delete All for larger operations.',
            ], 400);
        }

        // Verify all backups belong to this server
        $backups = $server->backups()->whereIn('uuid', $backupUuids)->get();
        if ($backups->count() !== count($backupUuids)) {
            return new JsonResponse([
                'error' => 'One or more backups not found or do not belong to this server.',
            ], 404);
        }

        // Submit individual delete jobs for each backup
        $jobIds = [];
        foreach ($backups as $backup) {
            try {
                $result = $this->elytraJobService->submitJob(
                    $server,
                    'backup_delete',
                    [
                        'operation' => 'delete',
                        'backup_uuid' => $backup->uuid,
                        'adapter_type' => $backup->getElytraAdapterType(),
                        'snapshot_id' => $backup->snapshot_id,
                        'checksum' => $backup->checksum,
                    ],
                    $request->user()
                );

                $jobIds[] = $result['job_id'];
            } catch (\Exception $e) {
                // Log error but continue with other backups
                \Log::error("Failed to submit delete job for backup {$backup->uuid}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Activity::event('backup:bulk_delete')
            ->subject($server)
            ->property(['backup_count' => count($backupUuids), 'job_ids' => $jobIds])
            ->log();

        return new JsonResponse([
            'message' => 'Bulk delete jobs submitted successfully',
            'job_count' => count($jobIds),
            'backup_count' => count($backupUuids),
        ]);
    }
}
