# Roadmap

Beta-ready target date: **April 1, 2026**

## Next 30 days

- Ship a stable, friend-shareable beta and make people aware through product-led sharing (not broad marketing).
- Implement timezone support end-to-end (storage, display, scheduling behavior).
- Add notifications foundation (event model, delivery channel choice, initial user controls).
- Add observability baseline (error tracking, performance metrics, request latency visibility).
- Deliver minimal admin panel for beta operations (user lookup, health/status checks, basic support actions).
- Keep beta access open via email sign-in and set expectations on beta reliability.

## Next 60 days

- Harden auth and abuse controls (Turnstile, token/session safeguards, rate limit verification).
- Strengthen production data durability (backup + restore runbook, restore drill).
- Expand test coverage and CI gates for auth, sync, notifications, and timezone-sensitive behavior.
- Improve reliability UX and fallback states for save/sync/email/notification failures.

## Next 90 days

- Use beta feedback to prioritize retention and usability improvements.
- Expand admin/ops tooling based on real support needs.
- Decide post-beta scope (growth loops, deeper analytics, broader launch prep).

## Imported

Imported from `PLAN.md` during consolidation on 2026-03-01.

### Beta Share Plan (Hosted, Open Signup, Quick Beta)

#### Goal
Ship a hosted Gratitude Journal link friends can use without handholding, with acceptable beta-level reliability and security.

#### Scope (locked)
- Distribution: Hosted web app
- Access: Anyone with email can sign in
- Quality bar: Quick beta

#### Must-Do Work (in order)

1. Deployment baseline
- Choose hosting target and document exact deploy/run commands.
- Configure production env:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_URL=https://<your-domain>`
- Ensure queue worker is running in production.

2. Email deliverability for magic links
- Switch from `MAIL_MAILER=log` to real provider.
- Configure SPF, DKIM, DMARC for sending domain.
- Set branded sender (`MAIL_FROM_*`).
- Add UI help text for delayed/missing email.

3. Abuse protection and session hardening
- Keep/tune throttle on magic link request route.
- Add bot friction (Turnstile or equivalent) on magic-link form.
- Set secure cookies for production:
  - `SESSION_SECURE_COOKIE=true`
- Add cleanup for expired/used magic tokens.

4. Data durability
- Use persistent managed DB for hosted beta.
- Set daily backups + basic restore procedure.
- Document backup/restore process.

5. Critical tests (currently minimal)
- Feature tests: magic link request/consume/logout.
- Feature tests: auth protection on write/sync/settings routes.
- Unit/feature tests: upsert conflict logic (`updated_at` newest wins).
- Feature tests: sync push response and mark-synced behavior.

6. CI and version pinning
- Add CI pipeline:
  - install deps
  - `composer test`
  - `npm run build`
- Pin Node to supported version (`22.12+`), via `.nvmrc` or `engines`.

7. Friend-facing polish
- Replace default app/env branding values.
- Add short "how it works" copy (local-first + optional sync).
- Add basic error states for save/sync/email failures.
- Add short privacy note.

#### Acceptance Criteria

- Friend can request magic link and receive email in inbox.
- Invalid/expired/used links are rejected safely.
- Authenticated save and sync flows succeed across devices.
- Protected routes block unauthenticated access.
- CI passes on clean environment.
- Fresh deploy works from docs without manual fixes.

#### Known Defaults / Assumptions

- Open email signup remains enabled for beta.
- Prioritize shipping speed over full production-grade observability.
- Existing route and API shape remain unchanged unless a blocker appears.
