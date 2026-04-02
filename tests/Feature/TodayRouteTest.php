<?php

namespace Tests\Feature;

use App\Models\User;
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

    public function test_today_uses_browser_timezone_for_guests(): void
    {
        Carbon::setTestNow('2026-03-21 10:30:00 UTC');

        $response = $this->withHeader('X-Timezone', 'Pacific/Kiritimati')->get('/today');

        $response->assertOk();
        $response->assertSee('2026-03-22');

        Carbon::setTestNow();
    }

    public function test_today_falls_back_to_app_timezone_for_invalid_guest_timezone(): void
    {
        Carbon::setTestNow('2026-03-21 10:30:00 UTC');

        $response = $this->withHeader('X-Timezone', 'Mars/Olympus_Mons')->get('/today');

        $response->assertOk();
        $response->assertSee('2026-03-21');

        Carbon::setTestNow();
    }

    public function test_today_uses_saved_user_timezone_instead_of_browser_timezone(): void
    {
        Carbon::setTestNow('2026-03-21 10:30:00 UTC');

        $user = User::factory()->create([
            'timezone' => 'America/Los_Angeles',
        ]);

        $response = $this
            ->actingAs($user)
            ->withHeader('X-Timezone', 'Pacific/Kiritimati')
            ->get('/today');

        $response->assertOk();
        $response->assertSee('2026-03-21');

        Carbon::setTestNow();
    }

    public function test_today_renders_inertia_script_element_boot_payload(): void
    {
        $response = $this->get('/today');

        $response->assertOk();
        $response->assertSee('<script data-page="app" type="application/json">', false);
        $response->assertSee('<div id="app"></div>', false);
    }
}
