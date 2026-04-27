<?php

namespace Tests\Feature;

use App\Mail\MagicLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use App\Support\Auth\TurnstileResult;
use App\Support\Auth\TurnstileVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MagicLinkRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_magic_link_request_sends_mail_after_successful_turnstile_verification(): void
    {
        Mail::fake();
        $verifier = new FakeTurnstileVerifier(new TurnstileResult(true));
        $this->app->instance(TurnstileVerifier::class, $verifier);

        $response = $this->post(route('auth.magic.request'), [
            'email' => 'Person@Gmail.com',
            'cf-turnstile-response' => 'valid-token',
        ]);

        $response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        $this->assertSame('valid-token', $verifier->verifiedToken);
        $this->assertSame('127.0.0.1', $verifier->verifiedIp);
        $this->assertSame(1, User::query()->count());
        $this->assertSame('person@gmail.com', User::query()->sole()->email);
        $this->assertSame(1, MagicLoginToken::query()->count());
        Mail::assertSent(MagicLinkMail::class, 1);
    }

    public function test_magic_link_request_returns_uniform_response_when_turnstile_fails(): void
    {
        Mail::fake();
        $this->app->instance(
            TurnstileVerifier::class,
            new FakeTurnstileVerifier(new TurnstileResult(false, ['invalid-input-response'])),
        );

        $response = $this->post(route('auth.magic.request'), [
            'email' => 'person@gmail.com',
            'cf-turnstile-response' => 'invalid-token',
        ]);

        $response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        $this->assertSame(0, User::query()->count());
        $this->assertSame(0, MagicLoginToken::query()->count());
        Mail::assertNothingSent();
    }

    public function test_magic_link_request_does_not_expose_turnstile_error_codes(): void
    {
        Mail::fake();
        $this->app->instance(
            TurnstileVerifier::class,
            new FakeTurnstileVerifier(new TurnstileResult(false, ['invalid-input-response'])),
        );

        $response = $this->post(route('auth.magic.request'), [
            'email' => 'person@gmail.com',
            'cf-turnstile-response' => 'invalid-token',
        ]);

        $response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        $this->assertStringNotContainsString('invalid-input-response', $response->getContent());
        $this->assertStringNotContainsString('invalid-input-response', json_encode(session()->all(), JSON_THROW_ON_ERROR));
    }
}

final class FakeTurnstileVerifier implements TurnstileVerifier
{
    public ?string $verifiedToken = null;

    public ?string $verifiedIp = null;

    public function __construct(private readonly TurnstileResult $result) {}

    public function verify(string $token, ?string $ip = null): TurnstileResult
    {
        $this->verifiedToken = $token;
        $this->verifiedIp = $ip;

        return $this->result;
    }
}
