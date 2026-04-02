# Status

## Project Snapshot

- Purpose: Daily gratitude journal with local-first capture and optional authenticated sync.
- Environments: Local development and hosted beta target.
- Primary URLs: Local dev default `http://127.0.0.1:8000`; hosted URL TBD.

## Health

- Tests: `php artisan test` passes locally (25 tests / 76 assertions as of 2026-03-21).
- Lint: Frontend build tooling present; dedicated lint command still not documented in repo docs.
- Security alerts: Not currently tracked in this file.
- Dependency status: Managed through Composer/npm lockfiles.
- CI status: Pipeline definition not documented in repo docs.

## Product Readiness

- Timezone support: Implemented for signed-in and guest `/today` resolution, account timezone persistence, and Settings UI editing.
- Timezone behavior: Existing `entry_date` values stay stable; signed-in users resolve "today" from saved account timezone; guests resolve "today" from device/browser timezone.
- Notifications MVP: Daily email reminders can now be configured from Settings with opt-in/out, reminder time selection, and duplicate protection by local date.
- Verification: `php artisan test` and `npm run build` both pass after timezone support changes.

## Hosting

- Provider: TBD.
- Server(s): TBD.
- Workers/queues: Queue listener required for magic-link and async work.
- Storage: SQLite by default in local development.

## Observability

- Error tracking: TBD.
- Logging: Laravel logs available locally via log files / Pail.
- Monitoring: TBD.

## Open Risks

- Hosted production baseline is not fully documented.
- Email deliverability setup is not yet documented.
- Data durability and restore process are not yet documented.
- Frontend test infrastructure is still missing; Settings UI coverage is tracked in backlog.
- Reminder delivery depends on hosted mailer configuration plus a recurring `notifications:send-daily-reminders` invocation.

## Notes

- Keep this file current with concrete environment and health facts.
