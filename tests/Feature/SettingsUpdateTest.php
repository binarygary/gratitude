<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_update_without_timezone_keeps_existing_timezone_and_redirects_to_settings(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'show_flashbacks' => false,
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHas('status', 'Settings updated.');

        $user->refresh();

        $this->assertSame('America/New_York', $user->timezone);
        $this->assertFalse($user->show_flashbacks);
    }

    public function test_settings_update_persists_timezone_and_redirects_to_today_when_timezone_changes(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'America/Los_Angeles',
                'show_flashbacks' => false,
            ]);

        $response->assertRedirect('/today');
        $response->assertSessionHas('status', 'Settings updated.');

        $user->refresh();

        $this->assertSame('America/Los_Angeles', $user->timezone);
        $this->assertFalse($user->show_flashbacks);
    }

    public function test_settings_update_redirects_to_settings_when_timezone_is_unchanged(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'America/New_York',
                'show_flashbacks' => false,
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHas('status', 'Settings updated.');

        $user->refresh();

        $this->assertSame('America/New_York', $user->timezone);
        $this->assertFalse($user->show_flashbacks);
    }

    public function test_settings_update_rejects_invalid_timezone(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'Mars/Olympus_Mons',
                'show_flashbacks' => false,
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHasErrors(['timezone']);

        $user->refresh();

        $this->assertSame('America/New_York', $user->timezone);
        $this->assertTrue($user->show_flashbacks);
    }

    public function test_settings_update_persists_notification_preferences(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
            'notifications_enabled' => false,
            'notification_channel' => null,
            'daily_reminder_time' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'America/New_York',
                'show_flashbacks' => true,
                'notifications_enabled' => true,
                'notification_channel' => 'email',
                'daily_reminder_time' => '20:15',
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHas('status', 'Settings updated.');

        $user->refresh();

        $this->assertTrue($user->notifications_enabled);
        $this->assertSame('email', $user->notification_channel);
        $this->assertSame('20:15', substr((string) $user->daily_reminder_time, 0, 5));
    }

    public function test_settings_update_rejects_invalid_notification_channel_and_time(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
            'notifications_enabled' => false,
            'notification_channel' => null,
            'daily_reminder_time' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'America/New_York',
                'show_flashbacks' => true,
                'notifications_enabled' => true,
                'notification_channel' => 'sms',
                'daily_reminder_time' => '8pm',
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHasErrors([
            'notification_channel',
            'daily_reminder_time',
        ]);

        $user->refresh();

        $this->assertFalse($user->notifications_enabled);
        $this->assertNull($user->notification_channel);
        $this->assertNull($user->daily_reminder_time);
    }

    public function test_settings_update_defaults_notification_channel_to_email_when_enabled(): void
    {
        $user = User::factory()->create([
            'timezone' => 'America/New_York',
            'show_flashbacks' => true,
            'notifications_enabled' => false,
            'notification_channel' => null,
            'daily_reminder_time' => null,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/settings')
            ->post('/settings', [
                'timezone' => 'America/New_York',
                'show_flashbacks' => true,
                'notifications_enabled' => true,
                'daily_reminder_time' => '20:15',
            ]);

        $response->assertRedirect('/settings');
        $response->assertSessionHas('status', 'Settings updated.');

        $user->refresh();

        $this->assertTrue($user->notifications_enabled);
        $this->assertSame('email', $user->notification_channel);
        $this->assertSame('20:15', substr((string) $user->daily_reminder_time, 0, 5));
    }
}
