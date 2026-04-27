<?php

namespace Tests\Feature;

use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MagicLinkCleanupCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_magic_link_cleanup_prunes_used_and_expired_tokens(): void
    {
        $user = User::factory()->create();

        $usedToken = MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', 'used-token'),
            'expires_at' => now()->addMinutes(30),
            'used_at' => now()->subMinute(),
        ]);

        $expiredToken = MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', 'expired-token'),
            'expires_at' => now()->subMinute(),
        ]);

        $activeToken = MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', 'active-token'),
            'expires_at' => now()->addMinutes(30),
        ]);

        $this->artisan('auth:prune-magic-links')
            ->expectsOutput('Pruned 2 magic login tokens.')
            ->assertExitCode(0);

        $this->assertDatabaseMissing('magic_login_tokens', ['id' => $usedToken->id]);
        $this->assertDatabaseMissing('magic_login_tokens', ['id' => $expiredToken->id]);
        $this->assertDatabaseHas('magic_login_tokens', ['id' => $activeToken->id]);
    }
}
