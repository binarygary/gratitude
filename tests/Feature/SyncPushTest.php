<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use App\Support\Entries\EntryPayloadRules;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncPushTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_sync_push_returns_canonical_entry_payload_for_upserted_entries(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();
        $clientUpdatedAt = (int) Carbon::parse('2026-04-25 10:15:00 UTC')->valueOf();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-canonical-upsert',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'Canonical Person',
                    'grace' => 'Canonical Grace',
                    'gratitude' => 'Canonical Gratitude',
                    'updated_at' => $clientUpdatedAt,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'upserted');
        $response->assertJsonPath('results.0.entry.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.entry.person', 'Canonical Person');
        $response->assertJsonPath('results.0.entry.grace', 'Canonical Grace');
        $response->assertJsonPath('results.0.entry.gratitude', 'Canonical Gratitude');
        $response->assertJsonPath('results.0.entry.updated_at', $clientUpdatedAt);
    }

    public function test_sync_push_returns_canonical_entry_payload_for_skipped_server_newer_entries(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();
        $serverUpdatedAt = Carbon::parse('2026-04-25 10:30:00 UTC');
        $clientUpdatedAt = (int) Carbon::parse('2026-04-25 10:00:00 UTC')->valueOf();

        $this->createEntry($user, '2026-04-25', $serverUpdatedAt, [
            'person' => 'Server Person',
            'grace' => 'Server Grace',
            'gratitude' => 'Server Gratitude',
        ]);

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-server-newer',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'Client Person',
                    'grace' => 'Client Grace',
                    'gratitude' => 'Client Gratitude',
                    'updated_at' => $clientUpdatedAt,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'skipped');
        $response->assertJsonPath('results.0.entry.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.entry.person', 'Server Person');
        $response->assertJsonPath('results.0.entry.grace', 'Server Grace');
        $response->assertJsonPath('results.0.entry.gratitude', 'Server Gratitude');
        $response->assertJsonPath('results.0.entry.updated_at', (int) $serverUpdatedAt->valueOf());

        $entry = Entry::query()->where('user_id', $user->id)->where('entry_date', '2026-04-25')->firstOrFail();

        self::assertSame('Server Person', $entry->person);
        self::assertSame('Server Grace', $entry->grace);
        self::assertSame('Server Gratitude', $entry->gratitude);
    }

    public function test_sync_push_upserts_client_newer_entries(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();
        $serverUpdatedAt = Carbon::parse('2026-04-25 10:00:00 UTC');
        $clientUpdatedAt = Carbon::parse('2026-04-25 11:00:00 UTC');
        $clientUpdatedAtMs = (int) $clientUpdatedAt->valueOf();

        $this->createEntry($user, '2026-04-25', $serverUpdatedAt, [
            'person' => 'Server Person',
            'grace' => 'Server Grace',
            'gratitude' => 'Server Gratitude',
        ]);

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-client-newer',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'Client Person',
                    'grace' => 'Client Grace',
                    'gratitude' => 'Client Gratitude',
                    'updated_at' => $clientUpdatedAtMs,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'upserted');
        $response->assertJsonPath('results.0.entry.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.entry.person', 'Client Person');
        $response->assertJsonPath('results.0.entry.grace', 'Client Grace');
        $response->assertJsonPath('results.0.entry.gratitude', 'Client Gratitude');
        $response->assertJsonPath('results.0.entry.updated_at', $clientUpdatedAtMs);

        $entry = Entry::query()->where('user_id', $user->id)->where('entry_date', '2026-04-25')->firstOrFail();

        self::assertSame('Client Person', $entry->person);
        self::assertSame('Client Grace', $entry->grace);
        self::assertSame('Client Gratitude', $entry->gratitude);
        self::assertSame($clientUpdatedAtMs, (int) Carbon::parse($entry->updated_at)->valueOf());
    }

    public function test_sync_push_rejects_duplicate_entry_dates_in_the_same_batch(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-duplicates',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'First Person',
                    'grace' => 'First Grace',
                    'gratitude' => 'First Gratitude',
                    'updated_at' => Carbon::parse('2026-04-25 10:00:00 UTC')->valueOf(),
                ],
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'Second Person',
                    'grace' => 'Second Grace',
                    'gratitude' => 'Second Gratitude',
                    'updated_at' => Carbon::parse('2026-04-25 10:01:00 UTC')->valueOf(),
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'upserted');
        $response->assertJsonPath('results.1.entry_date', '2026-04-25');
        $response->assertJsonPath('results.1.status', 'rejected');
        $response->assertJsonPath(
            'results.1.errors.entry_date.0',
            'Duplicate entry dates in one sync batch are not allowed.'
        );

        $entry = Entry::query()->where('user_id', $user->id)->where('entry_date', '2026-04-25')->firstOrFail();

        self::assertSame('First Person', $entry->person);
        self::assertSame('First Grace', $entry->grace);
        self::assertSame('First Gratitude', $entry->gratitude);
    }

    public function test_sync_push_rejects_entries_before_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-123',
            'entries' => [
                [
                    'entry_date' => '2025-12-31',
                    'person' => 'Test Person',
                    'grace' => 'Test Grace',
                    'gratitude' => 'Test Gratitude',
                    'updated_at' => time() * 1000,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.entry_date', '2025-12-31');
        $response->assertJsonPath('results.0.status', 'rejected');
        $response->assertJsonPath('results.0.errors.entry_date.0', 'The entry date field must be a date after or equal to 2026-01-01.');
    }

    public function test_sync_push_accepts_entries_on_or_after_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-456',
            'entries' => [
                [
                    'entry_date' => '2026-01-01',
                    'person' => 'Test Person',
                    'grace' => 'Test Grace',
                    'gratitude' => 'Test Gratitude',
                    'updated_at' => time() * 1000,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'ok' => true,
        ]);
        $response->assertJsonPath('results.0.status', 'upserted');
    }

    public function test_sync_push_accepts_entries_after_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-789',
            'entries' => [
                [
                    'entry_date' => '2026-06-15',
                    'person' => 'Test Person',
                    'grace' => 'Test Grace',
                    'gratitude' => 'Test Gratitude',
                    'updated_at' => time() * 1000,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'ok' => true,
        ]);
        $response->assertJsonPath('results.0.status', 'upserted');
    }

    public function test_sync_push_accepts_valid_entries_and_rejects_older_entries_in_same_batch(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-mixed',
            'entries' => [
                [
                    'entry_date' => '2025-12-31',
                    'person' => 'Too Old',
                    'grace' => 'Old Grace',
                    'gratitude' => 'Old Gratitude',
                    'updated_at' => time() * 1000,
                ],
                [
                    'entry_date' => '2026-01-01',
                    'person' => 'Valid',
                    'grace' => 'Valid Grace',
                    'gratitude' => 'Valid Gratitude',
                    'updated_at' => time() * 1000,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('results.0.status', 'rejected');
        $response->assertJsonPath('results.1.status', 'upserted');
    }

    public function test_sync_push_rejects_oversized_batches_at_request_level(): void
    {
        $user = User::factory()->create();
        $entries = [];

        for ($dayOffset = 0; $dayOffset <= EntryPayloadRules::MAX_BATCH_ENTRIES; $dayOffset++) {
            $entries[] = [
                'entry_date' => Carbon::parse('2026-01-01')->addDays($dayOffset)->toDateString(),
                'person' => 'Test Person',
                'grace' => 'Test Grace',
                'gratitude' => 'Test Gratitude',
                'updated_at' => time() * 1000,
            ];
        }

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-too-large',
            'entries' => $entries,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['entries']);
    }

    public function test_sync_push_rejects_oversized_prompt_fields_per_item(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-large-prompt',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => str_repeat('a', EntryPayloadRules::MAX_PROMPT_LENGTH + 1),
                    'grace' => 'Test Grace',
                    'gratitude' => 'Test Gratitude',
                    'updated_at' => time() * 1000,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'rejected');
        $response->assertJsonPath(
            'results.0.errors.person.0',
            'The person field must not be greater than 5000 characters.'
        );
    }

    public function test_sync_push_rejects_updated_at_more_than_fifteen_minutes_in_the_future(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-25 12:00:00 UTC'));
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sync/push', [
            'device_id' => 'test-device-future-skew',
            'entries' => [
                [
                    'entry_date' => '2026-04-25',
                    'person' => 'Test Person',
                    'grace' => 'Test Grace',
                    'gratitude' => 'Test Gratitude',
                    'updated_at' => Carbon::now()->addMilliseconds(EntryPayloadRules::MAX_FUTURE_SKEW_MILLISECONDS + 1)->valueOf(),
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('results.0.entry_date', '2026-04-25');
        $response->assertJsonPath('results.0.status', 'rejected');
        $response->assertJsonPath(
            'results.0.errors.updated_at.0',
            'The updated at field cannot be more than 15 minutes in the future.'
        );
    }

    /**
     * @param  array{person:string,grace:string,gratitude:string}  $attributes
     */
    private function createEntry(User $user, string $entryDate, Carbon $updatedAt, array $attributes): Entry
    {
        $entry = new Entry([
            'user_id' => $user->id,
            'entry_date' => $entryDate,
            'person' => $attributes['person'],
            'grace' => $attributes['grace'],
            'gratitude' => $attributes['gratitude'],
        ]);
        $entry->created_at = $updatedAt;
        $entry->updated_at = $updatedAt;
        $entry->save();

        return $entry->fresh();
    }
}
