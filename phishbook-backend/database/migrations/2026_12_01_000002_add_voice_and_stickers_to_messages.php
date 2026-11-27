<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $t) {
            $t->string('audio_path')->nullable();
            $t->unsignedSmallInteger('audio_seconds')->nullable();
            $t->boolean('sticker')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $t) {
            $t->dropColumn(['audio_path', 'audio_seconds', 'sticker']);
        });
    }
};