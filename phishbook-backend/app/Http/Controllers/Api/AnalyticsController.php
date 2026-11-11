<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function summary()
    {
        $totalUsers = User::where('role', 'USER')->count();
        $totalLoginAttempts = LoginActivity::count();
        $successfulLogins = LoginActivity::where('login_status', 'SUCCESSFUL_LOGIN')->count();
        $failedLogins = LoginActivity::whereIn('login_status', ['FAILED_LOGIN', 'INVALID_ACCOUNT', 'UNREGISTERED_USER'])->count();
        $activeUsers = User::where('role', 'USER')->where('status', 'ACTIVE')->count();
        // Website visits == every recorded login-page interaction (attempts).
        $totalVisits = $totalLoginAttempts;

        return response()->json([
            'total_registered_users' => $totalUsers,
            'total_website_visits' => $totalVisits,
            'total_login_attempts' => $totalLoginAttempts,
            'successful_logins' => $successfulLogins,
            'failed_logins' => $failedLogins,
            'active_users' => $activeUsers,
        ]);
    }

    public function loginAttemptsOverTime()
    {
        $data = LoginActivity::select(
            DB::raw('DATE(attempted_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->where('attempted_at', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    public function registrationStatistics()
    {
        $data = User::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->where('role', 'USER')
            ->where('created_at', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    public function successVsFailed()
    {
        $data = LoginActivity::select(
            DB::raw('DATE(attempted_at) as date'),
            DB::raw("SUM(CASE WHEN login_status = 'SUCCESSFUL_LOGIN' THEN 1 ELSE 0 END) as successful"),
            DB::raw("SUM(CASE WHEN login_status != 'SUCCESSFUL_LOGIN' THEN 1 ELSE 0 END) as failed")
        )
            ->where('attempted_at', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    public function dailyActivity()
    {
        $data = LoginActivity::select(
            DB::raw('DATE(attempted_at) as date'),
            DB::raw('COUNT(*) as visits')
        )
            ->where('attempted_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }
}
