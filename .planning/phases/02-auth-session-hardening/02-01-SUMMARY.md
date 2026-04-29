---
phase: 02-auth-session-hardening
plan: 01
subsystem: auth
tags: [laravel, cloudflare-turnstile, http-client, pest]

requires:
  - phase: 01-sync-contract-local-state
    provides: Stable local-first sync baseline before public beta auth hardening.
provides:
  - Turnstile service configuration with explicit production defaults and local/test bypass token scoping.
  - Fakeable Turnstile verifier contract with HTTP Siteverify and deterministic bypass implementations.
  - Container binding that fails closed outside local/testing when Turnstile is disabled or misconfigured.
  - Feature tests covering bypass, HTTP payload, missing secret, and non-local fail-closed behavior.
affects: [02-auth-session-hardening, magic-link-auth, beta-security]

tech-stack:
  added: []
  patterns: [Laravel service binding, fakeable auth verifier seam, Http::fake integration tests]

key-files:
  created:
    - app/Support/Auth/TurnstileResult.php
    - app/Support/Auth/TurnstileVerifier.php
    - app/Support/Auth/HttpTurnstileVerifier.php
    - app/Support/Auth/BypassTurnstileVerifier.php
    - tests/Feature/TurnstileVerifierTest.php
  modified:
    - .env.example
    - config/services.php
    - app/Providers/AppServiceProvider.php

key-decisions:
  - "Use Laravel's built-in HTTP client for Cloudflare Siteverify instead of adding a package."
  - "Keep the deterministic bypass token available only when the app environment is local or testing."
  - "Bind a fail-closed verifier for non-local disabled or missing-secret states so later auth gates send no mail."

patterns-established:
  - "Turnstile verification is resolved through App\\Support\\Auth\\TurnstileVerifier so request code can be tested without Cloudflare credentials."
  - "External auth verification failures return structured TurnstileResult values and do not log tokens, IPs, emails, or provider error details."

requirements-completed: [AUTH-01]

duration: 5min
completed: 2026-04-27
---

# Phase 02 Plan 01: Turnstile Verifier Foundation Summary

**Cloudflare Turnstile verifier seam using Laravel HTTP client, local/test bypass, and fail-closed container binding**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-27T14:50:20Z
- **Completed:** 2026-04-27T14:55:28Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added Turnstile env/config keys with production enabled-by-default behavior and local/testing-only bypass token scoping.
- Created a fakeable verifier contract, result value, HTTP Siteverify implementation, and deterministic local/test bypass.
- Bound the verifier in Laravel's container with fail-closed behavior for non-local disabled or missing-secret states.
- Added feature tests proving bypass, Siteverify payload, missing secret, and fail-closed behavior without real Cloudflare calls.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Turnstile config and verifier classes** - `4ac9618` (feat)
2. **Task 2: Bind and test the verifier seam** - `c438473` (feat)

**Plan metadata:** final docs commit records this summary and state updates.

## Files Created/Modified

- `.env.example` - Documents Turnstile enablement, site key, secret key, verify URL, timeout, and local/testing bypass env values.
- `config/services.php` - Adds `services.turnstile` config and scopes `bypass_token` to local/testing environments.
- `app/Support/Auth/TurnstileResult.php` - Immutable verifier result value.
- `app/Support/Auth/TurnstileVerifier.php` - Contract for auth request gating.
- `app/Support/Auth/HttpTurnstileVerifier.php` - Laravel HTTP client Siteverify implementation with no sensitive logging.
- `app/Support/Auth/BypassTurnstileVerifier.php` - Deterministic local/test verifier for the configured bypass token.
- `app/Providers/AppServiceProvider.php` - Binds the verifier seam to bypass, HTTP, or fail-closed implementations.
- `tests/Feature/TurnstileVerifierTest.php` - Covers verifier and binding behavior with `Http::fake()`.

## Decisions Made

- Used the existing Laravel HTTP client rather than adding a Composer package.
- Returned fail-closed `TurnstileResult` values for misconfigured production-like states instead of throwing or calling the network.
- Kept Cloudflare error details inside verifier results only; no logging was added in the verifier surface.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TDD RED runs failed for the expected reasons: first missing verifier classes, then missing container binding.
- Commit hooks ran successfully for both task commits under the normal no-`--no-verify` workflow.

## Verification

- `php artisan test tests/Feature/TurnstileVerifierTest.php` - 6 tests, 19 assertions passed.
- `XDEBUG_MODE=off vendor/bin/grumphp run` - npm script, ESLint, Pint, PHPStan, Composer, and Pest all passed.
- `rg "Log::|logger\\(|info\\(|error\\(" app/Support/Auth` - no matches.

## User Setup Required

Production enablement requires real Cloudflare Turnstile credentials in the environment:

- `TURNSTILE_ENABLED=true`
- `TURNSTILE_SITE_KEY=<Cloudflare widget site key>`
- `TURNSTILE_SECRET_KEY=<Cloudflare widget secret key>`
- Do not rely on `TURNSTILE_BYPASS_TOKEN` outside local/testing; config ignores it in non-local/test environments.

## Next Phase Readiness

Plan 02 can inject `TurnstileVerifier::class` into the magic-link request flow and block mail/token side effects unless verification succeeds.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/02-auth-session-hardening/02-01-SUMMARY.md`.
- Created verifier files exist under `app/Support/Auth/`.
- Task commits `4ac9618` and `c438473` exist in git history.

---
*Phase: 02-auth-session-hardening*
*Completed: 2026-04-27*
