<?php

namespace Tests\Feature;

use App\Mail\DailyReminderMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendDailyRemindersCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_reminder_command_sends_email_to_due_users_only_once_per_local_date(): void
    {
        Mail::fake();
        Carbon::setTestNow('2026-04-02 00:30:00 UTC');

        $dueUser = User::factory()->create([
            'email' => 'due@example.com',
            'timezone' => 'America/New_York',
            'notifications_enabled' => true,
            'notification_channel' => 'email',
            'daily_reminder_time' => '20:15',
            'daily_reminder_last_sent_on' => null,
        ]);

        $alreadySentUser = User::factory()->create([
            'email' => 'sent@example.com',
            'timezone' => 'America/New_York',
            'notifications_enabled' => true,
            'notification_channel' => 'email',
            'daily_reminder_time' => '20:15',
            'daily_reminder_last_sent_on' => '2026-04-01',
        ]);

        $notDueUser = User::factory()->create([
            'email' => 'later@example.com',
            'timezone' => 'America/Los_Angeles',
            'notifications_enabled' => true,
            'notification_channel' => 'email',
            'daily_reminder_time' => '20:15',
            'daily_reminder_last_sent_on' => null,
        ]);

        $disabledUser = User::factory()->create([
            'email' => 'disabled@example.com',
            'timezone' => 'America/New_York',
            'notifications_enabled' => false,
            'notification_channel' => null,
            'daily_reminder_time' => null,
            'daily_reminder_last_sent_on' => null,
        ]);

        $this->artisan('notifications:send-daily-reminders')
            ->assertExitCode(0);

        Mail::assertSent(DailyReminderMail::class, function (DailyReminderMail $mail) use ($dueUser): bool {
            return $mail->hasTo($dueUser->email);
        });
        Mail::assertSentCount(1);

        $dueUser->refresh();
        $alreadySentUser->refresh();
        $notDueUser->refresh();
        $disabledUser->refresh();

        $this->assertSame('2026-04-01', $dueUser->daily_reminder_last_sent_on?->toDateString());
        $this->assertSame('2026-04-01', $alreadySentUser->daily_reminder_last_sent_on?->toDateString());
        $this->assertNull($notDueUser->daily_reminder_last_sent_on);
        $this->assertNull($disabledUser->daily_reminder_last_sent_on);

        Carbon::setTestNow();
    }
}
