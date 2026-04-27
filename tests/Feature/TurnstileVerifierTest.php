<?php

namespace Tests\Feature;

use App\Support\Auth\BypassTurnstileVerifier;
use App\Support\Auth\HttpTurnstileVerifier;
use App\Support\Auth\TurnstileVerifier;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileVerifierTest extends TestCase
{
    public function test_local_turnstile_bypass_accepts_configured_token(): void
    {
        config()->set('services.turnstile.enabled', false);
        config()->set('services.turnstile.bypass_token', 'test-bypass-token');

        $verifier = $this->app->make(TurnstileVerifier::class);
        $result = $verifier->verify('test-bypass-token', '192.0.2.10');

        $this->assertInstanceOf(BypassTurnstileVerifier::class, $verifier);
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
        config()->set('services.turnstile.enabled', true);
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

        $verifier = $this->app->make(TurnstileVerifier::class);
        $result = $verifier->verify('token-value', '192.0.2.10');

        $this->assertInstanceOf(HttpTurnstileVerifier::class, $verifier);
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

    public function test_non_local_disabled_turnstile_fails_closed(): void
    {
        $this->app->detectEnvironment(fn (): string => 'production');
        config()->set('services.turnstile.enabled', false);
        config()->set('services.turnstile.secret_key', 'secret-value');

        Http::fake();

        $result = $this->app
            ->make(TurnstileVerifier::class)
            ->verify('local-turnstile-bypass', '192.0.2.10');

        $this->assertFalse($result->successful);
        $this->assertSame(['turnstile-disabled-or-misconfigured'], $result->errorCodes);
        Http::assertNothingSent();
    }

    public function test_non_local_missing_turnstile_secret_fails_closed(): void
    {
        $this->app->detectEnvironment(fn (): string => 'production');
        config()->set('services.turnstile.enabled', true);
        config()->set('services.turnstile.secret_key', null);

        Http::fake();

        $result = $this->app
            ->make(TurnstileVerifier::class)
            ->verify('token-value', '192.0.2.10');

        $this->assertFalse($result->successful);
        $this->assertSame(['turnstile-disabled-or-misconfigured'], $result->errorCodes);
        Http::assertNothingSent();
    }
}
