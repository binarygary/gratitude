<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\MagicLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class MagicLinkController extends Controller
{
    public function request(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc,dns'],
        ]);

        $email = strtolower(trim($validated['email']));

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => Str::headline(Str::before($email, '@')),
                'password' => null,
            ],
        );

        $rawToken = Str::random(64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $url = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
        );

        Mail::to($email)->send(new MagicLinkMail($url));

        return back()->with('status', 'If your email is valid, we sent a sign-in link.');
    }

    public function consume(Request $request, string $token): RedirectResponse
    {
        $record = MagicLoginToken::query()
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        abort_if($record === null, 403, 'This sign-in link is invalid or expired.');

        $record->forceFill(['used_at' => now()])->save();

        Auth::login($record->user);
        $request->session()->regenerate();
        event(new Login('web', $record->user, false));

        return to_route('today.show')->with('status', 'Signed in successfully.');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('today.show')->with('status', 'Signed out.');
    }
}
