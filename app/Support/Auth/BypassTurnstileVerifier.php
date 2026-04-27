<?php

namespace App\Support\Auth;

class BypassTurnstileVerifier implements TurnstileVerifier
{
    public function verify(string $token, ?string $ip = null): TurnstileResult
    {
        $bypassToken = config('services.turnstile.bypass_token');

        if (is_string($bypassToken) && $bypassToken !== '' && hash_equals($bypassToken, $token)) {
            return new TurnstileResult(true);
        }

        return new TurnstileResult(false, ['invalid-bypass-token']);
    }
}
