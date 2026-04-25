<?php

namespace App\Http\Controllers;

use App\Actions\Entries\UpsertEntry;
use App\Support\Entries\EntryPayload;
use App\Support\Entries\EntryPayloadRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntryController extends Controller
{
    public function upsert(Request $request, UpsertEntry $upsertEntry): JsonResponse
    {
        $validated = $request->validate(EntryPayloadRules::rules());

        $result = $upsertEntry->execute($request->user(), $validated);

        return response()->json([
            'ok' => true,
            'status' => $result['status'],
            'entry' => EntryPayload::fromModel($result['entry']),
        ]);
    }
}
