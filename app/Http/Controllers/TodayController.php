<?php

namespace App\Http\Controllers;

use App\Queries\EntryQueries;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TodayController extends Controller
{
    public function show(Request $request, EntryQueries $entryQueries): Response
    {
        $user = $request->user();
        $timezone = $user?->timezone ?? config('app.timezone', 'UTC');
        $requestedDate = $user !== null ? $request->query('date') : null;

        if (is_string($requestedDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $requestedDate) === 1) {
            try {
                $date = Carbon::createFromFormat('Y-m-d', $requestedDate, $timezone)->startOfDay();
            } catch (InvalidFormatException) {
                $date = Carbon::now($timezone)->startOfDay();
            }
        } else {
            $date = Carbon::now($timezone)->startOfDay();
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
