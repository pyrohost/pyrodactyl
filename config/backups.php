<?php

use Pterodactyl\Models\Backup;

return [
    // The backup driver to use for this Panel instance. All client generated server backups
    // will be stored in this location by default. It is possible to change this once backups
    // have been made, without losing data.
    // Options: elytra, wings (legacy), s3, rustic_local, rustic_s3
    'default' => env('APP_BACKUP_DRIVER', Backup::ADAPTER_WINGS),

    // This value is used to determine the lifespan of UploadPart presigned urls that wings
    // uses to upload backups to S3 storage.  Value is in minutes, so this would default to an hour.
    'presigned_url_lifespan' => env('BACKUP_PRESIGNED_URL_LIFESPAN', 60),

    // This value defines the maximal size of a single part for the S3 multipart upload during backups
    // The maximal part size must be given in bytes. The default value is 5GB.
    // Note that 5GB is the maximum for a single part when using AWS S3.
    'max_part_size' => env('BACKUP_MAX_PART_SIZE', 5 * 1024 * 1024 * 1024),

    // The time to wait before automatically failing a backup, time is in minutes and defaults
    // to 6 hours.  To disable this feature, set the value to `0`.
    'prune_age' => env('BACKUP_PRUNE_AGE', 360),

    // The maximum number of unlocked automatic backups to keep per server. When this limit is
    // exceeded, the oldest unlocked automatic backups will be automatically deleted. Locked
    // automatic backups do not count toward this limit and are preserved indefinitely.
    // Set to 0 to disable automatic pruning. Defaults to 32.
    'automatic_backup_limit' => env('BACKUP_AUTOMATIC_LIMIT', 32),

    'disks' => [
        // There is no configuration for the local disk for Wings. That configuration
        // is determined by the Daemon configuration, and not the Panel.
        'wings' => [
            'adapter' => Backup::ADAPTER_WINGS,
        ],

        // Elytra local backups (preferred over wings)
        'elytra' => [
            'adapter' => Backup::ADAPTER_ELYTRA,
        ],

        // Configuration for storing backups in Amazon S3. This uses the same credentials
        // specified in filesystems.php but does include some more specific settings for
        // backups, notably bucket, location, and use_accelerate_endpoint.
        's3' => [
            'adapter' => Backup::ADAPTER_AWS_S3,

            'region' => env('AWS_DEFAULT_REGION'),
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),

            // The S3 bucket to use for backups.
            'bucket' => env('AWS_BACKUPS_BUCKET'),

            // The location within the S3 bucket where backups will be stored. Backups
            // are stored within a folder using the server's UUID as the name. Each
            // backup for that server lives within that folder.
            'prefix' => env('AWS_BACKUPS_BUCKET') ?? '',

            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'use_accelerate_endpoint' => env('AWS_BACKUPS_USE_ACCELERATE', false),

            'storage_class' => env('AWS_BACKUPS_STORAGE_CLASS'),
        ],

        // Configuration for Rustic local backups. Rustic provides deduplicated,
        // encrypted backups with fast incremental snapshots.
        'rustic_local' => [
            'adapter' => Backup::ADAPTER_RUSTIC_LOCAL,

            // Path to rustic binary
            'binary_path' => env('RUSTIC_BINARY_PATH', 'rustic'),

            // Base path where rustic repositories will be stored (one per server)
            'repository_base_path' => env('RUSTIC_REPOSITORY_BASE_PATH', '/var/lib/pterodactyl/rustic-repos'),

            // Repository version (optional, default handled by rustic)
            'repository_version' => env('RUSTIC_REPOSITORY_VERSION', 2),

            // Pack size configuration for performance tuning
            'tree_pack_size_mb' => env('RUSTIC_TREE_PACK_SIZE_MB', 4),
            'data_pack_size_mb' => env('RUSTIC_DATA_PACK_SIZE_MB', 32),

            // Hot/cold storage setup option
            'use_cold_storage' => env('RUSTIC_LOCAL_USE_COLD_STORAGE', false),
            'hot_repository_path' => env('RUSTIC_LOCAL_HOT_REPOSITORY_PATH', ''),
        ],

        // Configuration for Rustic S3 backups. Combines Rustic's features with S3 storage.
        'rustic_s3' => [
            'adapter' => Backup::ADAPTER_RUSTIC_S3,

            // S3 configuration
            'endpoint' => env('RUSTIC_S3_ENDPOINT', env('AWS_ENDPOINT')),
            'region' => env('RUSTIC_S3_REGION', env('AWS_DEFAULT_REGION', 'us-east-1')),
            'bucket' => env('RUSTIC_S3_BUCKET'),
            'prefix' => env('RUSTIC_S3_PREFIX', 'rustic-repos/'),

            // S3 credentials
            'key' => env('RUSTIC_S3_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID')),
            'secret' => env('RUSTIC_S3_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY')),

            // Hot/cold storage configuration
            'use_cold_storage' => env('RUSTIC_S3_USE_COLD_STORAGE', false),
            'hot_bucket' => env('RUSTIC_S3_HOT_BUCKET', ''),
            'cold_storage_class' => env('RUSTIC_S3_COLD_STORAGE_CLASS', 'GLACIER'),

            // Connection options
            'force_path_style' => env('RUSTIC_S3_FORCE_PATH_STYLE', false),
            'disable_ssl' => env('RUSTIC_S3_DISABLE_SSL', false),
            'ca_cert_path' => env('RUSTIC_S3_CA_CERT_PATH', ''),
        ],
    ],
];
