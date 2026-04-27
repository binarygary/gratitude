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
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        abort_if($record === null, 403, 'This sign-in link is invalid or expired.');

        $record->forceFill(['used_at' => now()])->save();
        $user = $record->user;

        abort_if($user === null, 403, 'This sign-in link is invalid or expired.');

        /** @var SessionGuard $guard */
        $guard = Auth::guard('web');
        $guard->setRememberDuration(self::MAGIC_LINK_REMEMBER_MINUTES);
        $guard->login($user, remember: true);
        $request->session()->regenerate();
        event(new Login('web', $user, true));

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
