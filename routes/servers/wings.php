<?php


use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Controllers\Api\Client\Servers;
use Pterodactyl\Http\Controllers\Api\Client\Servers\Wings;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\Http\Middleware\Api\Client\Server\CheckDaemonType;


/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/wings/{server}
|
*/

Route::group([
    'prefix' => '/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
        CheckDaemonType::class . ':wings',
    ],
], function () {
    Route::get('/', [Wings\ServerController::class, 'index'])->name('api:client:server.wings.view');
    Route::get('/websocket', Wings\WebsocketController::class)->name('api:client:server.wings.ws');
    Route::get('/resources', Wings\ResourceUtilizationController::class)->name('api:client:server.wings.resources');
    Route::get('/activity', Wings\ActivityLogController::class)->name('api:client:server.wings.activity');

    Route::post('/command', [Wings\CommandController::class, 'index']);
    Route::post('/power', [Wings\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Wings\DatabaseController::class, 'index']);
        Route::post('/', [Wings\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Wings\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Wings\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Wings\FileController::class, 'directory']);
        Route::get('/contents', [Wings\FileController::class, 'contents']);
        Route::get('/download', [Wings\FileController::class, 'download']);
        Route::put('/rename', [Wings\FileController::class, 'rename']);
        Route::post('/copy', [Wings\FileController::class, 'copy']);
        Route::post('/write', [Wings\FileController::class, 'write']);
        Route::post('/compress', [Wings\FileController::class, 'compress']);
        Route::post('/decompress', [Wings\FileController::class, 'decompress']);
        Route::post('/delete', [Wings\FileController::class, 'delete']);
        Route::post('/create-folder', [Wings\FileController::class, 'create']);
        Route::post('/chmod', [Wings\FileController::class, 'chmod']);
        Route::post('/pull', [Wings\FileController::class, 'pull'])->middleware(['throttle:10,5']);
        Route::get('/upload', Wings\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Wings\ScheduleController::class, 'index']);
        Route::post('/', [Wings\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Wings\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Wings\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Wings\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Wings\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Wings\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Wings\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Wings\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Wings\NetworkAllocationController::class, 'index']);
        Route::post('/allocations', [Wings\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Wings\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Wings\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Wings\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Servers\SubuserController::class, 'index']);
        Route::post('/', [Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Servers\SubuserController::class, 'delete']);
    });

    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Wings\BackupController::class, 'index']);
        Route::post('/', [Wings\BackupController::class, 'store']);
        Route::get('/{backup}', [Wings\BackupController::class, 'view']);
        Route::get('/{backup}/download', [Wings\BackupController::class, 'download']);
        Route::post('/{backup}/lock', [Wings\BackupController::class, 'toggleLock']);
        Route::post('/{backup}/restore', [Wings\BackupController::class, 'restore']);
        Route::delete('/{backup}', [Wings\BackupController::class, 'delete']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Wings\StartupController::class, 'index']);
        Route::put('/variable', [Wings\StartupController::class, 'update']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Wings\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Wings\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Wings\SettingsController::class, 'dockerImage']);
        Route::put('/egg', [Wings\SettingsController::class, 'changeEgg']);
        Route::post('/egg/preview', [Wings\SettingsController::class, 'previewEggChange'])
            ->middleware('server.operation.rate-limit');
        Route::post('/egg/apply', [Wings\SettingsController::class, 'applyEggChange'])
            ->middleware('server.operation.rate-limit');
    });
});
