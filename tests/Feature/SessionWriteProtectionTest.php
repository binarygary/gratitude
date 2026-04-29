<?php

namespace Tests\Feature;

use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Session\TokenMismatchException;
use Tests\TestCase;

class SessionWriteProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_entry_upsert_is_rejected(): void
    {
        $response = $this->postJson('/entries/upsert', $this->entryPayload());

        $response->assertUnauthorized();
    }

    public function test_unauthenticated_sync_push_is_rejected(): void
    {
        $response = $this->postJson('/api/sync/push', [
            'device_id' => 'test-device',
            'entries' => [$this->entryPayload()],
        ]);

        $response->assertUnauthorized();
    }

    public function test_entry_upsert_requires_csrf_token_for_cross_site_session_write(): void
    {
        $this->assertStringNotContainsString('entries/upsert', file_get_contents(base_path('bootstrap/app.php')));

        $request = $this->sessionRequest('/entries/upsert');

        $this->expectException(TokenMismatchException::class);

        $this->csrfMiddleware()->handle($request, $this->passingNext());
    }

    public function test_sync_push_requires_csrf_token_for_cross_site_session_write(): void
    {
        $this->assertStringNotContainsString('api/sync/push', file_get_contents(base_path('bootstrap/app.php')));

        $request = $this->sessionRequest('/api/sync/push');

        $this->expectException(TokenMismatchException::class);

        $this->csrfMiddleware()->handle($request, $this->passingNext());
    }

    public function test_valid_csrf_token_allows_session_write_through_csrf_middleware(): void
    {
        $request = $this->sessionRequest('/entries/upsert');
        $request->headers->set('X-CSRF-TOKEN', $request->session()->token());

        $response = $this->csrfMiddleware()->handle($request, $this->passingNext());

        $this->assertSame(Response::HTTP_NO_CONTENT, $response->getStatusCode());
    }

    /** @return array{entry_date:string,person:string,grace:string,gratitude:string,updated_at:int} */
    private function entryPayload(): array
    {
        return [
            'entry_date' => '2026-04-27',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ];
    }

    private function sessionRequest(string $path): Request
    {
        $request = Request::create($path, 'POST');
        $request->setUserResolver(fn () => User::factory()->create());

        $session = $this->app['session.store'];
        $session->start();
        $request->setLaravelSession($session);

        return $request;
    }

    private function csrfMiddleware(): PreventRequestForgery
    {
        return new class($this->app, $this->app['encrypter']) extends PreventRequestForgery
        {
            protected function runningUnitTests(): bool
            {
                return false;
            }
        };
    }

    private function passingNext(): Closure
    {
        return fn (Request $request): Response => response('', Response::HTTP_NO_CONTENT);
    }
}
