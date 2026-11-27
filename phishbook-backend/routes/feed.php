<?php

use App\Http\Controllers\Api\FriendController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\StoryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SearchController;

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

// Friends + notifications (the frontend polls /notifications every few seconds)
Route::get('/friends/overview', [FriendController::class, 'overview']);
Route::post('/friends/request/{user}', [FriendController::class, 'request']);
Route::post('/friends/{friendship}/accept', [FriendController::class, 'accept']);
Route::delete('/friends/{friendship}', [FriendController::class, 'destroy']);

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
Route::post('/notifications/{notification}/read', [NotificationController::class, 'read']);

// Messenger (polled). /chat/conversations must stay above /chat/{user}
Route::get('/chat/conversations', [MessageController::class, 'conversations']);
Route::delete('/chat/messages/{message}', [MessageController::class, 'destroy']);
Route::post('/chat/messages/{message}/react', [MessageController::class, 'react']);
Route::post('/chat/messages/{message}/forward', [MessageController::class, 'forward']);
Route::get('/chat/{user}', [MessageController::class, 'thread']);
Route::post('/chat/{user}', [MessageController::class, 'send']);


// Profiles
Route::get('/users/{user}/profile', [ProfileController::class, 'show']);
Route::post('/profile/avatar', [ProfileController::class, 'avatar']);
Route::post('/profile/cover', [ProfileController::class, 'cover']);
Route::patch('/profile', [ProfileController::class, 'update']);

// Search
Route::get('/search/people', [SearchController::class, 'people']);