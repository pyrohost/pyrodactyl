<?php

namespace Pterodactyl\Services\ServerOperations;

use Exception;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Jobs\Server\ApplyEggChangeJob;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Service for handling server egg configuration changes.
 *
 * Manages egg previews, validation, and asynchronous application of egg changes
 * including backup creation and file management.
 */
class EggChangeService
{
    public function __construct(
        private ServerOperationService $operationService,
        private ServerStateValidationService $validationService,
        private SubdomainManagementService $subdomainService
    ) {}

    /**
     * Preview egg change information.
     */
    public function previewEggChange(Server $server, int $eggId, int $nestId): array
    {
        $this->validationService->validateServerState($server);
        
        $egg = Egg::query()
            ->with(['variables', 'nest'])
            ->findOrFail($eggId);
        
        if ($egg->nest_id !== $nestId) {
            throw new BadRequestHttpException('The specified egg does not belong to the specified nest.');
        }
        
        $variables = $egg->variables()->orderBy('name')->get();
        $dockerImages = $egg->docker_images ?? [];
        
        // Check subdomain compatibility
        $subdomainWarning = $this->checkSubdomainCompatibility($server, $egg);
        
        $result = [
            'egg' => [
                'id' => $egg->id,
                'name' => e($egg->name),
                'description' => e($egg->description),
                'startup' => $egg->startup,
            ],
            'variables' => $variables->map(function ($variable) {
                return [
                    'id' => $variable->id,
                    'name' => e($variable->name),
                    'description' => e($variable->description),
                    'env_variable' => $variable->env_variable,
                    'default_value' => $variable->default_value,
                    'user_viewable' => $variable->user_viewable,
                    'user_editable' => $variable->user_editable,
                    'rules' => $variable->rules,
                ];
            }),
            'docker_images' => $dockerImages,
            'default_docker_image' => !empty($dockerImages) ? array_keys($dockerImages)[0] : null,
        ];
        
        // Add subdomain warning if applicable
        if ($subdomainWarning) {
            $result['warnings'] = [$subdomainWarning];
        }
        
        return $result;
    }

    /**
     * Validate egg change parameters.
     */
    public function validateEggChangeParameters(
        Server $server,
        int $eggId,
        int $nestId,
        ?string $dockerImage = null,
        ?string $startupCommand = null
    ): array {
        $this->validationService->validateCanAcceptOperation($server, 'egg_change');
        
        $egg = Egg::query()
            ->with(['variables', 'nest'])
            ->findOrFail($eggId);
        
        if ($egg->nest_id !== $nestId) {
            throw new BadRequestHttpException('The specified egg does not belong to the specified nest.');
        }
        
        $startupCommand = $startupCommand ? trim($startupCommand) : null;
        $dockerImage = $dockerImage ? trim($dockerImage) : null;
        
        if ($startupCommand && strlen($startupCommand) > 2048) {
            throw new BadRequestHttpException('Startup command is too long (max 2048 characters).');
        }
        
        if ($dockerImage) {
            $allowedImages = array_values($egg->docker_images ?? []);
            if (!empty($allowedImages) && !in_array($dockerImage, $allowedImages)) {
                throw new BadRequestHttpException('The specified Docker image is not allowed for this egg.');
            }
        }
        
        if (!$dockerImage && !empty($egg->docker_images)) {
            $dockerImage = array_values($egg->docker_images)[0];
        }
        
        return [
            'egg' => $egg,
            'docker_image' => $dockerImage,
            'startup_command' => $startupCommand,
        ];
    }

    /**
     * Apply egg change asynchronously.
     */
    public function applyEggChangeAsync(
        Server $server,
        User $user,
        int $eggId,
        int $nestId,
        ?string $dockerImage = null,
        ?string $startupCommand = null,
        array $environment = [],
        bool $shouldBackup = false,
        bool $shouldWipe = false
    ): array {
        $validated = $this->validateEggChangeParameters(
            $server,
            $eggId,
            $nestId,
            $dockerImage,
            $startupCommand
        );

        $dockerImage = $validated['docker_image'];
        $startupCommand = $validated['startup_command'];
        
        $operation = $this->operationService->createOperation(
            $server,
            $user,
            'egg_change',
            [
                'from_egg_id' => $server->egg_id,
                'to_egg_id' => $eggId,
                'from_nest_id' => $server->nest_id,
                'to_nest_id' => $nestId,
                'docker_image' => $dockerImage,
                'startup_command' => $startupCommand,
                'environment' => $environment,
                'should_backup' => $shouldBackup,
                'should_wipe' => $shouldWipe,
            ]
        );
        
        try {
            ApplyEggChangeJob::dispatch(
                $server,
                $user,
                $eggId,
                $nestId,
                $dockerImage,
                $startupCommand,
                $environment,
                $shouldBackup,
                $shouldWipe,
                $operation->operation_id
            );
        } catch (Exception $e) {
            $operation->delete();
            
            Log::error('Failed to dispatch egg change job', [
                'server_id' => $server->id,
                'operation_id' => $operation->operation_id,
                'error' => $e->getMessage(),
            ]);
            
            throw new \RuntimeException('Failed to queue egg change operation. Please try again.');
        }
        
        return [
            'message' => 'Egg change operation has been queued for processing.',
            'operation_id' => $operation->operation_id,
            'status' => 'pending',
        ];
    }

    /**
     * Check if changing to the new egg will affect subdomain compatibility.
     */
    private function checkSubdomainCompatibility(Server $server, Egg $newEgg): ?array
    {
        // Check if server currently has an active subdomain
        $activeSubdomain = $server->activeSubdomain;
        
        if (!$activeSubdomain) {
            return null; // No subdomain to worry about
        }
        
        // Check if the current egg supports subdomains
        $currentSupportsSubdomain = $server->supportsSubdomains();
        
        if (!$currentSupportsSubdomain) {
            return null; // Current egg doesn't support subdomains anyway
        }
        
        // Create a temporary server instance with the new egg to test compatibility
        $tempServer = clone $server;
        $tempServer->egg = $newEgg;
        $tempServer->egg_id = $newEgg->id;
        
        // Check if the new egg supports subdomains
        $newSupportsSubdomain = $tempServer->supportsSubdomains();
        
        if (!$newSupportsSubdomain) {
            return [
                'type' => 'subdomain_incompatible',
                'message' => "Warning: The new egg does not support subdomains. Your current subdomain ({$activeSubdomain->full_domain}) will be deleted when you apply this change.",
                'severity' => 'warning',
            ];
        }
        
        return null; // New egg supports subdomains, no warning needed
    }
}