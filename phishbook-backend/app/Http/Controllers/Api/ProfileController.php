<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
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

    private function mine(User $u): array
    {
        return ['avatar' => $u->avatar_url, 'cover' => $u->cover_url, 'bio' => $u->bio];
    }

    /** Everything the profile page needs (polled every few seconds). */
    public function show(Request $r, User $user)
    {
        abort_if($user->role !== 'USER' || $user->status !== 'ACTIVE', 404);

        $me   = (int) $r->user()->id;
        $uid  = (int) $user->id;
        $isMe = $me === $uid;

        $rows = Friendship::with([
                'sender:id,first_name,last_name,avatar_path',
                'receiver:id,first_name,last_name,avatar_path',
            ])
            ->where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $uid)->orWhere('receiver_id', $uid))
            ->latest('id')
            ->get();

        $friends = $rows
            ->map(fn ($f) => (int) $f->sender_id === $uid ? $f->receiver : $f->sender)
            ->filter()
            ->values();

        // how the person looking at this profile is related to it
        $rel = ['status' => 'none', 'id' => null];
        if (!$isMe) {
            $f = Friendship::between($me, $uid)->first();
            if ($f) {
                if ($f->status === 'accepted') {
                    $rel = ['status' => 'friends', 'id' => (int) $f->id];
                } elseif ((int) $f->sender_id === $me) {
                    $rel = ['status' => 'sent', 'id' => (int) $f->id];
                } else {
                    $rel = ['status' => 'received', 'id' => (int) $f->id];
                }
            }
        }

        $photos = Post::where('user_id', $uid)
            ->where('media_type', 'image')
            ->whereNotNull('media_path')
            ->latest()
            ->limit(12)
            ->get(['id', 'media_path'])
            ->map(fn ($p) => ['id' => (int) $p->id, 'url' => asset('storage/' . $p->media_path)])
            ->values();

        return [
            'user' => [
                'id'        => $uid,
                'name'      => $this->fullName($user),
                'bio'       => $user->bio,
                'avatar'    => $user->avatar_url,
                'cover'     => $user->cover_url,
                'joined_at' => optional($user->created_at)->toIso8601String() ?? now()->toIso8601String(),
            ],
            'is_me'         => $isMe,
            'friendship'    => $rel,
            'friends_count' => $friends->count(),
            'posts_count'   => Post::where('user_id', $uid)->count(),
            'friends'       => $friends->take(60)->map(fn ($u) => $this->person($u))->values(),
            'photos'        => $photos,
            'me_details'    => $isMe ? [
                'username'      => $user->username,
                'email'         => $user->email,
                'mobile_number' => $user->mobile_number,
                'status'        => $user->status,
            ] : null,
        ];
    }

    public function avatar(Request $r)
    {
        $r->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:10240']);
        return $this->replacePhoto($r->user(), 'avatar_path', $r->file('photo')->store('avatars', 'public'));
    }

    public function cover(Request $r)
    {
        $r->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:10240']);
        return $this->replacePhoto($r->user(), 'cover_path', $r->file('photo')->store('covers', 'public'));
    }

    public function update(Request $r)
    {
        $r->validate(['bio' => 'nullable|string|max:255']);
        $u = $r->user();
        $bio = trim((string) $r->input('bio'));
        $u->bio = $bio !== '' ? $bio : null;
        $u->save();
        return $this->mine($u);
    }

    private function replacePhoto(User $u, string $column, string $path): array
    {
        $old = $u->{$column};
        $u->{$column} = $path;
        $u->save();
        if ($old) {
            Storage::disk('public')->delete($old);
        }
        return $this->mine($u);
    }
}