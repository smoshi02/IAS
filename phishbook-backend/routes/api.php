<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DummyAccountController;
use App\Http\Controllers\Api\LoginActivityController;
use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| PHISHBOOK API routes
|--------------------------------------------------------------------------
| Public routes are rate-limited (throttle) to reduce abuse.
| All /admin/* routes require a valid Sanctum token AND role=ADMIN,
| enforced by the auth:sanctum + admin middleware stack.
*/

Route::middleware('throttle:20,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
    Route::get('/analytics/login-attempts-over-time', [AnalyticsController::class, 'loginAttemptsOverTime']);
    Route::get('/analytics/registration-statistics', [AnalyticsController::class, 'registrationStatistics']);
    Route::get('/analytics/success-vs-failed', [AnalyticsController::class, 'successVsFailed']);
    Route::get('/analytics/daily-activity', [AnalyticsController::class, 'dailyActivity']);

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::patch('/users/{user}/status', [UserManagementController::class, 'updateStatus']);
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);

    Route::get('/login-activities', [LoginActivityController::class, 'index']);
    Route::get('/login-activities/export-csv', [LoginActivityController::class, 'exportCsv']);

    Route::get('/dummy-accounts', [DummyAccountController::class, 'index']);
    Route::post('/dummy-accounts', [DummyAccountController::class, 'store']);
    Route::patch('/dummy-accounts/{dummyAccount}/status', [DummyAccountController::class, 'updateStatus']);
});
