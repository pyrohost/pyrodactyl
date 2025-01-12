<?php

return [
    'paths' => [
        '/api/client', 
        '/api/application', 
        '/api/client/*', 
        '/api/application/*',
        '/*' // Allow CORS for all routes including Inertia
    ],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],

    'allowed_origins' => explode(',', env('APP_CORS_ALLOWED_ORIGINS') ?? ''),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        '*',
        'X-Inertia',
        'X-Inertia-Version',
        'X-Requested-With',
        'Content-Type',
        'Accept',
    ],

    'exposed_headers' => [
        'X-Inertia',
        'X-Inertia-Version',
        'X-Inertia-Location',
    ],

    'max_age' => 0,

    'supports_credentials' => true,
];