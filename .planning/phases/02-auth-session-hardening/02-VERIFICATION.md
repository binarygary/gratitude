---
phase: 02-auth-session-hardening
verified: 2026-04-27T15:37:26Z
status: human_needed
score: 11/11 must-haves verified
human_verification:
  - test: "Real browser magic-link request and consume flow"
    expected: "A signed-out user opens the AppShell sign-in menu, completes Turnstile or local/test bypass, submits an email, receives uniform request copy, consumes the logged magic link, and lands signed in on Today."
    why_human: "Automated feature tests verify the server path, but the full browser, mail-log, redirect, and session-cookie flow needs a rendered app."
  - test: "Production Turnstile credential smoke test"
    expected: "With production Turnstile keys configured, the widget returns a token accepted by server-side Siteverify; missing or disabled production config still sends no mail and shows uniform copy."
    why_human: "External Cloudflare Siteverify behavior and production credentials cannot be proven by local fakes."
  - test: "Sign-in dropdown visual and accessibility pass"
    expected: "The compact dropdown fits mobile and desktop, Turnstile renders without clipping, remember-device copy is readable, and status messages are announced politely."
    why_human: "Layout, third-party widget rendering, and assistive-technology quality require browser inspection."
---

# Phase 2: Auth & Session Hardening Verification Report

**Phase Goal:** Public beta users can request, consume, and use magic-link sessions with abuse controls and explicit write-route protection.
**Verified:** 2026-04-27T15:37:26Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Magic-link requests require successful server-side Turnstile or equivalent verification before mail is sent. | VERIFIED | `MagicLinkController::request()` calls `TurnstileVerifier::verify()` before `User::firstOrCreate`, `MagicLoginToken::create`, and `Mail::to`; `MagicLinkRequestTest` asserts failed verification creates no user/token/mail. |
| 2 | Local and test environments can complete auth tests without real Cloudflare credentials while production-like misconfiguration fails closed. | VERIFIED | `AppServiceProvider` binds `BypassTurnstileVerifier` only for local/testing disabled Turnstile; otherwise missing/disabled production-like config returns `turnstile-disabled-or-misconfigured`; `TurnstileVerifierTest` covers both paths. |
| 3 | Repeated magic-link requests are rate-limited by IP and normalized email while returning uniform responses. | VERIFIED | `/auth/magic-link/request` uses `throttle:magic-link-request`; named limiter has IP and SHA-1 normalized-email buckets; tests assert throttled attempts keep `If your email is valid, we sent a sign-in link.` and do not add tokens. |
| 4 | Invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped magic links are safely handled. | VERIFIED | `signed:relative` remains on the consume route; controller checks missing, used, expired, and missing-user token states before login; `InvalidSignatureException` renders recovery redirect; `MagicLinkConsumeTest` covers the matrix. |
| 5 | Used and expired magic-link tokens are cleaned up by an explicit operational command and active unused tokens are preserved. | VERIFIED | `routes/console.php` defines `auth:prune-magic-links`, deleting `used_at` rows or `expires_at <= now()`; `MagicLinkCleanupCommandTest` asserts only active token remains. |
| 6 | Remember-device behavior is explicit, configurable, and tied to the user's magic-link request choice. | VERIFIED | `auth.magic_link` config defines expiry, remember duration, and default; token rows persist `remember_device`; consume logs in with remember based on the row; tests cover requested and default behavior. |
| 7 | Session cookie and remember-device posture are documented for beta production. | VERIFIED | README documents `TURNSTILE_*`, `MAGIC_LINK_*`, `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, `SESSION_LIFETIME`, `SESSION_DOMAIN`, database sessions, fail-closed Turnstile, and cleanup command. |
| 8 | Session-authenticated write routes are no longer silently CSRF-exempt. | VERIFIED | `bootstrap/app.php` has no `validateCsrfTokens` exemptions for `/entries/upsert` or `/api/sync/push`; tests assert those strings are absent from bootstrap CSRF exemptions. |
| 9 | Unauthenticated writes fail, cross-site session writes without CSRF fail, and tokened same-origin writes remain possible. | VERIFIED | `SessionWriteProtectionTest` asserts unauthenticated 401s, direct `PreventRequestForgery` `TokenMismatchException` on missing token, and pass-through with `X-CSRF-TOKEN`; `resources/js/bootstrap.js` sets the header from Blade meta token. |
| 10 | Signed-out users can submit the embedded AppShell form with Turnstile/bypass and an explicit remember-device choice. | VERIFIED | Inertia shares public `turnstile` props and remember default; `AppShell.tsx` loads Cloudflare Turnstile, submits `cf-turnstile-response`, uses local/test shared bypass when available, and renders `Remember this device`. |
| 11 | Final Phase 2 backend, frontend, and quality gates pass. | VERIFIED | Fresh verifier run passed focused auth/session tests: 28 tests, 109 assertions. `npm run typecheck` passed. Orchestrator evidence also reports `composer test`, `npm run build`, and `XDEBUG_MODE=off vendor/bin/grumphp run` passed. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `app/Support/Auth/TurnstileVerifier.php` | Fakeable auth verifier contract | VERIFIED | Defines `verify(string $token, ?string $ip = null): TurnstileResult`. |
| `app/Support/Auth/HttpTurnstileVerifier.php` | Cloudflare Siteverify implementation | VERIFIED | Uses Laravel HTTP client, `services.turnstile.verify_url`, secret, response, remote IP, and timeout. Artifact helper missed the literal URL because it is config-driven. |
| `app/Support/Auth/BypassTurnstileVerifier.php` | Deterministic local/test verifier | VERIFIED | Compares against configured bypass token. Artifact helper missed the literal bypass value because it is in config, not hardcoded in the class. |
| `config/services.php` | Turnstile env/config posture | VERIFIED | Defines enabled/site/secret/verify URL/timeout/bypass token and scopes bypass to local/testing. |
| `app/Providers/AppServiceProvider.php` | Verifier binding and segmented limiter | VERIFIED | Binds bypass/HTTP/fail-closed verifier and registers `magic-link-request` IP/email limits. |
| `routes/web.php` | Magic-link request and consume route protection | VERIFIED | Request route uses named throttle; consume route keeps `signed:relative`; write routes require `auth`. |
| `app/Http/Controllers/Auth/MagicLinkController.php` | Request gate, token lifecycle, remember behavior | VERIFIED | Turnstile before side effects, uniform request status, explicit consume failure statuses, `used_at` marking, row-driven remember login. |
| `routes/console.php` | Token cleanup command | VERIFIED | Defines `auth:prune-magic-links` and deletes used/expired tokens. |
| `config/auth.php` | Magic-link expiry and remember config | VERIFIED | Defines `auth.magic_link.expires_minutes`, `remember_minutes`, and `remember_default`. |
| `database/migrations/2026_04_26_000001_add_remember_device_to_magic_login_tokens_table.php` | Remember-device persistence | VERIFIED | Adds boolean `remember_device` default false with down migration. |
| `app/Models/MagicLoginToken.php` | Token row casts/fillable | VERIFIED | Includes `remember_device` fillable and boolean cast. |
| `bootstrap/app.php` | Exception handling and no write-route CSRF exemptions | VERIFIED | Renders invalid signatures as recovery redirects and does not exempt write routes. |
| `resources/views/app.blade.php` | Blade CSRF meta token | VERIFIED | Provides `<meta name="csrf-token" content="{{ csrf_token() }}">`. |
| `resources/js/bootstrap.js` | Axios CSRF header wiring | VERIFIED | Preserves `X-Requested-With` and sets `X-CSRF-TOKEN` when meta token exists. |
| `app/Http/Middleware/HandleInertiaRequests.php` | Public Turnstile/remember shared props | VERIFIED | Shares enabled/site key/bypass token and remember default; bypass only local/testing. |
| `resources/js/Components/AppShell.tsx` | Embedded sign-in Turnstile and remember UI | VERIFIED | Existing dropdown posts email, Turnstile response, and `remember_device`; no hardcoded local bypass token. |
| `README.md` | Beta auth/session documentation | VERIFIED | Documents env keys, production recommendations, cleanup command, fail-closed behavior, and CSRF write route posture. |
| `tests/Feature/*Auth*` and `SessionWriteProtectionTest.php` | Feature coverage for Phase 2 behaviors | VERIFIED | Focused auth/session run passed 28 tests, 109 assertions. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `AppServiceProvider.php` | `TurnstileVerifier.php` | Container binding | VERIFIED | `TurnstileVerifier::class` binding resolves bypass, HTTP, or fail-closed verifier. |
| `HttpTurnstileVerifier.php` | `config/services.php` | Cloudflare config and Siteverify URL | VERIFIED | Uses `services.turnstile.*`; tests assert Siteverify payload. |
| `MagicLinkController.php` | `TurnstileVerifier.php` | Request gate before side effects | VERIFIED | `verify()` runs before user/token/mail creation. |
| `routes/web.php` | `AppServiceProvider.php` | Named throttle | VERIFIED | Route uses `throttle:magic-link-request`; provider registers the limiter. |
| `routes/web.php` | `bootstrap/app.php` | Signed URL plus invalid signature rendering | VERIFIED | Consume route keeps `signed:relative`; exceptions redirect with invalid-link copy. |
| `routes/console.php` | `MagicLoginToken.php` | Cleanup query | VERIFIED | Command deletes used/expired token rows. |
| `MagicLinkController.php` | `MagicLoginToken.php` | Remember-device request and consume | VERIFIED | `remember_device` stored on request and consumed during login. |
| `resources/views/app.blade.php` | `resources/js/bootstrap.js` | Meta CSRF token to Axios header | VERIFIED | Blade provides meta token; Axios sets `X-CSRF-TOKEN`. |
| `bootstrap/app.php` | `routes/web.php` | Laravel web CSRF middleware for writes | VERIFIED | Helper reported missing `validateCsrfTokens`, but that is the secure state: no exemptions are registered for the session-authenticated write routes. |
| `HandleInertiaRequests.php` | `AppShell.tsx` | Inertia shared props | VERIFIED | Shared `turnstile` and remember defaults are consumed by AppShell. |
| `AppShell.tsx` | `MagicLinkController.php` | Form fields | VERIFIED | Posts `cf-turnstile-response` and `remember_device` to `/auth/magic-link/request`. |
| `README.md` | `routes/console.php` | Cleanup command docs | VERIFIED | README documents `php artisan auth:prune-magic-links`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `MagicLinkController.php` | Turnstile result | `TurnstileVerifier` container binding to HTTP verifier, bypass verifier, or fail-closed verifier | Yes | FLOWING |
| `MagicLinkController.php` | Token row and mail side effects | Validated email plus successful verifier result | Yes | FLOWING |
| `AppServiceProvider.php` | Rate-limit keys | Request IP and normalized email input | Yes | FLOWING |
| `MagicLinkController.php` | Consume login user | `MagicLoginToken` lookup by SHA-256 token hash and `user` relation | Yes | FLOWING |
| `routes/console.php` | Cleanup rows | `MagicLoginToken` query for used or expired rows | Yes | FLOWING |
| `MagicLinkController.php` | Remember-device login flag | Request `remember_device` stored on `magic_login_tokens`, then read during consume | Yes | FLOWING |
| `resources/js/bootstrap.js` | CSRF header | Blade `<meta name="csrf-token">` | Yes | FLOWING |
| `AppShell.tsx` | Turnstile response | Cloudflare widget callback or local/testing Inertia bypass token | Yes | FLOWING |
| `AppShell.tsx` | Remember-device checkbox | Inertia remember default plus user checkbox state | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Auth/session focused tests | `php artisan test tests/Feature/TurnstileVerifierTest.php tests/Feature/MagicLinkRequestTest.php tests/Feature/MagicLinkConsumeTest.php tests/Feature/MagicLinkCleanupCommandTest.php tests/Feature/SessionWriteProtectionTest.php` | 28 passed, 109 assertions | PASS |
| TypeScript typecheck | `npm run typecheck` | Exited 0 | PASS |
| Direct save regression | Orchestrator evidence: `php artisan test --filter=EntryUpsertTest` | 6 tests, 20 assertions | PASS |
| Sync push regression | Orchestrator evidence: `php artisan test --filter=SyncPushTest` | 11 tests, 70 assertions | PASS |
| IndexedDB sync regression | Orchestrator evidence: `npm run test:unit -- resources/js/lib/db.test.ts` | 1 file, 11 tests | PASS |
| Schema drift | Orchestrator evidence: `gsd-tools verify schema-drift "02"` | `drift_detected=false`, `blocking=false` | PASS |
| Full PHP suite | Orchestrator evidence: `composer test` | 64 passed, 263 assertions | PASS |
| Production frontend build | Orchestrator evidence: `npm run build` | Passed | PASS |
| Preferred final gate | Orchestrator evidence: `XDEBUG_MODE=off vendor/bin/grumphp run` | Passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| AUTH-01 | 02-01, 02-02, 02-05 | Magic-link request flow verifies Cloudflare Turnstile or equivalent server-side before sending mail. | SATISFIED | Fakeable verifier, HTTP Siteverify implementation, controller gate before side effects, AppShell token field, and tests. |
| AUTH-02 | 02-02 | Magic-link request flow applies segmented rate limits by IP and email without leaking account existence. | SATISFIED | Named limiter has IP and normalized-email buckets; route uses it; tests prove uniform throttled responses and no extra tokens. |
| AUTH-03 | 02-03 | Magic-link consume flow safely rejects invalid, expired, reused, tampered, or wrong-signature tokens. | SATISFIED | Consume route stays signed; controller branches on token states; exception renderer handles invalid signatures; tests cover all listed cases plus alternate host/scheme and HTML-escaped signature. |
| AUTH-04 | 02-03, 02-05 | Expired and used magic-link tokens are cleaned up by a scheduled or documented operational command. | SATISFIED | `auth:prune-magic-links` command is implemented, tested, and documented in README. |
| AUTH-05 | 02-04, 02-05 | Session cookie and remember-device behavior are configured and documented for beta production. | SATISFIED | `auth.magic_link` config, `remember_device` persistence, row-driven remember login, README production posture, and remember tests. |
| AUTH-06 | 02-04, 02-05 | Session-authenticated write routes have an explicit, tested CSRF or token-auth posture. | SATISFIED | CSRF exemptions removed, Axios header wired, write routes require auth, middleware-level CSRF tests prove missing-token failure and valid-token pass-through. |

All AUTH-01 through AUTH-06 are declared in Phase 2 plans and mapped to Phase 2 in `REQUIREMENTS.md`; no orphaned Phase 2 AUTH requirements were found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `tests/Feature/TurnstileVerifierTest.php` | 94 | `local-turnstile-bypass` literal | Info | Expected test fixture proving production-like environments reject the bypass token. |
| `app/Providers/AppServiceProvider.php` / `app/Support/Auth/HttpTurnstileVerifier.php` | Various | `secret_key` config reads | Info | Server-side config reads only; grep found no frontend or Inertia secret exposure. |
| Multiple files | Various | Empty/default state patterns | Info | Reviewed as normal config defaults, test fakes, or React state initialization; no blocking stubs, TODOs, placeholder implementations, sensitive logging, or console-only behavior found. |

### Human Verification Required

### 1. Real Browser Magic-Link Request and Consume Flow

**Test:** In a browser, sign out, open the AppShell sign-in menu, complete Turnstile or local/test bypass, submit an email, retrieve the magic link from mail/log delivery, and consume it.
**Expected:** The user sees uniform request copy, the link signs them in, invalid/reused links show recovery copy, and Today loads authenticated.
**Why human:** Automated feature tests verify the server path, but the full rendered browser, mail/log, redirect, and cookie behavior needs UAT.

### 2. Production Turnstile Credential Smoke Test

**Test:** Configure real production Turnstile site/secret keys and make one valid request, then test disabled/missing secret in a production-like environment.
**Expected:** Valid widget token is accepted server-side and sends mail; missing or disabled production-like config fails closed and sends no mail while preserving uniform copy.
**Why human:** Local tests use `Http::fake()` and deterministic bypasses; real Cloudflare credentials and Siteverify need environment validation.

### 3. Sign-In Dropdown Visual and Accessibility Pass

**Test:** Inspect the sign-in dropdown on mobile and desktop with Turnstile enabled and disabled/local-bypass modes.
**Expected:** Turnstile fits the compact menu, remember-device copy is readable, controls are reachable, and flash statuses use polite live-region behavior without layout overlap.
**Why human:** Static inspection and typecheck cannot prove third-party widget rendering, responsive layout, or assistive-technology behavior.

### Gaps Summary

No code-level gaps blocking Phase 2 goal achievement were found. All roadmap success criteria, plan must-haves, artifacts, key links, data flows, and AUTH-01 through AUTH-06 requirement mappings are satisfied in the codebase.

Status remains `human_needed` because final confidence requires browser and external Cloudflare validation.

---

_Verified: 2026-04-27T15:37:26Z_
_Verifier: Claude (gsd-verifier)_
