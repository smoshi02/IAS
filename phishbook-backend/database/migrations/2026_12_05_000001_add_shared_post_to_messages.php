<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $t) {
            // a chat message can carry a shared post (shown as a preview card)
            $t->foreignId('shared_post_id')->nullable()->constrained('posts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $t) {
            $t->dropConstrainedForeignId('shared_post_id');
        });
    }
};