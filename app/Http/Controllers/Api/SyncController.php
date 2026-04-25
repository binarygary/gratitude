<?php

namespace App\Http\Controllers\Api;

use App\Actions\Entries\UpsertEntry;
use App\Http\Controllers\Controller;
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
            $result = $upsertEntry->execute($request->user(), $validatedEntry);

            $results[] = [
                'entry_date' => $validatedEntry['entry_date'],
                'status' => $result['status'],
            ];
        }

        return response()->json([
            'ok' => true,
            'results' => $results,
        ]);
    }
}
