<?php

namespace Pterodactyl\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class TestController extends Controller
{
    /**
     * Handle POST request and return flash message
     */
    public function test(Request $request): RedirectResponse
    {
        if ($request->method() !== 'POST') {
            abort(405, 'Only POST method is allowed');
        }

        return redirect()->back()->with('status', 'Request worked perfectly!.');
    }
}