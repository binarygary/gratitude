# Project Research Summary

**Project:** Gratitude
**Domain:** Friend-shareable beta readiness for a Laravel/Inertia local-first gratitude journal
**Researched:** 2026-04-25
**Confidence:** HIGH for Laravel/local-first beta architecture; MEDIUM for provider-specific operations until hosting is selected

## Executive Summary

Gratitude is a focused daily reflection product: one private entry per day across person, grace, and gratitude prompts, saved locally first in IndexedDB and optionally synced through a Laravel backend after magic-link sign-in. Experts would not treat this milestone as a feature expansion. They would harden the reliability, security, support, and operational surfaces around the existing ritual so a friend can use it without handholding and without losing trust in saved private writing.

The recommended approach is to preserve the existing Laravel 13, Inertia React, Dexie, magic-link, and SQLite-first development architecture while adding beta-readiness layers through small stacked phases. Start with data correctness and auth safety: canonical sync responses, explicit local sync states, shared server validation, CSRF/session posture, Turnstile server verification, rate limits, and token cleanup. Then add observability, production runbooks, one reliable notification channel, admin support visibility, and friend-share onboarding/failure states.

The key risks are silent sync divergence, weak public auth controls, notifications that cannot prove delivery, generic observability that misses beta-critical failures, and admin tooling that exposes too much private journal data. Mitigate them by using server-canonical sync contracts, delivery ledgers, low-cardinality operational events, policy-gated read-heavy admin views, restore drills, and frontend/browser tests for IndexedDB/local-first workflows.

## Key Findings

### Recommended Stack

Keep Laravel as the center of beta readiness and avoid adding parallel application frameworks. The current stack already matches the problem: Laravel for auth, validation, queues, scheduling, notifications, mail, rate limiting, CSRF, and operations; Inertia React for product UI; Dexie for local-first capture; Postmark/Symfony Mailer for transactional email; and Pest plus future Playwright coverage for critical flows.

Use narrowly scoped additions: Sentry Laravel + Sentry React for cross-stack error visibility, Filament only if the admin MVP needs multiple support screens/actions, Cloudflare Turnstile for unauthenticated magic-link abuse protection, and Playwright for browser/local-first workflow tests. Keep database queue for friend beta unless measured contention forces Redis.

**Core technologies:**
- Laravel 13 / PHP 8.4: backend, auth, queues, scheduler, mail, validation, CSRF, rate limits — directly fits beta operations.
- Inertia React / React 19: product UI and onboarding/failure states — preserves the current app shell.
- Dexie 4.4.2: IndexedDB local-first storage — keep and improve schema/revision/status handling.
- Laravel Notifications + Postmark: email reminder MVP and magic-link delivery — one reliable channel before push/SMS.
- Database queue + Laravel Scheduler: notification delivery, cleanup, recurring jobs — simple enough for friend beta.
- Sentry Laravel + React: backend/frontend errors and critical-flow traces — needed for local-first and auth visibility.
- Filament 5: optional internal admin panel — useful if support workflows outgrow one or two custom Inertia pages.
- Cloudflare Turnstile: magic-link abuse protection — only useful with backend Siteverify validation.
- Playwright Test: browser coverage for IndexedDB, offline, sync, and onboarding failure states.

### Expected Features

The beta must prioritize trust: reliable local save, visible sync state, production magic-link email, public auth hardening, one opt-in notification channel, operational visibility, admin support, runbooks, and critical-path tests. Differentiators should reinforce the narrow gratitude ritual rather than broaden the product into a general journal or social app.

**Must have (table stakes):**
- Reliable local autosave with visible saved/pending/error state.
- User-visible sync status, rejected-entry recovery, and safer conflict handling.
- Production magic-link email with deliverability setup and clear failure states.
- Auth and abuse hardening with Turnstile, rate limits, cleanup, session safeguards, and CSRF posture.
- Notification MVP with opt-in/out, timezone-aware scheduling, and delivery verification.
- Baseline observability for exceptions, latency, auth, sync, queues, and notifications.
- Admin/support MVP for user lookup and operational status without database spelunking.
- Production runbooks for deploy, worker, mail, backup, restore, incidents, and beta go/no-go.
- Critical-path tests covering auth, sync, timezone, notifications, and frontend local-first behavior.
- Friend-share onboarding, privacy note, beta expectations, and save/sync/email failure states.

**Should have (competitive):**
- Three-prompt gratitude ritual, emphasized in onboarding instead of adding broad templates.
- Local-first guest capture before signup, with transparent save/sync state.
- Flashbacks from one week and one year ago, with correct timezone behavior.
- Privacy-forward sharing posture: share the app, not private entries.
- Data export polish as a trust builder.
- Lightweight support visibility for a personal beta.

**Defer (v2+):**
- Native mobile apps or deep PWA investment.
- End-to-end encrypted sync until separately researched.
- AI prompts, summaries, or reflection insights.
- Social feeds, shared journals, comments, or public gratitude streams.
- Multiple reminder channels, SMS, or web push as launch scope.
- Broad analytics dashboards, advanced customization, media attachments, tags, and imports.

### Architecture Approach

Keep the Laravel monolith and add explicit boundaries where beta risk is concentrated. Controllers should remain thin; shared entry validation and canonical write/conflict behavior should live in actions; frontend local-first policy should live in `resources/js/lib`; observability should attach to request/queue/auth/sync/notification boundaries; admin should be read-heavy and policy-gated; and runbooks should point to real commands and environment variables.

**Major components:**
1. Local entry store — owns IndexedDB schema, sync metadata, rejected/conflict states, and device identity.
2. Entry write boundary — validates and persists canonical entry shape for direct saves and batch sync.
3. Sync API — accepts bounded batches and returns per-item canonical outcomes.
4. Auth/abuse boundary — owns magic-link request/consume/logout lifecycle, Turnstile, throttles, cleanup, and sessions.
5. Notification subsystem — owns preferences, scheduling, delivery attempts, queued mail, and status.
6. Observability subsystem — captures critical beta signals without logging private journal content.
7. Admin MVP — exposes internal support status and narrow audited actions.
8. Test harness — combines Pest feature tests with browser/local-store coverage for local-first behavior.

### Critical Pitfalls

1. **Treating sync as just a push endpoint** — add canonical server payloads, rejected/conflict states, chunked batches, server revisions, and restore expectations before claiming backup confidence.
2. **Shipping notifications without a delivery ledger** — persist notification intent, scheduled time, channel, status, provider result, and preference snapshot; expose failures in admin.
3. **Adding Turnstile without hardening auth lifecycle** — validate tokens server-side, throttle by IP/email, use uniform responses, avoid user-row pollution, and clean expired/used tokens.
4. **Keeping session-auth writes CSRF-exempt** — choose and document either CSRF-protected same-origin session routes or explicit token API auth; add tests for the chosen model.
5. **Installing observability without beta-relevant signals** — instrument auth, sync, notification, queue, frontend failures, latency, release/environment, and alerts.
6. **Building admin as direct database editing** — keep admin read-mostly, policy-gated, audited, and private-content-minimizing.
7. **Calling runbooks complete before a restore drill** — record a real restore into a clean environment with commands, duration, verification, and gaps.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Sync and Validation Foundation
**Rationale:** Data trust is the core product risk, and later UI/admin/support claims depend on accurate local/server state.
**Delivers:** Shared entry validation, bounded sync batches, canonical per-item sync responses, explicit local sync statuses, rejected-entry handling, and initial conflict semantics.
**Addresses:** Reliable autosave status, safer sync behavior, rejected-entry recovery.
**Avoids:** Silent divergence, rejected retry loops, timestamp-only conflict decisions.

### Phase 2: Auth and Abuse Hardening
**Rationale:** Friend sharing exposes magic-link signup and session-backed writes to public traffic.
**Delivers:** Server-side Turnstile verification, segmented rate limits, uniform magic-link responses, token cleanup, session safeguards, and documented/tested CSRF posture.
**Uses:** Laravel RateLimiter, CSRF middleware, scheduler, HTTP client, Turnstile Siteverify.
**Avoids:** Client-only bot protection, email probing, token table growth, CSRF-exempt session writes.

### Phase 3: Observability Baseline
**Rationale:** Notifications, admin, and beta go/no-go all depend on seeing critical failures and state-machine outcomes.
**Delivers:** Sentry/error setup, release/environment configuration, low-cardinality logs/events for auth/sync/queue/notifications, frontend failure capture, and basic alerts.
**Uses:** Sentry Laravel/React or equivalent provider, Laravel logging/listeners/middleware.
**Avoids:** Generic dashboards that cannot answer beta support questions.

### Phase 4: Production Readiness Runbooks
**Rationale:** A beta is not ready until deploy, worker, mail, backup, restore, and rollback are repeatable.
**Delivers:** Hosting/deploy checklist, queue worker commands, mail DNS/deliverability notes, backup schedule, restore drill evidence, incident/rollback notes, and beta go/no-go checklist.
**Addresses:** Production readiness docs, email deliverability, backup/restore.
**Avoids:** Docs-only backup readiness and provider assumptions.

### Phase 5: Notification MVP
**Rationale:** Reminders support the daily habit but introduce async failure modes that need queue and observability basics first.
**Delivers:** Reminder preferences, one email channel, timezone-aware scheduling, queued delivery, delivery ledger, opt-out controls, tests, and support-visible status.
**Uses:** Laravel Notifications, Postmark mail, database queue, scheduler.
**Avoids:** Missed reminders with no proof of queued/sent/failed/skipped state.

### Phase 6: Admin Support MVP
**Rationale:** Support tooling is useful only after sync/auth/notification states are trustworthy and observable.
**Delivers:** Admin authorization, user lookup, auth/sync/notification status summaries, recent failure visibility, narrow audited support actions, and non-admin access tests.
**Uses:** Filament if scope warrants resource/table workflows; otherwise custom Inertia admin pages.
**Avoids:** Raw model CRUD, private entry exposure, unaudited support mutations.

### Phase 7: Friend-Share Onboarding and Failure States
**Rationale:** Copy and UI should describe implemented guarantees, not desired future behavior.
**Delivers:** Concise local-first/privacy/beta copy, magic-link failure states, save/sync status UI, notification state copy, and product-led sharing polish.
**Addresses:** Friend-share onboarding, privacy/data ownership copy, failure recovery.
**Avoids:** Overpromising backup, reminders, encryption, or support access boundaries.

### Phase 8: Critical-Path Test and CI Expansion
**Rationale:** Tests should be added during each phase, but a final gate should ensure cross-flow coverage is coherent.
**Delivers:** Browser/local-first workflows, IndexedDB sync state tests, auth abuse tests, CSRF/session tests, timezone edge cases, notification delivery tests, admin authorization tests, type/build checks, and final GrumPHP gate.
**Uses:** Pest, PHP feature tests, TypeScript/build checks, Playwright.
**Avoids:** Backend-only confidence while frontend local-first behavior regresses.

### Phase Ordering Rationale

- Sync and auth come first because they protect private journal data and define the contracts every later surface reports on.
- Observability precedes notifications/admin because those features must expose real operational status, not inferred guesses.
- Runbooks can start early, but they should finish after auth/observability choices are concrete and before inviting non-technical friends.
- Notifications come after queue/observability/runbook basics because they create asynchronous support obligations.
- Admin comes after stable signals exist; otherwise it becomes a misleading database viewer.
- Onboarding and failure states come after actual guarantees exist so user-facing copy remains precise.
- Test expansion should be seeded throughout, with a final phase to cover cross-flow gaps.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1: Sync and Validation Foundation** — server revision/conflict semantics and fresh-browser restore scope need concrete design.
- **Phase 3: Observability Baseline** — provider choice, sampling, privacy scrubbing, source maps, and alerting need implementation-specific decisions.
- **Phase 4: Production Readiness Runbooks** — hosting/database/backup provider is still undecided.
- **Phase 5: Notification MVP** — exact first channel and delivery ledger shape need product and provider confirmation.
- **Phase 6: Admin Support MVP** — choose Filament vs custom Inertia based on actual support action count and privacy policy.
- **Phase 8: Critical-Path Test and CI Expansion** — Playwright setup and CI browser strategy need repo-specific planning.

Phases with standard patterns (skip research-phase unless requirements change):
- **Phase 2: Auth and Abuse Hardening** — Laravel/OWASP/Turnstile patterns are well documented.
- **Phase 7: Friend-Share Onboarding and Failure States** — mostly product copy and UI state implementation based on completed contracts.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Laravel-native recommendations were checked against official Laravel/Sentry/Cloudflare/Playwright/package sources and match the existing app. Provider choice remains MEDIUM until hosting is selected. |
| Features | HIGH | Beta table stakes align with project requirements, codebase concerns, OWASP/Laravel docs, and competitor expectations. Competitor landscape is MEDIUM because product pages can be marketing-biased. |
| Architecture | HIGH | Recommendations are grounded in the existing Laravel/Inertia/Dexie codebase map and current implementation references. Hosting/database scaling choices remain MEDIUM. |
| Pitfalls | HIGH | Sync, auth, CSRF, testing, and admin risks are repo-specific and supported by current codebase concerns plus official docs. Notification/provider caveats are MEDIUM until production services are chosen. |

**Overall confidence:** HIGH

### Gaps to Address

- Hosting and production database choice: decide before final runbooks, backup/restore commands, worker supervision, and observability provider configuration.
- Sync restore scope: decide whether beta must include paginated pull/fresh-device restore or only clearly documented backup limitations.
- Server revision model: design a monotonic conflict authority before replacing timestamp-only decisions.
- Notification channel: confirm email as the first channel and define the delivery ledger before UI work.
- Admin privacy policy: define which support data can be shown, whether entry bodies are ever accessible, and what audit records are required.
- Observability privacy: decide PII/content scrubbing rules, release naming, source map handling, and trace sampling.
- Browser test strategy: decide Playwright CI scope, browser matrix, and how to seed IndexedDB/local-first states reliably.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — product goal, active requirements, constraints, known codebase concerns.
- `.planning/research/STACK.md` — recommended Laravel-native beta stack, package versions, alternatives, and compatibility.
- `.planning/research/FEATURES.md` — beta table stakes, differentiators, anti-features, dependencies, and MVP definition.
- `.planning/research/ARCHITECTURE.md` — component boundaries, patterns, data flow, build order, and integration points.
- `.planning/research/PITFALLS.md` — critical pitfalls, warning signs, recovery strategies, and phase mapping.
- Laravel 13 docs for notifications, queues, scheduler, routing/rate limiting, CSRF, and deployment.
- Cloudflare Turnstile server-side validation docs — Siteverify, expiry, single-use token behavior.
- Sentry Laravel/React docs — error capture, tracing, environment, React/Vite support.
- Playwright docs — install, browser support, webServer workflows.
- OWASP Authentication and Forgot Password cheat sheets — throttling, uniform responses, token handling, monitoring.

### Secondary (MEDIUM confidence)
- Day One, Penzu, and Diarly product/docs pages — competitor expectations around autosave, privacy, reminders, sync, flashbacks, and sharing.
- Laravel Nightwatch, Pulse, Filament, Symfony Postmark, Packagist, and npm registry checks — provider/package fit and version compatibility.
- MDN Notifications and Background Sync docs — browser capability caveats for future notification channels.
- web.dev IndexedDB app-state guidance — local storage reliability and performance cautions.

### Tertiary (LOW confidence)
- None material. Open questions are implementation choices, not unsupported findings.

---
*Research completed: 2026-04-25*
*Ready for roadmap: yes*
