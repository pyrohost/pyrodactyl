<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\Backup;
use Pterodactyl\Services\Backups\ServerStateService;

class BackupTransformer extends BaseClientTransformer
{
    public function __construct(
        private ServerStateService $serverStateService,
    ) {
    }

    public function getResourceName(): string
    {
        return Backup::RESOURCE_NAME;
    }

    public function transform(Backup $backup): array
    {
        $data = [
            'uuid' => $backup->uuid,
            'is_successful' => $backup->is_successful,
            'is_locked' => $backup->is_locked,
            'name' => $backup->name,
            'ignored_files' => $backup->ignored_files,
            'checksum' => $backup->checksum,
            'bytes' => $backup->bytes,
            'size_gb' => round($backup->bytes / (1024 * 1024 * 1024), 3),
            'adapter' => $backup->disk,
            'is_rustic' => $backup->isRustic(),
            'snapshot_id' => $backup->snapshot_id,
            'created_at' => $backup->created_at->toAtomString(),
            'completed_at' => $backup->completed_at ? $backup->completed_at->toAtomString() : null,
        ];

        // Add server state information if available
        $stateSummary = $this->serverStateService->getStateSummary($backup);
        $data['server_state'] = $stateSummary ? [
            'has_state' => true,
            'nest_name' => $stateSummary['nest_name'],
            'egg_name' => $stateSummary['egg_name'],
            'image' => $stateSummary['image'],
            'variables_count' => $stateSummary['variables_count'],
            'captured_at' => $stateSummary['captured_at'],
        ] : [
            'has_state' => false,
        ];

        return $data;
    }
}
