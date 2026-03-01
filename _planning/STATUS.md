# Status

## Project Snapshot

- Purpose: Daily gratitude journal with local-first capture and optional authenticated sync.
- Environments: Local development and hosted beta target.
- Primary URLs: Local dev default `http://127.0.0.1:8000`; hosted URL TBD.

## Health

- Tests: Baseline test suite available via `composer test`.
- Lint: Frontend build tooling present; lint command not documented in repo docs.
- Security alerts: Not currently tracked in this file.
- Dependency status: Managed through Composer/npm lockfiles.
- CI status: Pipeline definition not documented in repo docs.

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

## Notes

- Keep this file current with concrete environment and health facts.
