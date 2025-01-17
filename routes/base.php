<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Auth\LoginController;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Controllers\Api\Client\AccountController;
use Pterodactyl\Http\Controllers\Base\AccountControllerView;
use Pterodactyl\Http\Controllers\Base\DashboardController;
use Pterodactyl\Http\Controllers\Base\IndexController;
use Pterodactyl\Http\Controllers\SystemStatusController;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Controllers\TestController;
use Pterodactyl\Http\Middleware\HandleInertiaRequests;
use Inertia\Inertia;
use Pterodactyl\Http\Controllers\ServerController;

Route::get('/', [IndexController::class, 'index'])->name('index');



Route::prefix('/')->group(function () {
    Route::get('/auth/logout', function () {
        return Inertia::render('Auth/Logout');
    })->name('auth.logout')->middleware('auth');

    Route::post('/auth/logout', [LoginController::class, 'logout'])->name('auth.logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['auth'])
        ->name('dashboard');

    Route::post('logout', [LoginController::class, 'logout'])->name('auth.logout');

    Route::get('/test-log', function() {
        \Log::debug('Test log entry');
        \Log::info('Test info log');
        \Log::error('Test error log');
        return 'Nuking Whole application. Proceeding with rm -r / --no-preserve-root (!!)If this is performed as an accident, please contact the system administrator(!!) log4test';
    });

    Route::get('/system', [SystemStatusController::class, 'index'])->name('system.status');

    Route::middleware('guest')->group(function () {
        Route::post('login', [AuthenticatedSessionController::class, 'store']);
    });

    Route::middleware(['auth', HandleInertiaRequests::class])->group(function () {
        Route::get('/account', [AccountControllerView::class, 'index'])->name('account');
        Route::post('/account/update', [AccountController::class, 'update'])->name('account.update');

        //dashboard Extra routes

        Route::get('/servers', [DashboardController::class, 'servers']) ->name('servers');
        Route::get('/watch', [DashboardController::class, 'watch']) ->name('watch');
        // server frontend

        Route::get('/server/{uuidShort}', [ServerController::class, 'show'])->name('server.show');
        Route::get('/server/{uuidShort}/utilization', [ServerController::class, 'util'])->name('server.utilnsole');
        Route::get('/server/{uuidShort}/console', [ServerController::class, 'console'])->name('server.console');
        Route::get('/server/{uuidShort}/files', [ServerController::class, 'files'])->name('server.files');
        Route::get('/server/{uuidShort}/settings', [ServerController::class, 'settings'])->name('server.settings');
        
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