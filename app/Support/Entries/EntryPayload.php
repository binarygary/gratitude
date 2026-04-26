<?php

namespace App\Support\Entries;

use App\Models\Entry;
use Carbon\Carbon;
use Carbon\CarbonInterface;

final class EntryPayload
{
    /** @return array{entry_date:string,person:?string,grace:?string,gratitude:?string,updated_at:int} */
    public static function fromModel(Entry $entry): array
    {
        $entryDate = $entry->entry_date instanceof CarbonInterface
            ? $entry->entry_date->toDateString()
            : (string) $entry->entry_date;

        $updatedAt = $entry->updated_at instanceof CarbonInterface
            ? (int) $entry->updated_at->valueOf()
            : (int) Carbon::parse($entry->updated_at)->valueOf();

        return [
            'entry_date' => $entryDate,
            'person' => $entry->person,
            'grace' => $entry->grace,
            'gratitude' => $entry->gratitude,
            'updated_at' => $updatedAt,
        ];
    }
}
