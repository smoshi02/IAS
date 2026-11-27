<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $t) {
            $t->string('alt_text', 200)->nullable();
            $t->boolean('ai_label')->default(false);
            $t->float('zoom')->default(1);
            $t->smallInteger('rotation')->default(0); // 0, 90, 180, 270
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $t) {
            $t->dropColumn(['alt_text', 'ai_label', 'zoom', 'rotation']);
        });
    }
};