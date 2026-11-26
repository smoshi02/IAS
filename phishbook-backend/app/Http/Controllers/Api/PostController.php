<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    private function fullName($u): string
    {
        $n = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
        return $n !== '' ? $n : ($u->name ?? 'User');
    }

    private function query($uid)
    {
        return Post::with(['user:id,first_name,last_name', 'sharedPost.user:id,first_name,last_name'])
            ->withCount(['likes', 'comments', 'shares'])
            ->withExists(['likes as liked_by_me' => fn ($q) => $q->where('user_id', $uid)]);
    }

    private function fmt(Post $p, bool $nested = true): array
    {
        return [
            'id'             => $p->id,
            'body'           => $p->body,
            'media_url'      => $p->media_path ? asset('storage/' . $p->media_path) : null,
            'media_type'     => $p->media_type,
            'created_at'     => $p->created_at->toIso8601String(),
            'user'           => ['id' => $p->user->id, 'name' => $this->fullName($p->user)],
            'likes_count'    => $p->likes_count ?? 0,
            'comments_count' => $p->comments_count ?? 0,
            'shares_count'   => $p->shares_count ?? 0,
            'liked_by_me'    => (bool) ($p->liked_by_me ?? false),
            'shared'         => ($nested && $p->sharedPost) ? $this->fmt($p->sharedPost, false) : null,
        ];
    }

    private function fmtComment(Comment $c): array
    {
        return [
            'id'         => $c->id,
            'body'       => $c->body,
            'created_at' => $c->created_at->toIso8601String(),
            'user'       => ['id' => $c->user->id, 'name' => $this->fullName($c->user)],
        ];
    }

    public function index(Request $r)
    {
        $page = $this->query($r->user()->id)->latest()->paginate(10);
        $page->getCollection()->transform(fn ($p) => $this->fmt($p));
        return $page;
    }

    public function store(Request $r)
    {
        $r->validate([
            'body'  => 'nullable|string|max:2000',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov|max:51200',
        ]);
        abort_if(!$r->filled('body') && !$r->hasFile('media'), 422, 'Write something or attach a photo/video.');

        $path = $type = null;
        if ($r->hasFile('media')) {
            $f = $r->file('media');
            $path = $f->store('posts', 'public');
            $type = str_starts_with($f->getMimeType(), 'video') ? 'video' : 'image';
        }

        $post = Post::create([
            'user_id'    => $r->user()->id,
            'body'       => $r->input('body'),
            'media_path' => $path,
            'media_type' => $type,
        ]);

        return response()->json($this->fmt($this->query($r->user()->id)->findOrFail($post->id)), 201);
    }

    public function destroy(Request $r, Post $post)
    {
        abort_if($post->user_id !== $r->user()->id, 403);
        if ($post->media_path) {
            Storage::disk('public')->delete($post->media_path);
        }
        $post->delete();
        return response()->noContent();
    }

    public function like(Request $r, Post $post)
    {
        $uid  = $r->user()->id;
        $like = Like::where(['user_id' => $uid, 'post_id' => $post->id])->first();
        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            Like::create(['user_id' => $uid, 'post_id' => $post->id]);
            $liked = true;
        }
        return ['liked' => $liked, 'likes_count' => $post->likes()->count()];
    }

    public function comments(Post $post)
    {
        return $post->comments()->with('user:id,first_name,last_name')->oldest()->get()
            ->map(fn ($c) => $this->fmtComment($c));
    }

    public function comment(Request $r, Post $post)
    {
        $r->validate(['body' => 'required|string|max:1000']);
        $c = Comment::create(['user_id' => $r->user()->id, 'post_id' => $post->id, 'body' => $r->body]);
        $c->load('user:id,first_name,last_name');
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
        return response()->json($this->fmt($this->query($r->user()->id)->findOrFail($new->id)), 201);
    }
}