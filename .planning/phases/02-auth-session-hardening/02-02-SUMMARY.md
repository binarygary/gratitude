---
phase: 02-auth-session-hardening
plan: 02
subsystem: auth
tags: [laravel, magic-link, cloudflare-turnstile, rate-limiting, pest]

requires:
  - phase: 02-auth-session-hardening
    provides: Turnstile verifier seam, local/test bypass, and fail-closed production binding from Plan 01.
provides:
  - Turnstile-gated magic-link request side effects before user, token, or mail creation.
  - Uniform magic-link request status copy for accepted, verification-failed, and throttled attempts.
  - Named magic-link request throttle segmented by IP and normalized email.
  - Feature coverage for request gating, side effects, error-code non-disclosure, and throttling.
affects: [02-auth-session-hardening, magic-link-auth, beta-security]

tech-stack:
  added: []
  patterns: [controller-level verifier gate, Laravel named multi-limit rate limiter, uniform public auth responses]

key-files:
  created:
    - tests/Feature/MagicLinkRequestTest.php
  modified:
    - app/Http/Controllers/Auth/MagicLinkController.php
    - app/Providers/AppServiceProvider.php
    - routes/web.php

key-decisions:
  - "Run Turnstile verification before creating users, tokens, or mail in MagicLinkController."
  - "Use a named Laravel rate limiter with separate IP and normalized-email buckets for magic-link requests."
  - "Return the same flash status for accepted, failed-verification, and throttled request attempts."

patterns-established:
  - "Magic-link request outcomes should use MagicLinkController::REQUEST_STATUS anywhere account-enumeration safety matters."
  - "Magic-link abuse controls live in the request route middleware and AppServiceProvider named limiter rather than custom persistence."

requirements-completed: [AUTH-01, AUTH-02]

duration: 4min
completed: 2026-04-27
---

# Phase 02 Plan 02: Magic-Link Request Abuse Gate Summary

**Turnstile-gated magic-link requests with IP and normalized-email throttles that keep public responses uniform**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-27T14:59:38Z
- **Completed:** 2026-04-27T15:04:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added request feature tests proving mail/token/user side effects happen only after successful Turnstile verification.
- Updated `MagicLinkController::request()` to verify `cf-turnstile-response` before user creation, token creation, or mail send.
- Replaced the generic request throttle with `throttle:magic-link-request`.
- Registered IP and normalized-email rate-limit buckets with uniform throttled redirect status copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate magic-link request side effects with Turnstile** - `808ee3d` (feat)
2. **Task 2: Add segmented IP and email throttling with uniform throttled responses** - `23e7f31` (feat)

**Plan metadata:** final docs commit records this summary and state updates.

## Files Created/Modified

- `tests/Feature/MagicLinkRequestTest.php` - Covers Turnstile success/failure, no error-code exposure, IP throttling, normalized-email throttling, and token side effects.
- `app/Http/Controllers/Auth/MagicLinkController.php` - Adds `REQUEST_STATUS`, accepts the Turnstile verifier, verifies before side effects, and reuses the uniform status constant.
- `app/Providers/AppServiceProvider.php` - Registers `RateLimiter::for('magic-link-request')` with IP and normalized-email buckets.
- `routes/web.php` - Applies `throttle:magic-link-request` directly to the magic-link request route.

## Decisions Made

- Kept the verifier result private to the controller flow; Turnstile error codes are not logged or exposed in response/session data.
- Hashed the normalized email limiter key with SHA-1 per plan contract so raw email values are not used directly as rate-limit keys.
- Used Laravel's named limiter response callback to preserve the uniform flash status for throttled attempts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale generated route cache**
- **Found during:** Task 2 (Add segmented IP and email throttling with uniform throttled responses)
- **Issue:** `php artisan route:list -v` still reported `throttle:5,15` after `routes/web.php` was updated because an untracked generated route cache file was present under `bootstrap/cache`.
- **Fix:** Ran `php artisan route:clear` so tests and route inspection loaded the current source route definitions.
- **Files modified:** None tracked; generated cache only.
- **Verification:** `php artisan route:list --name=auth.magic.request -v` showed `throttle:magic-link-request`, and `php artisan test tests/Feature/MagicLinkRequestTest.php` passed.
- **Committed in:** Runtime fix only; source changes committed in `23e7f31`.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix affected only generated local cache state. Source implementation stayed within the planned scope.

## Issues Encountered

- TDD RED runs failed for the expected missing behaviors: the verifier was not called before implementation, failed verification still created rows before implementation, the sixth IP attempt lacked the uniform status before named throttling, and the fourth normalized-email attempt still created a token before the email bucket existed.

## Verification

- `php artisan test tests/Feature/MagicLinkRequestTest.php` - 5 tests, 28 assertions passed.
- `XDEBUG_MODE=off vendor/bin/grumphp run` - npm script, ESLint, Pint, PHPStan, Composer, and Pest all passed.
- Task acceptance `rg` checks confirmed the required route middleware, rate limiter contract, tests, request gate, and absence of sensitive controller logging/error-code patterns.

## Known Stubs

None.

## User Setup Required

None - no new external service configuration beyond Plan 01 Turnstile credentials.

## Next Phase Readiness

Plan 03 can build on the hardened request path and focus on magic-link consume lifecycle behavior without changing the request abuse gate.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/02-auth-session-hardening/02-02-SUMMARY.md`.
- Task commits `808ee3d` and `23e7f31` exist in git history.
- No tracked generated files remain after clearing route cache.

---
*Phase: 02-auth-session-hardening*
*Completed: 2026-04-27*
