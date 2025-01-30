<?php

namespace Pterodactyl\Services\Notifications;

use Pterodactyl\Models\Notification;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public function notify($target, string $title, string $description, ?string $imageUrl = null, string $type = 'info')
    {
        return DB::transaction(function () use ($target, $title, $description, $imageUrl, $type) {
            $userIds = $this->resolveTargetUsers($target);
            
            return Notification::create([
                'title' => $title,
                'description' => $description,
                'image_url' => $imageUrl,
                'type' => $type,
                'user_ids' => $userIds,
                'admin_only' => $target === 'admins'
            ]);
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
}