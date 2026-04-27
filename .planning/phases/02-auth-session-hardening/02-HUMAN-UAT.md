---
status: partial
phase: 02-auth-session-hardening
source: [02-VERIFICATION.md]
started: 2026-04-27T15:37:26Z
updated: 2026-04-27T15:37:26Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Real browser magic-link request and consume flow
expected: A signed-out user opens the AppShell sign-in menu, completes Turnstile or local/test bypass, submits an email, receives uniform request copy, consumes the logged magic link, and lands signed in on Today.
result: [pending]

### 2. Production Turnstile credential smoke test
expected: With production Turnstile keys configured, the widget returns a token accepted by server-side Siteverify; missing or disabled production config still sends no mail and shows uniform copy.
result: [pending]

### 3. Sign-in dropdown visual and accessibility pass
expected: The compact dropdown fits mobile and desktop, Turnstile renders without clipping, remember-device copy is readable, and status messages are announced politely.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
