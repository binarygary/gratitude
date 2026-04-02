<?php

namespace App\Console\Commands;

use App\Mail\DailyReminderMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
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
            ->lazyById();

        $sentCount = 0;

        foreach ($eligibleUsers as $user) {
            $timezone = $user->timezone ?: config('app.timezone', 'UTC');
            $localNow = Carbon::now($timezone);
            $localDate = $localNow->toDateString();
            $dailyReminderTime = trim((string) $user->daily_reminder_time);
            $timeFormat = strlen($dailyReminderTime) === 8 ? 'H:i:s' : 'H:i';

            $dueAt = Carbon::createFromFormat(
                'Y-m-d '.$timeFormat,
                sprintf('%s %s', $localDate, $dailyReminderTime),
                $timezone,
            );

            if ($localNow->lt($dueAt)) {
                continue;
            }

            $lock = Cache::lock(sprintf('daily-reminder:%d:%s', $user->id, $localDate), 300);

            if (! $lock->get()) {
                continue;
            }

            try {
                $lastSentOn = $user->daily_reminder_last_sent_on;

                if ($lastSentOn !== null && Carbon::parse($lastSentOn)->toDateString() === $localDate) {
                    continue;
                }

                Mail::to($user->email)->send(new DailyReminderMail($user));

                $user->forceFill([
                    'daily_reminder_last_sent_on' => $localDate,
                ])->save();
            } finally {
                $lock->release();
            }

            $sentCount++;
        }

        $this->line(sprintf('Sent %d daily reminder(s).', $sentCount));

        return self::SUCCESS;
    }
}
