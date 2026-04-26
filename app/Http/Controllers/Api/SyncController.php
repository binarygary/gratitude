<?php

namespace App\Http\Controllers\Api;

use App\Actions\Entries\UpsertEntry;
use App\Http\Controllers\Controller;
use App\Support\Entries\EntryPayload;
use App\Support\Entries\EntryPayloadRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SyncController extends Controller
{
    public function push(Request $request, UpsertEntry $upsertEntry): JsonResponse
    {
        $validated = $request->validate(EntryPayloadRules::batchRules());

        $results = [];
        $seenEntryDates = [];

        foreach ($validated['entries'] as $entry) {
            $entryValidator = Validator::make($entry, EntryPayloadRules::rules());

            if ($entryValidator->fails()) {
                $results[] = [
                    'entry_date' => $entry['entry_date'] ?? null,
                    'status' => 'rejected',
                    'errors' => $entryValidator->errors()->toArray(),
                ];

                continue;
            }

            $validatedEntry = $entryValidator->validated();

            if (isset($seenEntryDates[$validatedEntry['entry_date']])) {
                $results[] = [
                    'entry_date' => $validatedEntry['entry_date'],
                    'status' => 'rejected',
                    'errors' => [
                        'entry_date' => ['Duplicate entry dates in one sync batch are not allowed.'],
                    ],
                ];

                continue;
            }

            $seenEntryDates[$validatedEntry['entry_date']] = true;
            $result = $upsertEntry->execute($request->user(), $validatedEntry);
            $savedEntry = $result['entry'];

            $results[] = [
                'entry_date' => $validatedEntry['entry_date'],
                'status' => $result['status'],
                'entry' => EntryPayload::fromModel($savedEntry),
            ];
        }

        return response()->json([
            'ok' => true,
            'results' => $results,
        ]);
    }
}
