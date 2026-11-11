<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * USER registration.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'mobile_number' => 'nullable|string|max:30',
            'username' => 'required|string|max:50|unique:users,username|alpha_dash',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'mobile_number' => $request->mobile_number,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'USER',
            'account_type' => 'REGULAR',
            'status' => 'ACTIVE',
        ]);

        return response()->json([
            'message' => 'Registration successful. Please log in.',
            'user' => $user,
        ], 201);
    }

    /**
     * USER login. This endpoint also drives the Login Activity Monitoring
     * module: every attempt is recorded, successful or not, but the
     * submitted PASSWORD VALUE is never stored or logged anywhere -
     * only whether the password field was non-empty.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifier' => 'required|string', // email or username
            'password' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $identifier = $request->input('identifier');
        $passwordInput = (string) $request->input('password', '');
        $passwordFieldCompleted = strlen($passwordInput) > 0;

        $user = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        $status = 'UNREGISTERED_USER';
        $authenticatedUser = null;

        if ($user && $user->role === 'USER') {
            if ($user->status !== 'ACTIVE') {
                $status = 'INVALID_ACCOUNT';
            } elseif ($passwordFieldCompleted && Hash::check($passwordInput, $user->password)) {
                $status = 'SUCCESSFUL_LOGIN';
                $authenticatedUser = $user;
            } else {
                $status = 'FAILED_LOGIN';
            }
        } elseif ($user && $user->role !== 'USER') {
            // An admin identifier submitted on the user login form.
            $status = 'INVALID_ACCOUNT';
        }

        LoginActivity::create([
            'user_id' => $authenticatedUser?->id,
            'submitted_identifier' => $identifier,
            'login_status' => $status,
            'password_field_completed' => $passwordFieldCompleted,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'attempted_at' => now(),
        ]);

        if (! $authenticatedUser) {
            return response()->json([
                'message' => 'Invalid credentials.',
                'status' => $status,
            ], 401);
        }

        $token = $authenticatedUser->createToken('user-session')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $authenticatedUser,
        ]);
    }

    /**
     * ADMIN login - separate endpoint, only accounts with role=ADMIN
     * can ever authenticate here. Not recorded in the participant
     * login-activity feed (that module tracks the USER login form only).
     */
    public function adminLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $admin = User::where('email', $request->email)
            ->where('role', 'ADMIN')
            ->first();

        if (! $admin || ! Hash::check($request->password, $admin->password) || $admin->status !== 'ACTIVE') {
            return response()->json(['message' => 'Invalid administrator credentials.'], 401);
        }

        $token = $admin->createToken('admin-session')->plainTextToken;

        return response()->json([
            'message' => 'Admin login successful.',
            'token' => $token,
            'user' => $admin,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
