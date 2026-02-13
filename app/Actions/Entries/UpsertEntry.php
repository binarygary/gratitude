<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;
use Carbon\Carbon;

class UpsertEntry
{
    public function execute(User $user, array $payload): array
    {
        $entryDate = Carbon::parse($payload['entry_date'])->toDateString();
        $clientUpdatedAt = (int) $payload['updated_at'];
        $existing = Entry::query()
            ->where('user_id', $user->id)
            ->where('entry_date', $entryDate)
            ->first();

        if ($existing !== null) {
            $existingUpdatedAtMs = Carbon::parse($existing->updated_at)->valueOf();

            if ($clientUpdatedAt <= $existingUpdatedAtMs) {
                return ['status' => 'skipped', 'entry' => $existing->fresh()];
            }

            $existing->fill([
                'person' => $payload['person'] ?? null,
                'grace' => $payload['grace'] ?? null,
                'gratitude' => $payload['gratitude'] ?? null,
            ]);
            $existing->updated_at = Carbon::createFromTimestampMs($clientUpdatedAt);
            $existing->save();

            return ['status' => 'upserted', 'entry' => $existing->fresh()];
        }

        $entry = new Entry([
            'user_id' => $user->id,
            'entry_date' => $entryDate,
            'person' => $payload['person'] ?? null,
            'grace' => $payload['grace'] ?? null,
            'gratitude' => $payload['gratitude'] ?? null,
        ]);
        $entry->created_at = Carbon::createFromTimestampMs($clientUpdatedAt);
        $entry->updated_at = Carbon::createFromTimestampMs($clientUpdatedAt);
        $entry->save();

        return ['status' => 'upserted', 'entry' => $entry->fresh()];
    }
}
