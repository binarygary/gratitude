<?php

use App\Http\Controllers\Auth\MagicLinkController;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\NormalizeHtmlEscapedSignature;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Exceptions\InvalidSignatureException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(
            prepend: [
                NormalizeHtmlEscapedSignature::class,
            ],
            append: [
                HandleInertiaRequests::class,
            ],
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (InvalidSignatureException $exception) {
            return to_route('today.show')->with('status', MagicLinkController::INVALID_LINK_STATUS);
        });
    })->create();
