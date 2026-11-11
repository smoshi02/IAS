<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('submitted_identifier'); // email/username typed, never the password
            $table->enum('login_status', [
                'SUCCESSFUL_LOGIN',
                'FAILED_LOGIN',
                'INVALID_ACCOUNT',
                'UNREGISTERED_USER',
            ]);
            $table->boolean('password_field_completed')->default(false);
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('attempted_at')->useCurrent();

            $table->index('login_status');
            $table->index('attempted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_activities');
    }
};
