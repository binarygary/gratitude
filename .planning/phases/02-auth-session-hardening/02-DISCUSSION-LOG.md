# Phase 2: Auth & Session Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 02-auth-session-hardening
**Mode:** Non-interactive fallback using recommended defaults
**Areas discussed:** Request Abuse Gate, Rate Limiting and Uniform Responses, Magic-Link Token Lifecycle, Session and Remember-Device Posture, Session-Authenticated Write Route Protection, User-Facing Failure States

---

## Request Abuse Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Turnstile | Low-friction bot gate that fits the beta and the roadmap's explicit Turnstile/equivalent wording. | yes |
| Generic verifier abstraction only | More flexible, but risks deferring the concrete beta gate. | |
| No visible challenge | Less UI work, but does not satisfy AUTH-01. | |

**Selected default:** Cloudflare Turnstile.
**Notes:** Keep local/test bypass deterministic and add only the minimum widget/form integration needed in `AppShell`.

---

## Rate Limiting and Uniform Responses

| Option | Description | Selected |
|--------|-------------|----------|
| Segment by IP and normalized email | Matches AUTH-02 directly and limits both broad and targeted abuse. | yes |
| IP-only throttling | Already close to current route throttle, but weak against repeated targeted email requests. | |
| Email-only throttling | Helps targeted abuse, but weak against distributed account enumeration attempts from one client. | |

**Selected default:** Segment by IP and normalized email.
**Notes:** Preserve the existing uniform magic-link request response and avoid sensitive logging.

---

## Magic-Link Token Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Keep signed URL plus hashed token and add tests/cleanup | Builds on the current implementation while closing lifecycle gaps. | yes |
| Replace token storage model | Larger change and not required by the phase boundary. | |
| Delay cleanup to Phase 4 | Leaves AUTH-04 incomplete. | |

**Selected default:** Keep the current signed/hash model and add lifecycle tests plus cleanup command.
**Notes:** Deferring user creation to token consume is not selected unless planning finds it necessary for abuse control.

---

## Session and Remember-Device Posture

| Option | Description | Selected |
|--------|-------------|----------|
| Documented configurable Laravel session posture | Preserves the existing web guard and makes beta cookie/remember behavior explicit. | yes |
| Move to stateless JWT | Adds unnecessary complexity and changes the auth model. | |
| Keep implicit 45-day remember behavior | Fastest, but keeps a documented security concern unresolved. | |

**Selected default:** Documented configurable Laravel session posture.
**Notes:** Prefer a visible remember-device choice or deliberate documented default over implicit always-remember.

---

## Session-Authenticated Write Route Protection

| Option | Description | Selected |
|--------|-------------|----------|
| Restore CSRF protection on session-backed write routes | Directly addresses AUTH-06 and the current `bootstrap/app.php` concern. | yes |
| Keep CSRF exemptions and document them | Not acceptable for beta unless paired with an explicit alternative auth posture. | |
| Move writes to token auth | Acceptable fallback only if CSRF restoration conflicts with required sync behavior. | |

**Selected default:** Restore CSRF protection if feasible.
**Notes:** Tests must prove the chosen CSRF/token posture, including failure without the required protection.

---

## User-Facing Failure States

| Option | Description | Selected |
|--------|-------------|----------|
| Quiet operational copy | Keeps account enumeration protection while helping beta users recover from auth failures. | yes |
| Detailed account-specific messages | Easier for users but leaks account existence. | |
| Defer all copy to Phase 7 | Leaves magic-link failure states underexplained for Phase 2 testing. | |

**Selected default:** Quiet operational copy.
**Notes:** Keep copy scoped to auth hardening and leave broad onboarding to Phase 7.

---

## the agent's Discretion

- Exact support/helper class boundaries.
- Exact command name for token cleanup.
- Exact short-form auth copy, within the uniform-response and beta-tone constraints.

## Deferred Ideas

- Passkeys, OAuth, password login, account deletion, and broad onboarding were kept out of Phase 2 scope.
