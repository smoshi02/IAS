<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $fillable = ['user_id', 'actor_id', 'type', 'friendship_id', 'read_at'];

    protected $casts = ['read_at' => 'datetime'];

    public function actor()      { return $this->belongsTo(User::class, 'actor_id'); }
    public function friendship() { return $this->belongsTo(Friendship::class); }
}