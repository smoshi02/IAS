<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'sender_id', 'receiver_id', 'body', 'read_at',
        'media_path', 'media_type', 'reply_to_id', 'forwarded',
        'deleted_by_sender', 'deleted_by_receiver', 'unsent_at',
        'audio_path', 'audio_seconds', 'sticker',
    ];

    protected $casts = [
        'read_at'             => 'datetime',
        'unsent_at'           => 'datetime',
        'forwarded'           => 'boolean',
        'sticker'             => 'boolean',
        'deleted_by_sender'   => 'boolean',
        'deleted_by_receiver' => 'boolean',
    ];

    public function sender()    { return $this->belongsTo(User::class, 'sender_id'); }
    public function replyTo()   { return $this->belongsTo(self::class, 'reply_to_id'); }
    public function reactions() { return $this->hasMany(MessageReaction::class); }
}