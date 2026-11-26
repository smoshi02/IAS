<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Story extends Model
{
    protected $fillable = [
        'user_id', 'media_path', 'media_type', 'caption',
        'filter', 'text_color', 'text_pos', 'expires_at',
    ];

    protected $casts = ['expires_at' => 'datetime'];

    public function user()      { return $this->belongsTo(User::class); }
    public function reactions() { return $this->hasMany(StoryReaction::class); }
}