---
phase: 02
slug: auth-session-hardening
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
---

# Phase 02 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Pest/PHPUnit feature tests, Vitest frontend unit tests where UI behavior is isolated |
| **Config file** | `phpunit.xml`, `vitest.config.ts`, `grumphp.yml` |
| **Quick run command** | `php artisan test tests/Feature/MagicLinkConsumeTest.php tests/Feature/SyncPushTest.php` |
| **Full suite command** | `XDEBUG_MODE=off vendor/bin/grumphp run` |
| **Estimated runtime** | ~5 seconds locally for GrumPHP gate |

---

## Sampling Rate

- **After every task commit:** Run the plan-specific targeted Pest/Vitest command.
- **After every plan wave:** Run `XDEBUG_MODE=off vendor/bin/grumphp run`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 30 seconds for targeted tests; 90 seconds for full gate.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | T-02-01 | Magic-link mail is not sent until Turnstile Siteverify succeeds or the configured local/test bypass is active. | feature | `php artisan test tests/Feature/MagicLinkRequestTest.php` | W0 if missing | pending |
| 02-01-02 | 01 | 1 | AUTH-02 | T-02-02 | IP and normalized-email throttles return uniform request responses without account-existence leakage. | feature | `php artisan test tests/Feature/MagicLinkRequestTest.php` | W0 if missing | pending |
| 02-02-01 | 02 | 1 | AUTH-03 | T-02-03 | Invalid, expired, reused, tampered, wrong-signature, alternate-host, and HTML-escaped magic links are rejected safely. | feature | `php artisan test tests/Feature/MagicLinkConsumeTest.php` | exists | pending |
| 02-02-02 | 02 | 1 | AUTH-04 | T-02-04 | Used or expired magic-link tokens are pruned by an explicit command without deleting valid unused tokens. | feature/console | `php artisan test tests/Feature/MagicLinkCleanupCommandTest.php` | W0 if missing | pending |
| 02-03-01 | 03 | 1 | AUTH-05 | T-02-05 | Session cookie and remember-device defaults are explicit in config/docs and covered by auth tests. | feature/docs | `php artisan test tests/Feature/MagicLinkConsumeTest.php` | exists | pending |
| 02-03-02 | 03 | 1 | AUTH-06 | T-02-06 | Session-authenticated write routes reject missing CSRF/token posture and still accept valid same-origin writes. | feature | `php artisan test tests/Feature/SessionWriteProtectionTest.php` | W0 if missing | pending |
| 02-04-01 | 04 | 2 | AUTH-01, AUTH-05 | T-02-01 / T-02-05 | AppShell sign-in UI submits the Turnstile token and exposes the configured remember-device choice or documented default. | frontend/build | `npm run typecheck && npm run build` | exists | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/Feature/MagicLinkRequestTest.php` - stubs for AUTH-01 and AUTH-02.
- [ ] `tests/Feature/MagicLinkCleanupCommandTest.php` - stubs for AUTH-04.
- [ ] `tests/Feature/SessionWriteProtectionTest.php` - stubs for AUTH-06, including the CSRF testing environment caveat from research.
- [ ] No new test framework install is expected.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production Turnstile key validity | AUTH-01 | Real Cloudflare keys cannot be validated in local CI without secrets. | In beta environment, submit the sign-in form with valid keys and confirm the request returns the uniform success response and logs/sends a magic link. |
| Production cookie security values | AUTH-05 | Final domain/HTTPS values depend on deployment environment. | Confirm `SESSION_SECURE_COOKIE=true`, expected `SESSION_SAME_SITE`, session lifetime, and domain values in the beta environment before launch. |

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verification.
- [x] Wave 0 covers all missing test references.
- [x] No watch-mode flags.
- [x] Feedback latency < 90 seconds for full local gate.
- [x] `nyquist_compliant: true` set in frontmatter after plans are verified.

**Approval:** approved after plan verification on 2026-04-26
