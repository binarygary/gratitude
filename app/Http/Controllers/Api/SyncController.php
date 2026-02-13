<?php

namespace App\Http\Controllers\Api;

use App\Actions\Entries\UpsertEntry;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    public function push(Request $request, UpsertEntry $upsertEntry): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:64'],
            'entries' => ['required', 'array'],
            'entries.*.entry_date' => ['required', 'date_format:Y-m-d'],
            'entries.*.person' => ['nullable', 'string'],
            'entries.*.grace' => ['nullable', 'string'],
            'entries.*.gratitude' => ['nullable', 'string'],
            'entries.*.updated_at' => ['required', 'integer', 'min:0'],
        ]);

        $results = [];

        foreach ($validated['entries'] as $entry) {
            $result = $upsertEntry->execute($request->user(), $entry);

            $results[] = [
                'entry_date' => $entry['entry_date'],
                'status' => $result['status'],
            ];
        }

        return response()->json([
            'ok' => true,
            'results' => $results,
        ]);
    }
}
