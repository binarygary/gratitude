<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private array $timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Berlin',
        'Asia/Tokyo',
    ];

    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Settings', [
            'timezone' => $user->timezone,
            'show_flashbacks' => (bool) $user->show_flashbacks,
            'timezones' => $this->timezones,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'timezone' => ['required', 'string', Rule::in($this->timezones)],
            'show_flashbacks' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return to_route('settings.show')->with('status', 'Settings updated.');
    }
}
