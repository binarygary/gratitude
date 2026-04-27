<?php

namespace App\Providers;

use App\Support\Auth\BypassTurnstileVerifier;
use App\Support\Auth\HttpTurnstileVerifier;
use App\Support\Auth\TurnstileResult;
use App\Support\Auth\TurnstileVerifier;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TurnstileVerifier::class, function (): TurnstileVerifier {
            $enabled = (bool) config('services.turnstile.enabled');
            $secretKey = config('services.turnstile.secret_key');

            if (! $enabled && $this->app->environment(['local', 'testing'])) {
                return $this->app->make(BypassTurnstileVerifier::class);
            }

            if ($enabled && is_string($secretKey) && $secretKey !== '') {
                return $this->app->make(HttpTurnstileVerifier::class);
            }

            return new class implements TurnstileVerifier
            {
                public function verify(string $token, ?string $ip = null): TurnstileResult
                {
                    return new TurnstileResult(false, ['turnstile-disabled-or-misconfigured']);
                }
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
