<?php

namespace Pterodactyl\Services\Notifications;

use Pterodactyl\Models\Notification;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class NotificationService
{
    private const DISCORD_COLORS = [ // color pallate 
        'info' => 3447003,     // Blue 
        'success' => 5763719,  // Green
        'error' => 15158332,   // Red
        'warning' => 16776960  // Yellow
    ];

    public function notify($target, string $title, string $description, ?string $imageUrl = null, string $type = 'info')
    {
        return DB::transaction(function () use ($target, $title, $description, $imageUrl, $type) {
            $notification = Notification::create([
                'title' => $title,
                'description' => $description,
                'image_url' => $imageUrl,
                'type' => $type,
                'user_ids' => $this->resolveTargetUsers($target),
                'admin_only' => $target === 'admins'
            ]);

            $this->sendDiscordNotification($title, $description, $type, $target);

            return $notification;
        });
    }

    private function resolveTargetUsers($target): ?array
    {
        if ($target === 'all') {
            return null;
        }

        if ($target === 'admins') {
            return User::where('root_admin', true)->pluck('id')->toArray();
        }

        if (is_array($target)) {
            return $target;
        }

        return [$target];
    }

    private function sendDiscordNotification(string $title, string $description, string $type, $target): void
    {
        if (!$webhookUrl = env('DISCORD_WEBHOOK')) {
            return;
        }

        $fields = [];
        if ($target === 'admins') {
            $fields[] = [
                'name' => 'Audience',
                'value' => 'Administrators Only',
                'inline' => true
            ];
        }

        Http::post($webhookUrl, [
            'embeds' => [[
                'title' => $title,
                'description' => $description,
                'color' => self::DISCORD_COLORS[$type] ?? self::DISCORD_COLORS['info'],
                'fields' => $fields,
                'timestamp' => now()
            ]]
        ]);
    }
}