# Phase 02: Auth & Session Hardening - Research

**Researched:** 2026-04-26  
**Domain:** Laravel 13 passwordless auth, segmented request throttling, session CSRF hardening
**Confidence:** HIGH for Laravel mechanics, MEDIUM for final beta copy and production cookie values

> Supersession note: this research originally evaluated Cloudflare Turnstile as an abuse gate. That provider-specific direction was superseded by `docs/plans/2026-04-27-remove-turnstile.md`; current Phase 2 requirements use uniform response copy and segmented Laravel throttling before sending magic-link mail.

<user_constraints>
## User Constraints (from CONTEXT.md)

Source for all bullets in this section: [VERIFIED: .planning/phases/02-auth-session-hardening/02-CONTEXT.md]

### Locked Decisions

### Request Abuse Gate
- **D-01:** Superseded. Current request protection uses uniform response copy plus segmented `throttle:magic-link-request` before sending mail.
- **D-02:** Keep the login form embedded in the existing `AppShell` sign-in menu rather than creating a new auth page.
- **D-03:** Superseded. Local and test environments no longer need a provider bypass or fake verifier.

### Rate Limiting and Uniform Responses
- **D-04:** Add segmented throttling by both IP and normalized email for `/auth/magic-link/request`.
- **D-05:** Preserve the existing uniform success response, "If your email is valid, we sent a sign-in link.", for accepted, throttled, or unknown request attempts where possible.
- **D-06:** Avoid logging private journal content or raw magic-link tokens when recording throttling or verification failures.

### Magic-Link Token Lifecycle
- **D-07:** Keep the existing relative signed URL model and hashed token storage.
- **D-08:** Expand tests around invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped signature cases before changing controller behavior.
- **D-09:** Add an explicit cleanup command for expired and used `magic_login_tokens`; scheduling can be documented if scheduler wiring belongs to later production runbooks.
- **D-10:** Do not defer user creation to token consumption in this phase unless planning finds it is required for abuse control. The phase should stay focused on the roadmap's beta hardening criteria.

### Session and Remember-Device Posture
- **D-11:** Replace the implicit always-remember 45-day login with an explicit beta posture: configurable duration, documented cookie settings, and either a visible "remember this device" choice or a deliberate documented default.
- **D-12:** Preserve Laravel's `web` session guard and database-backed session defaults. Do not introduce stateless JWT auth for this phase.
- **D-13:** Session cookie settings should be documented for beta production, including `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, session lifetime, domain, and the remember-device tradeoff.

### Session-Authenticated Write Route Protection
- **D-14:** Prefer restoring CSRF protection on `/entries/upsert` and `/api/sync/push` while keeping same-origin Axios/Inertia requests working through Laravel's standard CSRF token flow.
- **D-15:** If research finds CSRF restoration is incompatible with a required sync behavior, the alternative must be an explicit token-auth posture with tests and documented CORS assumptions. Silent CSRF exemption is not acceptable for beta.
- **D-16:** Add feature tests that prove unauthenticated requests are rejected and session-authenticated write requests without the expected CSRF/token posture fail.

### User-Facing Failure States
- **D-17:** Keep auth feedback quiet and uniform for account enumeration safety, but make delivery delay, verification failure, expired/invalid link, and sign-out states actionable enough for beta users.
- **D-18:** Copy should stay plain and operational, matching the existing product tone; avoid broad marketing or explanatory onboarding work that belongs to Phase 7.

### Claude's Discretion

- Exact service class boundaries for throttling helpers and cleanup command naming.
- Whether rate-limiter keys live inline in route/controller code or in a dedicated support class, provided tests keep the behavior clear.
- Exact wording for short auth failure/help copy, as long as responses remain uniform where account enumeration matters.

### Deferred Ideas (OUT OF SCOPE)

- New auth methods such as passkeys, OAuth, or password login are out of scope for Phase 2.
- Account deletion and data purge remain out of scope for this beta hardening phase.
- Broad friend-facing onboarding around auth belongs to Phase 7 unless a small failure-state copy change is required by AUTH criteria.
- Full scheduler/process runbook details belong to Phase 4, though Phase 2 should document the cleanup command it introduces.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Magic-link request flow uses uniform response copy and abuse controls before sending mail. [VERIFIED: .planning/REQUIREMENTS.md] | Align implementation and planning artifacts to the current `.planning/REQUIREMENTS.md` wording: Laravel validates email input, `throttle:magic-link-request` segments attempts by IP and normalized email, and outward responses stay uniform. [VERIFIED: .planning/REQUIREMENTS.md, routes/web.php, app/Providers/AppServiceProvider.php] |
| AUTH-02 | Magic-link request flow applies segmented rate limits by IP and email without leaking account existence. [VERIFIED: .planning/REQUIREMENTS.md] | Use Laravel named rate limiters returning multiple `Limit` instances keyed by IP and normalized email. [CITED: https://laravel.com/docs/13.x/routing#rate-limiting] |
| AUTH-03 | Magic-link consume flow safely rejects invalid, expired, reused, tampered, or wrong-signature tokens. [VERIFIED: .planning/REQUIREMENTS.md] | Keep `signed:relative`, hashed token lookup, `used_at` check, and expiry check; broaden test matrix first. [VERIFIED: routes/web.php, app/Http/Controllers/Auth/MagicLinkController.php, tests/Feature/MagicLinkConsumeTest.php] |
| AUTH-04 | Expired and used magic-link tokens are cleaned up by a scheduled or documented operational command. [VERIFIED: .planning/REQUIREMENTS.md] | Add an Artisan command deleting rows where `used_at` is not null or `expires_at <= now()`, then document/schedule it. [CITED: https://laravel.com/docs/13.x/artisan, https://laravel.com/docs/13.x/scheduling] |
| AUTH-05 | Session cookie and remember-device behavior are configured and documented for beta production. [VERIFIED: .planning/REQUIREMENTS.md] | Preserve database sessions and Laravel remember-me, but make duration/default explicit through config/env and docs. [CITED: https://laravel.com/docs/13.x/session, https://laravel.com/docs/13.x/authentication#remembering-users] |
| AUTH-06 | Session-authenticated write routes have an explicit, tested CSRF or token-auth posture. [VERIFIED: .planning/REQUIREMENTS.md] | Remove CSRF exemptions for session-backed writes and set Axios CSRF header support from the Blade meta token or XSRF cookie. [CITED: https://laravel.com/docs/13.x/csrf] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Work from the repository root and use repo-local files and documentation. [VERIFIED: AGENTS.md]
- Keep changes small and reviewable; prefer stacked PRs around foundation, core behavior, integration/API wiring, UI/external interfaces, and cleanup/docs. [VERIFIED: AGENTS.md, .planning/ROADMAP.md]
- Preserve SQLite-first development and the magic-link log-mailer workflow unless this phase explicitly changes it. [VERIFIED: AGENTS.md, .env.example, README.md]
- Use `composer test` for full PHP tests, targeted `php artisan test --filter=...` while iterating, and `XDEBUG_MODE=off vendor/bin/grumphp run` as the preferred final gate. [VERIFIED: AGENTS.md, composer.json, grumphp.yml]
- No `CLAUDE.md` exists in this repo, and no `.claude/skills` or `.agents/skills` directory exists. [VERIFIED: shell checks]

## Summary

Phase 2 should be planned as a Laravel-native hardening stack: keep the existing `web` session guard, relative signed magic-link route, hashed token table, Inertia sign-in dropdown, database-backed sessions, named throttling, and Pest feature tests. [VERIFIED: routes/web.php, config/auth.php, config/session.php, resources/js/Components/AppShell.tsx, composer.json]

The most important planning split is reviewability: foundation config/services, request gating and throttling, consume/cleanup lifecycle tests, session/CSRF posture, then UI/docs. [VERIFIED: AGENTS.md, .planning/ROADMAP.md] Do not introduce Sanctum/JWT/passkeys/OAuth in this phase because user decisions explicitly preserve session auth and defer new auth methods. [VERIFIED: .planning/phases/02-auth-session-hardening/02-CONTEXT.md]

**Primary recommendation:** Use named Laravel rate limiters + existing signed URL/session guard/CSRF middleware; add config, feature tests, and a cleanup command before touching UI copy. [CITED: Laravel 13 docs; VERIFIED: repo code]

## Standard Stack

### Core

| Library / Facility | Version | Purpose | Why Standard |
|--------------------|---------|---------|--------------|
| Laravel Framework | 13.6.0 installed | Routing, signed URLs, session guard, CSRF middleware, RateLimiter, Artisan, scheduler, HTTP tests. [VERIFIED: `php artisan --version`, composer show] | Already owns the auth/session surface; Laravel 13 docs cover every server-side primitive needed. [CITED: https://laravel.com/docs/13.x/routing, https://laravel.com/docs/13.x/csrf, https://laravel.com/docs/13.x/session] |
| Cloudflare Turnstile | External service, no npm/PHP package required | Bot verification before mail is sent. [VERIFIED: .planning/CONTEXT; CITED: Cloudflare docs] | Locked decision and official Siteverify flow is stable for backend validation. [VERIFIED: 02-CONTEXT.md; CITED: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/] |
| Laravel HTTP Client / Guzzle | `guzzlehttp/guzzle` 7.10.0 installed | Call `https://challenges.cloudflare.com/turnstile/v0/siteverify`. [VERIFIED: composer show guzzlehttp/guzzle] | Laravel HTTP client supports form-encoded POSTs, JSON parsing, timeouts, retries, and fakes. [CITED: https://laravel.com/docs/13.x/http-client] |
| Inertia React | `inertiajs/inertia-laravel` 3.0.6, `@inertiajs/react` 3.0.3 installed | Existing form submission and flash handling in `AppShell`. [VERIFIED: composer show, npm ls, resources/js/Components/AppShell.tsx] | Keeps login form embedded in the current app shell as required. [VERIFIED: 02-CONTEXT.md] |
| Axios | 1.15.2 installed | Same-origin JSON writes to `/entries/upsert` and `/api/sync/push`. [VERIFIED: npm ls, resources/js/Pages/Today.tsx, resources/js/lib/db.ts] | Laravel documents Axios/XSRF token support for same-origin requests. [CITED: https://laravel.com/docs/13.x/csrf#x-xsrf-token] |
| Pest / PHPUnit | Pest 4.6.3, pest-plugin-laravel 4.1.0, PHPUnit 12.5.23 installed | Feature, console, and HTTP tests. [VERIFIED: composer show -D] | Existing test suite already uses PHPUnit-style feature tests with `RefreshDatabase`. [VERIFIED: tests/Feature/MagicLinkConsumeTest.php] |

### Supporting

| Facility | Version | Purpose | When to Use |
|----------|---------|---------|-------------|
| Laravel named rate limiters | Laravel 13.6.0 | IP + normalized email throttling with multiple limits. [CITED: https://laravel.com/docs/13.x/routing#multiple-rate-limits] | Use for `/auth/magic-link/request`; prefix keys to keep IP and email buckets distinct. [CITED: Laravel routing docs] |
| Laravel signed URLs | Laravel 13.6.0 | Preserve relative signed magic-link URLs and wrong-signature rejection. [VERIFIED: routes/web.php] | Keep `signed:relative`; docs explicitly support relative signed URLs. [CITED: https://laravel.com/docs/13.x/urls#signed-urls] |
| Laravel Artisan closure or class command | Laravel 13.6.0 | `auth:prune-magic-links` or similar cleanup command. [VERIFIED: routes/console.php] | Closure command is enough unless the command grows; class command is cleaner if reused by scheduler/tests. [CITED: https://laravel.com/docs/13.x/artisan] |
| Cloudflare dummy keys / fake verifier | External | Deterministic local/test behavior. [CITED: https://developers.cloudflare.com/turnstile/troubleshooting/testing/] | Use dummy keys for browser-like local testing or bind a fake verifier in PHP feature tests. [CITED: Cloudflare testing docs; VERIFIED: 02-CONTEXT.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Turnstile widget script | React wrapper package | Avoid wrapper dependency; Cloudflare supports explicit rendering for SPAs and implicit rendering for simple forms. [CITED: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/] |
| Session CSRF restoration | Sanctum/API token posture | CSRF restoration matches locked preference and existing `web` routes; token posture is fallback only if sync behavior proves incompatible. [VERIFIED: 02-CONTEXT.md, bootstrap/app.php] |
| Closure Artisan command | Generated command class | Closure is sufficient for a small delete query; class command is better if tests need dependency injection or schedule reuse. [CITED: https://laravel.com/docs/13.x/artisan] |
| Laravel built-in RateLimiter | Custom throttle table | Built-in named limiters already support multiple segmented keys; custom persistence adds complexity. [CITED: https://laravel.com/docs/13.x/routing#multiple-rate-limits] |

**Installation:** No new Composer or npm dependency is required for the recommended stack. [VERIFIED: composer.json, package.json; CITED: Cloudflare client rendering docs]

```bash
# none
```

**Version verification:** Composer installed versions were verified with `composer show -D --format=json` and targeted `composer show` calls. [VERIFIED: command output] npm installed versions were verified with `npm ls ... --depth=0`; current registry versions checked with `npm view @inertiajs/react version`, `npm view axios version`, and `npm view react version`. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure

```text
app/
├── Actions/Auth/            # optional small actions if controller gets crowded [ASSUMED]
├── Console/Commands/        # cleanup command if using a command class [CITED: Laravel Artisan docs]
├── Http/Controllers/Auth/   # keep MagicLinkController as the request/consume orchestration point [VERIFIED: repo]
├── Providers/               # define named rate limiter in RouteServiceProvider/AppServiceProvider as local style allows [ASSUMED]
└── Support/Auth/            # Turnstile verifier contract + HTTP implementation + fake [ASSUMED]

config/
├── services.php             # Turnstile site key / secret / bypass config [ASSUMED]
└── session.php              # documented session cookie posture [VERIFIED: repo]

resources/js/Components/
└── AppShell.tsx             # embedded sign-in dropdown and Turnstile token field [VERIFIED: repo]

tests/Feature/
├── MagicLinkRequestTest.php # Turnstile, uniform response, IP/email throttling [ASSUMED]
├── MagicLinkConsumeTest.php # broaden invalid/reused/expired/signature cases [VERIFIED: existing file]
├── MagicLinkCleanupCommandTest.php # expired/used token pruning [ASSUMED]
└── SessionWriteProtectionTest.php # auth + CSRF posture [ASSUMED]
```

### Pattern 1: Fakeable Turnstile Verification Service

**What:** Define a small interface such as `TurnstileVerifier::verify(string $token, ?string $ip): TurnstileResult`, with an HTTP implementation and a deterministic fake for tests/local. [ASSUMED]

**When to use:** Use it before `User::firstOrCreate`, token creation, and `Mail::send` in `MagicLinkController::request`. [VERIFIED: current controller creates users/tokens/mail in that method]

**Example:**

```php
// Source: Cloudflare Siteverify + Laravel HTTP client docs
$response = Http::asForm()
    ->timeout(3)
    ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
        'secret' => config('services.turnstile.secret_key'),
        'response' => $token,
        'remoteip' => $request->ip(),
    ]);

return (bool) $response->json('success');
```

Cloudflare accepts form-encoded or JSON Siteverify requests and returns JSON; Laravel HTTP client supports `asForm()`, `post()`, `timeout()`, and JSON response access. [CITED: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/, https://laravel.com/docs/13.x/http-client]

### Pattern 2: Named Multi-Limit Rate Limiter

**What:** Define one named limiter for magic-link requests that returns separate IP and normalized-email limits. [CITED: Laravel routing docs]

**When to use:** Use for `/auth/magic-link/request`, replacing the current anonymous `throttle:5,15` route middleware. [VERIFIED: routes/web.php]

**Example:**

```php
// Source: Laravel Routing > Multiple Rate Limits
RateLimiter::for('magic-link-request', function (Request $request) {
    $email = strtolower(trim((string) $request->input('email')));

    return [
        Limit::perMinutes(15, 5)->by('ip:'.$request->ip()),
        Limit::perMinutes(60, 3)->by('email:'.$email),
    ];
});
```

Laravel supports returning an array of limits and recommends prefixing identical `by` values when multiple limits are used. [CITED: https://laravel.com/docs/13.x/routing#multiple-rate-limits]

### Pattern 3: Preserve Relative Signed URL + Hashed One-Time Token

**What:** Keep two checks: Laravel signature validation for URL tampering and database token validation for one-time use/expiry. [VERIFIED: routes/web.php, MagicLinkController.php]

**When to use:** Keep `URL::temporarySignedRoute(..., absolute: false)` and route middleware `signed:relative`; keep `token_hash`, `expires_at`, and `used_at`. [VERIFIED: repo]

**Example:**

```php
// Source: existing controller + Laravel signed URL docs
$record = MagicLoginToken::query()
    ->where('token_hash', hash('sha256', $token))
    ->whereNull('used_at')
    ->where('expires_at', '>', now())
    ->first();
```

Laravel signed URL middleware returns `403` on invalid signatures, and `signed:relative` is the documented mode when the domain is not part of the signature. [CITED: https://laravel.com/docs/13.x/urls#signed-urls]

### Pattern 4: Standard CSRF for Same-Origin Session Writes

**What:** Remove `entries/upsert` and `api/sync/push` from `validateCsrfTokens(except: ...)` and ensure Axios sends a token header or XSRF cookie on same-origin writes. [VERIFIED: bootstrap/app.php, resources/js/bootstrap.js]

**When to use:** Use for `/entries/upsert` and `/api/sync/push` because both are `web` routes using session auth. [VERIFIED: routes/web.php]

**Example:**

```js
// Source: Laravel CSRF docs, adapted to existing resources/js/bootstrap.js
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

if (token) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}
```

Laravel checks `X-CSRF-TOKEN` and also supports Axios automatically sending `X-XSRF-TOKEN` for same-origin requests when the XSRF cookie is present. [CITED: https://laravel.com/docs/13.x/csrf#x-csrf-token, https://laravel.com/docs/13.x/csrf#x-xsrf-token]

### Anti-Patterns to Avoid

- **Client-only Turnstile:** The backend must call Siteverify because forged form submissions can bypass the widget. [CITED: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/]
- **Raw token logging:** Raw magic-link tokens and private journal content must not be logged. [VERIFIED: 02-CONTEXT.md]
- **One generic throttle bucket:** A single IP bucket does not satisfy AUTH-02; use IP and normalized email. [VERIFIED: REQUIREMENTS.md; CITED: Laravel rate limiter docs]
- **Silent CSRF exemption:** Keeping write routes exempt while using session auth contradicts D-15 and keeps the known beta risk. [VERIFIED: 02-CONTEXT.md, .planning/codebase/CONCERNS.md]
- **Testing CSRF with normal `postJson()` only:** Laravel’s CSRF middleware bypasses checks when the app environment is `testing`, so ordinary feature tests can falsely pass. [VERIFIED: vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestForgery.php]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot verification | Custom challenge, honeypot-only gate, or client-only widget trust | Cloudflare Turnstile Siteverify | Tokens are short-lived, single-use, and verified by Cloudflare. [CITED: Cloudflare Siteverify docs] |
| Request throttling | Custom counters in SQL tables | Laravel RateLimiter named limits | Supports segmented keys and multiple limits already. [CITED: Laravel routing docs] |
| Link tamper protection | Custom HMAC query parser | Laravel temporary signed routes + `signed:relative` | Existing app already uses it and docs support relative signatures. [VERIFIED: repo; CITED: Laravel URL docs] |
| Session auth | JWT/session replacement | Laravel `web` guard and remember-me | Locked decision preserves Laravel session guard. [VERIFIED: 02-CONTEXT.md, config/auth.php] |
| CSRF protection | Custom origin/header scheme | Laravel `PreventRequestForgery` + Axios token header | Laravel web routes are built around session state and CSRF protection. [CITED: Laravel routing and CSRF docs] |
| Cleanup scheduling | External cron logic embedded in docs only | Artisan command, optionally scheduled | Laravel supports first-class commands and scheduling in source control. [CITED: Laravel Artisan and scheduling docs] |

**Key insight:** The hard parts here are trust boundaries and tests, not algorithms. Laravel and Cloudflare already solve the primitives; the plan should focus on wiring, deterministic fakes, uniform responses, and proving protections remain active. [VERIFIED: repo; CITED: Laravel and Cloudflare docs]

## Common Pitfalls

### Pitfall 1: Creating Users Before Abuse Gates

**What goes wrong:** Verification-failed or throttled requests still create `users` and `magic_login_tokens` rows. [VERIFIED: current MagicLinkController creates user before token/mail]  
**Why it happens:** Current controller has no Turnstile verifier and creates the user immediately after validation. [VERIFIED: MagicLinkController.php]  
**How to avoid:** Run Turnstile and rate-limit decisions before `firstOrCreate`, token creation, and mail send; preserve the uniform response. [VERIFIED: CONTEXT; CITED: Cloudflare Siteverify docs]  
**Warning signs:** Tests show `User::count()` or `MagicLoginToken::count()` changes after failed verification or throttled attempts. [ASSUMED]

### Pitfall 2: Leaking Enumeration Through Responses

**What goes wrong:** Unknown email, bad captcha, throttled email, and accepted email get distinguishable copy or status behavior. [VERIFIED: AUTH-02/D-05]  
**Why it happens:** Validation errors, 429 responses, or captcha failures often default to distinct responses. [ASSUMED]  
**How to avoid:** Use the same flash copy for accepted, throttled, unknown, and verification-failed flows where possible; use logs without sensitive values for operational visibility. [VERIFIED: 02-CONTEXT.md]  
**Warning signs:** Tests assert different body text or flash status for bad captcha versus accepted email. [ASSUMED]

### Pitfall 3: CSRF Tests That Never Exercise CSRF

**What goes wrong:** Tests claim missing CSRF token fails, but Laravel bypasses CSRF checks in the `testing` environment. [VERIFIED: vendor PreventRequestForgery.php]  
**Why it happens:** `PreventRequestForgery::handle()` returns early when `runningUnitTests()` is true. [VERIFIED: vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestForgery.php]  
**How to avoid:** Add a focused middleware test or temporarily bind the app environment to a non-testing value for the CSRF request, then restore it; also inspect `bootstrap/app.php` no longer exempts the write routes. [VERIFIED: vendor code, bootstrap/app.php]  
**Warning signs:** A missing-CSRF test still passes before removing the exemptions. [ASSUMED]

### Pitfall 4: Forgetting the Existing HTML-Escaped Signature Normalizer

**What goes wrong:** Email-client escaped `&amp;signature=` links regress. [VERIFIED: tests/Feature/MagicLinkConsumeTest.php, NormalizeHtmlEscapedSignature.php]  
**Why it happens:** New invalid-link behavior can bypass or replace the current middleware assumptions. [ASSUMED]  
**How to avoid:** Keep `NormalizeHtmlEscapedSignature` prepended in web middleware and retain the existing acceptance test. [VERIFIED: bootstrap/app.php, tests/Feature/MagicLinkConsumeTest.php]

### Pitfall 5: Over-Scoping Into New Auth

**What goes wrong:** Passkeys, OAuth, password login, Sanctum, or account deletion creep into the phase. [VERIFIED: deferred ideas]  
**Why it happens:** Auth hardening can look like an opportunity to redesign auth. [ASSUMED]  
**How to avoid:** Keep this phase to request gating, token lifecycle, sessions, CSRF, tests, and narrowly required UI copy. [VERIFIED: 02-CONTEXT.md, ROADMAP.md]

## Code Examples

### Turnstile Result Shape

```php
// Source: Cloudflare Siteverify response fields
final readonly class TurnstileResult
{
    public function __construct(
        public bool $successful,
        public array $errorCodes = [],
        public ?string $hostname = null,
        public ?string $action = null,
    ) {}
}
```

Cloudflare returns `success`, optional `hostname`, optional `action`, and `error-codes`, so keep the app-level result narrow and do not leak error codes to the user. [CITED: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/; VERIFIED: 02-CONTEXT.md]

### Uniform Request Response Assertion

```php
// Source: existing controller flash copy
$response->assertSessionHas('status', 'If your email is valid, we sent a sign-in link.');
```

The exact copy already exists and is locked for uniform request outcomes. [VERIFIED: MagicLinkController.php, 02-CONTEXT.md]

### Cleanup Command Query

```php
// Source: existing MagicLoginToken schema
$deleted = MagicLoginToken::query()
    ->where(fn ($query) => $query
        ->whereNotNull('used_at')
        ->orWhere('expires_at', '<=', now()))
    ->delete();
```

The schema already has nullable `used_at` and timestamp `expires_at`, so cleanup does not require a migration. [VERIFIED: database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php]

### CSRF Header Wiring

```js
// Source: Laravel CSRF docs, existing bootstrap file
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

if (csrfToken) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}
```

The Blade shell already emits `<meta name="csrf-token" ...>`, while `resources/js/bootstrap.js` currently only sets `X-Requested-With`. [VERIFIED: resources/views/app.blade.php, resources/js/bootstrap.js]

## State of the Art

| Old / Current Approach | Current Recommended Approach | When Changed / Verified | Impact |
|------------------------|------------------------------|-------------------------|--------|
| Login request route uses only `throttle:5,15`. [VERIFIED: routes/web.php] | Named limiter with multiple segmented keys plus Turnstile verification. [CITED: Laravel routing docs, Cloudflare docs] | Verified 2026-04-26 | Satisfies AUTH-01/AUTH-02 and keeps responses uniform. |
| Always remember for 45 days in controller constant. [VERIFIED: MagicLinkController.php] | Configurable remember duration and explicit beta default/choice. [VERIFIED: 02-CONTEXT.md] | Verified 2026-04-26 | Satisfies AUTH-05 without replacing Laravel session auth. |
| `/entries/upsert` and `/api/sync/push` are CSRF-exempt. [VERIFIED: bootstrap/app.php] | Restore Laravel CSRF for session writes, using Axios token support. [CITED: Laravel CSRF docs] | Verified 2026-04-26 | Satisfies AUTH-06 and closes known CSRF concern. |
| No magic token cleanup command. [VERIFIED: routes/console.php, code search] | Add explicit Artisan cleanup command, optionally scheduled/documented. [CITED: Laravel Artisan/scheduling docs] | Verified 2026-04-26 | Satisfies AUTH-04 and prevents token table accumulation. |

**Deprecated/outdated:**
- README says "Laravel 12, PHP 8.2+" while the installed project is Laravel 13.6.0 and PHP 8.4.20. [VERIFIED: README.md, php artisan --version, php --version]
- Silent CSRF exemption for session-authenticated writes is out of bounds for beta per D-15. [VERIFIED: 02-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `app/Support/Auth` or similar is the best namespace for Turnstile service seams. | Architecture Patterns | Low; planner can choose a different local namespace without changing behavior. |
| A2 | A closure command may be sufficient if cleanup stays a one-query operation. | Standard Stack / Alternatives | Low; class command is safer if dependency injection or detailed tests are desired. |
| A3 | Rate-limit numeric thresholds should be modest beta defaults, not fixed by research. | Code Examples | Medium; planner should choose exact limits based on beta tolerance. |
| A4 | Temporarily rebinding app environment or writing middleware-level tests is acceptable for CSRF posture tests. | Common Pitfalls / Validation | Medium; implementation should prove the test fails before removing exemptions. |

## Open Questions (RESOLVED)

1. **Exact Turnstile mode and env names**
   - What we know: The phase locks Cloudflare Turnstile and local/test fake behavior. [VERIFIED: 02-CONTEXT.md]
   - Decision: Plans use `TURNSTILE_ENABLED`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_VERIFY_URL`, `TURNSTILE_TIMEOUT`, and `TURNSTILE_BYPASS_TOKEN`. Local/testing may use the deterministic app-level bypass token `local-turnstile-bypass`; non-local/test environments never resolve or share the bypass token. If Turnstile is disabled or the secret is missing outside local/testing, the verifier fails closed and magic-link mail is not sent. [RESOLVED: 02-01-PLAN.md, 02-05-PLAN.md]

2. **Remember-device UX**
   - What we know: Always-remember 45 days must become explicit and configurable. [VERIFIED: 02-CONTEXT.md, MagicLinkController.php]
   - Decision: Plans implement a visible `Remember this device` checkbox inside the existing AppShell sign-in dropdown, below Turnstile and above the submit button, with helper copy `Stay signed in on this device for the configured beta session window.` The checkbox defaults from `auth.magic_link.remember_default`, which remains configurable and documented. [RESOLVED: 02-05-PLAN.md]

3. **Production cookie values**
   - What we know: `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, lifetime, and domain must be documented. [VERIFIED: 02-CONTEXT.md]
   - Decision: Plans document beta production recommendations as `TURNSTILE_ENABLED=true`, configured `TURNSTILE_SECRET_KEY`, no production use of `TURNSTILE_BYPASS_TOKEN`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`, database-backed `SESSION_DRIVER=database`, and host-only `SESSION_DOMAIN=null` unless subdomains are required. [RESOLVED: 02-05-PLAN.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| PHP CLI | Laravel app/tests | yes [VERIFIED: `php --version`] | 8.4.20 | none |
| Composer | PHP dependencies/scripts | yes [VERIFIED: `composer --version`] | 2.9.5 | none |
| Laravel Artisan | routes, tests, commands | yes [VERIFIED: `php artisan --version`] | Laravel 13.6.0 | none |
| Node.js | frontend build/typecheck | yes [VERIFIED: `node --version`] | 22.12.0 | none |
| npm | frontend deps/scripts | yes [VERIFIED: `npm --version`] | 10.9.0 | none |
| SQLite CLI | local database inspection | yes [VERIFIED: `sqlite3 --version`] | 3.51.0 | Laravel can still use PDO SQLite if CLI absent. [ASSUMED] |
| curl / HTTPS egress | Turnstile operational smoke checks | yes [VERIFIED: `curl --version`] | 8.7.1 | Use Laravel HTTP client tests/fakes for automated tests. [CITED: Laravel HTTP client testing docs] |
| Cloudflare Turnstile keys | Production Siteverify | not present in repo [VERIFIED: .env.example] | - | Dummy keys or fake verifier for local/test; production docs must require real keys. [CITED: Cloudflare testing docs] |

**Missing dependencies with no fallback:**
- Production Cloudflare Turnstile site key and secret are not in `.env.example`; production enablement requires real Cloudflare credentials. [VERIFIED: .env.example; CITED: Cloudflare get started docs]

**Missing dependencies with fallback:**
- Real Turnstile service calls should not be required for automated tests; use Cloudflare dummy keys or a fake verifier. [CITED: https://developers.cloudflare.com/turnstile/troubleshooting/testing/]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Pest 4.6.3 via Laravel/PHPUnit 12.5.23 [VERIFIED: composer show -D] |
| Config file | `phpunit.xml` [VERIFIED: repo] |
| Quick run command | `php artisan test --filter=MagicLink` [ASSUMED] |
| Full suite command | `composer test` [VERIFIED: composer.json, AGENTS.md] |
| Final gate | `XDEBUG_MODE=off vendor/bin/grumphp run` [VERIFIED: AGENTS.md, grumphp.yml] |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| AUTH-01 | Mail is sent only after successful Turnstile verification; failed verifier returns uniform response and creates no token. [VERIFIED: requirement/context] | feature + fake service | `php artisan test --filter=MagicLinkRequestTest` | no, Wave 0 |
| AUTH-02 | IP and normalized email limits throttle requests without distinct user-facing copy. [VERIFIED: requirement/context] | feature | `php artisan test --filter=MagicLinkRequestTest` | no, Wave 0 |
| AUTH-03 | Invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped links behave safely. [VERIFIED: requirement/context] | feature | `php artisan test --filter=MagicLinkConsumeTest` | partial, existing |
| AUTH-04 | Cleanup command deletes expired/used tokens and leaves active unused tokens. [VERIFIED: requirement/context] | console feature | `php artisan test --filter=MagicLinkCleanupCommandTest` | no, Wave 0 |
| AUTH-05 | Configurable remember-device/session posture is asserted and documented. [VERIFIED: requirement/context] | feature + config/doc assertion | `php artisan test --filter=MagicLinkConsumeTest` | partial, existing |
| AUTH-06 | Unauthenticated writes fail; authenticated writes without valid CSRF/token posture fail; valid same-origin writes work. [VERIFIED: requirement/context] | feature or middleware-level | `php artisan test --filter=SessionWriteProtectionTest` | no, Wave 0 |

### Sampling Rate

- **Per task commit:** targeted `php artisan test --filter=...` for changed auth area. [ASSUMED]
- **Per wave merge:** `composer test`. [VERIFIED: AGENTS.md]
- **Phase gate:** `XDEBUG_MODE=off vendor/bin/grumphp run` plus `npm run typecheck` if UI changed. [VERIFIED: AGENTS.md, grumphp.yml]

### Wave 0 Gaps

- [ ] `tests/Feature/MagicLinkRequestTest.php` covers Turnstile, uniform responses, mail/token side effects, and rate limits. [ASSUMED]
- [ ] Expand `tests/Feature/MagicLinkConsumeTest.php` before behavior edits. [VERIFIED: existing partial file, 02-CONTEXT.md]
- [ ] `tests/Feature/MagicLinkCleanupCommandTest.php` covers cleanup command. [ASSUMED]
- [ ] `tests/Feature/SessionWriteProtectionTest.php` or a focused CSRF middleware test covers AUTH-06 despite Laravel test-env CSRF bypass. [VERIFIED: vendor PreventRequestForgery.php]
- [ ] `resources/js` test or typecheck coverage for Turnstile prop/token field if widget code becomes non-trivial. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

OWASP ASVS 5.0 uses categories such as Authentication, Session Management, Authorization, Validation and Business Logic, Cryptography, Configuration, and Security Logging/Error Handling. [CITED: https://cornucopia.owasp.org/taxonomy/asvs-5.0, https://github.com/OWASP/ASVS/blob/master/5.0/en/0x15-V6-Authentication.md]

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| Authentication | yes | One-time magic-link token with defined expiry, hashed storage, signed URL, and single-use `used_at`. [VERIFIED: repo; CITED: OWASP ASVS authentication] |
| Session Management | yes | Laravel database sessions, session regeneration after login, documented cookie settings. [VERIFIED: MagicLinkController.php, config/session.php; CITED: Laravel session docs] |
| Authorization / Access Control | yes | Laravel `auth` middleware on settings/write/logout routes. [VERIFIED: routes/web.php] |
| Validation and Business Logic | yes | Server-side email validation, Turnstile Siteverify, segmented rate limits. [VERIFIED: MagicLinkController.php; CITED: Cloudflare/Laravel docs] |
| Cryptography | yes | Laravel signed URLs and hashed high-entropy token storage; do not hand-roll crypto. [VERIFIED: repo; CITED: Laravel URL docs] |
| Configuration | yes | `.env.example` must document Turnstile and session production settings. [VERIFIED: .env.example currently missing Turnstile keys] |
| Security Logging/Error Handling | limited in Phase 2 | Avoid sensitive logs; detailed observability is Phase 3. [VERIFIED: 02-CONTEXT.md, ROADMAP.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Bot-driven email flood | Denial of Service / Abuse | Turnstile Siteverify before mail plus IP/email rate limits. [CITED: Cloudflare docs, Laravel routing docs] |
| Account enumeration | Information Disclosure | Uniform flash response and side-effect tests. [VERIFIED: 02-CONTEXT.md] |
| Magic-link replay | Spoofing | `used_at` single-use check and immediate token marking before login. [VERIFIED: MagicLinkController.php] |
| Link tampering or wrong signature | Tampering | `signed:relative` middleware and invalid signature tests. [VERIFIED: routes/web.php, tests/Feature/MagicLinkConsumeTest.php] |
| CSRF on session-authenticated writes | Tampering | Remove exemptions and use Laravel CSRF token validation for web routes. [VERIFIED: bootstrap/app.php; CITED: Laravel CSRF docs] |
| Sensitive token leakage | Information Disclosure | Store only token hashes; do not log raw tokens. [VERIFIED: MagicLinkController.php, 02-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `02-CONTEXT.md` - locked implementation decisions, discretion, deferred scope. [VERIFIED]
- `REQUIREMENTS.md` - AUTH-01 through AUTH-06. [VERIFIED]
- `ROADMAP.md` - Phase 2 goal, success criteria, reviewability expectations. [VERIFIED]
- `AGENTS.md` - repo commands, testing, SQLite/magic-link workflow. [VERIFIED]
- `routes/web.php`, `MagicLinkController.php`, `MagicLoginToken.php`, `bootstrap/app.php`, `config/session.php`, `config/auth.php`, `AppShell.tsx`, `MagicLinkConsumeTest.php` - current implementation. [VERIFIED]
- Cloudflare Turnstile docs: Siteverify, client rendering, testing dummy keys. [CITED: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/, https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/, https://developers.cloudflare.com/turnstile/troubleshooting/testing/]
- Laravel 13 docs: routing/rate limiting, URLs/signed routes, CSRF, authentication/remember users, session, HTTP client, Artisan, scheduling, HTTP tests. [CITED: https://laravel.com/docs/13.x]

### Secondary (MEDIUM confidence)

- OWASP ASVS 5.0 taxonomy and GitHub markdown for security category mapping. [CITED: https://cornucopia.owasp.org/taxonomy/asvs-5.0, https://github.com/OWASP/ASVS]

### Tertiary (LOW confidence)

- Namespace and file placement recommendations where no existing repo convention exists for Turnstile services. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommended primitives are already installed or official external service choices. [VERIFIED/CITED]
- Architecture: MEDIUM - service boundaries are recommended but not dictated by existing repo patterns. [ASSUMED]
- Pitfalls: HIGH - major pitfalls are verified from current code, Laravel vendor behavior, and locked decisions. [VERIFIED/CITED]
- Validation: MEDIUM - auth tests are straightforward, but CSRF posture tests require deliberate handling of Laravel's testing bypass. [VERIFIED]

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26 for Laravel repo-local implementation details; 2026-05-03 for Cloudflare Turnstile docs and npm package versions. [ASSUMED]
