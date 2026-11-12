<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Timezone used to decide which calendar day an event belongs to.
     * Timestamps are stored in the app timezone (UTC), so grouping with the
     * database's DATE() would push anything between 00:00 and 08:00 Manila
     * time onto the previous day.
     */
    private const DISPLAY_TIMEZONE = 'Asia/Manila';

    private const CHART_DAYS = 14;

    public function summary()
    {
        // Dummy (seeded test) accounts are not participants, so they are not
        // counted as registered or active users.
        $participants = User::where('role', 'USER')->where('account_type', 'REGULAR');

        $totalUsers = (clone $participants)->count();
        $activeUsers = (clone $participants)->where('status', 'ACTIVE')->count();

        $totalLoginAttempts = LoginActivity::count();
        $successfulLogins = LoginActivity::where('login_status', 'SUCCESSFUL_LOGIN')->count();
        $failedLogins = LoginActivity::whereIn('login_status', ['FAILED_LOGIN', 'INVALID_ACCOUNT', 'UNREGISTERED_USER'])->count();

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
        $rows = LoginActivity::where('attempted_at', '>=', $this->windowStart(self::CHART_DAYS))
            ->get(['attempted_at', 'login_status']);

        $data = collect($this->groupByDay($rows, 'attempted_at', self::CHART_DAYS))
            ->map(fn ($day, $date) => ['date' => $date, 'total' => $day->count()])
            ->values();

        return response()->json($data);
    }

    public function registrationStatistics()
    {
        $rows = User::where('role', 'USER')
            ->where('account_type', 'REGULAR')
            ->where('created_at', '>=', $this->windowStart(self::CHART_DAYS))
            ->get(['created_at']);

        $data = collect($this->groupByDay($rows, 'created_at', self::CHART_DAYS))
            ->map(fn ($day, $date) => ['date' => $date, 'total' => $day->count()])
            ->values();

        return response()->json($data);
    }

    public function successVsFailed()
    {
        $rows = LoginActivity::where('attempted_at', '>=', $this->windowStart(self::CHART_DAYS))
            ->get(['attempted_at', 'login_status']);

        $data = collect($this->groupByDay($rows, 'attempted_at', self::CHART_DAYS))
            ->map(function ($day, $date) {
                $successful = $day->where('login_status', 'SUCCESSFUL_LOGIN')->count();

                return [
                    'date' => $date,
                    'successful' => $successful,
                    'failed' => $day->count() - $successful,
                ];
            })
            ->values();

        return response()->json($data);
    }

    public function dailyActivity()
    {
        $rows = LoginActivity::where('attempted_at', '>=', $this->windowStart(30))
            ->get(['attempted_at']);

        $data = collect($this->groupByDay($rows, 'attempted_at', 30))
            ->map(fn ($day, $date) => ['date' => $date, 'visits' => $day->count()])
            ->values();

        return response()->json($data);
    }

    /**
     * Start of the oldest day in the window, expressed in the app timezone so
     * it can be compared against the stored timestamps.
     */
    private function windowStart(int $days): Carbon
    {
        return Carbon::now(self::DISPLAY_TIMEZONE)
            ->startOfDay()
            ->subDays($days - 1)
            ->setTimezone(config('app.timezone'));
    }

    /**
     * Bucket rows by calendar day (in DISPLAY_TIMEZONE). Every day in the
     * window is present, oldest first, so quiet days show up as zeros
     * instead of being skipped.
     *
     * @return array<string, \Illuminate\Support\Collection>
     */
    private function groupByDay($rows, string $column, int $days): array
    {
        $today = Carbon::now(self::DISPLAY_TIMEZONE)->startOfDay();

        $buckets = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $buckets[$today->copy()->subDays($i)->toDateString()] = collect();
        }

        foreach ($rows as $row) {
            $date = $row->{$column}->copy()->setTimezone(self::DISPLAY_TIMEZONE)->toDateString();

            if (isset($buckets[$date])) {
                $buckets[$date]->push($row);
            }
        }

        return $buckets;
    }
}