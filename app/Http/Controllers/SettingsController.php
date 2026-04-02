<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Settings', [
            'timezone' => $user->timezone,
            'show_flashbacks' => (bool) $user->show_flashbacks,
            'notifications_enabled' => (bool) $user->notifications_enabled,
            'notification_channel' => $user->notification_channel,
            'daily_reminder_time' => $this->normalizeReminderTime($user->daily_reminder_time),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'show_flashbacks' => ['required', 'boolean'],
            'notifications_enabled' => ['sometimes', 'boolean'],
            'notification_channel' => ['nullable', 'string', 'in:email'],
            'daily_reminder_time' => ['nullable', 'date_format:H:i'],
        ]);

        $timezone = $validated['timezone'] ?? $user->timezone;
        $timezoneChanged = $timezone !== $user->timezone;
        $notificationsEnabled = array_key_exists('notifications_enabled', $validated)
            ? (bool) $validated['notifications_enabled']
            : (bool) $user->notifications_enabled;
        $notificationChannel = $notificationsEnabled
            ? ($validated['notification_channel'] ?? $user->notification_channel ?? 'email')
            : null;
        $dailyReminderTime = $notificationsEnabled ? ($validated['daily_reminder_time'] ?? null) : null;

        $user->update([
            'timezone' => $timezone,
            'show_flashbacks' => $validated['show_flashbacks'],
            'notifications_enabled' => $notificationsEnabled,
            'notification_channel' => $notificationChannel,
            'daily_reminder_time' => $dailyReminderTime,
        ]);

        $route = $timezoneChanged ? 'today.show' : 'settings.show';

        return to_route($route)->with('status', 'Settings updated.');
    }

    private function normalizeReminderTime(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return substr($value, 0, 5);
    }
}
