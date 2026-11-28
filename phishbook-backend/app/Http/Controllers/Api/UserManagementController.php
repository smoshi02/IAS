<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $users = $this->filtered($request)->orderByDesc('created_at')->paginate(15);

        // The password column holds whatever was captured at registration -
        // surfacing it here is intentional for this exercise's admin
        // monitoring. Not exposed on /login, /me, or /register.
        $users->getCollection()->each->makeVisible('password');

        return response()->json($users);
    }

    /**
     * Downloadable Excel list of participants for the admin to hand off.
     * Only the profile fields a participant may have filled in themselves
     * are included - a blank cell just means that participant never filled
     * that field in on Phishbook. Same search/status/account_type filters
     * as the on-screen table, but unpaginated (every matching row).
     */
    public function exportExcel(Request $request)
    {
        $users = $this->filtered($request)->orderByDesc('created_at')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Users');

        $headers = ['Full Name', 'Contact Number', 'Email', 'Address', 'Gender', 'Job Title'];
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        $row = 2;
        foreach ($users as $user) {
            $sheet->fromArray([
                trim("{$user->first_name} {$user->last_name}"),
                $user->mobile_number,
                $user->email,
                $user->address,
                $user->gender,
                $user->job_title,
            ], null, "A{$row}");
            $row++;
        }

        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'phishbook_users_' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function filtered(Request $request): Builder
    {
        $query = User::where('role', 'USER');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile_number', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($accountType = $request->query('account_type')) {
            $query->where('account_type', $accountType);
        }

        return $query;
    }

    public function updateStatus(Request $request, User $user)
    {
        $request->validate(['status' => 'required|in:ACTIVE,INACTIVE']);

        $user->update(['status' => $request->status]);

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'UPDATE_USER_STATUS',
            'description' => "Set user #{$user->id} ({$user->username}) status to {$request->status}.",
        ]);

        return response()->json(['message' => 'User status updated.', 'user' => $user]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->account_type !== 'DUMMY') {
            return response()->json([
                'message' => 'Only designated dummy/test accounts can be deleted through this action.',
            ], 422);
        }

        $username = $user->username;
        $user->delete();

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'DELETE_TEST_ACCOUNT',
            'description' => "Deleted test account ({$username}).",
        ]);

        return response()->json(['message' => 'Test account deleted.']);
    }
}