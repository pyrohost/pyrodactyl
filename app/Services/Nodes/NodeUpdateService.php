<?php

namespace Pterodactyl\Services\Nodes;

use Illuminate\Support\Str;
use Pterodactyl\Models\Node;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Exceptions\Service\Node\ConfigurationNotPersistedException;

class NodeUpdateService
{
    /**
     * NodeUpdateService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private DaemonConfigurationRepository $configurationRepository,
        private Encrypter $encrypter,
        private NodeRepository $repository,
    ) {
    }

    /**
     * Update the configuration values for a given node on the machine.
     *
     * @throws \Throwable
     */
    public function handle(Node $node, array $data, bool $resetToken = false): Node
    {
        if ($resetToken) {
            $data['daemon_token'] = $this->encrypter->encrypt(Str::random(Node::DAEMON_TOKEN_LENGTH));
            $data['daemon_token_id'] = Str::random(Node::DAEMON_TOKEN_ID_LENGTH);
        }

        // Automatically set use_separate_fqdns based on whether internal_fqdn is provided
        if (isset($data['internal_fqdn'])) {
            $data['use_separate_fqdns'] = !empty($data['internal_fqdn']);
        }

        [$updated, $exception] = $this->connection->transaction(function () use ($data, $node) {
            /** @var Node $updated */
            $updated = $this->repository->withFreshModel()->update($node->id, $data, true, true);

            try {
                // If we're changing the FQDN for the node, use the newly provided FQDN for the connection
                // address. This should alleviate issues where the node gets pointed to a "valid" FQDN that
                // isn't actually running the daemon software, and therefore you can't actually change it
                // back.
                //
                // This makes more sense anyways, because only the Panel uses the FQDN for connecting, the
                // node doesn't actually care about this.
                //
                // @see https://github.com/pterodactyl/panel/issues/1931

                // Update the node's internal FQDN fields if they were changed
                if (isset($data['fqdn'])) {
                    $node->fqdn = $updated->fqdn;
                }
                if (isset($data['internal_fqdn'])) {
                    $node->internal_fqdn = $updated->internal_fqdn;
                }
                if (isset($data['use_separate_fqdns'])) {
                    $node->use_separate_fqdns = $updated->use_separate_fqdns;
                }

                $this->configurationRepository->setNode($node)->update($updated);
            } catch (DaemonConnectionException $exception) {
                Log::warning($exception, ['node_id' => $node->id]);

                // Never actually throw these exceptions up the stack. If we were able to change the settings
                // but something went wrong with Wings we just want to store the update and let the user manually
                // make changes as needed.
                //
                // This avoids issues with proxies such as Cloudflare which will see Wings as offline and then
                // inject their own response pages, causing this logic to get fucked up.
                //
                // @see https://github.com/pterodactyl/panel/issues/2712
                return [$updated, true];
            }

            return [$updated, false];
        });

        if ($exception) {
            throw new ConfigurationNotPersistedException(trans('exceptions.node.daemon_off_config_updated'));
        }

        return $updated;
    }
}
