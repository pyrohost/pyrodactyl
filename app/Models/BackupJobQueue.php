<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\CarbonImmutable;

/**
 * @property int $id
 * @property string $job_id
 * @property int $backup_id
 * @property string $operation_type
 * @property string $status
 * @property array|null $job_data
 * @property string|null $error_message
 * @property int $retry_count
 * @property \Carbon\CarbonImmutable|null $last_polled_at
 * @property \Carbon\CarbonImmutable|null $expires_at
 * @property \Carbon\CarbonImmutable $created_at
 * @property \Carbon\CarbonImmutable $updated_at
 * @property Backup $backup
 */
class BackupJobQueue extends Model
{
    /** @use HasFactory<\Database\Factories\BackupJobQueueFactory> */
    use HasFactory;

    public const RESOURCE_NAME = 'backup_job_queue';

    // Operation types
    public const OPERATION_CREATE = 'create';
    public const OPERATION_DELETE = 'delete';
    public const OPERATION_RESTORE = 'restore';

    // Job statuses
    public const STATUS_QUEUED = 'queued';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RETRY = 'retry';

    protected $table = 'backup_job_queue';

    protected bool $immutableDates = true;

    protected $casts = [
        'id' => 'int',
        'backup_id' => 'int',
        'job_data' => 'array',
        'retry_count' => 'int',
        'last_polled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => self::STATUS_QUEUED,
        'retry_count' => 0,
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    public static array $validationRules = [
        'job_id' => 'required|string|max:255',
        'backup_id' => 'required|int|exists:backups,id',
        'operation_type' => 'required|string|in:create,delete,restore',
        'status' => 'required|string|in:queued,processing,completed,failed,cancelled,retry',
        'job_data' => 'nullable|array',
        'error_message' => 'nullable|string',
        'retry_count' => 'int|min:0|max:10',
    ];

    /**
     * Relationship to the associated backup
     */
    public function backup(): BelongsTo
    {
        return $this->belongsTo(Backup::class);
    }

    /**
     * Check if this job can be retried
     */
    public function canRetry(): bool
    {
        return $this->status === self::STATUS_FAILED &&
               $this->retry_count < config('backups.max_retry_attempts', 3);
    }

    /**
     * Check if this job has expired and should be cleaned up
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Mark this job for retry
     */
    public function markForRetry(string $errorMessage = null): void
    {
        $this->update([
            'status' => self::STATUS_RETRY,
            'retry_count' => $this->retry_count + 1,
            'error_message' => $errorMessage,
            'last_polled_at' => CarbonImmutable::now(),
        ]);
    }

    /**
     * Mark this job as completed
     */
    public function markCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'last_polled_at' => CarbonImmutable::now(),
        ]);
    }

    /**
     * Mark this job as failed
     */
    public function markFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'last_polled_at' => CarbonImmutable::now(),
        ]);
    }

    /**
     * Update last polled timestamp
     */
    public function updateLastPolled(): void
    {
        $this->update(['last_polled_at' => CarbonImmutable::now()]);
    }

    /**
     * Get jobs that need status polling
     */
    public static function needsPolling(): \Illuminate\Database\Eloquent\Builder
    {
        $staleThreshold = CarbonImmutable::now()->subMinutes(2);

        return static::query()
            ->whereIn('status', [self::STATUS_QUEUED, self::STATUS_PROCESSING, self::STATUS_RETRY])
            ->where(function ($query) use ($staleThreshold) {
                $query->whereNull('last_polled_at')
                      ->orWhere('last_polled_at', '<=', $staleThreshold);
            })
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', CarbonImmutable::now());
            });
    }

    /**
     * Get expired jobs that should be cleaned up
     */
    public static function expired(): \Illuminate\Database\Eloquent\Builder
    {
        return static::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', CarbonImmutable::now())
            ->whereNotIn('status', [self::STATUS_COMPLETED]);
    }
}