<?php

/**
 * Configuration for server operations system.
 *
 * Defines timeouts, cleanup policies, and other operational parameters
 * for long-running server operations like egg changes and reinstalls.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Operation Timeouts
    |--------------------------------------------------------------------------
    |
    | Maximum execution time (in seconds) for different types of server
    | operations before they are considered timed out and marked as failed.
    |
    */
    'timeouts' => [
        'egg_change' => 1800,      // 30 minutes
        'reinstall' => 1200,       // 20 minutes
        'backup_restore' => 2400,  // 40 minutes
        'default' => 900,          // 15 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Operation Cleanup
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic cleanup of old completed operations
    | to prevent database bloat and maintain performance.
    |
    */
    'cleanup' => [
        'enabled' => true,      // Enable automatic cleanup
        'retain_days' => 30,    // Days to retain completed operations
        'chunk_size' => 100,    // Records to process per cleanup batch
    ],
];