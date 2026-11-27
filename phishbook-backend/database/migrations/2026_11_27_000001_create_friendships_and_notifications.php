<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per pair. sender = who clicked "Add friend".
        Schema::create('friendships', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $t->string('status', 10)->default('pending'); // pending | accepted
            $t->timestamps();

            $t->unique(['sender_id', 'receiver_id']);
            $t->index(['receiver_id', 'status']);
        });

        // In-app notifications (the bell). user_id = who receives it.
        Schema::create('user_notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $t->string('type', 30); // friend_request | friend_accepted
            $t->foreignId('friendship_id')->nullable()->constrained('friendships')->cascadeOnDelete();
            $t->timestamp('read_at')->nullable();
            $t->timestamps();

            $t->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('friendships');
    }
};