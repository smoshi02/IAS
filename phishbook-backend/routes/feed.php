<?php

use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\StoryController;
use Illuminate\Support\Facades\Route;

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::delete('/posts/{post}', [PostController::class, 'destroy']);
Route::post('/posts/{post}/like', [PostController::class, 'like']);
Route::get('/posts/{post}/comments', [PostController::class, 'comments']);
Route::post('/posts/{post}/comments', [PostController::class, 'comment']);
Route::post('/posts/{post}/share', [PostController::class, 'share']);

Route::get('/stories', [StoryController::class, 'index']);
Route::post('/stories', [StoryController::class, 'store']);
Route::post('/stories/{story}/react', [StoryController::class, 'react']);
Route::delete('/stories/{story}', [StoryController::class, 'destroy']);