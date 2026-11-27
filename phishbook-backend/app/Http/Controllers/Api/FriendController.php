<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    private function fullName($u): string
    {
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    private function person($u): array
    {
        return ['id' => (int) $u->id, 'name' => $this->fullName($u), 'avatar' => $u->avatar_url];
    }

    /**
     * Everything the Friends page needs in one request:
     * friends, incoming requests, and people you may know
     * (people you already sent a request to are flagged requested=true).
     */
    public function overview(Request $r)
    {
        $me = (int) $r->user()->id;

        $rows = Friendship::with(['sender:id,	first_name,last_name,avatar_path', 'receiver:id,first_name,last_name,avatar_path'])
            ->where(fn ($q) => $q->where('sender_id', $me)->orWhere('receiver_id', $me))
            ->latest('id')
            ->get();

        $friends = [];
        $requests = [];
        $sentTo = [];       // user id => friendship id
        $exclude = [$me];   // never suggest these

        foreach ($rows as $f) {
            $other = (int) $f->sender_id === $me ? $f->receiver : $f->sender;
            if (!$other) continue;

            if ($f->status === 'accepted') {
                $friends[] = $this->person($other) + ['friendship_id' => (int) $f->id];
                $exclude[] = (int) $other->id;
            } elseif ((int) $f->receiver_id === $me) {
                $requests[] = $this->person($other) + [
                    'friendship_id' => (int) $f->id,
                    'created_at'    => $f->created_at->toIso8601String(),
                ];
                $exclude[] = (int) $other->id;
            } else {
                $sentTo[(int) $other->id] = (int) $f->id;
            }
        }

        $suggestions = User::whereNotIn('id', $exclude)
            ->where('role', 'USER')
            ->where('status', 'ACTIVE')
            ->orderByDesc('id')
            ->limit(30)
            ->get(['id', 'first_name', 'last_name', 'avatar_path'])
            ->map(fn ($u) => $this->person($u) + [
                'requested'     => isset($sentTo[(int) $u->id]),
                'friendship_id' => $sentTo[(int) $u->id] ?? null,
            ])
            ->values();

        return [
            'friends'     => $friends,
            'requests'    => $requests,
            'suggestions' => $suggestions,
        ];
    }

    /** "Add friend" - creates the request and the notification for the other person. */
    public function request(Request $r, User $user)
    {
        $me = $r->user();

        abort_if((int) $me->id === (int) $user->id, 422, 'You cannot add yourself.');
        abort_if($user->role !== 'USER' || $user->status !== 'ACTIVE', 404);

        $existing = Friendship::between((int) $me->id, (int) $user->id)->first();

        if ($existing) {
            // They already asked me -> adding them back just accepts it.
            if ($existing->status === 'pending' && (int) $existing->sender_id === (int) $user->id) {
                return $this->doAccept($existing, $me);
            }
            abort(422, 'Request already sent or you are already friends.');
        }

        $f = Friendship::create([
            'sender_id'   => $me->id,
            'receiver_id' => $user->id,
            'status'      => 'pending',
        ]);

        UserNotification::create([
            'user_id'       => $user->id,
            'actor_id'      => $me->id,
            'type'          => 'friend_request',
            'friendship_id' => $f->id,
        ]);

        return response()->json(['friendship_id' => $f->id, 'status' => 'pending'], 201);
    }

    /** "Confirm" - only the receiver can do this. */
    public function accept(Request $r, Friendship $friendship)
    {
        abort_if((int) $friendship->receiver_id !== (int) $r->user()->id, 403);
        abort_if($friendship->status !== 'pending', 422, 'Already handled.');

        return $this->doAccept($friendship, $r->user());
    }

    private function doAccept(Friendship $f, $me)
    {
        $f->update(['status' => 'accepted']);

        // The request notification the receiver was looking at is now done.
        UserNotification::where('friendship_id', $f->id)
            ->where('type', 'friend_request')
            ->where('user_id', $me->id)
            ->update(['read_at' => now()]);

        // Tell the person who sent it.
        UserNotification::create([
            'user_id'       => $f->sender_id,
            'actor_id'      => $me->id,
            'type'          => 'friend_accepted',
            'friendship_id' => $f->id,
        ]);

        return response()->json(['status' => 'accepted']);
    }

    /**
     * One endpoint for: Delete request (receiver), Cancel request (sender)
     * and Unfriend (either). Related notifications go with it (FK cascade).
     */
    public function destroy(Request $r, Friendship $friendship)
    {
        $me = (int) $r->user()->id;
        abort_unless($me === (int) $friendship->sender_id || $me === (int) $friendship->receiver_id, 403);

        $friendship->delete();
        return response()->noContent();
    }
}