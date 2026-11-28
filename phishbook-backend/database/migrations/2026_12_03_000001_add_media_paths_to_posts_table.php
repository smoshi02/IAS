<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A post can now carry several photos/videos. They are stored as a JSON
     * list of {path, type}. The old media_path / media_type columns stay and
     * hold the post's "cover" item, so older posts and the photo/video
     * search filters keep working.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->json('media_paths')->nullable()->after('media_type');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('media_paths');
        });
    }
};