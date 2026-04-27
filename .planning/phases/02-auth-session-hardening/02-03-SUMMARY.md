---
phase: 02-auth-session-hardening
plan: 03
subsystem: auth
tags: [laravel, magic-link, signed-routes, artisan, pest]

requires:
  - phase: 02-auth-session-hardening
    provides: Turnstile-gated and throttled magic-link request flow from Plans 01 and 02.
provides:
  - Safe recovery redirects for invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped magic-link consume paths.
  - Explicit reused-link copy distinct from invalid/expired recovery copy.
  - Tested `auth:prune-magic-links` command for deleting used and expired token rows while preserving active unused rows.
affects: [02-auth-session-hardening, magic-link-auth, beta-security, operations-docs]

tech-stack:
  added: []
  patterns: [controller-level magic-link lifecycle checks, Laravel exception rendering for signed URL failures, closure-based Artisan cleanup command]

key-files:
  created:
    - tests/Feature/MagicLinkCleanupCommandTest.php
  modified:
    - app/Http/Controllers/Auth/MagicLinkController.php
    - bootstrap/app.php
    - routes/console.php
    - tests/Feature/MagicLinkConsumeTest.php

key-decisions:
  - "Keep hashed token storage and `signed:relative` routing while moving invalid, expired, and reused token failures from aborts to app-surface recovery redirects."
  - "Render `InvalidSignatureException` through Laravel's exception handler so wrong-signature links do not authenticate and do not expose a raw 403 page."
  - "Ship cleanup as an explicit `auth:prune-magic-links` command without scheduler wiring; Plan 05/operations docs can document usage."

patterns-established:
  - "Magic-link consume failures should redirect to `today.show` with short recovery copy instead of rendering framework error pages."
  - "One-time token lifecycle checks should find by `token_hash` first, then branch on missing, used, expired, and user relation state before login."
  - "Operational cleanup commands should report the exact affected row count and preserve active records in feature coverage."

requirements-completed: [AUTH-03, AUTH-04]

duration: 5min
completed: 2026-04-27
---

# Phase 02 Plan 03: Magic-Link Consume Lifecycle Summary

**Magic-link consume hardening with recovery redirects plus an explicit used/expired token pruning command**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-27T15:09:04Z
- **Completed:** 2026-04-27T15:13:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Expanded `MagicLinkConsumeTest` to cover unknown, expired, reused, tampered-token, wrong-signature, alternate-host/scheme, and HTML-escaped magic-link paths.
- Updated consume handling so invalid/expired failures and reused-token failures redirect to `today.show` with the required recovery copy while leaving successful links single-use.
- Rendered Laravel `InvalidSignatureException` as the same invalid/expired recovery redirect for wrong-signature links.
- Added `auth:prune-magic-links` and feature coverage proving used and expired tokens are deleted while active unused tokens remain.

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden magic-link consume failure handling** - `b8eb9db` (feat)
2. **Task 2: Add magic-link token cleanup command** - `4217a19` (feat)

**Plan metadata:** final docs commit records this summary and state updates.

## Files Created/Modified

- `tests/Feature/MagicLinkConsumeTest.php` - Adds the AUTH-03 consume safety matrix and recovery-copy assertions.
- `app/Http/Controllers/Auth/MagicLinkController.php` - Adds invalid/reused copy constants and explicit missing, reused, expired, and missing-user consume handling before login.
- `bootstrap/app.php` - Renders invalid signed magic-link URLs as recovery redirects instead of raw 403 responses.
- `routes/console.php` - Adds `auth:prune-magic-links` with the used-or-expired token delete query and row-count output.
- `tests/Feature/MagicLinkCleanupCommandTest.php` - Covers pruning used and expired tokens while preserving an active unused token.

## Decisions Made

- Used controller constants for consume recovery copy so controller redirects and exception rendering share the same text.
- Kept the cleanup command as an explicit operator command with no scheduler wiring in this plan.
- Preserved relative signed URLs and hashed token storage; no route contract or token persistence model changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale login event variable after consume flow rewrite**
- **Found during:** Task 1 (Harden magic-link consume failure handling)
- **Issue:** The GREEN implementation removed the local `$user` variable but the `Login` event still referenced it, causing successful magic-link consumes to return 500.
- **Fix:** Emitted the login event with `$record->user`, matching the guard login call.
- **Files modified:** `app/Http/Controllers/Auth/MagicLinkController.php`
- **Verification:** `php artisan test tests/Feature/MagicLinkConsumeTest.php` passed with 8 tests and 36 assertions.
- **Committed in:** `b8eb9db`

**2. [Rule 3 - Blocking] Adjusted expiry comparison for PHPStan**
- **Found during:** Task 1 commit hook
- **Issue:** PHPStan inferred `expires_at` as a string and blocked the commit on `lessThanOrEqualTo()`.
- **Fix:** Compared through `now()->greaterThanOrEqualTo($record->expires_at)`, avoiding a method call on the inferred scalar while preserving the same expiry rule.
- **Files modified:** `app/Http/Controllers/Auth/MagicLinkController.php`
- **Verification:** The normal GrumPHP commit hook passed PHPStan and Pest.
- **Committed in:** `b8eb9db`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were directly required for the planned consume hardening and hook-clean commit. No scope expansion.

## Issues Encountered

- RED runs failed for the expected missing behavior: consume failures returned raw 403 responses before controller/exception changes, and the cleanup command did not exist before Task 2 implementation.
- Mandatory hooks prevent RED-only commits in this repository, so each TDD task was committed atomically after the RED/GREEN cycle and successful verification.

## Verification

- `php artisan test tests/Feature/MagicLinkConsumeTest.php` - 8 tests, 36 assertions passed.
- `php artisan test tests/Feature/MagicLinkCleanupCommandTest.php` - 1 test, 5 assertions passed.
- `php artisan test tests/Feature/MagicLinkConsumeTest.php tests/Feature/MagicLinkCleanupCommandTest.php` - 9 tests, 41 assertions passed.
- `php artisan auth:prune-magic-links` - exited 0 and printed `Pruned 2 magic login tokens.` in the local app.
- `XDEBUG_MODE=off vendor/bin/grumphp run` - npm script, ESLint, Pint, PHPStan, Composer, and Pest all passed.

## Known Stubs

None.

## User Setup Required

None - no new external service configuration required.

## Next Phase Readiness

Plan 04 can build on the safer consume lifecycle and focus on explicit remember-device/session posture plus CSRF-protected session write routes. Plan 05/operations docs should document `php artisan auth:prune-magic-links` usage as planned.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/02-auth-session-hardening/02-03-SUMMARY.md`.
- Cleanup test file exists at `tests/Feature/MagicLinkCleanupCommandTest.php`.
- Task commits `b8eb9db` and `4217a19` exist in git history.

---
*Phase: 02-auth-session-hardening*
*Completed: 2026-04-27*
