<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\MagicLinkMail;
use App\Models\MagicLoginToken;
use App\Models\User;
use App\Support\Auth\TurnstileVerifier;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class MagicLinkController extends Controller
{
    public const REQUEST_STATUS = 'If your email is valid, we sent a sign-in link.';

    public const INVALID_LINK_STATUS = 'This sign-in link is invalid or expired. Request a new link to continue.';

    public const REUSED_LINK_STATUS = 'This sign-in link has already been used. Request a new link to continue.';

    private const MAGIC_LINK_REMEMBER_MINUTES = 64_800; // 45 days

    public function request(Request $request, TurnstileVerifier $turnstile): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc,dns'],
            'cf-turnstile-response' => ['nullable', 'string'],
        ]);

        $email = strtolower(trim($validated['email']));

        $turnstileResult = $turnstile->verify(
            (string) $request->input('cf-turnstile-response', ''),
            $request->ip(),
        );

        if (! $turnstileResult->successful) {
            return back()->with('status', self::REQUEST_STATUS);
        }

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => Str::headline(Str::before($email, '@')),
                // Keep magic-link accounts passwordless in practice while satisfying
                // legacy schemas where users.password is still NOT NULL.
                'password' => Hash::make(Str::random(64)),
            ],
        );

        $rawToken = Str::random(64);
        $expiresAt = now()->addMinutes(30);

        MagicLoginToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $expiresAt,
        ]);

        $relativeSignedPath = URL::temporarySignedRoute(
            'auth.magic.consume',
            $expiresAt,
            ['token' => $rawToken],
            absolute: false,
        );
        $url = url($relativeSignedPath);

        Mail::to($email)->send(new MagicLinkMail($url));

        return back()->with('status', self::REQUEST_STATUS);
    }

    public function consume(Request $request, string $token): RedirectResponse
    {
        $record = MagicLoginToken::query()
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if ($record === null || $record->user === null) {
            return to_route('today.show')->with('status', self::INVALID_LINK_STATUS);
        }

        if ($record->used_at !== null) {
            return to_route('today.show')->with('status', self::REUSED_LINK_STATUS);
        }

        if (now()->greaterThanOrEqualTo($record->expires_at)) {
            return to_route('today.show')->with('status', self::INVALID_LINK_STATUS);
        }

        $record->forceFill(['used_at' => now()])->save();

        /** @var SessionGuard $guard */
        $guard = Auth::guard('web');
        $guard->setRememberDuration(self::MAGIC_LINK_REMEMBER_MINUTES);
        $guard->login($record->user, remember: true);
        $request->session()->regenerate();
        event(new Login('web', $record->user, true));

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
