<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $t) {
            $t->string('media_path')->nullable();
            $t->string('media_type', 10)->nullable();          // image | video
            $t->unsignedBigInteger('reply_to_id')->nullable(); // "replied to" message
            $t->boolean('forwarded')->default(false);
            $t->boolean('deleted_by_sender')->default(false);   // "Remove for you" (sender side)
            $t->boolean('deleted_by_receiver')->default(false); // "Remove for you" (receiver side)
            $t->timestamp('unsent_at')->nullable();             // "Unsend for everyone"
        });

        Schema::create('message_reactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 16);
            $t->timestamps();

            $t->unique(['message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
        Schema::table('messages', function (Blueprint $t) {
            $t->dropColumn([
                'media_path', 'media_type', 'reply_to_id', 'forwarded',
                'deleted_by_sender', 'deleted_by_receiver', 'unsent_at',
            ]);
        });
    }
};