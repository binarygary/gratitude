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
            'show_flashbacks' => (bool) $user->show_flashbacks,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'show_flashbacks' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return to_route('settings.show')->with('status', 'Settings updated.');
    }
}
