<?php


use Pterodactyl\Http\Controllers\Auth\LoginController;

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Pterodactyl\Http\Controllers\Base\IndexController;
use Pterodactyl\Http\Controllers\Base\DashboardController;
use Pterodactyl\Http\Controllers\Auth\LogoutController;
use Pterodactyl\Http\Controllers\SystemStatusController;

use Inertia\Inertia;

Route::get('/', [IndexController::class, 'index'])->name('index');


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

Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');


Route::fallback(function () {
        return Inertia::render('Errors/404')->toResponse(request())->setStatusCode(404);});

