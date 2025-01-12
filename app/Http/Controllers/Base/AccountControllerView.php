<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Facades\Activity;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdateEmailRequest;

class AccountControllerView extends Controller
{
    public function __construct(private UserUpdateService $updateService)
    {
    }

    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Account/Overview', [
            'user' => $user,
        ]);
    }

    public function updateEmail(UpdateEmailRequest $request)
    {
        $original = $request->user()->email;
        
        try {
            $this->updateService->handle($request->user(), $request->validated());

            if ($original !== $request->input('email')) {
                Activity::event('user:account.email-changed')
                    ->property(['old' => $original, 'new' => $request->input('email')])
                    ->log();
            }

            return redirect()->back()->with('success', 'Your email has been updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update user email', [
                'user' => $request->user()->id,
                'old_email' => $original,
                'new_email' => $request->input('email'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()->with('error', [
                'message' => 'An error occurred while attempting to update your email address.',
            ]);
        }
    }
}