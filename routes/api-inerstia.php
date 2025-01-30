<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Client;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Activity\AccountSubject;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Middleware\Api\Client\Server\ResourceBelongsToServer;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\Http\Controllers\Base\AccountControllerView;
use Pterodactyl\Http\Middleware\HandleInertiaRequests;
use Pterodactyl\Http\Middleware\VerifyCsrfToken;
use Pterodactyl\Http\Controllers\TestController;
use Pterodactyl\Http\Controllers\Base;

/*
|--------------------------------------------------------------------------
| Inerstia Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/inerstia
|
| Super Safety Feature, All active inerstia requests are sent via this 
| Do not push without testing for exploits as this channel handles a lot
| of sensitive data.
|
*/
Route::prefix('/')->middleware([
    'web',
    \Pterodactyl\Http\Middleware\HandleInertiaRequests::class,
    'auth'
])->group(function () {
    Route::get('/', [Client\ClientController::class, 'index'])->name('api:client.index');
    Route::get('/permissions', [Client\ClientController::class, 'permissions']);


    Route::post('/shop/buy/{id}', [Base\ShopController::class, 'buy'])->name('api:client.shop.buy');

    Route::get('/notifications', [Client\NotificationController::class, 'indexJson']);
    Route::post('/notifications/{id}/read', [Client\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/purge/{count}', [Client\NotificationController::class, 'purge']);


    //`/api/inerstia/pastel-keys`
    // DO NOT PUSH WITHOUT TESTING


    Route::prefix('/pastel-keys')->group(function () {
        Route::get('/', [Base\PastelKeyController::class, 'index']);
        Route::post('/', [Base\PastelKeyController::class, 'store']);
        Route::delete('/{key}', [Base\PastelKeyController::class, 'destroy']);
        //Route::get('/demo-key', [Base\PastelKeyController::class, 'generateDemoKey']);
    });


    // Account routes with updated middleware
    Route::prefix('/account')->middleware([
    'web',
    'auth',
    \Pterodactyl\Http\Middleware\HandleInertiaRequests::class,
    
])->group(function () {
        Route::get('/', [Client\AccountController::class, 'index'])->name('api:client.account');
        Route::post('/email', [Client\AccountController::class, 'updateEmail']);
        
        Route::put('/email', [Client\AccountController::class, 'updateEmail']);
        Route::put('/password', [Client\AccountController::class, 'updatePassword'])->name('api:client.account.update-password');

        Route::get('/servers/{server}/resources', [Client\Inerstia\ServerResourceController::class, 'index'])
        ->name('servers.resources');
        Route::put('/servers/{server}/resources', [Client\Inerstia\ServerResourceController::class, 'update'])
        ->name('servers.resources.update');
        
        Route::post('/password', [Client\Inerstia\AccountController::class, 'updatePassword'])->name('api:client.account.update-password');
        Route::post('/test', [TestController::class, 'test'])->name('api:client.account.update-password');
    });

    // Server routes with updated middleware
    Route::group([
        'prefix' => '/servers/{server}',
        'middleware' => [
            'auth:sanctum',
            ResourceBelongsToServer::class,
        ],
    ], function () {
        // ...existing code...
    });
});


/*
|--------------------------------------------------------------------------
| Client Control API
|--------------------------------------------------------------------------
|
| Endpoint: /api/client/servers/{server}
|
*/
Route::group([
    'prefix' => '/servers/{server}',
    'middleware' => [
        ServerSubject::class,
        AuthenticateServerAccess::class,
        ResourceBelongsToServer::class,
    ],
], function () {
    Route::get('/', [Client\Servers\ServerController::class, 'index'])->name('api:client:server.view');
    Route::get('/websocket', Client\Servers\WebsocketController::class)->name('api:client:server.ws');
    Route::get('/resources', Client\Servers\ResourceUtilizationController::class)->name('api:client:server.resources');
    Route::get('/activity', Client\Servers\ActivityLogController::class)->name('api:client:server.activity');

    Route::post('/command', [Client\Servers\CommandController::class, 'index']);
    Route::post('/power', [Client\Servers\PowerController::class, 'index']);

    Route::group(['prefix' => '/databases'], function () {
        Route::get('/', [Client\Servers\DatabaseController::class, 'index']);
        Route::post('/', [Client\Servers\DatabaseController::class, 'store']);
        Route::post('/{database}/rotate-password', [Client\Servers\DatabaseController::class, 'rotatePassword']);
        Route::delete('/{database}', [Client\Servers\DatabaseController::class, 'delete']);
    });

    Route::group(['prefix' => '/files'], function () {
        Route::get('/list', [Client\Servers\FileController::class, 'directory']);
        Route::get('/contents', [Client\Servers\FileController::class, 'contents']);
        Route::get('/download', [Client\Servers\FileController::class, 'download']);
        Route::put('/rename', [Client\Servers\FileController::class, 'rename']);
        Route::post('/copy', [Client\Servers\FileController::class, 'copy']);
        Route::post('/write', [Client\Servers\FileController::class, 'write']);
        Route::post('/compress', [Client\Servers\FileController::class, 'compress']);
        Route::post('/decompress', [Client\Servers\FileController::class, 'decompress']);
        Route::post('/delete', [Client\Servers\FileController::class, 'delete']);
        Route::post('/create-folder', [Client\Servers\FileController::class, 'create']);
        Route::post('/chmod', [Client\Servers\FileController::class, 'chmod']);
        Route::post('/pull', [Client\Servers\FileController::class, 'pull'])->middleware(['throttle:10,5']);
        Route::get('/upload', Client\Servers\FileUploadController::class);
    });

    Route::group(['prefix' => '/schedules'], function () {
        Route::get('/', [Client\Servers\ScheduleController::class, 'index']);
        Route::post('/', [Client\Servers\ScheduleController::class, 'store']);
        Route::get('/{schedule}', [Client\Servers\ScheduleController::class, 'view']);
        Route::post('/{schedule}', [Client\Servers\ScheduleController::class, 'update']);
        Route::post('/{schedule}/execute', [Client\Servers\ScheduleController::class, 'execute']);
        Route::delete('/{schedule}', [Client\Servers\ScheduleController::class, 'delete']);

        Route::post('/{schedule}/tasks', [Client\Servers\ScheduleTaskController::class, 'store']);
        Route::post('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'update']);
        Route::delete('/{schedule}/tasks/{task}', [Client\Servers\ScheduleTaskController::class, 'delete']);
    });

    Route::group(['prefix' => '/network'], function () {
        Route::get('/allocations', [Client\Servers\NetworkAllocationController::class, 'index']);
        Route::post('/allocations', [Client\Servers\NetworkAllocationController::class, 'store']);
        Route::post('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'update']);
        Route::post('/allocations/{allocation}/primary', [Client\Servers\NetworkAllocationController::class, 'setPrimary']);
        Route::delete('/allocations/{allocation}', [Client\Servers\NetworkAllocationController::class, 'delete']);
    });

    Route::group(['prefix' => '/users'], function () {
        Route::get('/', [Client\Servers\SubuserController::class, 'index']);
        Route::post('/', [Client\Servers\SubuserController::class, 'store']);
        Route::get('/{user}', [Client\Servers\SubuserController::class, 'view']);
        Route::post('/{user}', [Client\Servers\SubuserController::class, 'update']);
        Route::delete('/{user}', [Client\Servers\SubuserController::class, 'delete']);
    });

    Route::group(['prefix' => '/backups'], function () {
        Route::get('/', [Client\Servers\BackupController::class, 'index']);
        Route::post('/', [Client\Servers\BackupController::class, 'store']);
        Route::get('/{backup}', [Client\Servers\BackupController::class, 'view']);
        Route::get('/{backup}/download', [Client\Servers\BackupController::class, 'download']);
        Route::post('/{backup}/lock', [Client\Servers\BackupController::class, 'toggleLock']);
        Route::post('/{backup}/restore', [Client\Servers\BackupController::class, 'restore']);
        Route::delete('/{backup}', [Client\Servers\BackupController::class, 'delete']);
    });

    Route::group(['prefix' => '/startup'], function () {
        Route::get('/', [Client\Servers\StartupController::class, 'index']);
        Route::put('/variable', [Client\Servers\StartupController::class, 'update']);
    });

    Route::group(['prefix' => '/settings'], function () {
        Route::post('/rename', [Client\Servers\SettingsController::class, 'rename']);
        Route::post('/reinstall', [Client\Servers\SettingsController::class, 'reinstall']);
        Route::put('/docker-image', [Client\Servers\SettingsController::class, 'dockerImage']);
        Route::put('/egg', [Client\Servers\SettingsController::class, 'changeEgg']);
    });
});
