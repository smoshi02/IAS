<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use App\Models\DummyAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummyAccountController extends Controller
{
    /**
     * List dummy accounts. The predefined test password is only ever
     * returned from THIS controller, to an authenticated ADMIN, never
     * from any user-facing or general user-management endpoint.
     */
    public function index(Request $request)
    {
        $query = DummyAccount::with('user')->latest();

        if ($search = $request->query('search')) {
            $query->where('test_username', 'like', "%{$search}%");
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $accounts = $query->paginate(15);

        $accounts->getCollection()->transform(function (DummyAccount $account) {
            $account->makeVisible('predefined_test_password_plaintext');
            return $account;
        });

        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'test_username' => 'required|string|max:50|unique:users,username|unique:dummy_accounts,test_username',
            'predefined_test_password' => 'required|string|min:8',
        ]);

        $plaintextPassword = $request->predefined_test_password;

        $result = DB::transaction(function () use ($request, $plaintextPassword) {
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => Str::slug($request->test_username) . '+dummy@phishbook.test',
                'username' => $request->test_username,
                'password' => Hash::make($plaintextPassword), // hashed, used for real auth
                'role' => 'USER',
                'account_type' => 'DUMMY',
                'status' => 'ACTIVE',
            ]);

            $dummy = DummyAccount::create([
                'user_id' => $user->id,
                'test_username' => $request->test_username,
                // Stored in the clear, by explicit instructor request, so the
                // dummy-account screen can redisplay the exact test password.
                // This value is never used to authenticate - only users.password
                // (hashed) is checked at login.
                'predefined_test_password_plaintext' => $plaintextPassword,
                'status' => 'ACTIVE',
            ]);

            return $dummy;
        });

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'CREATE_DUMMY_ACCOUNT',
            'description' => "Generated dummy account '{$request->test_username}'.",
        ]);

        $result->load('user');
        $result->makeVisible('predefined_test_password_plaintext');

        return response()->json(['message' => 'Dummy account created.', 'dummy_account' => $result], 201);
    }

    public function updateStatus(Request $request, DummyAccount $dummyAccount)
    {
        $request->validate(['status' => 'required|in:ACTIVE,INACTIVE']);

        $dummyAccount->update(['status' => $request->status]);
        $dummyAccount->user()->update(['status' => $request->status]);

        AdminActivityLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'UPDATE_DUMMY_ACCOUNT_STATUS',
            'description' => "Set dummy account '{$dummyAccount->test_username}' status to {$request->status}.",
        ]);

        return response()->json(['message' => 'Dummy account updated.', 'dummy_account' => $dummyAccount]);
    }
}
