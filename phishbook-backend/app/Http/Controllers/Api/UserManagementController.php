<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function index(Request $request)
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

        $users = $query->orderByDesc('created_at')->paginate(15);

        // The password column holds a one-way bcrypt hash, never the
        // original value, so surfacing it here only lets admins see that a
        // password is hashed - it cannot be used to recover anyone's
        // password. Not exposed on /login, /me, or /register.
        $users->getCollection()->each->makeVisible('password');

        return response()->json($users);
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