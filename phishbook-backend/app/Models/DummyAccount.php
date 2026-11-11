<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DummyAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'test_username',
        'predefined_test_password_plaintext',
        'status',
    ];

    // Hidden by default; only the authorized dummy-account controller
    // explicitly makes this visible on its own endpoint.
    protected $hidden = [
        'predefined_test_password_plaintext',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
