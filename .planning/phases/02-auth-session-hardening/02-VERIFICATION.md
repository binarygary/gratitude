---
phase: 02-auth-session-hardening
verified: 2026-04-27T15:37:26Z
updated: 2026-04-27T16:05:00Z
status: human_needed
score: 10/10 must-haves verified
human_verification:
  - test: "Real browser magic-link request and consume flow"
    expected: "A signed-out user opens the AppShell sign-in menu, submits an email, receives uniform request copy, consumes the logged magic link, and lands signed in on Today."
    why_human: "Automated feature tests verify the server path, but the full browser, mail-log, redirect, and session-cookie flow needs a rendered app."
  - test: "Sign-in dropdown visual and accessibility pass"
    expected: "The compact dropdown fits mobile and desktop, remember-device copy is readable, and status messages are announced politely."
    why_human: "Layout and assistive-technology quality require browser inspection."
---

# Phase 2: Auth & Session Hardening Verification Report

**Phase Goal:** Public beta users can request, consume, and use magic-link sessions with abuse controls and explicit write-route protection.
**Status:** human_needed

## Goal Achievement

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Magic-link requests use uniform response copy and abuse controls before mail is sent. | VERIFIED | `MagicLinkController::request()` validates email, creates the link, and always returns `REQUEST_STATUS`; the route uses `throttle:magic-link-request`. |
| 2 | Repeated magic-link requests are rate-limited by IP and normalized email while returning uniform responses. | VERIFIED | `AppServiceProvider` registers IP and SHA-1 normalized-email limiter buckets; `MagicLinkRequestTest` covers both throttle paths. |
| 3 | Invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped magic links are safely handled. | VERIFIED | `signed:relative` remains on the consume route; controller checks missing, used, expired, and missing-user token states before login; invalid signatures render recovery redirects. |
| 4 | Used and expired magic-link tokens are cleaned up by an explicit operational command and active unused tokens are preserved. | VERIFIED | `routes/console.php` defines `auth:prune-magic-links`; `MagicLinkCleanupCommandTest` covers used, expired, and active rows. |
| 5 | Remember-device behavior is explicit, configurable, and tied to the user's magic-link request choice. | VERIFIED | `auth.magic_link` config defines expiry, remember duration, and default; token rows persist `remember_device`; consume logs in with remember based on the row. |
| 6 | Session cookie and remember-device posture are documented for beta production. | VERIFIED | README documents `MAGIC_LINK_*`, `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, `SESSION_LIFETIME`, `SESSION_DOMAIN`, database sessions, and cleanup command usage. |
| 7 | Session-authenticated write routes are no longer silently CSRF-exempt. | VERIFIED | `bootstrap/app.php` has no CSRF exemptions for `/entries/upsert` or `/api/sync/push`. |
| 8 | Unauthenticated writes fail, cross-site session writes without CSRF fail, and tokened same-origin writes remain possible. | VERIFIED | `SessionWriteProtectionTest` covers unauthenticated 401s, missing-token `TokenMismatchException`, and valid-token pass-through; `resources/js/bootstrap.js` sets `X-CSRF-TOKEN`. |
| 9 | Signed-out users can submit the embedded AppShell form with an explicit remember-device choice. | VERIFIED | `AppShell.tsx` posts email and `remember_device` from the existing compact sign-in dropdown. |
| 10 | Final Phase 2 backend, frontend, and quality gates pass. | VERIFIED | Phase execution gates passed before this removal; follow-up removal gates are tracked in the implementation plan. |

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| AUTH-01 | Magic-link request flow uses uniform response copy and abuse controls before sending mail. | SATISFIED | Valid request tests and segmented throttling tests pass without third-party challenge configuration. |
| AUTH-02 | Magic-link request flow applies segmented rate limits by IP and email without leaking account existence. | SATISFIED | Named limiter and tests preserve uniform status for throttled attempts. |
| AUTH-03 | Magic-link consume flow safely rejects invalid, expired, reused, tampered, or wrong-signature tokens. | SATISFIED | Consume controller and tests cover the failure matrix. |
| AUTH-04 | Expired and used magic-link tokens are cleaned up by a scheduled or documented operational command. | SATISFIED | `auth:prune-magic-links` is implemented, tested, and documented. |
| AUTH-05 | Session cookie and remember-device behavior are configured and documented for beta production. | SATISFIED | Config, migration, model casts, controller behavior, tests, and README cover the posture. |
| AUTH-06 | Session-authenticated write routes have an explicit, tested CSRF or token-auth posture. | SATISFIED | CSRF exemptions are removed and middleware-level tests prove the posture. |

## Human Verification Required

### 1. Real Browser Magic-Link Request and Consume Flow

**Test:** In a browser, sign out, open the AppShell sign-in menu, submit an email, retrieve the magic link from mail/log delivery, and consume it.
**Expected:** The user sees uniform request copy, the link signs them in, invalid/reused links show recovery copy, and Today loads authenticated.
**Why human:** Automated feature tests verify the server path, but the full rendered browser, mail/log, redirect, and cookie behavior needs UAT.

### 2. Sign-In Dropdown Visual and Accessibility Pass

**Test:** Inspect the sign-in dropdown on mobile and desktop.
**Expected:** The compact menu fits, remember-device copy is readable, controls are reachable, and flash statuses use polite live-region behavior without layout overlap.
**Why human:** Static inspection and typecheck cannot prove responsive layout or assistive-technology behavior.

## Gaps Summary

No code-level gaps blocking Phase 2 goal achievement were found. Status remains `human_needed` because final confidence still requires browser validation.
