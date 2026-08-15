<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The Next.js frontend runs on a different origin to this API, so it needs
    | explicit CORS permission. Because we authenticate with cookies rather than
    | bearer tokens, 'supports_credentials' must be true and the allowed origins
    | must be listed exactly — the '*' wildcard is not permitted alongside
    | credentials and browsers will reject the response.
    |
    | Origins come from FRONTEND_URL so staging and production configure
    | themselves through the environment rather than a code change.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        array_map('trim', explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000')))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
