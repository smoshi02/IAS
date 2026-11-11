<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    /**
     * Protect admin-only API routes. Ordinary USER accounts, and any
     * unauthenticated request, are rejected before reaching the controller.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->role !== 'ADMIN' || $user->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Forbidden. Administrator access only.',
            ], 403);
        }

        return $next($request);
    }
}
