<?php

namespace Database\Seeders;

use App\Models\DummyAccount;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DummyAccountSeeder extends Seeder
{
    public function run(): void
    {
        $dummies = [
            ['first' => 'Test', 'last' => 'Participant1', 'username' => 'test_participant1', 'password' => 'TestPass!123'],
            ['first' => 'Test', 'last' => 'Participant2', 'username' => 'test_participant2', 'password' => 'TestPass!456'],
        ];

        foreach ($dummies as $d) {
            $user = User::firstOrCreate(
                ['username' => $d['username']],
                [
                    'first_name' => $d['first'],
                    'last_name' => $d['last'],
                    'email' => $d['username'] . '+dummy@phishbook.test',
                    'password' => Hash::make($d['password']),
                    'role' => 'USER',
                    'account_type' => 'DUMMY',
                    'status' => 'ACTIVE',
                ]
            );

            DummyAccount::firstOrCreate(
                ['test_username' => $d['username']],
                [
                    'user_id' => $user->id,
                    'predefined_test_password_plaintext' => $d['password'],
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
