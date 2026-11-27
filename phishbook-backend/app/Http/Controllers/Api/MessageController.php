<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    private function fullName($u): string
    {
        if (!$u) return 'User';
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    private function isOnline($u): bool
    {
        return $u->last_seen_at && Carbon::parse($u->last_seen_at)->gt(now()->subSeconds(30));
    }

    private function seenAt($u): ?string
    {
        return $u->last_seen_at ? Carbon::parse($u->last_seen_at)->toIso8601String() : null;
    }

    /** ids of accepted friends of $me */
    private function friendIds(int $me): array
    {
        return Friendship::where('status', 'accepted')
            ->where(fn ($q) => $q->where('sender_id', $me)->orWhere('receiver_id', $me))
            ->get(['sender_id', 'receiver_id'])
            ->map(fn ($f) => (int) $f->sender_id === $me ? (int) $f->receiver_id : (int) $f->sender_id)
            ->all();
    }

    /** hides messages the user chose "Remove for you" on */
    private function visible($q, int $me)
    {
        return $q->where(function ($w) use ($me) {
            $w->where(fn ($x) => $x->where('sender_id', $me)->where('deleted_by_sender', false))
              ->orWhere(fn ($x) => $x->where('receiver_id', $me)->where('deleted_by_receiver', false));
        });
    }

    private function involved(Message $m, int $me): bool
    {
        return (int) $m->sender_id === $me || (int) $m->receiver_id === $me;
    }

    private function withRelations()
    {
        return Message::with([
            'replyTo.sender:id,first_name,last_name',
            'reactions.user:id,first_name,last_name',
        ]);
    }

    private function copyFile(?string $from): ?string
    {
        if (!$from || !Storage::disk('public')->exists($from)) return null;
        $ext = pathinfo($from, PATHINFO_EXTENSION);
        $to  = dirname($from) . '/' . uniqid('fwd_', true) . ($ext ? ".{$ext}" : '');
        Storage::disk('public')->copy($from, $to);
        return $to;
    }

    private function fmt(Message $m, int $me): array
    {
        $unsent = $m->unsent_at !== null;

        $reply = null;
        if ($m->replyTo) {
            $rp = $m->replyTo;
            $rUnsent = $rp->unsent_at !== null;
            $reply = [
                'id'         => (int) $rp->id,
                'mine'       => (int) $rp->sender_id === $me,
                'name'       => $this->fullName($rp->sender),
                'body'       => $rUnsent ? null : $rp->body,
                'media_type' => $rUnsent ? null : $rp->media_type,
                'audio'      => !$rUnsent && (bool) $rp->audio_path,
                'unsent'     => $rUnsent,
            ];
        }

        return [
            'id'            => (int) $m->id,
            'mine'          => (int) $m->sender_id === $me,
            'body'          => $unsent ? '' : (string) $m->body,
            'unsent'        => $unsent,
            'media_url'     => (!$unsent && $m->media_path) ? asset('storage/' . $m->media_path) : null,
            'media_type'    => $unsent ? null : $m->media_type,
            'audio_url'     => (!$unsent && $m->audio_path) ? asset('storage/' . $m->audio_path) : null,
            'audio_seconds' => $unsent ? null : $m->audio_seconds,
            'sticker'       => !$unsent && (bool) $m->sticker,
            'forwarded'     => (bool) $m->forwarded,
            'created_at'    => $m->created_at->toIso8601String(),
            'read'          => $m->read_at !== null,
            'reply'         => $reply,
            'reactions'     => $unsent ? [] : $m->reactions->map(fn ($x) => [
                'type' => $x->type,
                'mine' => (int) $x->user_id === $me,
                'name' => $this->fullName($x->user),
            ])->values(),
        ];
    }

    private function fresh(int $id, int $me): array
    {
        return $this->fmt($this->withRelations()->findOrFail($id), $me);
    }

    /** Friends with last message + unread count (polled by the Chats panel). */
    public function conversations(Request $r)
    {
        $me  = (int) $r->user()->id;
        $ids = $this->friendIds($me);

        if (!$ids) {
            return ['conversations' => [], 'total_unread' => 0];
        }

        $users = User::whereIn('id', $ids)
            ->get(['id', 'first_name', 'last_name', 'last_seen_at', 'avatar_path'])
            ->keyBy('id');

        $unread = Message::where('receiver_id', $me)
            ->whereNull('read_at')
            ->whereNull('unsent_at')
            ->where('deleted_by_receiver', false)
            ->whereIn('sender_id', $ids)
            ->selectRaw('sender_id, COUNT(*) AS c')
            ->groupBy('sender_id')
            ->pluck('c', 'sender_id');

        // newest visible message id per friend (conversation)
        $lastIds = Message::where(function ($q) use ($me, $ids) {
                $q->where(fn ($w) => $w->where('sender_id', $me)->whereIn('receiver_id', $ids))
                  ->orWhere(fn ($w) => $w->where('receiver_id', $me)->whereIn('sender_id', $ids));
            })
            ->where(fn ($q) => $this->visible($q, $me))
            ->selectRaw("MAX(id) AS id, CASE WHEN sender_id = {$me} THEN receiver_id ELSE sender_id END AS other")
            ->groupBy('other')
            ->pluck('id');

        $lastByOther = [];
        foreach (Message::whereIn('id', $lastIds)->get() as $m) {
            $other = (int) $m->sender_id === $me ? (int) $m->receiver_id : (int) $m->sender_id;
            $lastByOther[$other] = $m;
        }

        $list = [];
        foreach ($users as $u) {
            $m = $lastByOther[(int) $u->id] ?? null;
            $list[] = [
                'user'      => ['id' => (int) $u->id, 'name' => $this->fullName($u), 'avatar' => $u->avatar_url],
                'online'    => $this->isOnline($u),
                'last_seen' => $this->seenAt($u),
                'unread'    => (int) ($unread[(int) $u->id] ?? 0),
                'last'      => $m ? [
                    'id'         => (int) $m->id,
                    'body'       => $m->unsent_at ? '' : (string) $m->body,
                    'unsent'     => $m->unsent_at !== null,
                    'media_type' => $m->unsent_at ? null : $m->media_type,
                    'audio'      => !$m->unsent_at && (bool) $m->audio_path,
                    'sticker'    => !$m->unsent_at && (bool) $m->sticker,
                    'mine'       => (int) $m->sender_id === $me,
                    'created_at' => $m->created_at->toIso8601String(),
                ] : null,
            ];
        }

        usort($list, function ($a, $b) {
            $d = ($b['last']['id'] ?? 0) <=> ($a['last']['id'] ?? 0);
            return $d !== 0 ? $d : strcmp($a['user']['name'], $b['user']['name']);
        });

        return [
            'conversations' => $list,
            'total_unread'  => array_sum(array_column($list, 'unread')),
        ];
    }

    /**
     * Last 80 messages with one friend (polled every few seconds, so reactions,
     * unsends and "Seen" update live). Opening the thread marks theirs as read.
     */
    public function thread(Request $r, User $user)
    {
        $me = (int) $r->user()->id;
        abort_unless(in_array((int) $user->id, $this->friendIds($me), true), 403, 'You can only chat with friends.');

        $msgs = $this->withRelations()
            ->where(function ($q) use ($me, $user) {
                $q->where(fn ($w) => $w->where('sender_id', $me)->where('receiver_id', $user->id))
                  ->orWhere(fn ($w) => $w->where('sender_id', $user->id)->where('receiver_id', $me));
            })
            ->where(fn ($q) => $this->visible($q, $me))
            ->orderByDesc('id')
            ->limit(80)
            ->get()
            ->reverse()
            ->values();

        Message::where('sender_id', $user->id)
            ->where('receiver_id', $me)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return [
            'messages'  => $msgs->map(fn ($m) => $this->fmt($m, $me))->values(),
            'online'    => $this->isOnline($user),
            'last_seen' => $this->seenAt($user),
        ];
    }

    /** Send text, a photo/video, a voice message or a sticker, optionally as a reply. */
    public function send(Request $r, User $user)
    {
        $me = (int) $r->user()->id;
        abort_unless(in_array((int) $user->id, $this->friendIds($me), true), 403, 'You can only chat with friends.');

        $r->validate([
            'body'        => 'nullable|string|max:1000',
            'media'       => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov|max:51200',
            'audio'       => 'nullable|file|mimes:webm,weba,ogg,oga,opus,m4a,mp4,mp3,mpga,wav|max:10240',
            'duration'    => 'nullable|integer|min:0|max:900',
            'sticker'     => 'nullable|boolean',
            'reply_to_id' => 'nullable|integer',
        ]);
        abort_if(
            !$r->filled('body') && !$r->hasFile('media') && !$r->hasFile('audio'),
            422,
            'Write a message or attach a photo, video or voice message.'
        );

        $path = $type = $audio = null;
        if ($r->hasFile('media')) {
            $f = $r->file('media');
            $path = $f->store('messages', 'public');
            $type = str_starts_with((string) $f->getMimeType(), 'video') ? 'video' : 'image';
        }
        if ($r->hasFile('audio')) {
            $audio = $r->file('audio')->store('messages/voice', 'public');
        }

        // only allow replying to a message from this same conversation
        $replyId = null;
        if ($r->filled('reply_to_id')) {
            $orig = Message::find((int) $r->input('reply_to_id'));
            if ($orig && $this->involved($orig, $me)
                && in_array((int) $user->id, [(int) $orig->sender_id, (int) $orig->receiver_id], true)) {
                $replyId = $orig->id;
            }
        }

        $m = Message::create([
            'sender_id'     => $me,
            'receiver_id'   => $user->id,
            'body'          => trim((string) $r->input('body')),
            'media_path'    => $path,
            'media_type'    => $type,
            'audio_path'    => $audio,
            'audio_seconds' => $audio ? (int) $r->input('duration', 0) : null,
            'sticker'       => $r->boolean('sticker') && $r->filled('body') && !$path && !$audio,
            'reply_to_id'   => $replyId,
        ]);

        return response()->json($this->fresh($m->id, $me), 201);
    }

    /** React to a message (same emoji again removes your reaction). */
    public function react(Request $r, Message $message)
    {
        $me = (int) $r->user()->id;
        abort_unless($this->involved($message, $me), 403);
        abort_if($message->unsent_at !== null, 422, 'This message was unsent.');

        $r->validate(['type' => 'required|string|max:8']);
        $type = $r->input('type');

        $existing = $message->reactions()->where('user_id', $me)->first();
        if ($existing && $existing->type === $type) {
            $existing->delete();
        } elseif ($existing) {
            $existing->update(['type' => $type]);
        } else {
            $message->reactions()->create(['user_id' => $me, 'type' => $type]);
        }

        return $this->fresh($message->id, $me);
    }

    /**
     * ?mode=me        -> "Remove for you" (hidden only for you)
     * ?mode=everyone  -> "Unsend for everyone" (sender only)
     */
    public function destroy(Request $r, Message $message)
    {
        $me = (int) $r->user()->id;
        abort_unless($this->involved($message, $me), 403);

        if ($r->query('mode') === 'everyone') {
            abort_unless((int) $message->sender_id === $me, 403, 'Only the sender can unsend.');

            if ($message->unsent_at === null) {
                if ($message->media_path) {
                    Storage::disk('public')->delete($message->media_path);
                }
                if ($message->audio_path) {
                    Storage::disk('public')->delete($message->audio_path);
                }
                $message->reactions()->delete();
                $message->update([
                    'unsent_at'     => now(),
                    'body'          => '',
                    'media_path'    => null,
                    'media_type'    => null,
                    'audio_path'    => null,
                    'audio_seconds' => null,
                    'sticker'       => false,
                ]);
            }
        } else {
            $message->update(
                (int) $message->sender_id === $me
                    ? ['deleted_by_sender' => true]
                    : ['deleted_by_receiver' => true]
            );
        }

        return response()->noContent();
    }

    /** Forward a message to another friend. */
    public function forward(Request $r, Message $message)
    {
        $me = (int) $r->user()->id;
        abort_unless($this->involved($message, $me), 403);
        abort_if($message->unsent_at !== null, 422, 'This message was unsent.');

        $r->validate(['to' => 'required|integer|exists:users,id']);
        $to = (int) $r->input('to');
        abort_unless(in_array($to, $this->friendIds($me), true), 403, 'You can only forward to friends.');

        // copy the files so unsending the original later does not break the forward
        $path  = $this->copyFile($message->media_path);
        $audio = $this->copyFile($message->audio_path);

        $m = Message::create([
            'sender_id'     => $me,
            'receiver_id'   => $to,
            'body'          => (string) $message->body,
            'media_path'    => $path,
            'media_type'    => $path ? $message->media_type : null,
            'audio_path'    => $audio,
            'audio_seconds' => $audio ? $message->audio_seconds : null,
            'sticker'       => (bool) $message->sticker,
            'forwarded'     => true,
        ]);

        return response()->json($this->fresh($m->id, $me), 201);
    }
}