<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $t) {
            $t->string('filter', 12)->default('none')->after('caption');
            $t->string('text_color', 10)->default('white')->after('filter');
            $t->string('text_pos', 10)->default('bottom')->after('text_color');
        });

        Schema::create('story_reactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('story_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 10)->default('like');
            $t->unique(['story_id', 'user_id']);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('story_reactions');
        Schema::table('stories', function (Blueprint $t) {
            $t->dropColumn(['filter', 'text_color', 'text_pos']);
        });
    }
};