<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Friendship;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    private function fullName($u): string
    {
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    private function query()
    {
        return Post::with([
                'user:id,first_name,last_name,avatar_path',
                'sharedPost.user:id,first_name,last_name,avatar_path',
                'likes:id,post_id,user_id,type',
            ])
            ->withCount(['comments', 'shares']);
    }

    /** Every photo/video on a post as [{url, type}], oldest posts (single media_path) included. */
    public function mediaList(Post $p): array
    {
        $items = is_array($p->media_paths) ? $p->media_paths : [];

        if (count($items)) {
            return array_values(array_map(fn ($i) => [
                'url'  => asset('storage/' . $i['path']),
                'type' => $i['type'] ?? 'image',
            ], $items));
        }

        if ($p->media_path) {
            return [['url' => asset('storage/' . $p->media_path), 'type' => $p->media_type ?: 'image']];
        }

        return [];
    }

    private function fmt(Post $p, $uid, bool $nested = true): array
    {
        $likes = $p->relationLoaded('likes') ? $p->likes : collect();
        $media = $this->mediaList($p);

        return [
            'id'             => $p->id,
            'body'           => $p->body,
            'media'          => $media,
            'media_url'      => $media[0]['url'] ?? null,   // first item, kept for older screens
            'media_type'     => $media[0]['type'] ?? null,
            'created_at'     => $p->created_at->toIso8601String(),
            'user'           => ['id' => $p->user->id, 'name' => $this->fullName($p->user), 'avatar' => $p->user->avatar_url],
            'likes_count'    => $likes->count(),
            'reactions'      => $likes->groupBy('type')->map(fn ($g) => $g->count()),
            'my_reaction'    => optional($likes->firstWhere('user_id', $uid))->type,
            'comments_count' => $p->comments_count ?? 0,
            'shares_count'   => $p->shares_count ?? 0,
            'shared'         => ($nested && $p->sharedPost) ? $this->fmt($p->sharedPost, $uid, false) : null,
        ];
    }

    private function fmtComment(Comment $c): array
    {
        return [
            'id'         => $c->id,
            'body'       => $c->body,
            'created_at' => $c->created_at->toIso8601String(),
            'user'       => ['id' => $c->user->id, 'name' => $this->fullName($c->user), 'avatar' => $c->user->avatar_url],
        ];
    }

    public function index(Request $r)
    {
        $uid = $r->user()->id;
        $q   = $this->query()->latest();

        if ($r->filled('user_id')) {
            $q->where('user_id', (int) $r->query('user_id'));
        }

        // ---- search: ?q=text  (post text, author name, or the text of a shared post)
        if ($r->filled('q')) {
            $like = '%' . addcslashes(trim((string) $r->query('q')), '\\%_') . '%';
            $q->where(function ($w) use ($like) {
                $w->where('body', 'like', $like)
                  ->orWhereHas('user', function ($u) use ($like) {
                      $u->where('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like)
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$like]);
                  })
                  ->orWhereHas('sharedPost', fn ($s) => $s->where('body', 'like', $like));
            });
        }

        // ---- ?media=image|video  (photos / videos tabs of the search page)
        if (in_array($r->query('media'), ['image', 'video'], true)) {
            $q->where('media_type', $r->query('media'));
        }

        // ---- ?since=today|week|month|year  (the "Date posted" filter)
        $sinceMap = [
            'today' => now()->startOfDay(),
            'week'  => now()->subDays(7),
            'month' => now()->subDays(30),
            'year'  => now()->subDays(365),
        ];
        $sinceKey = $r->query('since');
        $since = is_string($sinceKey) ? ($sinceMap[$sinceKey] ?? null) : null;
        if ($since) {
            $q->where('created_at', '>=', $since);
        }

        // ---- ?from=me|friends  (the "Posts from" filter)
        if ($r->query('from') === 'me') {
            $q->where('user_id', $uid);
        } elseif ($r->query('from') === 'friends') {
            $friendIds = Friendship::where('status', 'accepted')
                ->where(fn ($w) => $w->where('sender_id', $uid)->orWhere('receiver_id', $uid))
                ->get()
                ->map(fn ($f) => (int) $f->sender_id === (int) $uid ? (int) $f->receiver_id : (int) $f->sender_id);
            $q->whereIn('user_id', $friendIds);
        }

        $page = $q->paginate(10);
        $page->getCollection()->transform(fn ($p) => $this->fmt($p, $uid));
        return $page;
    }

    public function store(Request $r)
    {
        // accept a single `media` file too, not just media[]
        if ($r->hasFile('media') && !is_array($r->file('media'))) {
            $r->files->set('media', [$r->file('media')]);
        }

        $r->validate([
            'body'    => 'nullable|string|max:2000',
            'media'   => 'nullable|array|max:20',
            'media.*' => 'file|mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov|max:51200',
        ]);

        $files = array_values(array_filter(Arr::wrap($r->file('media'))));
        abort_if(!$r->filled('body') && count($files) === 0, 422, 'Write something or attach a photo/video.');

        $items = [];
        foreach ($files as $f) {
            $items[] = [
                'path' => $f->store('posts', 'public'),
                'type' => str_starts_with($f->getMimeType(), 'video') ? 'video' : 'image',
            ];
        }

        // cover = first photo if there is one, otherwise the first item
        $cover = collect($items)->firstWhere('type', 'image') ?? ($items[0] ?? null);

        $post = Post::create([
            'user_id'     => $r->user()->id,
            'body'        => $r->input('body'),
            'media_path'  => $cover['path'] ?? null,
            'media_type'  => $cover['type'] ?? null,
            'media_paths' => count($items) ? $items : null,
        ]);

        return response()->json($this->fmt($this->query()->findOrFail($post->id), $r->user()->id), 201);
    }

    /** One post, for the "X's Post" pop-up (opened from a chat card). */
    public function show(Request $r, Post $post)
    {
        return response()->json($this->fmt($this->query()->findOrFail($post->id), $r->user()->id));
    }

    public function destroy(Request $r, Post $post)
    {
        abort_if($post->user_id !== $r->user()->id, 403);

        $paths = collect(is_array($post->media_paths) ? $post->media_paths : [])->pluck('path');
        if ($post->media_path) {
            $paths->push($post->media_path);
        }
        foreach ($paths->unique() as $path) {
            Storage::disk('public')->delete($path);
        }

        $post->delete();
        return response()->noContent();
    }

    public function like(Request $r, Post $post)
    {
        $r->validate(['type' => 'nullable|in:like,love,care,haha,wow,sad,angry']);
        $type = $r->input('type', 'like');
        $uid  = $r->user()->id;

        $existing = Like::where(['user_id' => $uid, 'post_id' => $post->id])->first();

        if ($existing && $existing->type === $type) {
            $existing->delete();
            $mine = null;
        } elseif ($existing) {
            $existing->update(['type' => $type]);
            $mine = $type;
        } else {
            Like::create(['user_id' => $uid, 'post_id' => $post->id, 'type' => $type]);
            $mine = $type;
        }

        $likes = $post->likes()->get(['type']);
        return [
            'my_reaction' => $mine,
            'likes_count' => $likes->count(),
            'reactions'   => $likes->groupBy('type')->map(fn ($g) => $g->count()),
        ];
    }

    public function comments(Post $post)
    {
        return $post->comments()->with('user:id,first_name,last_name,avatar_path')->oldest()->get()
            ->map(fn ($c) => $this->fmtComment($c));
    }

    public function comment(Request $r, Post $post)
    {
        $r->validate(['body' => 'required|string|max:1000']);
        $c = Comment::create(['user_id' => $r->user()->id, 'post_id' => $post->id, 'body' => $r->body]);
        $c->load('user:id,first_name,last_name,avatar_path');
        return response()->json($this->fmtComment($c), 201);
    }

    public function share(Request $r, Post $post)
    {
        $r->validate(['body' => 'nullable|string|max:2000']);
        $orig = $post->shared_post_id ? $post->sharedPost : $post;
        $new  = Post::create([
            'user_id'        => $r->user()->id,
            'body'           => $r->input('body'),
            'shared_post_id' => $orig->id,
        ]);
        return response()->json($this->fmt($this->query()->findOrFail($new->id), $r->user()->id), 201);
    }

    /** "Your story" in the share dialog: puts the post into the user's story for 24h. */
    public function shareToStory(Request $r, Post $post)
    {
        $orig = $post->shared_post_id ? $post->sharedPost : $post;
        abort_if(!$orig, 404);

        $story = \App\Models\Story::create([
            'user_id'        => $r->user()->id,
            'shared_post_id' => $orig->id,
            'media_path'     => null,
            'media_type'     => null,
            'expires_at'     => now()->addHours(24),
        ]);

        return response()->json(['id' => $story->id], 201);
    }
}