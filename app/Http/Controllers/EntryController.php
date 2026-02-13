<?php

namespace App\Http\Controllers;

use App\Actions\Entries\UpsertEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntryController extends Controller
{
    public function upsert(Request $request, UpsertEntry $upsertEntry): JsonResponse
    {
        $validated = $request->validate([
            'entry_date' => ['required', 'date_format:Y-m-d'],
            'person' => ['nullable', 'string'],
            'grace' => ['nullable', 'string'],
            'gratitude' => ['nullable', 'string'],
            'updated_at' => ['required', 'integer', 'min:0'],
        ]);

        $result = $upsertEntry->execute($request->user(), $validated);

        return response()->json([
            'ok' => true,
            'status' => $result['status'],
            'entry' => [
                'entry_date' => (string) $result['entry']->entry_date,
                'updated_at' => $result['entry']->updated_at->valueOf(),
            ],
        ]);
    }
}
