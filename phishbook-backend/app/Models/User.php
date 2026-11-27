<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'birthday',
        'gender',
        'email',
        'mobile_number',
        'username',
        'password',
        'role',
        'account_type',
        'status',
        'terms_accepted_at',
        'avatar_path',
        'cover_path',
        'bio',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'birthday' => 'date:Y-m-d',
        'terms_accepted_at' => 'datetime',
    ];

    // login and /me now also return the photo URLs
    protected $appends = ['avatar_url', 'cover_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        $p = $this->attributes['avatar_path'] ?? null;
        return $p ? asset('storage/' . $p) : null;
    }

    public function getCoverUrlAttribute(): ?string
    {
        $p = $this->attributes['cover_path'] ?? null;
        return $p ? asset('storage/' . $p) : null;
    }

    public function loginActivities()
    {
        return $this->hasMany(LoginActivity::class);
    }

    public function dummyAccount()
    {
        return $this->hasOne(DummyAccount::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }
}