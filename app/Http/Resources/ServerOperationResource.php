<?php

namespace Pterodactyl\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Pterodactyl\Models\ServerOperation;

/**
 * Resource for transforming server operations for API responses.
 *
 * Provides comprehensive operation information including status, timing,
 * and metadata for frontend consumption.
 */
class ServerOperationResource extends JsonResource
{
    /**
     * Transform the server operation into an array.
     */
    public function toArray(Request $request): array
    {
        /** @var ServerOperation $operation */
        $operation = $this->resource;

        return [
            'operation_id' => $operation->operation_id,
            'type' => $operation->type,
            'status' => $operation->status,
            'message' => $operation->message,
            'created_at' => $operation->created_at->toISOString(),
            'updated_at' => $operation->updated_at->toISOString(),
            'started_at' => $operation->started_at?->toISOString(),
            'parameters' => $operation->parameters,
            'meta' => [
                'is_active' => $operation->isActive(),
                'is_completed' => $operation->isCompleted(),
                'has_failed' => $operation->hasFailed(),
                'has_timed_out' => $operation->hasTimedOut(),
                'can_be_cancelled' => $operation->isActive() && !$operation->hasFailed(),
            ],
        ];
    }
}