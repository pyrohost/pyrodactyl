<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use Pterodactyl\Http\Controllers\Auth\LoginController;
use Pterodactyl\Http\Controllers\Auth\LogoutController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Endpoint: /auth
|
*/

Route::middleware(['guest'])->group(function () {
    Route::get('/login', [LoginController::class, 'index'])->name('auth.login');
    Route::post('/login', [LoginController::class, 'login'])->name('login.submit');
    Route::get('/discord', [Auth\DiscordRegisterController::class, 'redirectToDiscord'])->name('auth.discord');
Route::get('/discord/callback', [Auth\DiscordRegisterController::class, 'handleDiscordCallback'])->name('auth.discord.callback');
    
});



Route::get('profile/edit', [LoginController::class, 'editProfile'])->name('profile.edit');
Route::post('profile/update', [LoginController::class, 'updateProfile'])->name('profile.update');

// Apply a throttle to authentication action endpoints, in addition to the
// recaptcha endpoints to slow down manual attack spammers even more. 🤷‍
//
// @see \Pterodactyl\Providers\RouteServiceProvider



Route::middleware(['throttle:authentication'])->group(function () {
    // Login endpoints.
    Route::post('/login', [Auth\LoginController::class, 'login'])->middleware('recaptcha');
    Route::post('/login/checkpoint', Auth\LoginCheckpointController::class)->name('auth.login-checkpoint');

    // Forgot password route. A post to this endpoint will trigger an
    // email to be sent containing a reset token.
    Route::post('/password', [Auth\ForgotPasswordController::class, 'sendResetLinkEmail'])
        ->name('auth.post.forgot-password')
        ->middleware('recaptcha');
});



// Password reset routes. This endpoint is hit after going through
// the forgot password routes to acquire a token (or after an account
// is created).
Route::post('/password/reset', Auth\ResetPasswordController::class)->name('auth.reset-password');

// Remove the guest middleware and apply the authenticated middleware to this endpoint,
// so it cannot be used unless you're already logged in.


// Catch any other combinations of routes and pass them off to the React component.
Route::get('/', [IndexController::class, 'index'])->name('index');