<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    private function fullName($u): string
    {
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    /**
     * Polled by the frontend every few seconds, so keep it cheap:
     * latest 30 notifications + two counters.
     */
    public function index(Request $r)
    {
        $me = (int) $r->user()->id;

        // presence: this poll runs every few seconds while the app is open
        DB::table('users')->where('id', $me)->update(['last_seen_at' => now()]);

        $items = UserNotification::with([
                'actor:id,first_name,last_name,avatar_path',
                'friendship:id,status',
            ])
            ->where('user_id', $me)
            ->latest('id')
            ->limit(30)
            ->get()
            ->map(fn ($n) => [
                'id'         => (int) $n->id,
                'type'       => $n->type,
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at->toIso8601String(),
                'actor'      => ['id' => (int) $n->actor->id, 'name' => $this->fullName($n->actor), 'avatar' => $n->actor->avatar_url],
                'friendship' => $n->friendship
                    ? ['id' => (int) $n->friendship->id, 'status' => $n->friendship->status]
                    : null,
            ])
            ->values();

        return [
            'items'            => $items,
            'unread_count'     => UserNotification::where('user_id', $me)->whereNull('read_at')->count(),
            'pending_requests' => Friendship::where('receiver_id', $me)->where('status', 'pending')->count(),
        ];
    }

    public function read(Request $r, UserNotification $notification)
    {
        abort_if((int) $notification->user_id !== (int) $r->user()->id, 403);
        $notification->update(['read_at' => $notification->read_at ?? now()]);
        return response()->noContent();
    }

    public function readAll(Request $r)
    {
        UserNotification::where('user_id', $r->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->noContent();
    }
}