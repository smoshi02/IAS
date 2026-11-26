<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('media_path');
            $t->string('media_type', 10);
            $t->string('caption', 200)->nullable();
            $t->timestamp('expires_at');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};