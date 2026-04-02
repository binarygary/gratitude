# Log

Decisions, notable changes, and operational notes.

## Consolidation (2026-03-01)

- Created:
  - `_planning/README.md`
  - `_planning/STATUS.md`
  - `_planning/NOW.md`
  - `_planning/BACKLOG.md`
  - `_planning/CHECKLISTS.md`
  - `_planning/RUNBOOKS.md`
  - `_planning/LOG.md`
  - `_planning/tasks/recurring.md`
  - `_planning/tasks/one_off.md`
- Moved:
  - `PLAN.md` -> `_planning/ROADMAP.md`
- Merged:
  - `PLAN.md` content merged into `_planning/ROADMAP.md` under an imported section.
- Follow-ups:
  - Confirm hosting provider, production URL, and operational runbooks.
  - Review imported beta plan items and split into prioritized backlog tasks.
  - Add CI/observability details to `STATUS.md` once configured.

## Recent

- 2026-03-21: Completed timezone support slice across `/today`, account settings persistence, and Settings UI; verified with `php artisan test` and `npm run build`.
- 2026-04-01: Reprioritized planning to make Notifications MVP the top active beta gate and added `docs/plans/2026-04-01-notifications-mvp.md`.
- 2026-04-01: Implemented daily reminder notification preferences and the `notifications:send-daily-reminders` email delivery command; verified with targeted feature tests and `npm run build`.
