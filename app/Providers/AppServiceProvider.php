<?php

namespace App\Providers;

use App\Http\Controllers\Auth\MagicLinkController;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('magic-link-request', function (Request $request): array {
            return [
                Limit::perMinutes(15, 5)
                    ->by('magic-link:ip:'.$request->ip())
                    ->response(fn () => back()->with('status', MagicLinkController::REQUEST_STATUS)),
                Limit::perHour(3)
                    ->by('magic-link:email:'.sha1(strtolower(trim((string) $request->input('email')))))
                    ->response(fn () => back()->with('status', MagicLinkController::REQUEST_STATUS)),
            ];
        });
    }
}
