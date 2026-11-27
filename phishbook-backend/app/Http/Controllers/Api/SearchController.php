<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * GET /api/search/people?q=juan&limit=20
     * Matches first name, last name, full name and bio of active participants.
     * (Usernames / emails are deliberately NOT searchable or returned.)
     */
    public function people(Request $r)
    {
        $r->validate([
            'q'     => 'required|string|max:100',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $term  = trim($r->query('q'));
        $limit = (int) $r->query('limit', 20);
        $me    = (int) $r->user()->id;
        $like  = '%' . addcslashes($term, '\\%_') . '%';
        $start = addcslashes($term, '\\%_') . '%';

        $users = User::where('role', 'USER')
            ->where('status', 'ACTIVE')
            ->where(function ($w) use ($like) {
                $w->where('first_name', 'like', $like)
                  ->orWhere('last_name', 'like', $like)
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$like])
                  ->orWhere('bio', 'like', $like);
            })
            // names that START with the search text come first
            ->orderByRaw("CASE WHEN CONCAT(first_name, ' ', last_name) LIKE ? OR last_name LIKE ? THEN 0 ELSE 1 END", [$start, $start])
            ->orderBy('first_name')
            ->limit($limit)
            ->get();

        // how the person searching is related to each result
        $ids = $users->pluck('id')->all();
        $rel = [];
        if ($ids) {
            $rows = Friendship::where(fn ($w) => $w->where('sender_id', $me)->whereIn('receiver_id', $ids))
                ->orWhere(fn ($w) => $w->where('receiver_id', $me)->whereIn('sender_id', $ids))
                ->get();
            foreach ($rows as $f) {
                $other = (int) $f->sender_id === $me ? (int) $f->receiver_id : (int) $f->sender_id;
                if ($f->status === 'accepted') {
                    $rel[$other] = ['status' => 'friends', 'id' => (int) $f->id];
                } elseif ((int) $f->sender_id === $me) {
                    $rel[$other] = ['status' => 'sent', 'id' => (int) $f->id];
                } else {
                    $rel[$other] = ['status' => 'received', 'id' => (int) $f->id];
                }
            }
        }

        return [
            'data' => $users->map(function ($u) use ($me, $rel) {
                $name = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
                return [
                    'id'         => (int) $u->id,
                    'name'       => $name !== '' ? $name : 'User',
                    'avatar'     => $u->avatar_url,
                    'bio'        => $u->bio,
                    'is_me'      => (int) $u->id === $me,
                    'friendship' => $rel[(int) $u->id] ?? ['status' => 'none', 'id' => null],
                ];
            })->values(),
        ];
    }
}