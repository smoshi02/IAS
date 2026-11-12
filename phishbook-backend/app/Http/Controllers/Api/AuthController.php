<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * USER registration. Driven by the multi-step sign-up flow: name,
     * birthday, gender, contact (mobile number OR email), password, terms.
     * The username is generated here because the flow does not ask for one.
     */
    public function register(Request $request)
    {
        $request->merge([
            'email' => $request->filled('email') ? Str::lower(trim((string) $request->input('email'))) : null,
            'mobile_number' => self::normalizeMobile($request->input('mobile_number')) ?: null,
        ]);

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'birthday' => [
                'required',
                'date_format:Y-m-d',
                'after:1900-01-01',
                'before_or_equal:' . now()->subYears(13)->toDateString(),
            ],
            'gender' => 'required|in:FEMALE,MALE,OTHER',
            'email' => 'required_without:mobile_number|nullable|email|max:150|unique:users,email',
            'mobile_number' => ['required_without:email', 'nullable', 'regex:/^\+?[0-9]{7,15}$/', 'unique:users,mobile_number'],
            'password' => 'required|string|min:8|max:255',
            'terms_accepted' => 'accepted',
        ], [
            'birthday.before_or_equal' => 'You must be at least 13 years old to sign up.',
            'email.required_without' => 'Enter a mobile number or an email address.',
            'mobile_number.required_without' => 'Enter a mobile number or an email address.',
            'mobile_number.regex' => 'Enter a valid mobile number.',
            'mobile_number.unique' => 'That mobile number is already registered.',
            'email.unique' => 'That email address is already registered.',
            'terms_accepted.accepted' => 'You need to agree to the terms and policies to continue.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => trim($request->first_name),
            'last_name' => trim($request->last_name),
            'birthday' => $request->birthday,
            'gender' => $request->gender,
            'email' => $request->email,
            'mobile_number' => $request->mobile_number,
            'username' => $this->generateUsername($request->first_name, $request->last_name),
            'password' => Hash::make($request->password),
            'role' => 'USER',
            'account_type' => 'REGULAR',
            'status' => 'ACTIVE',
            'terms_accepted_at' => now(),
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

        // The sign-up flow allows a mobile number instead of an email, so the
        // identifier may be an email, a username or a mobile number.
        $mobile = self::normalizeMobile($identifier);

        $user = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->when($mobile !== '', fn ($q) => $q->orWhere('mobile_number', $mobile))
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

    /**
     * Strip spaces, dashes, dots and brackets from a phone number. Returns an
     * empty string when the value does not look like a phone number.
     */
    private static function normalizeMobile($value): string
    {
        $clean = preg_replace('/[\s\-\.\(\)]/', '', (string) $value);

        return preg_match('/^\+?[0-9]{7,15}$/', $clean) ? $clean : '';
    }

    private function generateUsername(string $first, string $last): string
    {
        $base = Str::limit(Str::slug(trim($first . ' ' . $last), '_'), 40, '') ?: 'user';

        for ($i = 0; $i < 10; $i++) {
            $username = $base . random_int(1000, 9999);
            if (! User::where('username', $username)->exists()) {
                return $username;
            }
        }

        return $base . Str::lower(Str::random(8));
    }
}