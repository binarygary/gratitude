<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $entries = [];

        if ($user !== null) {
            $entries = $user->entries()
                ->orderByDesc('entry_date')
                ->limit(365)
                ->get()
                ->map(function ($entry) {
                    return [
                        'entry_date' => (string) $entry->entry_date,
                        'person_snippet' => mb_strimwidth((string) $entry->person, 0, 60, '...'),
                        'grace_snippet' => mb_strimwidth((string) $entry->grace, 0, 60, '...'),
                        'gratitude_snippet' => mb_strimwidth((string) $entry->gratitude, 0, 60, '...'),
                        'updated_at' => $entry->updated_at->valueOf(),
                    ];
                })
                ->values()
                ->all();
        }

        return Inertia::render('History', [
            'entries' => $entries,
            'isAuthenticated' => $user !== null,
        ]);
    }
}
