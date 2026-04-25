# Architecture Research

**Domain:** Beta readiness architecture for an existing Laravel/Inertia local-first gratitude journal
**Researched:** 2026-04-25
**Confidence:** HIGH for codebase structure and build-order recommendations; MEDIUM for production provider choices because hosting is still TBD.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Browser / Inertia React                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Today / History / Settings / Admin pages                                     │
│ AppShell auth, sharing, export, status surfaces                              │
│ resources/js/lib/db.ts: IndexedDB entries, device id, sync state transitions │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ same-origin Inertia + Axios requests
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               Laravel Web App                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ routes/web.php -> controllers -> actions/queries -> Eloquent                 │
│ Middleware: Inertia shared props, signed-link normalization, auth, throttles │
│ Cross-cutting: CSRF, Turnstile, request metrics, structured logs             │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ model writes, queued work, mail, logs
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             Persistence / Operations                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Server DB: users, entries, magic tokens, sessions, jobs, notification state  │
│ External: email provider, Turnstile verification, error/log monitoring       │
│ Runbooks: deploy, queue worker, backup/restore, beta go/no-go                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Local entry store | Own browser entry persistence, sync metadata, rejected/conflict states, device identity, and eventual IndexedDB migrations. | Keep in `resources/js/lib/db.ts` initially, but split sync state helpers into narrow functions before adding fields such as `sync_status`, `sync_error`, `server_updated_at`, or `server_revision`. |
| Journal pages | Render capture/history workflows and call local-store helpers. They should not own sync policy. | Keep route pages in `resources/js/Pages`; extract page-specific hooks only when a phase touches behavior already concentrated in `Today.tsx` or `History.tsx`. |
| Entry write boundary | Validate and persist one canonical entry shape for direct saves and batch sync. | Introduce shared validation/rule object or FormRequest-style helper used by `EntryController` and `Api\SyncController`; keep canonical write behavior in `app/Actions/Entries/UpsertEntry.php` or a successor action. |
| Sync API | Accept bounded batches, return canonical server outcomes, and never make the browser guess what happened. | Keep `POST /api/sync/push`; add batch limits, per-item canonical payloads, rejected metadata, and eventually pull/cursor endpoints if cross-device restore becomes beta-critical. |
| Auth/abuse boundary | Own magic-link request/consume/logout lifecycle, bot checks, throttles, token cleanup, and session hardening. | Keep `MagicLinkController` as HTTP boundary; add small services for Turnstile verification and token cleanup rather than growing controller logic. |
| Notification subsystem | Own reminder preferences, delivery attempts, and provider-specific delivery. It must depend on user settings and queue workers, not page components. | Add models/actions under `app/Actions/Notifications`, queued jobs under `app/Jobs`, notification preference fields/table, and Settings UI controls. Start with email or app-generated calendar/reminder behavior before push complexity. |
| Observability subsystem | Capture beta health signals for errors, latency, auth, sync, queue jobs, notification delivery, and critical flow failures. | Add middleware/listeners/jobs instrumentation close to Laravel boundaries; use configured logging channels or a dedicated error service. Keep metrics low-cardinality and operational, not product analytics. |
| Admin MVP | Provide internal user lookup, status visibility, and support actions without becoming a second product. | Add authenticated/admin-gated routes and controllers under `app/Http/Controllers/Admin`, Inertia pages under `resources/js/Pages/Admin`, read models/queries for support status, and auditable action services for mutations. |
| Production docs/runbooks | Define repeatable deploy, worker, email deliverability, backup/restore, incident, and beta go/no-go procedures. | Keep in project docs or planning docs. Tie each runbook to actual commands/env vars already present in `composer.json`, `.github/workflows/quality.yml`, and Laravel config. |
| Test harness | Prove beta gates at HTTP, domain, and browser-local workflow boundaries. | Continue Pest feature tests for Laravel behavior; add frontend/browser-local tests before changing IndexedDB sync semantics heavily. |

## Recommended Project Structure

```text
app/
├── Actions/
│   ├── Entries/              # canonical write/conflict actions
│   ├── Notifications/        # reminder scheduling and delivery actions
│   ├── Auth/                 # token cleanup or abuse-hardening helpers
│   └── Admin/                # support actions that mutate user/account state
├── Http/
│   ├── Controllers/
│   │   ├── Api/              # sync and future JSON endpoints
│   │   ├── Auth/             # magic-link and abuse-protected auth flows
│   │   └── Admin/            # internal beta support pages/actions
│   ├── Middleware/           # Inertia props, observability, admin gate if needed
│   └── Requests/             # shared request validation when rules diverge today
├── Jobs/                     # queued notification delivery, cleanup, async ops
├── Models/                   # users, entries, tokens, notification preferences/attempts
├── Queries/
│   ├── Entries/ or EntryQueries.php
│   └── Admin/                # support dashboard/user-status read models
└── Support/
    ├── Observability/        # event names, metric/log context helpers
    ├── Security/             # Turnstile verifier/client wrapper
    └── Sync/                 # shared sync result DTOs if controller logic grows

resources/js/
├── Pages/
│   ├── Admin/                # admin Inertia pages
│   ├── Today.tsx
│   ├── History.tsx
│   └── Settings.tsx
├── Components/
│   ├── SyncStatus.tsx        # user-visible save/sync state
│   ├── Auth/                 # magic-link form and failure states
│   └── Admin/                # admin-only display components
└── lib/
    ├── db.ts                 # Dexie schema and low-level local-entry operations
    ├── sync.ts               # sync orchestration if db.ts becomes too broad
    └── date.ts

tests/
├── Feature/                  # Laravel route/action/job/admin/security tests
└── Browser or resources tests # add only when chosen test runner exists
```

### Structure Rationale

- **Keep the Laravel monolith.** The beta work is operational hardening around an existing small app. Splitting services would add deployment and observability burden before the product needs it.
- **Use domain actions for write policy.** Existing `UpsertEntry` is the right pattern. Notifications, admin support mutations, cleanup, and sync reconciliation should follow the same action boundary so controllers stay thin.
- **Use queries/read models for admin.** Admin MVP should aggregate support status without leaking admin-specific query logic into user-facing controllers.
- **Keep local-first policy in frontend utilities, not page components.** `Today.tsx` and `History.tsx` should render workflows; sync state transitions should be testable from `resources/js/lib`.
- **Avoid a broad service layer.** Add services only where a concrete external boundary exists: Turnstile verification, notification delivery, observability adapters, or sync reconciliation DTOs.

## Architectural Patterns

### Pattern 1: Canonical Server Write Action

**What:** One action owns server-side write/conflict behavior for both immediate saves and sync batches.
**When to use:** Any time `EntryController` and `Api\SyncController` need the same validation, conflict, size-limit, or response semantics.
**Trade-offs:** Keeps behavior consistent, but requires careful response design so direct-save and batch-sync callers both receive enough canonical state.

**Recommended direction:**
```php
$validatedEntry = $entryPayloadRules->validate($payload);
$result = $upsertEntry->execute($request->user(), $validatedEntry);

return [
    'status' => $result->status,
    'entry' => $result->canonicalEntryPayload(),
];
```

### Pattern 2: Explicit Local Sync State Machine

**What:** Model local records as `pending`, `synced`, `rejected`, `conflicted`, or `failed` instead of inferring all state from `synced_at === null`.
**When to use:** Before adding safer sync behavior, user-visible sync status, notification-triggered reminders, or admin support status that depends on whether a user is actually backed up.
**Trade-offs:** Requires an IndexedDB schema migration and frontend test coverage, but prevents infinite retry loops and invisible divergence.

**Recommended direction:**
```typescript
type SyncStatus = 'pending' | 'synced' | 'rejected' | 'conflicted' | 'failed';

type LocalEntry = {
    entry_date: string;
    updated_at: number;
    synced_at: number | null;
    sync_status: SyncStatus;
    sync_error: string | null;
    server_updated_at: number | null;
};
```

### Pattern 3: Boundary Instrumentation

**What:** Add observability at request, queue, mail/notification, auth, and sync boundaries rather than sprinkling logs throughout domain code.
**When to use:** For beta health visibility: request latency, auth request/consume outcomes, sync result counts, queue failures, notification attempts, and admin support actions.
**Trade-offs:** Middleware/listener instrumentation gives broad coverage with small code changes, but domain-specific events are still needed for sync conflicts/rejections and notification delivery outcomes.

### Pattern 4: Admin as Read-Heavy Operations Surface

**What:** Admin pages read support status from query services and call narrow auditable actions for mutations.
**When to use:** User lookup, entry/sync counts, magic-token state, recent login/token attempts, notification status, and basic support actions.
**Trade-offs:** Slower to build than direct model access inside controllers, but avoids turning admin pages into an unstructured backdoor.

### Pattern 5: Queue-Backed Notification Delivery

**What:** Store user opt-in preferences and delivery attempts; enqueue delivery; record outcomes.
**When to use:** Notification MVP when delivery verification matters.
**Trade-offs:** Requires production queue worker docs and monitoring. It is still simpler and safer than browser push until beta has a concrete need for web-push subscriptions and browser permission UX.

## Data Flow

### Request Flow

```
User action in React page
    ↓
Local IndexedDB update when entry data is involved
    ↓
Axios/Inertia request to Laravel route
    ↓
Controller validates boundary inputs
    ↓
Action/query owns domain behavior
    ↓
Eloquent persists or reads server state
    ↓
Response returns canonical state + operational outcome
    ↓
Frontend updates local sync/status UI
```

### State Management

```
IndexedDB entries
    ↓
Local store helpers in resources/js/lib
    ↓
Today/History/Settings components
    ↕
Laravel server state for authenticated users
    ↓
Admin and observability read operational status, not private journal content by default
```

### Key Data Flows

1. **Entry save:** `Today.tsx` writes to IndexedDB first, then posts to `/entries/upsert` when authenticated. The server should return canonical entry metadata, and the browser should update `sync_status` rather than only `synced_at`.
2. **Batch sync push:** `resources/js/lib/db.ts` sends bounded pending entries to `/api/sync/push`. `SyncController` validates the batch envelope, applies shared entry rules per item, delegates writes to `UpsertEntry`, and returns per-item `upserted`, `skipped`, `rejected`, or `conflicted` results plus canonical server fields.
3. **Auth request:** `AppShell` or extracted auth component submits email and Turnstile token to `/auth/magic-link/request`. `MagicLinkController` validates email, verifies Turnstile through a small support service, creates token state, sends mail, and emits/logs an auth outcome without revealing account existence.
4. **Notification delivery:** User updates reminder preference in Settings. A scheduled command/job selects due users, enqueues delivery jobs, sends through the chosen channel, records attempts, and emits delivery metrics. Admin reads preference/attempt status for support.
5. **Observability:** Middleware records request latency and status; auth/sync/notification actions emit structured events or logs with low-cardinality context; queue failures are visible through Laravel failed job handling and external monitoring.
6. **Admin support:** Admin routes require an explicit admin gate. Admin queries read user, entries count, token status, sync health, notification status, and recent operational events. Mutations call actions and record audit rows/logs.
7. **Friend-share onboarding/failure states:** User-facing pages remain Inertia/React. Copy and error states should consume real operational statuses: email sent/failed, save pending, sync rejected, notification disabled, and privacy assurances.

## Suggested Build Order and Dependencies

1. **Safety foundation: sync and validation contracts**
   - Add shared entry validation rules, bounded sync batch sizes, canonical sync responses, and rejected-entry handling.
   - Add explicit local sync states before user-visible sync status or admin claims about backup health.
   - Depends on current `UpsertEntry`, `SyncController`, and `resources/js/lib/db.ts`.

2. **Security foundation: CSRF/session/auth abuse hardening**
   - Remove or justify CSRF exemptions for session-backed write routes, add tests, add Turnstile verifier to magic-link request, make token cleanup scheduled/commanded, and verify session cookie production settings.
   - Should happen before friend-share expansion because open email sign-in is the public attack surface.

3. **Observability baseline**
   - Instrument request latency/errors, auth outcomes, sync result counts, queue failures, and notification delivery attempts.
   - Should follow the sync/auth contracts so event names and statuses are stable.

4. **Production readiness docs/runbooks**
   - Document hosting, deploy, worker, queue, mail deliverability, backups, restore drill, environment variables, and beta go/no-go.
   - Can start early, but final docs should reflect security/observability decisions.

5. **Notification MVP**
   - Add user preference data, delivery action/job, delivery attempt logging, Settings controls, and delivery verification.
   - Depends on queue/runbook clarity and observability baseline. Do not introduce web push until email/calendar-style MVP is insufficient.

6. **Admin MVP**
   - Add admin gate, user lookup, support status queries, and narrowly scoped support actions.
   - Depends on stable observability and sync/auth status data; otherwise admin shows unreliable or incomplete state.

7. **Friend-share onboarding and failure states**
   - Add polished copy and visible failure states for email, save, sync, and notification paths.
   - Depends on real statuses from sync/auth/notification work so UI does not promise behavior the system cannot verify.

8. **Stronger tests throughout, with frontend workflow tests before risky local-first changes**
   - Add PHP feature tests per backend phase.
   - Add browser/local-store tests before or alongside IndexedDB schema changes and user-visible sync behavior.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k beta users | Keep monolith, SQLite-first local defaults, database queue, same-origin session auth, and simple operational dashboards. Add backups, logs, mail deliverability, and queue worker supervision before launch. |
| 1k-100k users | Move production to a managed database if SQLite write contention appears, add sync pull/pagination, limit/chunk sync batches, move logs/errors to hosted monitoring, and use queue dashboards/alerts. |
| 100k+ users | Consider dedicated read models, notification provider abstraction, durable event/audit storage, and possibly service separation only around notification delivery or analytics/observability pipelines. |

### Scaling Priorities

1. **First bottleneck:** Data reliability and support visibility, not raw traffic. Fix rejected sync, conflict/canonical responses, backup/restore, and admin support status first.
2. **Second bottleneck:** Open auth abuse and email deliverability. Harden magic-link request flow before broader sharing.
3. **Third bottleneck:** Queue and notification delivery visibility. Notifications introduce asynchronous failure modes that need worker docs and monitoring.

## Anti-Patterns

### Anti-Pattern 1: Building Notifications Before Queue/Observability Basics

**What people do:** Add reminder UI and a scheduled job without delivery attempts, worker monitoring, or failure visibility.
**Why it's wrong:** Users cannot trust reminders, and support cannot tell whether a notification was opted out, queued, sent, failed, or never scheduled.
**Do this instead:** Add delivery attempt persistence and instrumentation with the MVP notification channel.

### Anti-Pattern 2: Treating Admin as Direct Model CRUD

**What people do:** Expose broad user and entry model access through admin controllers.
**Why it's wrong:** The app stores private journal content; admin needs support status first, not unnecessary content access.
**Do this instead:** Build read-heavy status queries and narrow audited support actions. Avoid displaying entry bodies unless a later support policy explicitly allows it.

### Anti-Pattern 3: Hiding Sync Failures Behind Fire-and-Forget Calls

**What people do:** Continue swallowing `pushUnsyncedEntries()` errors and mark server-skipped entries as synced without fetching canonical state.
**Why it's wrong:** Local and server data can diverge silently, and rejected records can retry forever.
**Do this instead:** Return canonical server payloads, model explicit local statuses, surface pending/rejected/conflicted state, and add tests for clock skew and server-newer cases.

### Anti-Pattern 4: Mixing Refactors With Beta Behavior Changes

**What people do:** Rewrite `Today.tsx`, `AppShell`, sync, auth, and admin in one broad phase.
**Why it's wrong:** The repo is brownfield and the riskiest flows are user data and auth. Large mixed changes make review and rollback difficult.
**Do this instead:** Use stacked PRs: foundation contracts, behavior, integration, UI, docs/cleanup.

### Anti-Pattern 5: Documenting Production Readiness Without Verifiable Commands

**What people do:** Write generic deployment and backup guidance disconnected from actual Laravel commands, queue config, mail provider, and hosting.
**Why it's wrong:** Beta failures need repeatable procedures, not aspirations.
**Do this instead:** Tie docs to actual env vars, `composer` scripts, `artisan` commands, worker process, database backup/restore commands, and go/no-go checks.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Email provider | Laravel Mail transport through `config/mail.php` and existing `MagicLinkMail`; notification MVP can reuse mail if email reminders are chosen. | Postmark support is already present through Symfony mailer dependencies/config. Deliverability docs must cover SPF, DKIM, DMARC, sender, and failure handling. |
| Turnstile | Server-side verifier service called from magic-link request validation. | Keep provider credentials in env/config. Fail closed for suspicious public requests, but produce friendly UI failure states. |
| Error/log monitoring | Laravel logging channel, error tracker, or hosted log drain connected at middleware/listener boundaries. | Prefer low-cardinality events: route name, status family, auth outcome, sync result counts, job name, notification result. Avoid journal content in logs. |
| Queue worker | Laravel database queue initially. | Required for notifications and cleanup jobs. Production runbook must include worker command, restart behavior, retries, and failed jobs. |
| Backups/storage | Database backup process tied to chosen production DB. | SQLite-first local defaults can stay, but beta docs need persistent production storage and restore drill evidence. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React pages to local store | Function calls to `resources/js/lib/*` | Pages render state; store helpers own IndexedDB schema and sync state transitions. |
| React to Laravel | Same-origin Inertia/Axios routes | Keep session auth. Re-enable/verify CSRF for write routes unless intentionally moving to token auth. |
| Controllers to actions | Dependency-injected action classes | Controllers validate request envelopes and coordinate responses; actions own domain writes. |
| Controllers to queries | Dependency-injected query/read services | Admin and history reads should not duplicate query shaping in controllers. |
| Sync API to entry write | Shared validation + `UpsertEntry` | Sync must return canonical server state, not just status strings. |
| Auth to Turnstile | Support service/client | Keeps provider HTTP details out of `MagicLinkController`. |
| Notification scheduler to delivery | Command/job -> action -> mail/provider | Persist attempts and emit observability events around the job boundary. |
| Admin to user operations | Query services + audited action services | Admin pages should read operational state and call narrow actions. |

## Sources

- `.planning/PROJECT.md` - current beta-readiness requirements, constraints, and known concerns.
- `.planning/codebase/ARCHITECTURE.md` - existing Laravel/Inertia/local-first architecture map.
- `.planning/codebase/STRUCTURE.md` - current file organization and extension points.
- `.planning/codebase/CONVENTIONS.md` - coding, validation, logging, and module conventions.
- `.planning/codebase/TESTING.md` - current test harness and coverage gaps.
- `.planning/codebase/CONCERNS.md` - sync, CSRF, local-first, auth, performance, and test-risk findings.
- `.planning/codebase/INTEGRATIONS.md` - current email, storage, queue, session, logging, and CI integration map.
- `routes/web.php`, `bootstrap/app.php`, `app/Http/Controllers/Api/SyncController.php`, `app/Actions/Entries/UpsertEntry.php`, `resources/js/lib/db.ts`, and `app/Http/Controllers/Auth/MagicLinkController.php` - implementation references inspected during research.

---
*Architecture research for: beta readiness in Gratitude*
*Researched: 2026-04-25*
