<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegisterController extends Controller
{
    public function showRegistrationForm()
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        User::create([
            'username'   => $request->input('username'),
            'email'      => $request->input('email'),
            'password'   => Hash::make($request->input('password')),
            'root_admin' => false,
            'use_totp'   => false,
            'language'   => 'en',
        ]);

        return redirect()->route('login')->with('message', 'Registration successful. Please login.');
    }
}