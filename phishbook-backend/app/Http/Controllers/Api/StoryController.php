<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\StoryReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoryController extends Controller
{
    private function fullName($u): string
    {
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    /** The post shown inside a "shared to story" card. */
    private function fmtShared($p): array
    {
        $media = app(PostController::class)->mediaList($p);
        return [
            'id'    => $p->id,
            'body'  => $p->body,
            'media' => $media,
            'user'  => ['id' => $p->user->id, 'name' => $this->fullName($p->user), 'avatar' => $p->user->avatar_url],
        ];
    }

    public function index(Request $r)
    {
        $uid = $r->user()->id;

        return Story::where('expires_at', '>', now())
            ->with(['user:id,first_name,last_name,avatar_path', 'reactions:id,story_id,user_id,type', 'sharedPost.user:id,first_name,last_name,avatar_path'])
            ->oldest()
            ->get()
            ->groupBy('user_id')
            ->map(function ($items) use ($uid) {
                $u = $items->first()->user;
                return [
                    'user'    => ['id' => $u->id, 'name' => $this->fullName($u), 'avatar' => $u->avatar_url],
                    'stories' => $items->map(fn ($s) => [
                        'id'              => $s->id,
                        'media_url'       => $s->media_path ? asset('storage/' . $s->media_path) : null,
                        'shared'          => $s->sharedPost ? $this->fmtShared($s->sharedPost) : null,
                        'media_type'      => $s->media_type,
                        'caption'         => $s->caption,
                        'filter'          => $s->filter,
                        'text_color'      => $s->text_color,
                        'text_pos'        => $s->text_pos,
                        'alt_text'        => $s->alt_text,
                        'ai_label'        => (bool) $s->ai_label,
                        'zoom'            => (float) ($s->zoom ?? 1),
                        'rotation'        => (int) ($s->rotation ?? 0),
                        'created_at'      => $s->created_at->toIso8601String(),
                        'my_reaction'     => optional($s->reactions->firstWhere('user_id', $uid))->type,
                        'reactions'       => $s->reactions->groupBy('type')->map(fn ($g) => $g->count()),
                        'reactions_count' => $s->reactions->count(),
                    ])->values(),
                ];
            })
            ->sortBy(fn ($g) => $g['user']['id'] === $uid ? 0 : 1)
            ->values();
    }

    public function store(Request $r)
    {
        $r->validate([
            'media'      => 'required|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov|max:51200',
            'caption'    => 'nullable|string|max:200',
            'filter'     => 'nullable|in:none,mono,warm,cool,vivid,fade',
            'text_color' => 'nullable|in:white,black,yellow,pink,blue',
            'text_pos'   => 'nullable|in:top,center,bottom',
            'alt_text'   => 'nullable|string|max:200',
            'ai_label'   => 'nullable|in:0,1,true,false',
            'zoom'       => 'nullable|numeric|min:0.5|max:3',
            'rotation'   => 'nullable|in:0,90,180,270',
        ]);

        $f = $r->file('media');
        $story = Story::create([
            'user_id'    => $r->user()->id,
            'media_path' => $f->store('stories', 'public'),
            'media_type' => str_starts_with($f->getMimeType(), 'video') ? 'video' : 'image',
            'caption'    => $r->input('caption'),
            'filter'     => $r->input('filter') ?: 'none',
            'text_color' => $r->input('text_color') ?: 'white',
            'text_pos'   => $r->input('text_pos') ?: 'bottom',
            'alt_text'   => $r->input('alt_text'),
            'ai_label'   => $r->boolean('ai_label'),
            'zoom'       => $r->filled('zoom') ? (float) $r->input('zoom') : 1,
            'rotation'   => (int) $r->input('rotation', 0),
            'expires_at' => now()->addHours(24),
        ]);

        return response()->json(['id' => $story->id], 201);
    }

    public function react(Request $r, Story $story)
    {
        $r->validate(['type' => 'required|in:like,love,care,haha,wow,sad,angry']);
        abort_if($story->expires_at->isPast(), 404);

        $type = $r->input('type');
        $uid  = $r->user()->id;

        $existing = StoryReaction::where(['story_id' => $story->id, 'user_id' => $uid])->first();

        if ($existing && $existing->type === $type) {
            $existing->delete();
            $mine = null;
        } elseif ($existing) {
            $existing->update(['type' => $type]);
            $mine = $type;
        } else {
            StoryReaction::create(['story_id' => $story->id, 'user_id' => $uid, 'type' => $type]);
            $mine = $type;
        }

        $all = $story->reactions()->get(['type']);
        return [
            'my_reaction'     => $mine,
            'reactions'       => $all->groupBy('type')->map(fn ($g) => $g->count()),
            'reactions_count' => $all->count(),
        ];
    }

    public function destroy(Request $r, Story $story)
    {
        abort_if($story->user_id !== $r->user()->id, 403);
        if ($story->media_path) {
            Storage::disk('public')->delete($story->media_path);
        }
        $story->delete();
        return response()->noContent();
    }
}