<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ConsoleLog;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Permission;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Pterodactyl\Exceptions\Http\HttpForbiddenException;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Services\Servers\GetUserPermissionsService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Illuminate\Support\Facades\Log;
use Throwable;
use React\Socket\Connector as SocketConnector;
use Ratchet\Client\Connector as ClientConnector;
use Illuminate\Support\Facades\DB;
use React\EventLoop\Factory;
use Psr\Http\Message\RequestInterface;
use Amp\Websocket\Client\Connection;
use Amp\Websocket\Client\Handshake;
use Amp\Websocket\Client\WebsocketClient;
use Amp\Websocket\Client\WebsocketHandshake;
use function Amp\async;
use function Amp\WebSocket\Client\connect;

class WebsocketController extends ClientApiController
{
    /**
     * WebsocketController constructor.
     */
    public function __construct(
        private NodeJWTService $jwtService,
        private GetUserPermissionsService $permissionsService
    ) {
        parent::__construct();
    }

    /**
     * Generates a one-time token that is sent along in every websocket call to the Daemon.
     * This is a signed JWT that the Daemon then uses to verify the user's identity, and
     * allows us to continually renew this token and avoid users maintaining sessions wrongly,
     * as well as ensure that user's only perform actions they're allowed to.
     */
    public function __invoke(ClientApiRequest $request, Server $server): JsonResponse
    {
        $user = $request->user();
        if ($user->cannot(Permission::ACTION_WEBSOCKET_CONNECT, $server)) {
            throw new HttpForbiddenException('You do not have permission to connect to this server\'s websocket.');
        }

        $permissions = $this->permissionsService->handle($server, $user);

        $node = $server->node;
        if (!is_null($server->transfer)) {
            // Check if the user has permissions to receive transfer logs.
            if (!in_array('admin.websocket.transfer', $permissions)) {
                throw new HttpForbiddenException('You do not have permission to view server transfer logs.');
            }

            // Redirect the websocket request to the new node if the server has been archived.
            if ($server->transfer->archived) {
                $node = $server->transfer->newNode;
            }
        }

        $token = $this->jwtService
            ->setExpiresAt(CarbonImmutable::now()->addMinutes(10))
            ->setUser($request->user())
            ->setClaims([
                'server_uuid' => $server->uuid,
                'permissions' => $permissions,
            ])
            ->handle($node, $user->id . $server->uuid);

        $socket = str_replace(['https://', 'http://'], ['wss://', 'ws://'], $node->getConnectionAddress());

        return new JsonResponse([
            'data' => [
                'token' => $token->toString(),
                'socket' => $socket . sprintf('/api/servers/%s/ws', $server->uuid),
            ],
        ]);
    }

    /**
     * takes the last logs and sends them to frontend
     */

     public function getLogs(ClientApiRequest $request, Server $server): JsonResponse
     {
         $user = $request->user();
         if ($user->cannot(Permission::ACTION_WEBSOCKET_CONNECT, $server)) {
             throw new HttpForbiddenException('You do not have permission to access this server\'s logs.');
         }
     
         try {
             $response = $this->__invoke($request, $server);
             $data = json_decode($response->getContent(), true)['data'];
             $logs = [];
     
             $loop = Factory::create();
             $connector = new ClientConnector($loop, new SocketConnector([
                 'timeout' => 10,
                 'tls' => [
                     'verify_peer' => false,
                     'verify_peer_name' => false
                 ]
             ]));
     
             $connector($data['socket'], [], ['Origin' => config('app.url')])->then(
                 function ($connection) use ($data, &$logs) {
                     // Send auth
                     $connection->send(json_encode([
                         'event' => 'auth',
                         'args' => [$data['token']]
                     ]));
     
                     $connection->on('message', function ($msg) use ($connection, &$logs) {
                         $payload = json_decode($msg, true);
                         
                         if ($payload['event'] === 'auth success') {
                             $connection->send(json_encode([
                                 'event' => 'send logs',
                                 'args' => [null]
                             ]));
                         } 
                         
                         if (isset($payload['args']) && !empty($payload['args'][0])) {
                            $logs[] = [
                                'event' => $payload['event'],
                                'message' => $payload['args'][0]
                            ];
                            
                            // Close connection after receiving logs
                            if ($payload['event'] === 'send logs' || count($logs) > 100) {
                                $connection->close();
                            }
                        }
                     });
                 }
             );
     
             // Run loop with timeout
             $loop->addTimer(5, function() use ($loop) {
                 $loop->stop();
             });
             
             $loop->run();
     
             return new JsonResponse(['data' => $logs]);
     
         } catch (Throwable $e) {
             Log::error('Failed to retrieve logs', ['error' => $e->getMessage()]);
             return new JsonResponse(['error' => 'Failed to retrieve logs'], 500);
         }
     }

    public function startLogging(ClientApiRequest $request, Server $server): JsonResponse
{
    $user = $request->user();
    if ($user->cannot(Permission::ACTION_WEBSOCKET_CONNECT, $server)) {
        throw new HttpForbiddenException('You do not have permission to log this server\'s console.');
    }

    try {
        // Get connection details and token from the __invoke function
        $response = $this->__invoke($request, $server);
        $data = json_decode($response->getContent(), true)['data'];

        \Log::info('Attempting WebSocket connection', [
            'socket' => $data['socket'],
            'token_length' => strlen($data['token'])
        ]);

        // Setup WebSocket connection
        $loop = Factory::create();
        $connector = new ClientConnector($loop, new SocketConnector([
            'timeout' => 10,
            'tls' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]));
// Me wage huthika blaiyak hinda                
        // Set the origin header
        $connector($data['socket'], [], ['Origin' => config('app.url')])->then(
            function ($connection) use ($data, $server) {
                \Log::info('WebSocket connection established');

                // Send authentication payload
                $authPayload = json_encode([
                    'event' => 'auth',
                    'args' => [$data['token']]
                ]);

                \Log::debug('Sending authentication', [
                    'payload_type' => 'auth',
                    'token_present' => !empty($data['token'])
                ]);

                // Send the auth payload to the WebSocket
                $connection->send($authPayload);

                // Handle WebSocket messages
                $connection->on('message', function ($msg) use ($server, $connection) {
                    $payload = json_decode($msg, true);

                    switch ($payload['event']) {
                        case 'auth success':
                            \Log::info('Authentication successful');
                            // Request initial logs
                            $connection->send(json_encode([
                                'event' => 'send logs',
                                'args' => [null]
                            ]));
                            break;

                        case 'console output':
                            DB::transaction(function() use ($server, $payload) {
                                // Check if message contains end signal
                                if ($payload['args'][0] === "\u001b[m>end") {
                                    // Clear previous logs for this server
                                    ConsoleLog::where('server_uuid', $server->uuid)->delete();
                                }
                                
                                // Create new log entry
                                ConsoleLog::create([
                                    'server_uuid' => $server->uuid,
                                    'content' => $payload['args'][0],
                                    'timestamp' => now()
                                ]);
                            });
                            break;

                        case 'token expired':
                            \Log::warning('Token expired - closing connection');
                            $connection->close();
                            break;
                    }
                });

                // Handle connection close
                $connection->on('close', function () {
                    \Log::info('WebSocket connection closed');
                });
            },
            function ($e) {
                \Log::error('Connection failed', ['error' => $e->getMessage()]);
                throw $e;
            }
        );

        // Run the event loop to maintain the WebSocket connection
        $loop->run();

        return new JsonResponse(['message' => 'Logging started']);

    } catch (Throwable $e) {
        \Log::error('WebSocket error', ['error' => $e->getMessage()]);
        return new JsonResponse(['error' => 'Connection failed'], 500);
    }
}

}
