# Phase 2: Auth & Session Hardening - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 hardens the existing passwordless magic-link and Laravel session-auth surface for public beta traffic. It covers server-side bot verification, request throttling, invalid/reused/expired token handling, token cleanup, production session/remember-device posture, and explicit protection for session-authenticated write routes. It does not introduce new authentication methods, account deletion, admin support tooling, or full production runbooks beyond the auth/session documentation needed for this phase.

</domain>

<decisions>
## Implementation Decisions

### Request Abuse Gate
- **D-01:** Use Cloudflare Turnstile as the default "equivalent verification" for magic-link request protection because it is low-friction for a friend-share beta and does not require broad authentication UX changes.
- **D-02:** Keep the login form embedded in the existing `AppShell` sign-in menu. Add the minimum Turnstile widget or fallback field needed there rather than creating a new auth page.
- **D-03:** Local and test environments must have a deterministic bypass or fake verifier so auth feature tests and local magic-link logs remain ergonomic.

### Rate Limiting and Uniform Responses
- **D-04:** Add segmented throttling by both IP and normalized email for `/auth/magic-link/request`.
- **D-05:** Preserve the existing uniform success response, "If your email is valid, we sent a sign-in link.", for accepted, throttled, unknown, or verification-failed request attempts where possible.
- **D-06:** Avoid logging private journal content or raw magic-link tokens when recording throttling or verification failures.

### Magic-Link Token Lifecycle
- **D-07:** Keep the existing relative signed URL model and hashed token storage.
- **D-08:** Expand tests around invalid, expired, reused, tampered, wrong-signature, alternate-host/scheme, and HTML-escaped signature cases before changing controller behavior.
- **D-09:** Add an explicit cleanup command for expired and used `magic_login_tokens`; scheduling can be documented if scheduler wiring belongs to later production runbooks.
- **D-10:** Do not defer user creation to token consumption in this phase unless planning finds it is required for abuse control. The phase should stay focused on the roadmap's beta hardening criteria.

### Session and Remember-Device Posture
- **D-11:** Replace the implicit always-remember 45-day login with an explicit beta posture: configurable duration, documented cookie settings, and either a visible "remember this device" choice or a deliberate documented default.
- **D-12:** Preserve Laravel's `web` session guard and database-backed session defaults. Do not introduce stateless JWT auth for this phase.
- **D-13:** Session cookie settings should be documented for beta production, including `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, session lifetime, domain, and the remember-device tradeoff.

### Session-Authenticated Write Route Protection
- **D-14:** Prefer restoring CSRF protection on `/entries/upsert` and `/api/sync/push` while keeping same-origin Axios/Inertia requests working through Laravel's standard CSRF token flow.
- **D-15:** If research finds CSRF restoration is incompatible with a required sync behavior, the alternative must be an explicit token-auth posture with tests and documented CORS assumptions. Silent CSRF exemption is not acceptable for beta.
- **D-16:** Add feature tests that prove unauthenticated requests are rejected and session-authenticated write requests without the expected CSRF/token posture fail.

### User-Facing Failure States
- **D-17:** Keep auth feedback quiet and uniform for account enumeration safety, but make delivery delay, verification failure, expired/invalid link, and sign-out states actionable enough for beta users.
- **D-18:** Copy should stay plain and operational, matching the existing product tone; avoid broad marketing or explanatory onboarding work that belongs to Phase 7.

### the agent's Discretion
- Exact service class boundaries for Turnstile verification, throttling helpers, and cleanup command naming.
- Whether rate-limiter keys live inline in route/controller code or in a dedicated support class, provided tests keep the behavior clear.
- Exact wording for short auth failure/help copy, as long as responses remain uniform where account enumeration matters.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/ROADMAP.md` — Phase 2 goal, dependencies, success criteria, and reviewability expectations.
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-06 and related TEST-01/TEST-02 expectations.
- `.planning/PROJECT.md` — Product constraints, local-first values, and beta-readiness scope.

### Existing Auth and Session Code
- `routes/web.php` — Current magic-link, logout, entry upsert, sync push, and settings route middleware.
- `app/Http/Controllers/Auth/MagicLinkController.php` — Existing request, consume, remember login, and logout behavior.
- `app/Models/MagicLoginToken.php` — Token storage model and casts.
- `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php` — Magic-token schema.
- `resources/js/Components/AppShell.tsx` — Current embedded sign-in menu and magic-link request form.
- `bootstrap/app.php` — Current CSRF exemptions for session-authenticated write endpoints.
- `config/session.php` — Session cookie, lifetime, driver, domain, secure, same-site, and lottery settings.
- `config/auth.php` — Current Laravel `web` session guard and password reset throttle defaults.

### Existing Verification and Known Risks
- `tests/Feature/MagicLinkConsumeTest.php` — Current signed-route, tamper, alternate host, and HTML-escaped signature coverage.
- `.planning/codebase/ARCHITECTURE.md` — Auth data flow, session model, and Inertia route patterns.
- `.planning/codebase/INTEGRATIONS.md` — Current mailer, session, route, and auth integration map.
- `.planning/codebase/CONCERNS.md` — CSRF exemption, magic-token accumulation, remember-duration, and auth test-gap notes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MagicLinkController` already centralizes request, consume, and logout behavior, so Phase 2 can add verification, throttling, and token lifecycle checks without scattering auth behavior.
- `MagicLoginToken` already stores hashed single-use tokens with `expires_at` and `used_at`, which supports cleanup and invalid/reused/expired tests.
- `AppShell` already owns the sign-in menu, so Turnstile UI integration can stay small and local to the existing form.
- `MagicLinkConsumeTest` provides a test base for signed URL behavior and should be expanded before changing consume semantics.

### Established Patterns
- Laravel controllers validate inputs directly and return redirects/Inertia responses or JSON; keep auth hardening consistent with that style unless a helper removes real duplication.
- Feature tests use Pest/PHPUnit with `RefreshDatabase`; prefer focused tests around request, consume, logout, cleanup, throttling, and CSRF posture.
- The app uses Laravel's session guard with database-backed sessions. Auth hardening should build on this, not replace it.
- Public-facing auth responses already avoid account existence leaks by returning uniform copy after magic-link requests.

### Integration Points
- `/auth/magic-link/request` is currently route-throttled with `throttle:5,15` and posts from the `AppShell` menu.
- `/auth/magic-link/{token}` uses `signed:relative`, while `NormalizeHtmlEscapedSignature` is prepended in the web stack.
- `/entries/upsert` and `/api/sync/push` require `auth` middleware but are currently excluded from CSRF validation in `bootstrap/app.php`.
- Magic-link emails use Laravel Mail and the default log mailer locally, so local verification must keep the log-based workflow intact.

</code_context>

<specifics>
## Specific Ideas

- Keep the beta auth experience quiet and utilitarian: a small sign-in form, uniform request response, and clear expired/invalid-link handling.
- Treat Turnstile as a request gate, not a new auth identity concept.
- Make session/remember behavior explicit enough that a friend-share beta can be explained and operated without guessing.

</specifics>

<deferred>
## Deferred Ideas

- New auth methods such as passkeys, OAuth, or password login are out of scope for Phase 2.
- Account deletion and data purge remain out of scope for this beta hardening phase.
- Broad friend-facing onboarding around auth belongs to Phase 7 unless a small failure-state copy change is required by AUTH criteria.
- Full scheduler/process runbook details belong to Phase 4, though Phase 2 should document the cleanup command it introduces.

</deferred>

---

*Phase: 02-auth-session-hardening*
*Context gathered: 2026-04-26*
