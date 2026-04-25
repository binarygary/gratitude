# Requirements: Gratitude

**Defined:** 2026-04-25
**Core Value:** Users can capture a daily gratitude reflection with confidence that it is saved, recoverable, and easy to revisit.

## v1 Requirements

Requirements for the beta-readiness milestone. Each maps to roadmap phases.

### Sync Reliability

- [x] **SYNC-01**: User can see whether a local entry is saved locally, pending sync, synced, failed, rejected, or in conflict.
- [x] **SYNC-02**: Server returns a canonical entry payload for each accepted or skipped sync item.
- [ ] **SYNC-03**: Client stores canonical server data after sync so local state does not silently diverge.
- [x] **SYNC-04**: Rejected sync entries stop retrying indefinitely and show a recoverable user-facing state.
- [x] **SYNC-05**: Sync API rejects oversized batches and oversized entry fields with clear per-item or request-level errors.
- [x] **SYNC-06**: Direct entry save and batch sync use one shared server-side entry validation contract.
- [x] **SYNC-07**: Conflict handling is defined and covered for server-newer, client-newer, duplicate, and clock-skew scenarios.
- [ ] **SYNC-08**: Beta documentation and UI do not promise full fresh-device restore unless a restore/pull flow is implemented and verified.

### Authentication & Abuse Protection

- [ ] **AUTH-01**: Magic-link request flow verifies Cloudflare Turnstile or equivalent server-side before sending mail.
- [ ] **AUTH-02**: Magic-link request flow applies segmented rate limits by IP and email without leaking account existence.
- [ ] **AUTH-03**: Magic-link consume flow safely rejects invalid, expired, reused, tampered, or wrong-signature tokens.
- [ ] **AUTH-04**: Expired and used magic-link tokens are cleaned up by a scheduled or documented operational command.
- [ ] **AUTH-05**: Session cookie and remember-device behavior are configured and documented for beta production.
- [ ] **AUTH-06**: Session-authenticated write routes have an explicit, tested CSRF or token-auth posture.

### Observability

- [ ] **OBS-01**: Backend exceptions and frontend runtime errors are captured with environment and release context.
- [ ] **OBS-02**: Auth, sync, queue, notification, and admin flows emit low-cardinality operational events or logs.
- [ ] **OBS-03**: Observability scrubs private journal content, magic-link tokens, and personally sensitive data.
- [ ] **OBS-04**: Critical beta failure signals have documented alert or review paths.
- [ ] **OBS-05**: Queue and scheduler health can be checked without manually inspecting the database.

### Production Readiness

- [ ] **OPS-01**: Hosting/deploy runbook documents exact build, migrate, queue worker, scheduler, and rollback commands.
- [ ] **OPS-02**: Production mail setup documents provider choice, sender configuration, SPF, DKIM, DMARC, and test procedure.
- [ ] **OPS-03**: Backup runbook documents database backup schedule, storage location, retention, and responsible checks.
- [ ] **OPS-04**: Restore runbook documents and verifies a restore drill into a clean environment.
- [ ] **OPS-05**: Beta go/no-go checklist covers auth, sync, notifications, observability, backup/restore, tests, and known risks.

### Notifications

- [ ] **NOTIF-01**: User can opt in or out of the first notification channel.
- [ ] **NOTIF-02**: Notification scheduling respects the user's saved timezone.
- [ ] **NOTIF-03**: Notification delivery runs through the queue and records intent, channel, status, and failure reason.
- [ ] **NOTIF-04**: User can see and update notification preference state in Settings.
- [ ] **NOTIF-05**: Admin/support view can inspect notification status without exposing private journal content.
- [ ] **NOTIF-06**: Notification MVP uses one verified channel before adding push, SMS, or multiple reminder types.

### Admin Support

- [ ] **ADMIN-01**: Only authorized admins can access internal support pages.
- [ ] **ADMIN-02**: Admin can look up a user by email and see account, auth, sync, and notification status.
- [ ] **ADMIN-03**: Admin support views minimize or exclude private journal entry content.
- [ ] **ADMIN-04**: Narrow support actions are policy-gated and audited.
- [ ] **ADMIN-05**: Non-admin users are blocked from all admin routes and actions.

### Friend-Share Experience

- [ ] **BETA-01**: Friend-facing onboarding explains local-first capture, optional sync, privacy posture, and beta expectations.
- [ ] **BETA-02**: Magic-link request, delivery delay, invalid link, save failure, sync failure, and notification failure states are visible and actionable.
- [ ] **BETA-03**: Product sharing copy encourages sharing the app without sharing private entries.
- [ ] **BETA-04**: Demo/local seeding behavior cannot accidentally clear or flood a real guest user's local entries in production.

### Testing & CI

- [ ] **TEST-01**: PHP feature tests cover magic-link request, consume, logout, throttling, cleanup, and invalid token cases.
- [ ] **TEST-02**: PHP feature tests cover auth protection, CSRF/token posture, entry validation, sync conflicts, rejected entries, and batch limits.
- [ ] **TEST-03**: PHP feature tests cover timezone-sensitive date resolution and notification scheduling.
- [ ] **TEST-04**: Browser or frontend tests cover IndexedDB local save, sync status transitions, offline/error states, and friend-facing failure states.
- [ ] **TEST-05**: Admin authorization and audit behavior are covered by automated tests.
- [ ] **TEST-06**: Final quality gate runs typecheck, build, PHP tests, static analysis, formatting, and GrumPHP successfully.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sync & Data

- **DATA-01**: User can restore full historical entries into a fresh browser from server data.
- **DATA-02**: User can delete account and purge server data through a self-service flow.
- **DATA-03**: User can import entries from another journal format.

### Notifications

- **NCHN-01**: User can receive web push notifications.
- **NCHN-02**: User can receive SMS notifications.
- **NCHN-03**: User can configure multiple reminder schedules.

### Product

- **PROD-01**: User can tag or categorize entries.
- **PROD-02**: User can attach media to entries.
- **PROD-03**: User can use AI-assisted prompts, summaries, or insights.
- **PROD-04**: User can use a native mobile app.
- **PROD-05**: User can participate in social feeds, comments, shared journals, or public gratitude streams.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Broad marketing campaign | Beta scope is friend-shareable readiness and direct sharing, not acquisition. |
| Multiple notification channels in MVP | One verified channel is easier to operate and debug. |
| End-to-end encrypted sync claim | Requires separate product, cryptography, recovery, and support design. |
| Social feed or shared journal | Not required for the private daily reflection core value. |
| Raw admin CRUD over all models | Too risky for private journal content and unnecessary for beta support. |
| Native mobile application | Web-first beta should validate value before platform expansion. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | Phase 1 | Complete |
| SYNC-02 | Phase 1 | Complete |
| SYNC-03 | Phase 1 | Pending |
| SYNC-04 | Phase 1 | Complete |
| SYNC-05 | Phase 1 | Complete |
| SYNC-06 | Phase 1 | Complete |
| SYNC-07 | Phase 1 | Complete |
| SYNC-08 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| OBS-01 | Phase 3 | Pending |
| OBS-02 | Phase 3 | Pending |
| OBS-03 | Phase 3 | Pending |
| OBS-04 | Phase 3 | Pending |
| OBS-05 | Phase 3 | Pending |
| OPS-01 | Phase 4 | Pending |
| OPS-02 | Phase 4 | Pending |
| OPS-03 | Phase 4 | Pending |
| OPS-04 | Phase 4 | Pending |
| OPS-05 | Phase 4 | Pending |
| NOTIF-01 | Phase 5 | Pending |
| NOTIF-02 | Phase 5 | Pending |
| NOTIF-03 | Phase 5 | Pending |
| NOTIF-04 | Phase 5 | Pending |
| NOTIF-05 | Phase 5 | Pending |
| NOTIF-06 | Phase 5 | Pending |
| ADMIN-01 | Phase 6 | Pending |
| ADMIN-02 | Phase 6 | Pending |
| ADMIN-03 | Phase 6 | Pending |
| ADMIN-04 | Phase 6 | Pending |
| ADMIN-05 | Phase 6 | Pending |
| BETA-01 | Phase 7 | Pending |
| BETA-02 | Phase 7 | Pending |
| BETA-03 | Phase 7 | Pending |
| BETA-04 | Phase 7 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |
| TEST-03 | Phase 8 | Pending |
| TEST-04 | Phase 8 | Pending |
| TEST-05 | Phase 8 | Pending |
| TEST-06 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after roadmap creation*
