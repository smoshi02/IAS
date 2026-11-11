<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin account - change this password immediately after first login.
        User::firstOrCreate(
            ['email' => 'admin@phishbook.test'],
            [
                'first_name' => 'Phishbook',
                'last_name' => 'Admin',
                'username' => 'admin',
                'mobile_number' => null,
                'password' => Hash::make('ChangeMe!2026'),
                'role' => 'ADMIN',
                'account_type' => 'REGULAR',
                'status' => 'ACTIVE',
            ]
        );

        $this->call([DummyAccountSeeder::class]);
    }
}
