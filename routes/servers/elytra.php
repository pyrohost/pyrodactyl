<?php


use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client\Servers;
use Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\Http\Middleware\Api\Client\Server\CheckDaemonType;



/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/elytra/{server}
|
*/

Route::group([
    'prefix' => '/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
        CheckDaemonType::class . ':elytra',
    ],
], function () {
    Route::get('/', [Elytra\ServerController::class, 'index'])->name('api:client:server.elytra.view');
    Route::get('/websocket', Elytra\WebsocketController::class)->name('api:client:server.elytra.ws');
    Route::get('/resources', Elytra\ResourceUtilizationController::class)->name('api:client:server.elytra.resources');
    Route::get('/activity', Elytra\ActivityLogController::class)->name('api:client:server.elytra.activity');

    Route::post('/command', [Elytra\CommandController::class, 'index']);
    Route::post('/power', [Elytra\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Elytra\DatabaseController::class, 'index']);
        Route::post('/', [Elytra\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Elytra\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Elytra\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Elytra\FileController::class, 'directory']);
        Route::get('/contents', [Elytra\FileController::class, 'contents']);
        Route::get('/download', [Elytra\FileController::class, 'download']);
        Route::put('/rename', [Elytra\FileController::class, 'rename']);
        Route::post('/copy', [Elytra\FileController::class, 'copy']);
        Route::post('/write', [Elytra\FileController::class, 'write']);
        Route::post('/compress', [Elytra\FileController::class, 'compress']);
        Route::post('/decompress', [Elytra\FileController::class, 'decompress']);
        Route::post('/delete', [Elytra\FileController::class, 'delete']);
        Route::post('/create-folder', [Elytra\FileController::class, 'create']);
        Route::post('/chmod', [Elytra\FileController::class, 'chmod']);
        Route::post('/pull', [Elytra\FileController::class, 'pull'])->middleware(['throttle:10,5']);
        Route::get('/upload', Elytra\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Elytra\ScheduleController::class, 'index']);
        Route::post('/', [Elytra\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Elytra\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Elytra\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Elytra\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Elytra\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Elytra\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Elytra\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Elytra\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Elytra\NetworkAllocationController::class, 'index']);
        Route::post('/allocations', [Elytra\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Elytra\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Elytra\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Elytra\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Servers\SubuserController::class, 'index']);
        Route::post('/', [Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Servers\SubuserController::class, 'delete']);
    });

    // Elytra Jobs API
    Route::group(['prefix' => '/jobs'], function () {
        Route::get('/', [Elytra\ElytraJobsController::class, 'index']);
        Route::post('/', [Elytra\ElytraJobsController::class, 'create'])
            ->middleware('server.operation.rate-limit');
        Route::get('/{jobId}', [Elytra\ElytraJobsController::class, 'show']);
        Route::delete('/{jobId}', [Elytra\ElytraJobsController::class, 'cancel']);
    });

    // Backups API
    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Elytra\BackupsController::class, 'index']);
        Route::post('/', [Elytra\BackupsController::class, 'store'])
            ->middleware('server.operation.rate-limit');
        Route::delete('/delete-all', [Elytra\BackupsController::class, 'deleteAll'])
            ->middleware('throttle:2,60');
        Route::post('/bulk-delete', [Elytra\BackupsController::class, 'bulkDelete'])
            ->middleware('throttle:10,60');
        Route::get('/{backup}', [Elytra\BackupsController::class, 'show']);
        Route::get('/{backup}/download', [Elytra\BackupsController::class, 'download']);
        Route::post('/{backup}/restore', [Elytra\BackupsController::class, 'restore'])
            ->middleware('server.operation.rate-limit');
        Route::post('/{backup}/rename', [Elytra\BackupsController::class, 'rename']);
        Route::post('/{backup}/lock', [Elytra\BackupsController::class, 'toggleLock']);
        Route::delete('/{backup}', [Elytra\BackupsController::class, 'destroy']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Elytra\StartupController::class, 'index']);
        Route::put('/variable', [Elytra\StartupController::class, 'update']);
        Route::put('/command', [Elytra\StartupController::class, 'updateCommand']);
        Route::get('/command/default', [Elytra\StartupController::class, 'getDefaultCommand']);
        Route::post('/command/process', [Elytra\StartupController::class, 'processCommand']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Elytra\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Elytra\SettingsController::class, 'reinstall'])
            ->middleware('server.operation.rate-limit');
        Route::put('/docker-image', [Elytra\SettingsController::class, 'dockerImage']);
        Route::post('/docker-image/revert', [Elytra\SettingsController::class, 'revertDockerImage']);
        Route::put('/egg', [Elytra\SettingsController::class, 'changeEgg']);
        Route::post('/egg/preview', [Elytra\SettingsController::class, 'previewEggChange'])
            ->middleware('server.operation.rate-limit');
        Route::post('/egg/apply', [Elytra\SettingsController::class, 'applyEggChange'])
            ->middleware('server.operation.rate-limit');
    });

    Route::group(['prefix' => '/operations'], function () {
        Route::get('/', [Elytra\SettingsController::class, 'getServerOperations']);
        Route::get('/{operationId}', [Elytra\SettingsController::class, 'getOperationStatus']);
    });
});
