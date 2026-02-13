<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodayRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_today_ignores_date_query_override_for_guests(): void
    {
        Carbon::setTestNow('2026-02-13 10:00:00');

        $response = $this->get('/today?date=2025-03-11');

        $response->assertOk();
        $response->assertSee('2026-02-13');

        Carbon::setTestNow();
    }
}
