<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntryUpsertTest extends TestCase
{
    use RefreshDatabase;

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
}
