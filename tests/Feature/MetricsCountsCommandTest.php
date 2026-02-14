<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetricsCountsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_metrics_counts_command_outputs_user_and_entry_totals(): void
    {
        $users = User::factory()->count(2)->create();

        Entry::query()->create([
            'user_id' => $users[0]->id,
            'entry_date' => '2026-02-12',
            'person' => 'Alex',
            'grace' => 'Sunlight',
            'gratitude' => 'Quiet morning',
        ]);

        Entry::query()->create([
            'user_id' => $users[1]->id,
            'entry_date' => '2026-02-13',
            'person' => 'Sam',
            'grace' => 'Coffee',
            'gratitude' => 'A focused afternoon',
        ]);

        Entry::query()->create([
            'user_id' => $users[1]->id,
            'entry_date' => '2026-02-14',
            'person' => 'Jordan',
            'grace' => 'Fresh air',
            'gratitude' => 'A long walk',
        ]);

        $this->artisan('metrics:counts')
            ->expectsOutput('Users: 2')
            ->expectsOutput('Entries: 3')
            ->assertExitCode(0);
    }
}
