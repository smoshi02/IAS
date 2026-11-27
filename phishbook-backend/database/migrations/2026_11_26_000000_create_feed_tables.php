<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::create('posts', function (Blueprint $t) {
        $t->id();
        $t->foreignId('user_id')->constrained()->cascadeOnDelete();
        $t->text('body')->nullable();
        $t->string('media_path')->nullable();
        $t->string('media_type')->nullable(); // image | video
        $t->foreignId('shared_post_id')->nullable()->constrained('posts')->nullOnDelete();
        $t->timestamps();
    });
    Schema::create('likes', function (Blueprint $t) {
        $t->id();
        $t->foreignId('user_id')->constrained()->cascadeOnDelete();
        $t->foreignId('post_id')->constrained()->cascadeOnDelete();
        $t->unique(['user_id', 'post_id']);
        $t->timestamps();
    });
    Schema::create('comments', function (Blueprint $t) {
        $t->id();
        $t->foreignId('user_id')->constrained()->cascadeOnDelete();
        $t->foreignId('post_id')->constrained()->cascadeOnDelete();
        $t->text('body');
        $t->timestamps();
    });
}
public function down(): void
{
    Schema::dropIfExists('comments');
    Schema::dropIfExists('likes');
    Schema::dropIfExists('posts');
}
};
