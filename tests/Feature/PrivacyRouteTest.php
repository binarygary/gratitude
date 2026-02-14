<?php

namespace Tests\Feature;

use Tests\TestCase;

class PrivacyRouteTest extends TestCase
{
    public function test_policies_route_is_available(): void
    {
        $response = $this->get('/policies');

        $response->assertOk();
    }

    public function test_privacy_route_redirects_to_policies_privacy_anchor(): void
    {
        $response = $this->get('/privacy');

        $response->assertRedirect('/policies#privacy');
    }
}
