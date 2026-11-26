<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('likes', function (Blueprint $t) {
            $t->string('type', 10)->default('like')->after('post_id');
        });
    }

    public function down(): void
    {
        Schema::table('likes', function (Blueprint $t) {
            $t->dropColumn('type');
        });
    }
};