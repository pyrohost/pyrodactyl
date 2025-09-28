<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElytraJob extends Model
{
    use HasUuids;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'server_id',
        'user_id',
        'job_type',
        'job_data',
        'status',
        'progress',
        'status_message',
        'error_message',
        'elytra_job_id',
        'submitted_at',
        'completed_at',
    ];

    protected $casts = [
        'job_data' => 'array',
        'progress' => 'integer',
        'created_at' => 'immutable_datetime',
        'submitted_at' => 'immutable_datetime',
        'completed_at' => 'immutable_datetime',
        'updated_at' => 'immutable_datetime',
    ];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_SUBMITTED,
            self::STATUS_RUNNING,
        ]);
    }

    public function isCompleted(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ]);
    }

    public function isInProgress(): bool
    {
        return in_array($this->status, [
            self::STATUS_SUBMITTED,
            self::STATUS_RUNNING,
        ]);
    }

    public function getStatusDisplayAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_SUBMITTED => 'Submitted',
            self::STATUS_RUNNING => 'Running',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    public function getOperationAttribute(): string
    {
        return match ($this->job_type) {
            'backup_create' => 'create',
            'backup_delete' => 'delete',
            'backup_restore' => 'restore',
            'backup_download' => 'download',
            default => 'unknown',
        };
    }
}