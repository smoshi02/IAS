<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = ['user_id', 'body', 'media_path', 'media_type', 'media_paths', 'shared_post_id'];

    protected $casts = ['media_paths' => 'array'];

    public function user()       { return $this->belongsTo(User::class); }
    public function likes()      { return $this->hasMany(Like::class); }
    public function comments()   { return $this->hasMany(Comment::class); }
    public function shares()     { return $this->hasMany(Post::class, 'shared_post_id'); }
    public function sharedPost() { return $this->belongsTo(Post::class, 'shared_post_id'); }
}