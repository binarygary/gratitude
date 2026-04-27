<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request)
    {
        return parent::version($request);
    }

    public function share(Request $request)
    {
        $shareBypassToken = app()->environment(['local', 'testing']);

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'timezone' => $request->user()->timezone,
                    'show_flashbacks' => (bool) $request->user()->show_flashbacks,
                ] : null,
                'magic_link' => [
                    'remember_default' => (bool) config('auth.magic_link.remember_default', false),
                ],
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
            'seo' => [
                'base_url' => config('app.url'),
            ],
            'turnstile' => [
                'enabled' => (bool) config('services.turnstile.enabled'),
                'site_key' => config('services.turnstile.site_key'),
                'bypass_token' => $shareBypassToken ? config('services.turnstile.bypass_token') : null,
            ],
        ]);
    }
}
