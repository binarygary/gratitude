# Remove Turnstile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove Cloudflare Turnstile from magic-link auth while preserving rate limiting, uniform responses, remember-device behavior, CSRF posture, and documentation.

**Architecture:** Magic-link requests use Laravel validation plus the existing named rate limiter as the abuse control. The controller directly creates/sends a magic link after valid email input, while throttle callbacks preserve account-enumeration resistant copy. Frontend sign-in remains embedded in AppShell with email and remember-device fields only.

**Tech Stack:** Laravel, Pest/PHPUnit feature tests, Inertia React, TypeScript, Vite.

---

### Task 1: Request Tests Without Turnstile

**Files:**
- Modify: `tests/Feature/MagicLinkRequestTest.php`

**Step 1: Write the failing test changes**

Remove tests that bind `TurnstileVerifier` or assert failed challenge behavior. Rename the success test to `test_magic_link_request_sends_mail_for_valid_email` and assert a valid email creates one user, one token, sends mail, and returns `MagicLinkController::REQUEST_STATUS`.

**Step 2: Run test to verify it fails**

Run: `php artisan test tests/Feature/MagicLinkRequestTest.php`

Expected: FAIL while the controller still requires `cf-turnstile-response` verification or tests reference deleted behavior.

**Step 3: Commit after green implementation**

Commit message: `test(02): remove turnstile request expectations`

### Task 2: Remove Backend Turnstile Gate

**Files:**
- Modify: `app/Http/Controllers/Auth/MagicLinkController.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Modify: `config/services.php`
- Modify: `.env.example`
- Delete: `app/Support/Auth/TurnstileResult.php`
- Delete: `app/Support/Auth/TurnstileVerifier.php`
- Delete: `app/Support/Auth/HttpTurnstileVerifier.php`
- Delete: `app/Support/Auth/BypassTurnstileVerifier.php`
- Delete: `tests/Feature/TurnstileVerifierTest.php`

**Step 1: Implement minimal backend removal**

Remove the verifier import/injection/call and `cf-turnstile-response` validation from `MagicLinkController::request()`. Remove the service binding and imports from `AppServiceProvider`. Remove `services.turnstile` config and `TURNSTILE_*` env rows. Delete Turnstile support classes and tests.

**Step 2: Verify backend**

Run: `php artisan test tests/Feature/MagicLinkRequestTest.php`

Expected: PASS.

**Step 3: Commit**

Commit message: `refactor(02): remove turnstile backend gate`

### Task 3: Remove Frontend Turnstile UI

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Modify: `resources/js/Components/AppShell.tsx`

**Step 1: Implement frontend removal**

Remove shared `turnstile` props. Remove Turnstile global types, script loader, widget component, hidden `cf-turnstile-response` field, reset state, and unavailable verification copy. Keep the email field, delivery helper text, remember-device checkbox, and successful form reset.

**Step 2: Verify frontend**

Run: `npm run typecheck && npm run build`

Expected: PASS.

**Step 3: Commit**

Commit message: `refactor(02): remove turnstile sign-in ui`

### Task 4: Update Docs And Planning Artifacts

**Files:**
- Modify: `README.md`
- Modify: `.planning/REQUIREMENTS.md`
- Modify: `.planning/ROADMAP.md`
- Modify: `.planning/phases/02-auth-session-hardening/02-HUMAN-UAT.md`
- Modify: `.planning/phases/02-auth-session-hardening/02-VERIFICATION.md`
- Modify as needed: `.planning/phases/02-auth-session-hardening/02-*-SUMMARY.md`

**Step 1: Remove Turnstile references**

Update Phase 2 requirement wording to rate limiting/uniform responses rather than Turnstile. Remove production Turnstile smoke test UAT. Update README auth/session posture to document rate limits, cleanup, remember-device, session cookies, and CSRF without Cloudflare.

**Step 2: Verify no live references remain**

Run: `rg -n "Turnstile|turnstile|cf-turnstile|TURNSTILE|Cloudflare|challenges.cloudflare" app config routes resources tests README.md .env.example .planning/REQUIREMENTS.md .planning/ROADMAP.md .planning/phases/02-auth-session-hardening`

Expected: No matches except historical phase plan/research files if intentionally retained.

**Step 3: Commit**

Commit message: `docs(02): remove turnstile phase posture`

### Task 5: Final Gate

**Files:**
- No direct edits expected.

**Step 1: Run final verification**

Run:

```bash
php artisan test tests/Feature/MagicLinkRequestTest.php tests/Feature/MagicLinkConsumeTest.php tests/Feature/MagicLinkCleanupCommandTest.php tests/Feature/SessionWriteProtectionTest.php
composer test
npm run typecheck
npm run build
XDEBUG_MODE=off vendor/bin/grumphp run
```

Expected: PASS.

**Step 2: Commit any final artifact updates**

Commit message if needed: `test(02): verify turnstile removal`
