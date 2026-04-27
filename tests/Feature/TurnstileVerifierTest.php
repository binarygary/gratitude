<?php

namespace Tests\Feature;

use App\Support\Auth\BypassTurnstileVerifier;
use App\Support\Auth\HttpTurnstileVerifier;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileVerifierTest extends TestCase
{
    public function test_local_turnstile_bypass_accepts_configured_token(): void
    {
        config()->set('services.turnstile.bypass_token', 'test-bypass-token');

        $result = (new BypassTurnstileVerifier)->verify('test-bypass-token', '192.0.2.10');

        $this->assertTrue($result->successful);
        $this->assertSame([], $result->errorCodes);
    }

    public function test_local_turnstile_bypass_rejects_other_tokens(): void
    {
        config()->set('services.turnstile.bypass_token', 'test-bypass-token');

        $result = (new BypassTurnstileVerifier)->verify('wrong-token', '192.0.2.10');

        $this->assertFalse($result->successful);
        $this->assertSame(['invalid-bypass-token'], $result->errorCodes);
    }

    public function test_http_turnstile_verifier_posts_siteverify_payload(): void
    {
        config()->set('services.turnstile.secret_key', 'secret-value');
        config()->set('services.turnstile.verify_url', 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
        config()->set('services.turnstile.timeout', 3);

        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
                'success' => true,
                'hostname' => 'consider.today',
                'action' => 'magic-link-request',
            ]),
        ]);

        $result = (new HttpTurnstileVerifier)->verify('token-value', '192.0.2.10');

        $this->assertTrue($result->successful);
        $this->assertSame('consider.today', $result->hostname);
        $this->assertSame('magic-link-request', $result->action);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
                && $request->method() === 'POST'
                && $request->data() === [
                    'secret' => 'secret-value',
                    'response' => 'token-value',
                    'remoteip' => '192.0.2.10',
                ];
        });
    }

    public function test_http_turnstile_verifier_fails_without_secret_key(): void
    {
        config()->set('services.turnstile.secret_key', null);

        Http::fake();

        $result = (new HttpTurnstileVerifier)->verify('token-value', '192.0.2.10');

        $this->assertFalse($result->successful);
        $this->assertSame(['missing-secret-key'], $result->errorCodes);
        Http::assertNothingSent();
    }
}
