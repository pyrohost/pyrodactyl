<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class ElytraJobsController extends ClientApiController
{
    public function __construct(
        private ElytraJobService $elytraJobService,
    ) {
        parent::__construct();
    }

    public function index(Request $request, Server $server): JsonResponse
    {
        $jobType = $request->query('type');

        if ($jobType) {
            $handler = $this->elytraJobService->getJobHandler($jobType);
            $requiredPermissions = $handler->getRequiredPermissions('index');

            foreach ($requiredPermissions as $permission) {
                if (!$request->user()->can($permission, $server)) {
                    throw new AuthorizationException();
                }
            }
        }

        $jobs = $this->elytraJobService->listJobs(
            $server,
            $request->query('type'),
            $request->query('status')
        );

        return new JsonResponse([
            'object' => 'list',
            'data' => $jobs,
        ]);
    }

    public function create(Request $request, Server $server): JsonResponse
    {
        $jobType = $request->input('job_type');
        $jobData = $request->input('job_data', []);

        $handler = $this->elytraJobService->getJobHandler($jobType);
        $requiredPermissions = $handler->getRequiredPermissions('create');

        foreach ($requiredPermissions as $permission) {
            if (!$request->user()->can($permission, $server)) {
                throw new AuthorizationException();
            }
        }

        $result = $this->elytraJobService->submitJob(
            $server,
            $jobType,
            $jobData,
            $request->user()
        );

        Activity::event('job:create')
            ->subject($server)
            ->property(['job_type' => $jobType, 'job_id' => $result['job_id']])
            ->log();

        return new JsonResponse($result);
    }

    public function show(Request $request, Server $server, string $jobId): JsonResponse
    {
        $job = $this->elytraJobService->getJobStatus($server, $jobId);

        if (!$job) {
            return response()->json(['error' => 'Job not found'], 404);
        }

        $handler = $this->elytraJobService->getJobHandler($job['type']);
        $requiredPermissions = $handler->getRequiredPermissions('show');

        foreach ($requiredPermissions as $permission) {
            if (!$request->user()->can($permission, $server)) {
                throw new AuthorizationException();
            }
        }

        return new JsonResponse([
            'object' => 'job',
            'attributes' => $job,
        ]);
    }

    public function cancel(Request $request, Server $server, string $jobId): JsonResponse
    {
        $job = $this->elytraJobService->getJobStatus($server, $jobId);

        if (!$job) {
            return response()->json(['error' => 'Job not found'], 404);
        }

        $handler = $this->elytraJobService->getJobHandler($job['type']);
        $requiredPermissions = $handler->getRequiredPermissions('cancel');

        foreach ($requiredPermissions as $permission) {
            if (!$request->user()->can($permission, $server)) {
                throw new AuthorizationException();
            }
        }

        $result = $this->elytraJobService->cancelJob($server, $jobId);

        Activity::event('job:cancel')
            ->subject($server)
            ->property(['job_id' => $jobId])
            ->log();

        return new JsonResponse($result);
    }
}

