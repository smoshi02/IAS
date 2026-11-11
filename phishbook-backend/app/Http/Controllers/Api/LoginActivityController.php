<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LoginActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginActivity::with('user:id,first_name,last_name,username,email');

        if ($search = $request->query('search')) {
            $query->where('submitted_identifier', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $query->where('login_status', $status);
        }

        if ($date = $request->query('date')) {
            $query->whereDate('attempted_at', $date);
        }

        $activities = $query->orderByDesc('attempted_at')->paginate(20);

        $activities->getCollection()->transform(function (LoginActivity $activity) {
            return [
                'activity_id' => $activity->id,
                'participant_id' => $activity->user_id,
                'participant_name' => $activity->user
                    ? trim($activity->user->first_name . ' ' . $activity->user->last_name)
                    : null,
                'submitted_identifier' => $activity->submitted_identifier,
                'date' => $activity->attempted_at->toDateString(),
                'time' => $activity->attempted_at->toTimeString(),
                'login_status' => $activity->login_status,
                'password_field_completed' => $activity->password_field_completed,
                'ip_address' => $activity->ip_address,
            ];
        });

        return response()->json($activities);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $query = LoginActivity::with('user:id,first_name,last_name');

        if ($status = $request->query('status')) {
            $query->where('login_status', $status);
        }
        if ($date = $request->query('date')) {
            $query->whereDate('attempted_at', $date);
        }

        $filename = 'login_activities_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Activity ID', 'Participant ID', 'Participant Name', 'Submitted Identifier',
                'Date', 'Time', 'Login Status', 'Password Field Completed', 'IP Address',
            ]);

            $query->orderByDesc('attempted_at')->chunk(500, function ($chunk) use ($handle) {
                foreach ($chunk as $activity) {
                    fputcsv($handle, [
                        $activity->id,
                        $activity->user_id,
                        $activity->user ? trim($activity->user->first_name . ' ' . $activity->user->last_name) : '',
                        $activity->submitted_identifier,
                        $activity->attempted_at->toDateString(),
                        $activity->attempted_at->toTimeString(),
                        $activity->login_status,
                        $activity->password_field_completed ? 'Yes' : 'No',
                        $activity->ip_address,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
