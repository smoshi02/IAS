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
        'email',
        'mobile_number',
        'username',
        'password',
        'role',
        'account_type',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

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
