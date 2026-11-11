<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dummy_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('test_username')->unique();
            // Auth uses the hashed password on the users table.
            // This column stores the SAME plaintext predefined test password
            // ONLY so the authorized dummy-account admin screen can display it
            // back to instructors. It is never used for authentication and is
            // never exposed outside the dummy-account admin endpoints.
            $table->string('predefined_test_password_plaintext');
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dummy_accounts');
    }
};
