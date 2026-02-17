<?php

namespace Pterodactyl\Console\Commands\Server;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Factory as ValidatorFactory;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;

class BulkPowerActionCommand extends Command
{
    protected $signature = 'p:server:bulk-power
                            {action : The action to perform (start, stop, restart, kill)}
                            {--servers= : A comma-separated list of server IDs.}
                            {--nodes= : A comma-separated list of node IDs.}';

    protected $description = 'Performs bulk power management on servers or nodes.';

    /**
     * Frok by xql.dev Love Pyrodactyl <3
     * Good Docs For New Developper xp
     */
    public function __construct(
        private DaemonPowerRepository $powerRepository,
        private ValidatorFactory $validator
    ) {
        parent::__construct();
    }

    /**
     * Handle the bulk power request.
     *
     * @throws ValidationException
     */
    public function handle(): void
    {
        $action = $this->argument('action');
        $nodes = $this->parseOptionList($this->option('nodes'));
        $servers = $this->parseOptionList($this->option('servers'));

        $this->validateInput($action, $nodes, $servers);

        $query = $this->getQueryBuilder($servers, $nodes);
        $count = $query->count();

        if ($count === 0) {
            $this->output->warning('No servers found matching the specified criteria.');
            return;
        }

        if (!$this->confirmAction($action, $count)) {
            $this->output->info('Bulk power action cancelled.');
            return;
        }

        $this->processServers($query, $action);
    }

    /**
     * Parse comma-separated option string into an array.
     */
    private function parseOptionList(?string $option): array
    {
        return array_filter(array_map('trim', explode(',', $option ?? '')));
    }

    /**
     * Validate input parameters.
     *
     * @throws ValidationException
     */
    private function validateInput(string $action, array $nodes, array $servers): void
    {
        $validator = $this->validator->make([
            'action' => $action,
            'nodes' => $nodes,
            'servers' => $servers,
        ], [
            'action' => 'required|string|in:start,stop,kill,restart',
            'nodes' => 'array',
            'nodes.*' => 'integer|min:1',
            'servers' => 'array',
            'servers.*' => 'integer|min:1',
        ]);

        if ($validator->fails()) {
            foreach ($validator->getMessageBag()->all() as $message) {
                $this->output->error($message);
            }
            throw new ValidationException($validator);
        }

        if (empty($nodes) && empty($servers)) {
            throw new ValidationException($this->validator->make(
                [],
                ['servers' => 'required_without:nodes']
            ));
        }
    }

    /**
     * Confirm the bulk action with the user.
     */
    private function confirmAction(string $action, int $count): bool
    {
        if (!$this->input->isInteractive()) {
            return true;
        }

        return $this->confirm(trans('command/messages.server.power.confirm', [
            'action' => $action,
            'count' => $count,
        ]));
    }

    /**
     * Process servers with the specified power action.
     */
    private function processServers(Builder $query, string $action): void
    {
        $bar = $this->output->createProgressBar($query->count());
        $bar->start();

        $query->chunk(100, function ($servers) use ($action, $bar) {
            foreach ($servers as $server) {
                $this->processServer($server, $action);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->line('');
        $this->output->success(sprintf('Bulk power action "%s" completed.', $action));
    }

    /**
     * Process a single server's power action.
     */
    private function processServer(Server $server, string $action): void
    {
        try {
            $this->powerRepository->setServer($server)->send($action);
            Log::info('Bulk power action successful', [
                'action' => $action,
                'server_id' => $server->id,
                'server_name' => $server->name,
                'node_id' => $server->node_id,
            ]);
        } catch (DaemonConnectionException $exception) {
            $this->output->error(trans('command/messages.server.power.action_failed', [
                'name' => $server->name,
                'id' => $server->id,
                'node' => $server->node->name,
                'message' => $exception->getMessage(),
            ]));
            Log::error('Bulk power action failed', [
                'action' => $action,
                'server_id' => $server->id,
                'server_name' => $server->name,
                'node_id' => $server->node_id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Returns the query builder instance for affected servers.
     */
    private function getQueryBuilder(array $servers, array $nodes): Builder
    {
        $query = Server::query()
            ->whereNull('status')
            ->with('node');

        if (!empty($servers)) {
            $query->whereIn('id', $servers);
        }

        if (!empty($nodes)) {
            $query->orWhereIn('node_id', $nodes);
        }

        return $query;
    }
}
