# Testing Patterns

**Analysis Date:** 2026-04-25

## Test Framework

**Runner:**
- Pest PHP `^4.3` with `pestphp/pest-plugin-laravel` `^4.0`, declared in `composer.json`.
- PHPUnit `^12` is the underlying runner, declared in `composer.json`.
- Config: `phpunit.xml`
- Pest bootstrap: `tests/Pest.php`
- Base test case: `tests/TestCase.php`

**Assertion Library:**
- Laravel HTTP, session, auth, database, and console test assertions through `Tests\TestCase`, as used in `tests/Feature/EntryUpsertTest.php`, `tests/Feature/MagicLinkConsumeTest.php`, `tests/Feature/SettingsUpdateTest.php`, and `tests/Feature/MetricsCountsCommandTest.php`.
- PHPUnit assertions such as `assertSame()`, `assertFalse()`, `assertTrue()`, and `assertNotNull()` are used directly in class-based tests like `tests/Feature/SettingsUpdateTest.php` and `tests/Feature/MagicLinkConsumeTest.php`.

**Run Commands:**
```bash
composer test                         # Clear config and run the full Laravel/Pest suite
php artisan test                      # Run the full test suite directly
php artisan test --filter=SyncPush    # Run a targeted test class or method while iterating
XDEBUG_MODE=off vendor/bin/grumphp run # Final quality gate: typecheck, ESLint, PHPStan, Pint, Pest
npm run typecheck                     # Frontend TypeScript check
npm run lint                          # Frontend ESLint check
```

## Test File Organization

**Location:**
- Feature tests live under `tests/Feature/`, such as `tests/Feature/TodayRouteTest.php`, `tests/Feature/SyncPushTest.php`, and `tests/Feature/MagicLinkConsumeTest.php`.
- Unit tests live under `tests/Unit/`; the current unit suite contains `tests/Unit/ExampleTest.php`.
- Shared test configuration lives in `tests/Pest.php` and `tests/TestCase.php`.
- No JavaScript/TypeScript test runner or frontend test files are configured. There is no `vitest.config.*`, `jest.config.*`, or `playwright.config.*`; frontend verification is currently `npm run typecheck` and `npm run lint` from `package.json`.

**Naming:**
- Use `*Test.php` filenames, grouped by feature or route: `EntryUpsertTest.php`, `SyncPushTest.php`, `SettingsUpdateTest.php`, `HistoryEntryRouteTest.php`, and `MetricsCountsCommandTest.php`.
- Use test method names beginning with `test_` and describing expected behavior: `test_today_uses_browser_timezone_for_guests()` in `tests/Feature/TodayRouteTest.php` and `test_magic_link_rejects_tampered_signature()` in `tests/Feature/MagicLinkConsumeTest.php`.

**Structure:**
```text
tests/
├── Feature/
│   ├── EntryUpsertTest.php
│   ├── HistoryEntryRouteTest.php
│   ├── MagicLinkConsumeTest.php
│   ├── MetricsCountsCommandTest.php
│   ├── SettingsUpdateTest.php
│   ├── SyncPushTest.php
│   └── TodayRouteTest.php
├── Unit/
│   └── ExampleTest.php
├── Pest.php
└── TestCase.php
```

## Test Structure

**Suite Organization:**
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntryUpsertTest extends TestCase
{
    use RefreshDatabase;

    public function test_entry_upsert_accepts_entries_on_or_after_2026_01_01(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/entries/upsert', [
            'entry_date' => '2026-01-01',
            'person' => 'Test Person',
            'grace' => 'Test Grace',
            'gratitude' => 'Test Gratitude',
            'updated_at' => time() * 1000,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'ok' => true,
        ]);
    }
}
```

**Patterns:**
- Tests are written as PHPUnit-style classes extending `Tests\TestCase`, even though Pest is installed. Follow the class-based pattern in `tests/Feature/EntryUpsertTest.php`, `tests/Feature/SyncPushTest.php`, and `tests/Feature/SettingsUpdateTest.php`.
- Include `use RefreshDatabase;` in class-based feature tests that touch the database. `tests/Pest.php` applies `RefreshDatabase` to Pest closure tests in `tests/Feature/`, but class-based tests still include the trait explicitly.
- Arrange test data with Eloquent factories and direct model creation. `tests/Feature/MetricsCountsCommandTest.php` uses `User::factory()->count(2)->create()` and `Entry::query()->create()`.
- Act through Laravel request helpers (`get()`, `post()`, `postJson()`) or console helpers (`artisan()`), as shown in `tests/Feature/TodayRouteTest.php`, `tests/Feature/SyncPushTest.php`, and `tests/Feature/MetricsCountsCommandTest.php`.
- Assert HTTP status and response payloads with Laravel response assertions: `assertOk()`, `assertStatus(422)`, `assertForbidden()`, `assertRedirect()`, `assertJson()`, `assertJsonPath()`, `assertJsonValidationErrors()`, `assertSessionHas()`, and `assertSessionHasErrors()`.
- Assert persisted model state by refreshing models and using PHPUnit assertions, as in `tests/Feature/SettingsUpdateTest.php`.

## Mocking

**Framework:** Mockery is available through `mockery/mockery` in `composer.json`, and Laravel test fakes are available, but current tests mostly use real framework/database behavior.

**Patterns:**
```php
public function test_today_uses_saved_user_timezone_instead_of_browser_timezone(): void
{
    Carbon::setTestNow('2026-03-21 10:30:00 UTC');

    $user = User::factory()->create([
        'timezone' => 'America/Los_Angeles',
    ]);

    $response = $this
        ->actingAs($user)
        ->withHeader('X-Timezone', 'Pacific/Kiritimati')
        ->get('/today');

    $response->assertOk();
    $response->assertSee('2026-03-21');

    Carbon::setTestNow();
}
```

**What to Mock:**
- Mock or fake external side effects when tests exercise mail, queues, events, or third-party services. `composer.json` includes Laravel test tooling and `mockery/mockery`, but existing tests do not currently call `Mail::fake()`, `Queue::fake()`, `Event::fake()`, or Mockery.
- Freeze time with `Carbon::setTestNow()` when behavior depends on today's date or timezone, following `tests/Feature/TodayRouteTest.php`.
- Use request headers and server variables to simulate environment inputs rather than mocking controllers. `tests/Feature/TodayRouteTest.php` uses `withHeader('X-Timezone', ...)`; `tests/Feature/MagicLinkConsumeTest.php` uses `withServerVariables()`.

**What NOT to Mock:**
- Do not mock Eloquent models or the database for feature tests. Existing feature tests use the in-memory SQLite database configured by `phpunit.xml` and refresh it with `RefreshDatabase`.
- Do not mock Laravel routing, middleware, validation, or auth guards when route behavior is under test. `tests/Feature/MagicLinkConsumeTest.php`, `tests/Feature/EntryUpsertTest.php`, and `tests/Feature/SettingsUpdateTest.php` exercise the real HTTP stack.
- Do not mock local domain actions just to test controllers. `tests/Feature/EntryUpsertTest.php` and `tests/Feature/SyncPushTest.php` exercise `app/Actions/Entries/UpsertEntry.php` through the routes.

## Fixtures and Factories

**Test Data:**
```php
$user = User::factory()->create([
    'timezone' => 'America/New_York',
    'show_flashbacks' => true,
]);

Entry::query()->create([
    'user_id' => $user->id,
    'entry_date' => '2026-02-12',
    'person' => 'Alex',
    'grace' => 'Sunlight',
    'gratitude' => 'Quiet morning',
]);
```

**Location:**
- User factory: `database/factories/UserFactory.php`
- Seeder: `database/seeders/DatabaseSeeder.php`
- Current tests create entries directly with `Entry::query()->create()` in files such as `tests/Feature/MetricsCountsCommandTest.php`; no `EntryFactory` exists.
- Magic-link token test records are created directly with `MagicLoginToken::query()->create()` in `tests/Feature/MagicLinkConsumeTest.php`; no `MagicLoginTokenFactory` exists.

## Coverage

**Requirements:** No coverage threshold is configured in `phpunit.xml`, `grumphp.yml`, `composer.json`, or `package.json`.

**View Coverage:**
```bash
php artisan test --coverage
```

Coverage output requires an enabled PHP coverage driver. The repository does not define a dedicated coverage script.

## Test Types

**Unit Tests:**
- Scope: isolated pure logic or small units under `tests/Unit/`.
- Current state: only `tests/Unit/ExampleTest.php` exists, so most meaningful coverage is feature-level.

**Integration Tests:**
- Scope: Laravel route, validation, auth, persistence, Inertia response, and console command behavior through the framework.
- Route tests live in `tests/Feature/TodayRouteTest.php`, `tests/Feature/HistoryEntryRouteTest.php`, `tests/Feature/PrivacyRouteTest.php`, and `tests/Feature/ExampleTest.php`.
- Auth/magic-link tests live in `tests/Feature/MagicLinkConsumeTest.php`.
- API and sync tests live in `tests/Feature/EntryUpsertTest.php` and `tests/Feature/SyncPushTest.php`.
- Settings persistence tests live in `tests/Feature/SettingsUpdateTest.php`.
- Console command tests live in `tests/Feature/MetricsCountsCommandTest.php`.

**E2E Tests:**
- Not used. No Playwright, Cypress, Dusk, Jest, or Vitest test configuration is present.
- Browser-facing React behavior in `resources/js/Pages/Today.tsx`, `resources/js/Components/AppShell.tsx`, `resources/js/lib/db.ts`, and `resources/js/lib/export.ts` has no automated runtime tests in the repository.

## Common Patterns

**Async Testing:**
```php
public function test_sync_push_accepts_entries_on_or_after_2026_01_01(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/sync/push', [
        'device_id' => 'test-device-456',
        'entries' => [
            [
                'entry_date' => '2026-01-01',
                'person' => 'Test Person',
                'grace' => 'Test Grace',
                'gratitude' => 'Test Gratitude',
                'updated_at' => time() * 1000,
            ],
        ],
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('results.0.status', 'upserted');
}
```

Use HTTP-level assertions for API behavior instead of testing async internals directly. Queue behavior is configured as `sync` in `phpunit.xml`.

**Error Testing:**
```php
public function test_sync_push_rejects_entries_before_2026_01_01(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/sync/push', [
        'device_id' => 'test-device-123',
        'entries' => [
            [
                'entry_date' => '2025-12-31',
                'person' => 'Test Person',
                'grace' => 'Test Grace',
                'gratitude' => 'Test Gratitude',
                'updated_at' => time() * 1000,
            ],
        ],
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('results.0.status', 'rejected');
    $response->assertJsonPath('results.0.errors.entry_date.0', 'The entry date field must be a date after or equal to 2026-01-01.');
}
```

For top-level validation errors, assert 422 plus validation keys as in `tests/Feature/EntryUpsertTest.php`. For partial batch validation, assert the per-item rejected result as in `tests/Feature/SyncPushTest.php`. For forbidden auth/signature failures, assert `assertForbidden()` and auth state as in `tests/Feature/MagicLinkConsumeTest.php`.

---

*Testing analysis: 2026-04-25*
