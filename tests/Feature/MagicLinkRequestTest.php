<?php

namespace Tests\Feature;

use App\Mail\MagicLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MagicLinkRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_magic_link_request_sends_mail_for_valid_email(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.magic.request'), [
            'email' => 'Person@Gmail.com',
        ]);

        $response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        $this->assertSame(1, User::query()->count());
        $this->assertSame('person@gmail.com', User::query()->sole()->email);
        $this->assertSame(1, MagicLoginToken::query()->count());
        Mail::assertSent(MagicLinkMail::class, 1);
    }

    public function test_magic_link_request_rejects_array_email_without_side_effects(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.magic.request'), [
            'email' => ['person@gmail.com'],
        ]);

        $response
            ->assertSessionHasErrors('email')
            ->assertSessionMissing('status');
        $this->assertSame(0, User::query()->count());
        $this->assertSame(0, MagicLoginToken::query()->count());
        Mail::assertNothingSent();
    }

    public function test_magic_link_request_collapses_invalid_email_rate_limit_keys(): void
    {
        Mail::fake();

        foreach (['not-an-email', 'also-not-email', 'still invalid'] as $index => $email) {
            $this
                ->withServerVariables(['REMOTE_ADDR' => "192.0.2.3{$index}"])
                ->post(route('auth.magic.request'), [
                    'email' => $email,
                ])
                ->assertSessionHasErrors('email')
                ->assertSessionMissing('status');
        }

        $this
            ->withServerVariables(['REMOTE_ADDR' => '192.0.2.40'])
            ->post(route('auth.magic.request'), [
                'email' => 'different-invalid-value',
            ])
            ->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');

        $this->assertSame(0, User::query()->count());
        $this->assertSame(0, MagicLoginToken::query()->count());
        Mail::assertNothingSent();
    }

    public function test_magic_link_request_stores_remember_device_choice(): void
    {
        Mail::fake();

        $response = $this->post(route('auth.magic.request'), [
            'email' => 'person@gmail.com',
            'remember_device' => true,
        ]);

        $response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        $this->assertTrue(MagicLoginToken::query()->sole()->remember_device);
    }

    public function test_magic_link_request_is_throttled_by_ip_with_uniform_response(): void
    {
        Mail::fake();

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this
                ->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
                ->post(route('auth.magic.request'), [
                    'email' => "person{$attempt}@gmail.com",
                ])
                ->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        }

        $this->assertSame(5, MagicLoginToken::query()->count());

        $this
            ->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
            ->post(route('auth.magic.request'), [
                'email' => 'person6@gmail.com',
            ])
            ->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');

        $this->assertSame(5, MagicLoginToken::query()->count());
    }

    public function test_magic_link_request_is_throttled_by_normalized_email_with_uniform_response(): void
    {
        Mail::fake();

        foreach (['Person@Gmail.com', 'person@gmail.com', 'PERSON@GMAIL.COM'] as $index => $email) {
            $this
                ->withServerVariables(['REMOTE_ADDR' => "192.0.2.1{$index}"])
                ->post(route('auth.magic.request'), [
                    'email' => $email,
                ])
                ->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
        }

        $this->assertSame(3, MagicLoginToken::query()->count());

        $this
            ->withServerVariables(['REMOTE_ADDR' => '192.0.2.20'])
            ->post(route('auth.magic.request'), [
                'email' => 'pErSoN@gmail.com',
            ])
            ->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');

        $this->assertSame(3, MagicLoginToken::query()->count());
    }
}
