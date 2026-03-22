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
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'show_flashbacks' => ['required', 'boolean'],
        ]);

        $timezone = $validated['timezone'] ?? $user->timezone;
        $timezoneChanged = $timezone !== $user->timezone;

        $user->update([
            'timezone' => $timezone,
            'show_flashbacks' => $validated['show_flashbacks'],
        ]);

        $route = $timezoneChanged ? 'today.show' : 'settings.show';

        return to_route($route)->with('status', 'Settings updated.');
    }
}
