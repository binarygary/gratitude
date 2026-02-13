<?php

namespace App\Http\Controllers;

use App\Queries\EntryQueries;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryEntryController extends Controller
{
    public function show(Request $request, EntryQueries $entryQueries, string $date): Response
    {
        try {
            $entryDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
        } catch (InvalidFormatException) {
            abort(404);
        }

        $user = $request->user();
        $entry = null;

        if ($user !== null) {
            $entry = $entryQueries->forUserDate($user, $entryDate);
        }

        return Inertia::render('HistoryEntry', [
            'date' => $entryDate->toDateString(),
            'entry' => $entry ? [
                'entry_date' => (string) $entry->entry_date,
                'person' => $entry->person,
                'grace' => $entry->grace,
                'gratitude' => $entry->gratitude,
                'updated_at' => Carbon::parse($entry->updated_at)->valueOf(),
            ] : null,
            'isAuthenticated' => $user !== null,
        ]);
    }
}
