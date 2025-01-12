<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Define the root template.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
{
    $user = $request->user();

    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $user ? [
                'uuid'       => $user->uuid,
                'username'   => $user->username,
                'email'      => $user->email,
                'rootAdmin'  => $user->root_admin,
                'useTotp'    => $user->use_totp,
                'language'   => $user->language,
                'rank'       => $user->root_admin ? 'admin' : 'user',
            ] : null,
        ],
        'AppConfig' => [
            'appName'  => env('APP_NAME'),
            'appUrl'   => env('APP_URL'),
            'appTheme' => env('APP_THEME'),
            'appLogo'  => env('VITE_LOGO_URL'),
            'appVer'  => env('VERSION'),
        ],
        'flash' => [
            'status'         => fn () => $request->session()->get('status'),
            'error'          => fn () => $request->session()->get('error'),
            'res'            => fn () => $request->session()->get('res'),
            'servers'        => fn () => $request->session()->get('servers'),
            'success'        => fn () => $request->session()->get('success'),
            'users'          => fn () => $request->session()->get('users'),
            'server_url'     => fn () => $request->session()->get('server_url'),
            'secerts'        => fn () => $request->session()->get('secerts'),
            'linkvertiseUrl' => fn () => $request->session()->get('linkvertiseUrl'),
        ],
    ]);
}
}