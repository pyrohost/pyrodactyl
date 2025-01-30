<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Pterodactyl\Models\Notification;
use Pterodactyl\Services\Notifications\NotificationService;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends ClientApiController
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index()
    {
        $user = auth()->user();
        $notifications = Notification::query()
            ->where(function($query) use ($user) {
                $query->whereNull('user_ids')
                    ->orWhereJsonContains('user_ids', $user->id);
            })
            ->when(!$user->root_admin, function($query) {
                $query->where('admin_only', false);
            })
            ->orderByDesc('created_at')
            ->paginate(10);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications
        ]);
    }

    public function purge(Request $request, int $count)
{
    if (!auth()->user()->root_admin) {
        return back()->with('error', [
            'title' => 'Unauthorized Route 403 ',
            'desc' => 'You are not authorized to access this route'
        ]);
    }

    if ($count < 1) {
        
        return back()->with('error', [
            'title' => 'Count Value Error',
            'desc' => 'Count must be greater than 0'
        ]);
    }

    $notifications = Notification::orderBy('created_at', 'asc')
        ->take($count)
        ->delete();

    

    return back()->with('success', [
        'title' => 'Successfully Purged ',
        'desc' => "Successfully purged {$notifications} oldest notifications"
    ]);
}

    public function indexJson(Request $request)
{
    $user = auth()->user();
    $limit = $request->input('new', 10);
    $type = $request->input('type');

    $query = Notification::query()
        ->where(function($query) use ($user) {
            $query->whereNull('user_ids')
                ->orWhereJsonContains('user_ids', $user->id);
        })
        ->when(!$user->root_admin, function($query) {
            $query->where('admin_only', false);
        })
        ->when($type === 'unread', function($query) {
            $query->where('read', false);
        })
        ->orderByDesc('created_at')
        ->take($limit);

    return response()->json([
        'data' => $query->get(),
        'meta' => [
            'type' => $type,
            'limit' => $limit,
            'total' => $query->count()
        ]
    ]);
}

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update([
            'read' => true,
            'read_at' => now()
        ]);

        return back();
    }
}