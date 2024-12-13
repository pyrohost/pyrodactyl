<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // Retrieve the valid API key from .env
            $validApiKey = env('ADMIN_API_KEY');
            
            if (!$validApiKey) {
                Log::error('ADMIN_API_KEY not configured in environment');
                return response()->json([
                    'error' => 'Server configuration error',
                    'message' => 'API key not properly configured'
                ], 500);
            }

            // Get the bearer token from the request
            $bearerToken = $request->bearerToken();

            // Log the API key received (Note: Be cautious with this in production)
            Log::info('API key received:', ['api_key' => $bearerToken]);

            if ($bearerToken) {
                if ($bearerToken === $validApiKey) {
                    Log::info('Successful API authentication', [
                        'ip' => $request->ip(),
                        'path' => $request->path()
                    ]);
                    return $next($request);
                }

                Log::warning('Invalid API key provided', [
                    'ip' => $request->ip(),
                    'path' => $request->path(),
                    'provided_key' => $bearerToken
                ]);
                return response()->json([
                    'error' => 'Invalid API key',
                    'message' => 'The provided API key is not valid'
                ], 403);
            }

            // Fallback to regular admin check
            if ($request->is('admin*')) {
                if (!Auth::check() || !Auth::user()->is_admin) {
                    Log::warning('Unauthorized admin access attempt', [
                        'ip' => $request->ip(),
                        'user_id' => Auth::id() ?? 'guest'
                    ]);
                    return response()->json([
                        'error' => 'Unauthorized',
                        'message' => 'Admin privileges required'
                    ], 403);
                }
            }

            return $next($request);

        } catch (\Exception $e) {
            Log::error('AdminMiddleware critical error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip()
            ]);
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'An unexpected error occurred'
            ], 500);
        }
    }
}