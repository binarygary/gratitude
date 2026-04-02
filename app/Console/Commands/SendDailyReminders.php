<?php

namespace App\Console\Commands;

use App\Mail\DailyReminderMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDailyReminders extends Command
{
    protected $signature = 'notifications:send-daily-reminders';

    protected $description = 'Send daily reminder emails to users with notifications enabled';

    public function handle(): int
    {
        $eligibleUsers = User::query()
            ->where('notifications_enabled', true)
            ->where('notification_channel', 'email')
            ->whereNotNull('daily_reminder_time')
            ->get();

        $sentCount = 0;

        foreach ($eligibleUsers as $user) {
            $timezone = $user->timezone ?: config('app.timezone', 'UTC');
            $localNow = Carbon::now($timezone);
            $localDate = $localNow->toDateString();

            $lastSentOn = $user->daily_reminder_last_sent_on;

            if ($lastSentOn !== null && Carbon::parse($lastSentOn)->toDateString() === $localDate) {
                continue;
            }

            $dueAt = Carbon::createFromFormat(
                'Y-m-d H:i',
                sprintf('%s %s', $localDate, $user->daily_reminder_time),
                $timezone,
            );

            if ($localNow->lt($dueAt)) {
                continue;
            }

            Mail::to($user->email)->send(new DailyReminderMail($user));

            $user->forceFill([
                'daily_reminder_last_sent_on' => $localDate,
            ])->save();

            $sentCount++;
        }

        $this->line(sprintf('Sent %d daily reminder(s).', $sentCount));

        return self::SUCCESS;
    }
}
