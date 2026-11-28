<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $t) {
            // a story can now be a shared post instead of an uploaded photo/video
            $t->string('media_path')->nullable()->change();
            $t->string('media_type', 10)->nullable()->change();
            $t->foreignId('shared_post_id')->nullable()->after('user_id')->constrained('posts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $t) {
            $t->dropConstrainedForeignId('shared_post_id');
        });
    }
};