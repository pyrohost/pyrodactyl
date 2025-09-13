<?php

namespace Pterodactyl\Tests\Integration\Services\Servers;

use Mockery\MockInterface;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\DatabaseHost;
use GuzzleHttp\Exception\BadResponseException;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Pterodactyl\Services\Backups\DeleteBackupService;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Databases\DatabaseManagementService;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class ServerDeletionServiceTest extends IntegrationTestCase
{
    private MockInterface $daemonServerRepository;

    private MockInterface $databaseManagementService;

    private MockInterface $deleteBackupService;

    private static ?string $defaultLogger;

    /**
     * Stub out services that we don't want to test in here.
     */
    public function setUp(): void
    {
        parent::setUp();

        self::$defaultLogger = config('logging.default');
        // There will be some log calls during this test, don't actually write to the disk.
        config()->set('logging.default', 'null');

        $this->daemonServerRepository = \Mockery::mock(DaemonServerRepository::class);
        $this->databaseManagementService = \Mockery::mock(DatabaseManagementService::class);
        $this->deleteBackupService = \Mockery::mock(DeleteBackupService::class);

        $this->app->instance(DaemonServerRepository::class, $this->daemonServerRepository);
        $this->app->instance(DatabaseManagementService::class, $this->databaseManagementService);
        $this->app->instance(DeleteBackupService::class, $this->deleteBackupService);
    }

    /**
     * Reset the log driver.
     */
    protected function tearDown(): void
    {
        config()->set('logging.default', self::$defaultLogger);
        self::$defaultLogger = null;

        parent::tearDown();
    }

    /**
     * Test that a server is not deleted if the force option is not set and an error
     * is returned by wings.
     */
    public function testRegularDeleteFailsIfWingsReturnsError()
    {
        $server = $this->createServerModel();

        $this->expectException(DaemonConnectionException::class);

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andThrows(
            new DaemonConnectionException(new BadResponseException('Bad request', new Request('GET', '/test'), new Response()))
        );

        $this->getService()->handle($server);

        $this->assertDatabaseHas('servers', ['id' => $server->id]);
    }

    /**
     * Test that a 404 from Wings while deleting a server does not cause the deletion to fail.
     */
    public function testRegularDeleteIgnores404FromWings()
    {
        $server = $this->createServerModel();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andThrows(
            new DaemonConnectionException(new BadResponseException('Bad request', new Request('GET', '/test'), new Response(404)))
        );

        $this->getService()->handle($server);

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
    }

    /**
     * Test that an error from Wings does not cause the deletion to fail if the server is being
     * force deleted.
     */
    public function testForceDeleteIgnoresExceptionFromWings()
    {
        $server = $this->createServerModel();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andThrows(
            new DaemonConnectionException(new BadResponseException('Bad request', new Request('GET', '/test'), new Response(500)))
        );

        $this->getService()->withForce()->handle($server);

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
    }

    /**
     * Test that a non-force-delete call does not delete the server if one of the databases
     * cannot be deleted from the host.
     */
    public function testExceptionWhileDeletingStopsProcess()
    {
        $server = $this->createServerModel();
        $host = DatabaseHost::factory()->create();

        /** @var Database $db */
        $db = Database::factory()->create(['database_host_id' => $host->id, 'server_id' => $server->id]);

        $server->refresh();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andReturnUndefined();
        $this->databaseManagementService->expects('delete')->with(\Mockery::on(function ($value) use ($db) {
            return $value instanceof Database && $value->id === $db->id;
        }))->andThrows(new \Exception());

        $this->expectException(\Exception::class);
        $this->getService()->handle($server);

        $this->assertDatabaseHas('servers', ['id' => $server->id]);
        $this->assertDatabaseHas('databases', ['id' => $db->id]);
    }

    /**
     * Test that a server is deleted even if the server databases cannot be deleted from the host.
     */
    public function testExceptionWhileDeletingDatabasesDoesNotAbortIfForceDeleted()
    {
        $server = $this->createServerModel();
        $host = DatabaseHost::factory()->create();

        /** @var Database $db */
        $db = Database::factory()->create(['database_host_id' => $host->id, 'server_id' => $server->id]);

        $server->refresh();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andReturnUndefined();
        $this->databaseManagementService->expects('delete')->with(\Mockery::on(function ($value) use ($db) {
            return $value instanceof Database && $value->id === $db->id;
        }))->andThrows(new \Exception());

        $this->getService()->withForce(true)->handle($server);

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
        $this->assertDatabaseMissing('databases', ['id' => $db->id]);
    }

    /**
     * Test that server backups are deleted when a server is deleted.
     */
    public function testServerBackupsAreDeletedDuringServerDeletion()
    {
        $server = $this->createServerModel();
        
        /** @var Backup $backup1 */
        $backup1 = Backup::factory()->create(['server_id' => $server->id]);
        /** @var Backup $backup2 */
        $backup2 = Backup::factory()->create(['server_id' => $server->id]);

        $server->refresh();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andReturnUndefined();
        
        $this->deleteBackupService->expects('handle')->with(\Mockery::on(function ($value) use ($backup1) {
            return $value instanceof Backup && $value->id === $backup1->id;
        }))->andReturnUndefined();
        
        $this->deleteBackupService->expects('handle')->with(\Mockery::on(function ($value) use ($backup2) {
            return $value instanceof Backup && $value->id === $backup2->id;
        }))->andReturnUndefined();

        $this->getService()->handle($server);

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
    }

    /**
     * Test that server deletion continues even if backup deletion fails when force is enabled.
     */
    public function testServerDeletionContinuesWhenBackupDeletionFailsWithForce()
    {
        $server = $this->createServerModel();
        
        /** @var Backup $backup */
        $backup = Backup::factory()->create(['server_id' => $server->id]);

        $server->refresh();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andReturnUndefined();
        
        $this->deleteBackupService->expects('handle')->with(\Mockery::on(function ($value) use ($backup) {
            return $value instanceof Backup && $value->id === $backup->id;
        }))->andThrows(new \Exception('Backup deletion failed'));

        $this->getService()->withForce(true)->handle($server);

        $this->assertDatabaseMissing('servers', ['id' => $server->id]);
        $this->assertDatabaseMissing('backups', ['id' => $backup->id]);
    }

    /**
     * Test that server deletion fails if backup deletion fails and force is not enabled.
     */
    public function testServerDeletionFailsWhenBackupDeletionFailsWithoutForce()
    {
        $server = $this->createServerModel();
        
        /** @var Backup $backup */
        $backup = Backup::factory()->create(['server_id' => $server->id]);

        $server->refresh();

        $this->daemonServerRepository->expects('setServer->delete')->withNoArgs()->andReturnUndefined();
        
        $this->deleteBackupService->expects('handle')->with(\Mockery::on(function ($value) use ($backup) {
            return $value instanceof Backup && $value->id === $backup->id;
        }))->andThrows(new \Exception('Backup deletion failed'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Backup deletion failed');

        $this->getService()->handle($server);

        $this->assertDatabaseHas('servers', ['id' => $server->id]);
        $this->assertDatabaseHas('backups', ['id' => $backup->id]);
    }

    private function getService(): ServerDeletionService
    {
        return $this->app->make(ServerDeletionService::class);
    }
}
