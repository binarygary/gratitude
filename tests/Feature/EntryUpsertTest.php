<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Entries\EntryPayloadRules;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntryUpsertTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_entry_upsert_rejects_entries_before_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2025-12-31',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['entry_date']);
    }

    public function test_entry_upsert_accepts_entries_on_or_after_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-01-01',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'ok' => true,
        ]);
    }

    public function test_entry_upsert_accepts_entries_after_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-06-15',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'ok' => true,
        ]);
    }

    public function test_entry_upsert_rejects_oversized_prompt_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-04-25',
            'person' => str_repeat('a', EntryPayloadRules::MAX_PROMPT_LENGTH + 1),
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['person']);
    }

    public function test_entry_upsert_rejects_updated_at_more_than_fifteen_minutes_in_the_future(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-04-25',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => Carbon::now()->addMilliseconds(EntryPayloadRules::MAX_FUTURE_SKEW_MILLISECONDS + 1)->valueOf(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['updated_at']);
        $response->assertJsonPath(
            'errors.updated_at.0',
            'The updated at field cannot be more than 15 minutes in the future.'
        );
    }

    public function test_entry_upsert_returns_full_canonical_entry_payload(): void
    {
        $user = User::factory()->create();
        $updatedAt = time() * 1000;

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-04-25',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => $updatedAt,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('entry.entry_date', '2026-04-25');
        $response->assertJsonPath('entry.person', 'Test Person');
        $response->assertJsonPath('entry.grace', 'Test Grace');
        $response->assertJsonPath('entry.gratitude', 'Test Gratitude');
        $response->assertJsonPath('entry.updated_at', $updatedAt);
    }
}
