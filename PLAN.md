# PLAN.md

## Beta Share Plan (Hosted, Open Signup, Quick Beta)

### Goal
Ship a hosted Gratitude Journal link friends can use without handholding, with acceptable beta-level reliability and security.

### Scope (locked)
- Distribution: Hosted web app
- Access: Anyone with email can sign in
- Quality bar: Quick beta

### Must-Do Work (in order)

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

### Acceptance Criteria

- Friend can request magic link and receive email in inbox.
- Invalid/expired/used links are rejected safely.
- Authenticated save and sync flows succeed across devices.
- Protected routes block unauthenticated access.
- CI passes on clean environment.
- Fresh deploy works from docs without manual fixes.

### Known Defaults / Assumptions

- Open email signup remains enabled for beta.
- Prioritize shipping speed over full production-grade observability.
- Existing route and API shape remain unchanged unless a blocker appears.
