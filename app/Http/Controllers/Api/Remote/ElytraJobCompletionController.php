<?php

namespace Pterodactyl\Http\Controllers\Api\Remote;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Http\Requests\Api\Remote\ElytraJobCompleteRequest;

class ElytraJobCompletionController extends Controller
{
    public function __construct(
        private ElytraJobService $elytraJobService,
    ) {}

    public function update(ElytraJobCompleteRequest $request, string $jobId): JsonResponse
    {
        try {
            $this->elytraJobService->updateJobStatus($jobId, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Job status updated successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}