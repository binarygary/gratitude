# Backlog

Keep items small, actionable, and link to issues/PRs when they exist.

## P0

- [Beta gate] Timezone support complete and verified across create/edit/display + date rollover cases.
- [Beta gate] Notifications MVP shipped with clear user controls and delivery verification.
- [Beta gate] Observability baseline live for app errors, request latency, and critical flows (auth/sync).
- [Beta gate] Admin panel MVP available for beta operations/support.
- [Beta gate] Beta readiness review completed before April 1, 2026 with go/no-go checklist.

## P1

- Add Turnstile to magic-link request flow and verify abuse resistance.
- Harden auth/session settings for production and validate invalid/expired token behavior.
- Add/expand tests for timezone-sensitive logic and notification behavior.
- Improve friend-share onboarding copy to increase awareness via direct sharing.

## P2

- Expand admin panel with audit logs and richer support tooling.
- Add deeper performance dashboards and SLO-style alert thresholds.
- Improve notification personalization and scheduling.

## Security & Maintenance

- Turnstile lifecycle: key rotation, failure-mode handling, and periodic verification.
- Dependency/security updates on a regular cadence.
- Backup + restore drill and runbook validation for production data.
- Review and tune rate limits for auth and sync endpoints.

## Nice to have

- Referral/invite tracking for product-led awareness.
- Additional UX polish and empty/error state improvements.
- Lightweight in-app feedback collection for beta users.
