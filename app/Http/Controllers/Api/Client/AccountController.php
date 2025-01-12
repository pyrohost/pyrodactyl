<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Auth\AuthManager;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Transformers\Api\Client\AccountTransformer;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdateEmailRequest;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdatePasswordRequest;
use Illuminate\Support\Facades\Log;

class AccountController extends ClientApiController
{
    public function __construct(private AuthManager $manager, private UserUpdateService $updateService)
    {
        parent::__construct();
    }

    public function index(Request $request): array
    {
        return $this->fractal->item($request->user())
            ->transformWith($this->getTransformer(AccountTransformer::class))
            ->toArray();
    }


    public function updateEmail(UpdateEmailRequest $request): JsonResponse|RedirectResponse
    {
        $original = $request->user()->email;
        
        try {
            $this->updateService->handle($request->user(), $request->validated());
        
            if ($original !== $request->input('email')) {
                Activity::event('user:account.email-changed')
                    ->property(['old' => $original, 'new' => $request->input('email')])
                    ->log();
            }
        
            if ($request->isMethod('put')) {
                return new JsonResponse([], Response::HTTP_NO_CONTENT);
            }

            Log::error('Log testing', [
            ]);
        
            return redirect()->back()->with('res', 'Your email has been updated successfully.');
        
        } catch (\Exception $e) {
            Log::error('Failed to update user email', [
                'user' => $request->user()->id,
                'old_email' => $original,
                'new_email' => $request->input('email'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        
            if ($request->isMethod('put')) {
                throw $e;
            }
            return redirect()->back()->with('error', 'There was an error while updating your email address.');
        }
    }

    /**
 * Update the authenticated user's password. All existing sessions will be logged
 * out immediately.
 *
 * @throws \Throwable
 */
public function updatePassword(UpdatePasswordRequest $request): JsonResponse|RedirectResponse
{
    try {
        $user = $this->updateService->handle($request->user(), $request->validated());

        $guard = $this->manager->guard();
        $guard->setUser($user);

        if (method_exists($guard, 'logoutOtherDevices')) {
            $guard->logoutOtherDevices($request->input('password'));
        }

        Activity::event('user:account.password-changed')->log();

        if ($request->isMethod('put')) {
            return new JsonResponse([], Response::HTTP_NO_CONTENT);
        }

        return redirect()->back()->with('success', 'Your password has been updated successfully.');
    } catch (\Exception $e) {
        Log::error('Failed to update user password', [
            'user' => $request->user()->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        if ($request->isMethod('put')) {
            throw $e;
        }

        return redirect()->back()->with('error', 'There was an error while updating your password.');
    }
}
}