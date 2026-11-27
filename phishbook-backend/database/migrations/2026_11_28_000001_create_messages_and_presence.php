<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $t->text('body');
            $t->timestamp('read_at')->nullable();
            $t->timestamps();

            $t->index(['sender_id', 'receiver_id']);
            $t->index(['receiver_id', 'read_at']);
        });

        // Used for the green "online" dot (updated by the notification poll).
        Schema::table('users', function (Blueprint $t) {
            $t->timestamp('last_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn('last_seen_at');
        });
        Schema::dropIfExists('messages');
    }
};