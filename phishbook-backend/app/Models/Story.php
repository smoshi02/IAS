<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    protected $fillable = [
        'user_id', 'media_path', 'media_type', 'caption',
        'filter', 'text_color', 'text_pos', 'expires_at',
        'alt_text', 'ai_label', 'zoom', 'rotation', 'shared_post_id',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'ai_label'   => 'boolean',
    ];

    public function user()      { return $this->belongsTo(User::class); }
    public function sharedPost() { return $this->belongsTo(Post::class, 'shared_post_id'); }
    public function reactions() { return $this->hasMany(StoryReaction::class); }
}