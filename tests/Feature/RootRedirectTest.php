<?php

namespace Tests\Feature;

use Tests\TestCase;

class RootRedirectTest extends TestCase
{
    public function test_root_redirect_does_not_start_a_session(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/today');

        $this->assertFalse($response->headers->has('Set-Cookie'));
        $this->assertSame('max-age=300, public', $response->headers->get('Cache-Control'));
    }
}
