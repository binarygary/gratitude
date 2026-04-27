<?php

namespace App\Support\Auth;

use Illuminate\Support\Facades\Http;

class HttpTurnstileVerifier implements TurnstileVerifier
{
    public function verify(string $token, ?string $ip = null): TurnstileResult
    {
        $secretKey = config('services.turnstile.secret_key');

        if (! is_string($secretKey) || $secretKey === '') {
            return new TurnstileResult(false, ['missing-secret-key']);
        }

        $response = Http::asForm()
            ->timeout((int) config('services.turnstile.timeout', 3))
            ->post((string) config('services.turnstile.verify_url'), [
                'secret' => $secretKey,
                'response' => $token,
                'remoteip' => $ip,
            ]);

        if (! $response->successful()) {
            return new TurnstileResult(false, ['siteverify-unavailable']);
        }

        $errorCodes = $response->json('error-codes', []);

        return new TurnstileResult(
            successful: (bool) $response->json('success', false),
            errorCodes: is_array($errorCodes) ? array_values($errorCodes) : [],
            hostname: $response->json('hostname'),
            action: $response->json('action'),
        );
    }
}
