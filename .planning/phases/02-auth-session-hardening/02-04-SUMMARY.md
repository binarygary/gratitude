---
phase: 02-auth-session-hardening
plan: 04
subsystem: auth
tags: [laravel, magic-link, csrf, session-auth, axios, pest]

requires:
  - phase: 02-auth-session-hardening
    provides: Turnstile-gated, throttled, and lifecycle-hardened magic-link flow from Plans 01-03.
provides:
  - Explicit magic-link remember-device config and env defaults with opt-in default behavior.
  - Persisted `remember_device` choice on magic-link token rows and consume-time Laravel remember-cookie control.
  - Restored Laravel CSRF protection for session-authenticated entry and sync write routes.
  - Axios `X-CSRF-TOKEN` header wiring from the existing Blade meta token.
  - Feature coverage for unauthenticated write rejection and direct CSRF middleware token checks.
affects: [02-auth-session-hardening, magic-link-auth, session-security, sync-writes]

tech-stack:
  added: []
  patterns: [config-driven magic-link session posture, Laravel CSRF middleware test subclass, Blade meta token to Axios header]

key-files:
  created:
    - database/migrations/2026_04_26_000001_add_remember_device_to_magic_login_tokens_table.php
    - tests/Feature/SessionWriteProtectionTest.php
  modified:
    - .env.example
    - config/auth.php
    - app/Models/MagicLoginToken.php
    - app/Http/Controllers/Auth/MagicLinkController.php
    - bootstrap/app.php
    - resources/js/bootstrap.js
    - tests/Feature/MagicLinkConsumeTest.php

key-decisions:
  - "Keep Laravel's web guard and remember-cookie mechanism, but drive remember behavior from the stored magic-link token row."
  - "Restore standard Laravel CSRF protection for session-backed write routes instead of introducing token auth or Sanctum."
  - "Test CSRF posture at middleware level with Laravel's unit-test bypass disabled, because normal HTTP tests skip CSRF in testing."

patterns-established:
  - "Magic-link request metadata that affects login state should be stored on `magic_login_tokens` and consumed from that row."
  - "Session write-route CSRF posture should be verified both by source exemption checks and direct `PreventRequestForgery` middleware tests."

requirements-completed: [AUTH-05, AUTH-06]

duration: 5min
completed: 2026-04-27
---

# Phase 02 Plan 04: Session and CSRF Posture Summary

**Configurable magic-link remember-device behavior plus restored Laravel CSRF protection for session-backed writes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-27T15:16:49Z
- **Completed:** 2026-04-27T15:22:15Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `auth.magic_link` config and `.env.example` values for magic-link expiry, remember duration, and remember default.
- Added `remember_device` persistence to magic-link token rows and changed consume login to remember only when the token row requests it.
- Removed CSRF exemptions for `/entries/upsert` and `/api/sync/push`.
- Added Axios `X-CSRF-TOKEN` wiring from the existing Blade `<meta name="csrf-token">`.
- Added `SessionWriteProtectionTest` for unauthenticated write rejection, missing-token CSRF failures, valid-token pass-through, and source exemption checks.

## Task Commits

Each task was committed atomically:

1. **Task 1: Persist and consume explicit remember-device choices** - `a7513f7` (feat)
2. **Task 2: Restore CSRF protection and wire Axios token header** - `2ef452a` (fix)
3. **Task 3: Add session write-route protection tests** - `dfc27ad` (test)

**Plan metadata:** final docs commit records this summary and state updates.

## Files Created/Modified

- `.env.example` - Documents magic-link expiry, remember duration, and remember default env keys.
- `config/auth.php` - Adds `auth.magic_link` config with `expires_minutes`, `remember_minutes`, and `remember_default`.
- `database/migrations/2026_04_26_000001_add_remember_device_to_magic_login_tokens_table.php` - Adds the persisted `remember_device` column.
- `app/Models/MagicLoginToken.php` - Makes `remember_device` fillable and casts it to boolean.
- `app/Http/Controllers/Auth/MagicLinkController.php` - Validates/stores remember choice, uses configurable expiry and remember duration, and logs in with row-driven remember behavior.
- `bootstrap/app.php` - Removes write-route CSRF exemptions.
- `resources/js/bootstrap.js` - Adds Axios `X-CSRF-TOKEN` from the Blade meta token while preserving `X-Requested-With`.
- `tests/Feature/MagicLinkConsumeTest.php` - Covers remember-cookie presence/absence and request-time remember choice persistence.
- `tests/Feature/SessionWriteProtectionTest.php` - Covers AUTH-06 route auth and direct CSRF middleware posture.

## Decisions Made

- Kept remember-device opt-in by default through `MAGIC_LINK_REMEMBER_DEFAULT=false`.
- Preserved the existing Laravel session guard and database sessions; no Sanctum, JWT, CORS, or auth-provider changes were introduced.
- Used a direct `PreventRequestForgery` subclass in tests to bypass Laravel's `runningUnitTests()` shortcut and prove real missing-token behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid DNS email fixture in remember-device request test**
- **Found during:** Task 1 (Persist and consume explicit remember-device choices)
- **Issue:** The added request-storage test used `person@example.com`, but the controller validates `email:rfc,dns`, so the test failed before reaching the planned remember-device assertion.
- **Fix:** Switched the fixture to `person@gmail.com`, matching the existing auth request tests.
- **Files modified:** `tests/Feature/MagicLinkConsumeTest.php`
- **Verification:** `php artisan test tests/Feature/MagicLinkConsumeTest.php --filter=remember` passed.
- **Committed in:** `a7513f7`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix affected only test data and kept the planned validation behavior unchanged.

## Issues Encountered

- The first RED run for remember-device behavior failed because default consumes still issued a remember cookie, which was the intended behavior gap.
- Task 3 tests were added after Task 2 restored CSRF posture, so they passed immediately against the already-correct source and now lock that posture for regression coverage.

## Verification

- `php artisan test tests/Feature/MagicLinkConsumeTest.php --filter=remember` - 3 tests, 14 assertions passed.
- `npm run typecheck` - TypeScript completed with exit 0.
- `php artisan test tests/Feature/SessionWriteProtectionTest.php` - 5 tests, 7 assertions passed.
- `php artisan test tests/Feature/EntryUpsertTest.php tests/Feature/SyncPushTest.php` - 17 tests, 90 assertions passed.
- Normal GrumPHP commit hooks passed for all three task commits.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required for this plan. Production values for session cookie settings and auth operations remain Plan 05 documentation scope.

## Next Phase Readiness

Plan 05 can document beta session cookie settings, remember-device tradeoffs, cleanup command usage, and the restored CSRF posture with the implementation now in place.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/02-auth-session-hardening/02-04-SUMMARY.md`.
- Created files exist at `database/migrations/2026_04_26_000001_add_remember_device_to_magic_login_tokens_table.php` and `tests/Feature/SessionWriteProtectionTest.php`.
- Task commits `a7513f7`, `2ef452a`, and `dfc27ad` exist in git history.

---
*Phase: 02-auth-session-hardening*
*Completed: 2026-04-27*
