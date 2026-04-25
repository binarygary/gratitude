# Pitfalls Research

**Domain:** Beta readiness for a Laravel/Inertia local-first gratitude journal
**Researched:** 2026-04-25
**Confidence:** HIGH for repo-specific sync/auth/testing risks; MEDIUM for provider-specific notification and observability choices until hosting/email providers are selected.

## Critical Pitfalls

### Pitfall 1: Treating local-first sync as "just a push endpoint"

**What goes wrong:**
Entries appear saved locally, but authenticated backup state diverges from server state. Rejected records retry forever, server-winning conflicts get marked as synced without replacing local content, fresh browsers cannot restore history, and users cannot tell whether an entry is backed up.

**Why it happens:**
The app already has a functional happy path, so beta work can accidentally add UI polish and notifications around a sync model that still depends on client wall-clock timestamps and one-way push behavior.

**How to avoid:**
Make sync reliability a dedicated phase before friend-share polish. Return canonical server payloads for `upserted`, `skipped`, and conflict outcomes; add a server revision or monotonic version instead of trusting client `updated_at`; persist rejected state with a user-visible repair path; chunk push requests; and add a paginated pull/restore path before presenting sync as backup across devices.

**Warning signs:**
`pushUnsyncedEntries().catch(() => null)` remains the dominant error path; `skipped` responses only call `markEntriesSynced`; there is no "pending / backed up / needs attention" state; a fresh browser after login does not restore prior entries; tests only assert backend response status, not IndexedDB state transitions.

**Phase to address:**
Sync reliability and restore phase, before reliability UX and before friend-share onboarding claims mention cross-device backup.

---

### Pitfall 2: Shipping notifications without a delivery ledger

**What goes wrong:**
Users opt into reminders but the product cannot prove what should have been sent, what was queued, what failed, or why a reminder was skipped. Support ends up debugging from anecdote, and failed jobs silently become missed habit-forming moments.

**Why it happens:**
Notifications feel like a UI preference plus a queued mail/web push job. Laravel makes notification classes easy to create, but queued notifications require a real worker, failed-job handling, retries, and channel-specific observability. Browser notifications also have secure-context and browser-support constraints.

**How to avoid:**
Build a minimal notification event/delivery table before multiple channels. Record notification intent, channel, scheduled-for time, sent/failed/skipped status, provider response metadata, and user preference snapshot. Start with one delivery channel, queue it with explicit tries/backoff/timeout, verify failed-job storage, and expose delivery status in admin. Treat web notifications/background sync as progressive enhancement, not the MVP guarantee.

**Warning signs:**
Reminder settings exist before a delivery status model; queue worker health is not in the beta checklist; failed notification jobs are not visible in admin; notification tests only fake `Notification::send` and do not assert persisted delivery state; product copy says "we will remind you" without channel-specific caveats.

**Phase to address:**
Notifications foundation phase, with verification carried into observability baseline and admin MVP.

---

### Pitfall 3: Adding Turnstile but leaving the auth abuse model unchanged

**What goes wrong:**
Magic-link requests can still create user rows and token rows at scale, enumerate or probe emails through behavior differences, and fill queues/mail provider quotas. A client-side challenge gives a false sense of protection if tokens are not validated server-side on every request.

**Why it happens:**
Bot protection is often scoped as "add widget to the form" instead of "harden the full request lifecycle." This repo currently creates accounts on request, keeps expired/used magic tokens without a cleanup path, and uses a long remember duration after magic-link consume.

**How to avoid:**
Validate Turnstile tokens server-side for every magic-link request, including hostname/action checks where configured. Keep rate limits keyed by IP and normalized email, avoid response differences that reveal account state, defer durable user creation until token consume or track pending requests separately, add cleanup for expired/used tokens, and make remember duration/configuration explicit.

**Warning signs:**
Turnstile secret appears in frontend code; server accepts requests when Siteverify is unavailable without a deliberate fail-open policy; tests assert the widget renders but not backend validation failures; token/user row counts grow faster than successful logins; resend flow produces different messages for existing versus new accounts.

**Phase to address:**
Auth and abuse hardening phase, after observability can measure request volume but before open friend sharing.

---

### Pitfall 4: Keeping session-auth write APIs CSRF-exempt for convenience

**What goes wrong:**
Authenticated entry writes and sync pushes remain exposed to cross-site request risks because they use Laravel session cookies but bypass CSRF checks. Beta users may run normal browsers with active sessions, making this more relevant than it felt during local development.

**Why it happens:**
JSON endpoints are sometimes treated like stateless APIs even when they are registered in `routes/web.php` and protected by session auth. The current repo explicitly exempts `entries/upsert` and `api/sync/push` in `bootstrap/app.php`.

**How to avoid:**
Choose one model and make it explicit: either restore CSRF protection for session-backed routes and use Axios' token handling, or move sync/write APIs to token-based auth with explicit CORS. Add tests that unauthenticated requests fail and authenticated session requests without the expected CSRF posture are rejected.

**Warning signs:**
CSRF exceptions grow to include new beta endpoints; tests pass because Laravel disables CSRF middleware in the test environment without a dedicated CSRF test; frontend code posts successfully only because same-origin session cookies are present; no architecture note explains whether `/api/sync/push` is web-session or token API.

**Phase to address:**
Auth and abuse hardening phase, before safer sync behavior expands write surfaces.

---

### Pitfall 5: Installing observability without beta-relevant signals

**What goes wrong:**
The team has a dashboard but cannot answer beta support questions: "Are magic links being delivered?", "Did sync fail?", "Which users are stuck with rejected entries?", "Is the queue running?", "Did the restore drill work?", or "Which endpoint got slow after deploy?"

**Why it happens:**
Generic error tracking captures exceptions, but many local-first and support failures are state-machine failures, swallowed promises, failed jobs, latency spikes, or missing operational events. Sentry tracing also needs careful production sampling, and Laravel Pulse currently has database requirements that may conflict with a SQLite-first beta plan.

**How to avoid:**
Define an observability contract around critical flows before choosing dashboards. Capture errors and request latency for `/auth/magic-link/request`, magic-link consume, `/entries/upsert`, `/api/sync/push`, settings, notification jobs, and admin support actions. Add structured domain events for sync rejected/conflict, magic link requested/consumed/failed, notification queued/sent/failed, backup job status, and queue health. Configure environment, release, and sampling deliberately.

**Warning signs:**
Only unhandled exceptions are reported; frontend sync catches errors without emitting a metric/event; Sentry is enabled in tests/local by accident; traces sample 100% in production with no quota plan; Pulse is selected without validating production database support; no alert exists for queue not processing jobs.

**Phase to address:**
Observability baseline phase, before notifications/admin depend on it and before beta go/no-go.

---

### Pitfall 6: Building admin as direct database editing

**What goes wrong:**
The admin MVP becomes a way to mutate sensitive journal data or account state without auditability, authorization boundaries, or support-safe workflows. A support action meant to help one user can delete or expose private entries.

**Why it happens:**
Small beta teams often build admin screens as internal shortcuts. This app stores private journal entries, local/server sync state, magic tokens, sessions, and future notification state; those need constrained support views rather than raw CRUD.

**How to avoid:**
Make admin read-mostly at first: user lookup, account metadata, sync status summary, delivery status, token/request status, queue/health indicators, and safe resend/disable actions. Add policy-gated admin access, audit logs for every support action, no plaintext magic tokens, no full journal content display unless explicitly required, and no destructive data operations until account deletion/export workflows are designed.

**Warning signs:**
Admin routes are only hidden by URL; there is no `is_admin`/policy check or audit table; support screens show full entry bodies by default; admin actions call model deletes directly; no tests assert non-admin access is forbidden.

**Phase to address:**
Admin MVP phase, with audit/event hooks coordinated with observability baseline.

---

### Pitfall 7: Calling docs/runbooks complete before a restore drill

**What goes wrong:**
The beta has deploy notes and backup configuration, but no one has proven a fresh deploy, queue worker, email sending, database migration, backup restore, or rollback works under realistic conditions.

**Why it happens:**
Runbooks often describe intended infrastructure rather than exercised operations. This repo is SQLite-first locally, production hosting/provider is TBD, and `_planning/RUNBOOKS.md` still has backup/restore placeholders.

**How to avoid:**
Create executable runbooks with exact environment variables, deploy commands, worker command/process manager, mail provider DNS requirements, backup schedule, restore drill, rollback path, and beta go/no-go checklist. Perform one restore into a clean environment and record the date, source backup, duration, verification commands, and unresolved gaps.

**Warning signs:**
`APP_URL`, mail provider, queue worker, and DB path are still TBD near beta; "daily backups enabled" has no restore command; no one can explain how magic-link mail is delivered in production; deploy docs do not include `APP_DEBUG=false`, secure cookies, worker restart, or migration order.

**Phase to address:**
Production readiness docs/runbooks phase, before beta go/no-go and before inviting non-technical friends.

---

### Pitfall 8: Expanding confidence with only PHP feature tests

**What goes wrong:**
Backend tests pass while the riskiest user behavior regresses: IndexedDB writes, merge decisions, save failure UI, browser timezone boundaries, notification permission states, export, and guest-to-auth sync transitions.

**Why it happens:**
The existing suite is useful but server-heavy. There is no JS runtime/browser test configuration, and local-first behavior lives mostly in `resources/js/lib/db.ts`, `Today.tsx`, and `History.tsx`.

**How to avoid:**
Add focused frontend/runtime coverage for Dexie helpers and at least one browser-level happy path for guest save -> sign in -> sync -> history. Add PHP tests for conflict, rejection, CSRF/auth posture, magic-link request lifecycle, notification delivery records, admin authorization, and timezone boundaries. Keep final verification through `XDEBUG_MODE=off vendor/bin/grumphp run`, plus `npm run typecheck`/`npm run build`.

**Warning signs:**
New sync or notification phases only add controller tests; no tests simulate IndexedDB quota/write failure or rejected records; timezone tests freeze server time but not browser date behavior; admin pages have no authorization tests; CI does not run frontend checks.

**Phase to address:**
Stronger tests and CI gates phase, but seed targeted tests inside each feature phase before changing behavior.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Marking server `skipped` sync results as locally synced | Avoids repeated retries | Silent local/server divergence and lost cross-device trust | Never for beta; replace local record with canonical server payload or show conflict |
| Trusting client `updated_at` as conflict authority | Simple implementation | Clock skew can overwrite fresher data | Only as temporary telemetry while adding server revisions |
| Adding notification preferences without delivery records | Fast UI progress | Cannot support missed reminders or prove delivery | Only behind disabled feature flag |
| Using swallowed frontend promises for reliability flows | Keeps UI calm | Users and operators cannot see failures | Acceptable only for non-critical opportunistic refreshes, not save/sync/auth |
| Deferring magic-token cleanup | No scheduler work | Token table and user table growth, harder abuse analysis | Short local dev only |
| Admin raw CRUD | Quick support shortcuts | Privacy and audit risk | Never for private journal content |
| "Docs-only" backup readiness | Checks a planning box | Restore may fail when needed | Never for beta; require a drill |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Laravel queues | Running `queue:listen --tries=1 --timeout=0` locally and forgetting production worker supervision, timeouts, retries, and failed jobs | Define production `queue:work` command, process manager, tries/backoff/timeout, failed-job table, and queue health checks |
| Laravel notifications | Treating queued notification dispatch as delivery success | Persist a delivery record and update it from job/provider outcomes |
| Browser Notifications API | Assuming browser/system notifications are universally available | Require HTTPS, permission checks, denied/default states, and fallback channel/copy |
| Background Sync API | Depending on it for guaranteed sync | Treat as progressive enhancement because browser support is limited; keep in-app retry/status controls |
| Turnstile | Rendering the widget without backend Siteverify validation | Validate every token server-side, enforce action/hostname when configured, handle timeout/duplicate errors |
| Sentry | Enabling errors/tracing with default environment and sampling | Set environment/release, disable DSN in tests/local, scrub sensitive context, tune trace sample rate |
| Laravel Pulse | Choosing it without checking storage assumptions | Validate production DB support first; Pulse docs note first-party storage requires MySQL, MariaDB, or PostgreSQL |
| Mail provider | Switching from log mailer without deliverability DNS/runbook | Configure SPF/DKIM/DMARC, branded sender, bounce handling, and support copy for missing links |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded sync batch | Slow requests, memory spikes, repeated validation of bad records | Limit server `entries` count, chunk client pushes, compact per-item errors | A seeded/local-heavy browser or retry loop, not necessarily many users |
| Rejected sync retry loop | Same bad record posts on every page load | Persist rejected state and stop automatic retry until edited | Any user with one invalid local record |
| One request per entry with SQLite production writes | Lock contention and slow sync | Document production DB path and write strategy; keep SQLite local-first but verify hosted DB choice | Concurrent beta users syncing history |
| Loading all IndexedDB entries for history/export | Main-thread jank, tab crashes, bad mobile UX | Paginate history, chunk export, test large journals | Hundreds to low thousands of entries |
| 100% tracing in production | Observability quota/cost spike | Use low default sample rate plus targeted sampling for auth/sync/notification endpoints | Immediately after beta traffic if tracing is enabled broadly |
| Queue worker without timeout/retry alignment | Duplicate or stuck notification/email jobs | Keep worker timeout shorter than queue `retry_after`; add failed-job monitoring | First external mail/provider slowdown |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Session-auth writes without CSRF posture | Cross-site requests can mutate authenticated journal data | Restore CSRF checks or move to explicit token API with CORS |
| Account creation on every magic-link request | User/token table pollution and abuse amplification | Create pending requests or defer account creation until token consume |
| Email enumeration through auth messages | Attackers infer account state | Use uniform request responses and log distinctions server-side only |
| Long-lived remember sessions by default | Lost devices retain access to private entries | Make remember duration configurable and expose device/session controls later |
| Admin reads private entries by default | Support tooling becomes privacy exposure | Show metadata/status first; gate content access and audit it |
| Logging sensitive journal text or magic links | Private content leaks to logs/observability vendors | Scrub request bodies, tokens, email links, and entry fields before logging/reporting |
| Client-only Turnstile | Bot protection can be bypassed | Validate token on backend and fail deliberately on invalid/expired/duplicate tokens |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sync status hidden | Users assume entries are backed up when they are only local | Show small, calm status: local, syncing, backed up, needs attention |
| "Reminder" copy before delivery confidence | Users lose trust after missed reminders | Say what channel is used, allow opt out, and show last delivery/check state |
| Magic-link failure states are generic | Users abandon sign-in when email is delayed, expired, or already used | Add resend guidance, expiry copy, and safe failure messages |
| Friend-share onboarding over-explains marketing value | First session feels like a landing page instead of journaling | Keep first screen focused on writing; add concise local-first/privacy copy near sign-in |
| Conflict resolution uses technical language | Users do not know whether to keep local or server text | Use date/device/status language and provide one clear repair action |
| Admin/support cannot explain data location | Support gives wrong guidance after local storage clear or fresh browser login | Make local versus server state visible in admin and help copy |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Notifications MVP:** Has delivery ledger, opt-in/out, queue worker, failed-job visibility, tests, and one verified production channel.
- [ ] **Observability baseline:** Captures auth, sync, notifications, queue health, request latency, frontend failures, release/environment, and alerts for critical flows.
- [ ] **Admin MVP:** Has policy-gated access, audit logs, read-mostly support views, non-admin tests, and no default full-entry exposure.
- [ ] **Auth hardening:** Validates Turnstile server-side, rate-limits by email/IP, cleans magic tokens, uses uniform responses, and verifies session/CSRF posture.
- [ ] **Production readiness:** Includes deploy, worker, email DNS, backup schedule, restore drill, rollback, secure cookie, and beta go/no-go docs.
- [ ] **Safer sync:** Handles rejected records, conflicts, canonical server payloads, chunking, user-visible status, and restore/pull expectations.
- [ ] **Testing:** Includes PHP feature tests and frontend/browser tests for local-first flows, not only typecheck/build.
- [ ] **Friend-share onboarding:** Explains local-first/sync/privacy/failure states without turning the app into broad marketing.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Local/server sync divergence | HIGH | Stop marking ambiguous records synced; add admin/user export of both copies; ship canonical pull; write a one-time reconciliation script if server revisions exist |
| Rejected retry loop | MEDIUM | Add rejected state migration, mark existing invalid records as needs-attention, show repair UI, and rate-limit retry |
| Missed notifications | MEDIUM | Backfill delivery ledger from jobs/logs where possible, add failed status, notify affected users only if useful, and tune worker/provider settings |
| Auth request abuse | MEDIUM/HIGH | Temporarily tighten throttle, block offending IP/ranges if needed, pause open signup if severe, add Turnstile validation and token cleanup |
| Observability noise/quota burn | LOW/MEDIUM | Lower sample rates, drop sensitive/high-cardinality tags, disable local/test DSNs, and add targeted event filters |
| Admin privacy incident | HIGH | Disable risky admin action/view, audit access logs, rotate affected credentials if needed, notify according to policy/legal advice, reintroduce with policy and audit checks |
| Failed restore drill | HIGH | Freeze beta expansion, identify missing backup/dependency, repeat restore into clean environment, update runbook with measured commands and timing |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Treating local-first sync as "just a push endpoint" | Safer sync behavior | Tests for server-newer, local-newer, clock skew, rejected records, chunking, and fresh-browser restore |
| Shipping notifications without a delivery ledger | Notifications MVP | Delivery table exists; queued job updates status; failed delivery appears in admin; opt-out respected |
| Adding Turnstile but leaving auth lifecycle unchanged | Auth/abuse hardening | Backend Siteverify tests; uniform responses; token cleanup command; rate-limit tests |
| Keeping session-auth write APIs CSRF-exempt | Auth/abuse hardening | Dedicated CSRF/session tests and documented API auth model |
| Installing observability without beta-relevant signals | Observability baseline | Test event appears in provider; alerts cover auth/sync/queue; frontend sync failure emits a signal |
| Building admin as direct database editing | Admin MVP | Non-admin forbidden tests; audit log assertions; support actions avoid private content by default |
| Calling runbooks complete before restore drill | Production readiness docs/runbooks | Restore drill recorded with date, commands, duration, and verification output |
| Expanding confidence with only PHP feature tests | Stronger tests | CI runs PHP tests plus frontend type/build and local-first runtime tests |
| Friend-share copy overpromising backup/reminders | Friend-share onboarding/failure states | Copy distinguishes local save, authenticated sync, notification channel, and failure states |

## Sources

- Repo context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `_planning/STATUS.md`, `_planning/ROADMAP.md`, `_planning/NOW.md`.
- Laravel 13 CSRF documentation: https://laravel.com/docs/13.x/csrf (HIGH confidence for session-backed CSRF expectations and URI exclusions).
- Laravel 13 queues documentation: https://laravel.com/docs/13.x/queues (HIGH confidence for workers, retries, timeouts, failed jobs).
- Laravel 13 notifications documentation: https://laravel.com/docs/13.x/notifications (HIGH confidence for queued notifications and delivery channels).
- Laravel Pulse documentation: https://laravel.com/docs/pulse (MEDIUM confidence for Pulse storage constraint because docs are Laravel 12 page but current official Pulse docs).
- Sentry Laravel documentation: https://docs.sentry.io/platforms/php/guides/laravel/ (HIGH confidence for install, Laravel support, tracing, environment/testing cautions).
- Cloudflare Turnstile server-side validation docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ (HIGH confidence for mandatory backend validation, token lifetime, single-use behavior).
- MDN Notifications API permission docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission_static (HIGH confidence for browser support/secure-context caveats).
- MDN Background Synchronization API docs: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API (HIGH confidence for limited availability and secure-context/service-worker requirements).
- web.dev IndexedDB app-state best practices: https://web.dev/articles/indexeddb-best-practices-app-state (MEDIUM confidence for browser storage failure and performance guidance; older article but still consistent with current platform behavior).

---
*Pitfalls research for: beta readiness in a Laravel/Inertia local-first gratitude journal*
*Researched: 2026-04-25*
