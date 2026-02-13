<?php

namespace App\Http\Controllers;

use App\Queries\EntryQueries;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function show(Request $request, EntryQueries $entryQueries): Response
    {
        $user = $request->user();

        if ($user !== null) {
            $date = Carbon::now($user->timezone)->startOfDay();
        } else {
            $date = Carbon::now()->startOfDay();
        }

        $entry = null;
        $flashbacks = [
            'weekAgo' => null,
            'yearAgo' => null,
        ];

        if ($user !== null) {
            $entry = $entryQueries->forUserDate($user, $date);

            if ($user->show_flashbacks) {
                $flashbacks = [
                    'weekAgo' => $entryQueries->snippet($entryQueries->weekAgo($user, $date)),
                    'yearAgo' => $entryQueries->snippet($entryQueries->yearAgo($user, $date)),
                ];
            }
        }

        return Inertia::render('Today', [
            'date' => $date->toDateString(),
            'entry' => $entry ? [
                'entry_date' => (string) $entry->entry_date,
                'person' => $entry->person,
                'grace' => $entry->grace,
                'gratitude' => $entry->gratitude,
                'updated_at' => Carbon::parse($entry->updated_at)->valueOf(),
            ] : null,
            'flashbacks' => $flashbacks,
            'showFlashbacks' => (bool) ($user?->show_flashbacks ?? true),
            'isAuthenticated' => $user !== null,
            'loginPromptThreshold' => 3,
        ]);
    }
}
