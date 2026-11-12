<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@phishbook.test'],
            [
                'first_name' => 'Phishbook',
                'last_name' => 'Admin',
                'username' => 'admin',
                'mobile_number' => null,
                'password' => 'ChangeMe!2026',
                'role' => 'ADMIN',
                'account_type' => 'REGULAR',
                'status' => 'ACTIVE',
            ]
        );

        $this->call([DummyAccountSeeder::class]);
    }
}

