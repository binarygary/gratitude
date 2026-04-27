<?php

namespace Tests\Feature;

use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class MagicLinkConsumeTest extends TestCase
{
    use RefreshDatabase;

    private const INVALID_LINK_STATUS = 'This sign-in link is invalid or expired. Request a new link to continue.';

    private const REUSED_LINK_STATUS = 'This sign-in link has already been used. Request a new link to continue.';

    public function test_magic_link_can_be_consumed_with_different_host_and_scheme(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('a', 64);
        $expiresAt = now()->addMinutes(30);

        $magicToken = MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );

        $parts = parse_url($signedUrl);
        $pathWithQuery = $parts['path'].'?'.$parts['query'];

        $response = $this
            ->withServerVariables([
                'HTTP_HOST' => 'alt.example.test',
                'HTTPS' => 'on',
            ])
            ->get($pathWithQuery);

        $response->assertRedirect(route('today.show'));
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($magicToken->fresh()->used_at);
    }

    public function test_magic_link_rejects_tampered_signature(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('b', 64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );

        $parts = parse_url($signedUrl);
        parse_str($parts['query'], $query);
        $query['signature'] = strrev($query['signature']);
        $tamperedUrl = $parts['path'].'?'.http_build_query($query);

        $response = $this->get($tamperedUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::INVALID_LINK_STATUS);
        $this->assertGuest();
    }

    public function test_magic_link_accepts_html_escaped_signature_param_name(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('c', 64);
        $expiresAt = now()->addMinutes(30);

        $magicToken = MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );
        $htmlEscapedUrl = str_replace('&signature=', '&amp;signature=', $signedUrl);

        $response = $this->get($htmlEscapedUrl);

        $response->assertRedirect(route('today.show'));
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($magicToken->fresh()->used_at);
    }

    public function test_magic_link_rejects_unknown_token(): void
    {
        $rawToken = str_repeat('d', 64);
        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            now()->addMinutes(30),
            ['token' => $rawToken],
            absolute: false,
        );

        $response = $this->get($signedUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::INVALID_LINK_STATUS);
        $this->assertGuest();
    }

    public function test_magic_link_rejects_expired_token(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('e', 64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => now()->subMinute(),
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );

        $response = $this->get($signedUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::INVALID_LINK_STATUS);
        $this->assertGuest();
    }

    public function test_magic_link_rejects_reused_token(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('f', 64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
            'used_at' => now()->subMinute(),
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );

        $response = $this->get($signedUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::REUSED_LINK_STATUS);
        $this->assertGuest();
    }

    public function test_magic_link_rejects_tampered_token_path(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('1', 64);
        $pathToken = str_repeat('2', 64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $pathToken],
            absolute: false,
        );

        $response = $this->get($signedUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::INVALID_LINK_STATUS);
        $this->assertGuest();
    }

    public function test_magic_link_rejects_wrong_signature_without_authenticating(): void
    {
        $user = User::factory()->create();
        $rawToken = str_repeat('3', 64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );

        $parts = parse_url($signedUrl);
        parse_str($parts['query'], $query);
        $query['signature'] = str_repeat('0', strlen($query['signature']));
        $wrongSignatureUrl = $parts['path'].'?'.http_build_query($query);

        $response = $this->get($wrongSignatureUrl);

        $response
            ->assertRedirect(route('today.show'))
            ->assertSessionHas('status', self::INVALID_LINK_STATUS);
        $this->assertGuest();
    }
}
