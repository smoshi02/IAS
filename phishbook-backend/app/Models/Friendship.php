<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Friendship extends Model
{
    protected $fillable = ['sender_id', 'receiver_id', 'status'];

    public function sender()   { return $this->belongsTo(User::class, 'sender_id'); }
    public function receiver() { return $this->belongsTo(User::class, 'receiver_id'); }

    /** Row between two users, whichever way round it was sent. */
    public function scopeBetween($q, int $a, int $b)
    {
        return $q->where(function ($q) use ($a, $b) {
            $q->where(fn ($w) => $w->where('sender_id', $a)->where('receiver_id', $b))
              ->orWhere(fn ($w) => $w->where('sender_id', $b)->where('receiver_id', $a));
        });
    }
}