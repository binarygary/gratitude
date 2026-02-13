<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistoryEntryRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_history_entry_route_is_available_for_valid_date(): void
    {
        $response = $this->get('/history/2026-01-31');

        $response->assertOk();
    }

    public function test_history_entry_route_rejects_invalid_date_shape(): void
    {
        $response = $this->get('/history/not-a-date');

        $response->assertNotFound();
    }
}
