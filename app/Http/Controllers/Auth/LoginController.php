<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Pterodactyl\Facades\Activity;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function __construct()
    {
        $this->middleware('guest')->except(['logout', 'editProfile', 'updateProfile']);
    }

    public function index(): Response
    {
        if (Auth::check()) {
            return to_route('/dashboard');
        }
        
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): Response
    {
        $request->validate([
            'user' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($this->hasTooManyLoginAttempts($request)) {
            $this->fireLockoutEvent($request);
            
            return Inertia::render('Auth/Login', [
                'errors' => [
                    'user' => 'Too many login attempts. Please try again later.'
                ]
            ]);
        }

        try {
            $username = $request->input('user');
            $user = User::query()->where($this->getField($username), $username)->firstOrFail();
        } catch (ModelNotFoundException $e) {
            $this->incrementLoginAttempts($request);
            
            return Inertia::render('Auth/Login', [
                'errors' => [
                    'user' => 'Invalid credentials provided.'
                ]
            ]);
        }

        if (!password_verify($request->input('password'), $user->password)) {
            $this->incrementLoginAttempts($request);
            
            return Inertia::render('Auth/Login', [
                'errors' => [
                    'password' => 'Invalid credentials provided.'
                ]
            ]);
        }

        $this->clearLoginAttempts($request);

        if (!$user->use_totp) {
    Auth::login($user, $request->filled('remember'));
    
    return Inertia::render('Auth/Login', [
        'success' => 'Successfully Authenticated'
    ]);
}

        Activity::event('auth:checkpoint')->withRequestMetadata()->subject($user)->log();

        $token = Str::random(64);
        $request->session()->put('auth_confirmation_token', [
            'user_id' => $user->id,
            'token_value' => $token,
            'expires_at' => CarbonImmutable::now()->addMinutes(5),
        ]);

        return Inertia::render('Auth/TwoFactor', [
            'confirmationToken' => $token
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    public function editProfile(): Response
    {
        return Inertia::render('Auth/Profile/Edit', [
            'user' => Auth::user()
        ]);
    }

    public function updateProfile(Request $request): Response 
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = Auth::user();
        $user->name = $request->input('name');
        $user->save();

        return Inertia::render('Auth/Profile/Edit', [
            'user' => $user,
            'message' => 'Profile updated successfully.'
        ]);
    }

    protected function validateLogin(Request $request): void
    {
        $request->validate([
            'user' => 'required|string',
            'password' => 'required|string',
        ]);
    }

    protected function getField(string $username): string
    {
        return filter_var($username, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
    }

    protected function hasTooManyLoginAttempts(Request $request): bool
    {
        return $this->limiter()->tooManyAttempts(
            $this->throttleKey($request),
            5
        );
    }

    protected function incrementLoginAttempts(Request $request): void
    {
        $this->limiter()->hit(
            $this->throttleKey($request),
            60
        );
    }

    protected function clearLoginAttempts(Request $request): void
    {
        $this->limiter()->clear($this->throttleKey($request));
    }

    protected function throttleKey(Request $request): string
    {
        return Str::transliterate(Str::lower($request->input('user')).'|'.$request->ip());
    }

    protected function limiter()
    {
        return app('Illuminate\Cache\RateLimiter');
    }
}