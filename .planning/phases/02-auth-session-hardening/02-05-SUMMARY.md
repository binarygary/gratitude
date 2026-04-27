---
phase: 02-auth-session-hardening
plan: 05
subsystem: auth
tags: [laravel, inertia, react, cloudflare-turnstile, session-security, docs]

requires:
  - phase: 02-auth-session-hardening
    provides: Turnstile verifier, request throttling, magic-link lifecycle hardening, remember-device persistence, and CSRF-protected session writes from Plans 01-04.
provides:
  - Public Inertia props for Turnstile widget configuration and magic-link remember-device defaults.
  - Embedded AppShell sign-in controls that submit Turnstile tokens or local/test bypass values plus remember-device choice.
  - README beta auth/session posture covering Turnstile, session cookies, cleanup, and CSRF write-route operations.
  - Final Phase 2 targeted, full PHP, frontend, build, and GrumPHP gate evidence.
affects: [02-auth-session-hardening, magic-link-auth, beta-security, operations-docs]

tech-stack:
  added: []
  patterns: [Inertia shared public auth props, local AppShell Turnstile script loader, README beta security posture]

key-files:
  created: []
  modified:
    - app/Http/Middleware/HandleInertiaRequests.php
    - resources/js/Components/AppShell.tsx
    - README.md

key-decisions:
  - "Share only public Turnstile configuration through Inertia; the bypass token remains limited to local/testing and the secret key is never shared."
  - "Keep Turnstile and remember-device controls inside the existing AppShell sign-in dropdown rather than adding a new auth page."
  - "Document beta production posture in README while leaving scheduler wiring to production operations."

patterns-established:
  - "Embedded auth forms should receive server-required auth fields from Inertia props and submit them through the existing AppShell menu."
  - "Auth/session operator docs should name exact env keys and operational commands without expanding Phase 2 into new auth methods."

requirements-completed: [AUTH-01, AUTH-04, AUTH-05, AUTH-06]

duration: 5 min
completed: 2026-04-27
---

# Phase 02 Plan 05: Auth Surface and Documentation Summary

**Embedded Turnstile sign-in controls with remember-device choice plus beta auth/session operator documentation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-27T15:25:45Z
- **Completed:** 2026-04-27T15:31:07Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added top-level Inertia `turnstile` props and `auth.magic_link.remember_default` without changing the existing `auth.user` shape.
- Updated the existing AppShell sign-in dropdown to load/render compact Cloudflare Turnstile, submit `cf-turnstile-response`, and expose a visible `Remember this device` checkbox.
- Documented beta Turnstile, magic-link, session cookie, cleanup command, and CSRF write-route posture in README.
- Ran the full final Phase 2 gate successfully.

## Task Commits

Each task was committed atomically:

1. **Task 1: Share Turnstile and remember-device props to the frontend** - `8e75887` (feat)
2. **Task 2: Add embedded Turnstile widget and remember-device control** - `bf83afc` (feat)
3. **Task 3: Document auth/session posture and run final gate** - `e5582d5` (docs)

**Plan metadata:** final docs commit records this summary and state updates.

## Files Created/Modified

- `app/Http/Middleware/HandleInertiaRequests.php` - Shares public Turnstile settings and magic-link remember defaults through Inertia, with bypass token sharing limited to local/testing.
- `resources/js/Components/AppShell.tsx` - Keeps the existing sign-in dropdown while adding the Turnstile script loader/widget, fallback verifier copy, delivery helper text, hidden verifier response value, and remember-device checkbox.
- `README.md` - Documents exact beta auth/session env keys, production recommendations, fail-closed Turnstile behavior, cleanup command, and CSRF-protected session write routes.

## Decisions Made

- Kept the Cloudflare widget loader local to `AppShell.tsx` to avoid a new dependency for one embedded auth surface.
- Reset the sign-in form to the shared remember default and local/test bypass state after successful submissions.
- Documented `auth:prune-magic-links` usage without adding scheduler wiring in this plan, matching the Phase 2 boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Matched README fail-closed acceptance wording**
- **Found during:** Task 3 (Document auth/session posture and run final gate)
- **Issue:** The README initially said magic-link requests "fail closed", but the plan acceptance check required the exact phrase `fails closed`.
- **Fix:** Updated the sentence to include `fails closed` while preserving the same operational meaning.
- **Files modified:** `README.md`
- **Verification:** `rg "Auth and session beta posture|TURNSTILE_ENABLED=true|TURNSTILE_SECRET_KEY|TURNSTILE_BYPASS_TOKEN.*local/testing|fails closed|SESSION_SECURE_COOKIE=true|SESSION_SAME_SITE=lax|SESSION_DOMAIN=null|auth:prune-magic-links|/entries/upsert|/api/sync/push|X-CSRF-TOKEN" README.md` passed.
- **Committed in:** `e5582d5`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Documentation wording was adjusted to satisfy the planned acceptance contract. No scope expansion.

## Issues Encountered

- README wording required one acceptance-check iteration for the exact `fails closed` phrase.
- No authentication gates or external service blockers occurred.

## Verification

- `rg "turnstile|site_key|bypass_token|remember_default" app/Http/Middleware/HandleInertiaRequests.php resources/js/Components/AppShell.tsx` - found required shared props and TypeScript usage.
- `rg "environment\\(\\['local', 'testing'\\]\\)|environment\\('local'\\)|environment\\('testing'\\)|bypass_token.*null" app/Http/Middleware/HandleInertiaRequests.php` - confirmed bypass token scoping.
- `rg "TURNSTILE_SECRET_KEY|secret_key" app/Http/Middleware/HandleInertiaRequests.php resources/js/Components/AppShell.tsx` - no matches.
- `rg "challenges.cloudflare.com/turnstile/v0/api.js\\?render=explicit|cf-turnstile-response|Remember this device|Stay signed in on this device for the configured beta session window|The link may take a minute to arrive and expires in 30 minutes" resources/js/Components/AppShell.tsx` - found required widget, fields, and copy.
- `rg "local-turnstile-bypass" resources/js/Components/AppShell.tsx` - no matches.
- `rg "w-72|p-4|aria-expanded|aria-controls=\\\"sign-in-menu\\\"|role=\\\"status\\\"|aria-live=\\\"polite\\\"" resources/js/Components/AppShell.tsx` - found preserved UI/accessibility contract markers.
- `rg "Auth and session beta posture|TURNSTILE_ENABLED=true|TURNSTILE_SECRET_KEY|TURNSTILE_BYPASS_TOKEN.*local/testing|fails closed|SESSION_SECURE_COOKIE=true|SESSION_SAME_SITE=lax|SESSION_DOMAIN=null|auth:prune-magic-links|/entries/upsert|/api/sync/push|X-CSRF-TOKEN" README.md` - found required docs.
- `rg "passkey|OAuth|password login|JWT|Sanctum|account deletion|admin tooling" README.md` - no matches.
- `php artisan test tests/Feature/TurnstileVerifierTest.php tests/Feature/MagicLinkRequestTest.php tests/Feature/MagicLinkConsumeTest.php tests/Feature/MagicLinkCleanupCommandTest.php tests/Feature/SessionWriteProtectionTest.php` - 28 tests, 109 assertions passed.
- `composer test` - 64 tests, 263 assertions passed.
- `npm run typecheck` - TypeScript completed with exit 0.
- `npm run build` - Vite built successfully.
- `XDEBUG_MODE=off vendor/bin/grumphp run` - npm script, ESLint, Pint, PHPStan, Composer, and Pest all passed.

## Known Stubs

None.

## User Setup Required

No separate USER-SETUP.md was generated. Beta production still requires real Cloudflare Turnstile credentials and session env values as documented in `README.md`.

## Next Phase Readiness

Phase 2 is complete. The app now has server-side auth hardening, embedded Turnstile and remember-device UI, documented auth/session beta posture, cleanup command documentation, and a green final quality gate.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/02-auth-session-hardening/02-05-SUMMARY.md`.
- Modified files exist at `app/Http/Middleware/HandleInertiaRequests.php`, `resources/js/Components/AppShell.tsx`, and `README.md`.
- Task commits `8e75887`, `bf83afc`, and `e5582d5` exist in git history.

---
*Phase: 02-auth-session-hardening*
*Completed: 2026-04-27*
