<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Auth\LoginController;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Controllers\System;
use Pterodactyl\Http\Controllers\Api\Client\AccountController;
use Pterodactyl\Http\Controllers\Base\AccountControllerView;
use Pterodactyl\Http\Controllers\Base\DashboardController;
use Pterodactyl\Http\Controllers\Base\IndexController;
use Pterodactyl\Http\Controllers\Base\EarningController;
use Pterodactyl\Http\Controllers\SystemStatusController;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Controllers\UpdateController;
use Pterodactyl\Http\Middleware\HandleInertiaRequests;
use Pterodactyl\Http\Controllers\Api\Client;
use Inertia\Inertia;
use Pterodactyl\Http\Controllers\ServerController;

Route::get('/', [IndexController::class, 'index'])->name('index');



Route::prefix('/')->group(function () {
    Route::get('/auth/logout', function () {
        return Inertia::render('Auth/Logout');
    })->name('auth.logout')->middleware('auth');

    Route::post('/auth/logout', [LoginController::class, 'logout'])->name('auth.logout.post');

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['auth'])
        ->name('dashboard');

    Route::get('/logout', [DashboardController::class, 'logout'])
        ->middleware(['auth'])
        ->name('page.logout');
        
    Route::get('/privacy-policy', [DashboardController::class, 'priv'])->name('privacy.policy');

    Route::get('/earn', [Base\EarningViewController::class, 'index'])->name('earning.index');

    Route::post('logout', [LoginController::class, 'logout'])->name('auth.logout');

    Route::get('/test-log', function() {
        \Log::debug('Test log entry');
        \Log::info('Test info log');
        \Log::error('Test error log');
        return 'Nuking Whole application. Proceeding with rm -r / --no-preserve-root (!!)If this is performed as an accident, please contact the system administrator(!!) log4test';
    });

    Route::get('/update', [System\SystemUpdateController::class, '__invoke'])->name('system.update');

   

    Route::middleware('guest')->group(function () {
        Route::post('login', [AuthenticatedSessionController::class, 'store']);
    });

    Route::middleware(['auth', HandleInertiaRequests::class])->group(function () {
        Route::get('/account', [AccountControllerView::class, 'index'])->name('account');
        Route::post('/account/update', [AccountController::class, 'update'])->name('account.update');

        //dashboard Extra routes

        Route::get('/servers', [DashboardController::class, 'servers']) ->name('servers');
        Route::get('/watch', [DashboardController::class, 'watch']) ->name('watch');
        Route::get('/shop', [DashboardController::class, 'shop']) ->name('shop');
        Route::get('/deploy', [DashboardController::class, 'deploy']) ->name('deploy');
         
        // server frontend

        Route::post('/suspend/{server}', [ServerController::class, 'suspend'])
        ->name('api:client:server.suspend');

        

        Route::get('/server/{uuidShort}', [ServerController::class, 'show'])->name('server.show');
        
        Route::get('/server/{uuidShort}/utilization', [ServerController::class, 'util'])->name('server.Activity');
        Route::get('/server/{uuidShort}/activity', [ServerController::class, 'Activity'])->name('server.util');
        Route::get('/server/{uuidShort}/console', [ServerController::class, 'console'])->name('server.console');
        Route::get('/server/{uuidShort}/files', [ServerController::class, 'files'])->name('server.files');
        Route::get('/server/{uuidShort}/settings', [ServerController::class, 'settings'])->name('server.settings');
        Route::get('/server/{uuidShort}/etc', [ServerController::class, 'etc'])->name('server.etc');
        Route::get('/server/{uuidShort}/upgrade', [ServerController::class, 'upgrade'])->name('server.upgrade');
        
    });

    

    Route::get('/locales/locale.json', Base\LocaleController::class)
        ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
        ->where('namespace', '.*');

    Route::get('/{react}', [Base\IndexController::class, 'index'])
        ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');
});

// Place the fallback route outside of any route groups
Route::fallback(function () {
    return Inertia::render('Errors/404')->toResponse(request())->setStatusCode(404);
});