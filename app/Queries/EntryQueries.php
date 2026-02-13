<?php

namespace App\Queries;

use App\Models\Entry;
use App\Models\User;
use Carbon\Carbon;

class EntryQueries
{
    public function forUserDate(User $user, Carbon $date): ?Entry
    {
        return Entry::query()
            ->where('user_id', $user->id)
            ->where('entry_date', $date->toDateString())
            ->first();
    }

    public function weekAgo(User $user, Carbon $date): ?Entry
    {
        return Entry::query()
            ->where('user_id', $user->id)
            ->where('entry_date', $date->copy()->subWeek()->toDateString())
            ->first();
    }

    public function yearAgo(User $user, Carbon $date): ?Entry
    {
        return Entry::query()
            ->where('user_id', $user->id)
            ->where('entry_date', $date->copy()->subYear()->toDateString())
            ->first();
    }

    public function snippet(?Entry $entry): ?array
    {
        if ($entry === null) {
            return null;
        }

        return [
            'entry_date' => (string) $entry->entry_date,
            'person' => (string) ($entry->person ?? ''),
            'grace' => (string) ($entry->grace ?? ''),
            'gratitude' => (string) ($entry->gratitude ?? ''),
        ];
    }
}
