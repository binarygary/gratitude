# Roadmap: Gratitude Beta Readiness

## Overview

This milestone moves the existing local-first Gratitude journal from functional product to friend-shareable beta. The sequence starts with the trust boundary around entry sync, then hardens public authentication, adds operational visibility, documents production operations, delivers one verified notification channel, exposes private-content-safe support tooling, polishes friend-facing onboarding and failure states, and finishes with cross-flow test and quality gate expansion.

Reviewability guidance: phase plans should prefer stacked, independently reviewable PRs around foundation, core behavior, integration/API wiring, UI or external interfaces, and cleanup/docs. Keep individual PRs near 100-300 lines when practical, and avoid mixing refactors with behavior changes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Sync Contract & Local State** - Make local/server entry state explicit, bounded, canonical, and recoverable.
- [ ] **Phase 2: Auth & Session Hardening** - Protect magic-link auth and session-backed writes for public beta traffic.
- [ ] **Phase 3: Observability & Health Signals** - Capture beta-critical errors, flow events, and queue/scheduler health without private content.
- [ ] **Phase 4: Production Runbooks & Beta Gate** - Document and verify deploy, mail, backup, restore, rollback, and go/no-go operations.
- [ ] **Phase 5: Notification MVP** - Ship one timezone-aware, opt-in notification channel with queued delivery and support-visible status.
- [ ] **Phase 6: Admin Support MVP** - Give authorized admins private-content-safe user lookup, status visibility, and audited narrow support actions.
- [ ] **Phase 7: Friend-Share Onboarding & Failure States** - Align friend-facing copy and UI states with the beta guarantees actually implemented.
- [ ] **Phase 8: Critical-Path Test & CI Expansion** - Close automated coverage gaps across auth, sync, timezone, notifications, admin, frontend, and quality gates.

## Phase Details

### Phase 1: Sync Contract & Local State
**Goal**: Users can trust local-first entry capture because sync outcomes are visible, bounded, canonical, and recoverable.
**Depends on**: Nothing (first phase)
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06, SYNC-07, SYNC-08
**Success Criteria** (what must be TRUE):
  1. User can see whether an entry is saved locally, pending sync, synced, failed, rejected, or in conflict.
  2. After sync, the browser stores the server-canonical entry payload for accepted and skipped items.
  3. Rejected entries stop retrying indefinitely and give the user a recoverable state.
  4. Oversized batches and entry fields are rejected with clear item-level or request-level feedback.
  5. Beta UI and documentation accurately state restore limits unless a verified pull/restore flow exists.
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md - Shared backend validation limits and canonical entry serializer.
- [x] 01-02-PLAN.md - Canonical batch sync response contract and conflict semantics.
- [x] 01-03-PLAN.md - Frontend unit harness and Dexie explicit sync-state migration.
- [x] 01-04-PLAN.md - Result-aware local sync writes for synced, failed, rejected, and conflict outcomes.
- [x] 01-05-PLAN.md - User-visible sync statuses, recovery copy, restore-limit copy, and final gate.
**UI hint**: yes

### Phase 2: Auth & Session Hardening
**Goal**: Public beta users can request, consume, and use magic-link sessions with abuse controls and explicit write-route protection.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Magic-link requests require successful server-side Turnstile or equivalent verification before mail is sent.
  2. Repeated magic-link requests are rate-limited by IP and email while returning uniform responses.
  3. Invalid, expired, reused, tampered, and wrong-signature magic links are safely rejected.
  4. Used and expired magic-link tokens are cleaned up by a scheduled or documented operational command.
  5. Session cookie, remember-device, and CSRF or token-auth posture are configured, documented, and covered by tests.
**Plans**: 5 plans
Plans:
- [x] 02-01-PLAN.md - Turnstile verifier foundation, config, fakeable service seam, and tests.
- [x] 02-02-PLAN.md - Magic-link request Turnstile gate, segmented throttling, and uniform response tests.
- [x] 02-03-PLAN.md - Magic-link consume hardening and used/expired token cleanup command.
- [ ] 02-04-PLAN.md - Explicit remember-device backend posture and CSRF-protected session write routes.
- [ ] 02-05-PLAN.md - Embedded AppShell Turnstile/remember UI, auth-session docs, and final gate.
**UI hint**: yes

### Phase 3: Observability & Health Signals
**Goal**: The beta has enough privacy-safe operational visibility to detect and investigate critical app failures.
**Depends on**: Phase 2
**Requirements**: OBS-01, OBS-02, OBS-03, OBS-04, OBS-05
**Success Criteria** (what must be TRUE):
  1. Backend exceptions and frontend runtime errors are captured with environment and release context.
  2. Auth, sync, queue, notification, and admin flows emit low-cardinality operational events or logs.
  3. Observability output excludes private journal content, magic-link tokens, and sensitive personal data.
  4. Queue and scheduler health can be checked without manually inspecting database tables.
  5. Critical beta failure signals have a documented alert or review path.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Production Runbooks & Beta Gate
**Goal**: The app can be deployed, operated, backed up, restored, and assessed for beta launch using concrete commands and checklists.
**Depends on**: Phase 3
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05
**Success Criteria** (what must be TRUE):
  1. Hosting/deploy documentation lists exact build, migrate, queue worker, scheduler, and rollback commands.
  2. Production mail setup documents provider choice, sender configuration, SPF, DKIM, DMARC, and a test procedure.
  3. Backup documentation identifies schedule, storage location, retention, and responsible checks.
  4. Restore documentation records a verified restore drill into a clean environment.
  5. A beta go/no-go checklist covers auth, sync, notifications, observability, backup/restore, tests, and known risks.
**Plans**: TBD

### Phase 5: Notification MVP
**Goal**: Users can opt into one reliable reminder channel that respects timezone settings and leaves an auditable delivery trail.
**Depends on**: Phase 4
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06
**Success Criteria** (what must be TRUE):
  1. User can opt in or out of the first notification channel.
  2. User can see and update notification preference state in Settings.
  3. Scheduled notifications respect the user's saved timezone.
  4. Notification delivery runs through the queue and records intent, channel, status, and failure reason.
  5. Support can inspect notification status without seeing private journal content.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Admin Support MVP
**Goal**: Authorized admins can support beta users through narrow, audited, private-content-safe operational views.
**Depends on**: Phase 5
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):
  1. Only authorized admins can access internal support pages.
  2. Admin can look up a user by email and see account, auth, sync, and notification status.
  3. Admin support views minimize or exclude private journal entry content.
  4. Narrow support actions are policy-gated and audit logged.
  5. Non-admin users are blocked from every admin route and action.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Friend-Share Onboarding & Failure States
**Goal**: Friends can understand beta expectations, privacy posture, local-first behavior, and recoverable failure states without handholding.
**Depends on**: Phase 6
**Requirements**: BETA-01, BETA-02, BETA-03, BETA-04
**Success Criteria** (what must be TRUE):
  1. Friend-facing onboarding explains local-first capture, optional sync, privacy posture, and beta expectations.
  2. Magic-link request, delivery delay, invalid link, save failure, sync failure, and notification failure states are visible and actionable.
  3. Product sharing copy encourages sharing the app without sharing private entries.
  4. Demo/local seeding behavior cannot clear or flood real guest local entries in production.
**Plans**: TBD
**UI hint**: yes

### Phase 8: Critical-Path Test & CI Expansion
**Goal**: The completed beta readiness surface is protected by automated tests and a final quality gate.
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. PHP feature tests cover magic-link request, consume, logout, throttling, cleanup, and invalid token cases.
  2. PHP feature tests cover auth protection, CSRF/token posture, entry validation, sync conflicts, rejected entries, and batch limits.
  3. Tests cover timezone-sensitive date resolution and notification scheduling.
  4. Browser or frontend tests cover IndexedDB local save, sync status transitions, offline/error states, and friend-facing failure states.
  5. Typecheck, build, PHP tests, static analysis, formatting, and GrumPHP pass as the final quality gate.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Sync Contract & Local State | 5/5 | Complete | 2026-04-26 |
| 2. Auth & Session Hardening | 3/5 | In Progress | - |
| 3. Observability & Health Signals | 0/TBD | Not started | - |
| 4. Production Runbooks & Beta Gate | 0/TBD | Not started | - |
| 5. Notification MVP | 0/TBD | Not started | - |
| 6. Admin Support MVP | 0/TBD | Not started | - |
| 7. Friend-Share Onboarding & Failure States | 0/TBD | Not started | - |
| 8. Critical-Path Test & CI Expansion | 0/TBD | Not started | - |
