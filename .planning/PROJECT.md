# Gratitude

## What This Is

Gratitude is a Laravel and Inertia React daily reflection app for writing one entry per day across three prompts: person, grace, and gratitude. It works locally first in the browser through IndexedDB, lets users browse prior entries and flashbacks, and offers passwordless magic-link sign-in for authenticated server sync.

The current product goal is to move an existing, functional journal into a stable friend-shareable beta with clearer reliability, security, operational visibility, and support workflows.

## Core Value

Users can capture a daily gratitude reflection with confidence that it is saved, recoverable, and easy to revisit.

## Requirements

### Validated

- ✓ User can write one daily reflection with person, grace, and gratitude prompts — existing
- ✓ Guest users can save entries locally in the browser through IndexedDB — existing
- ✓ Authenticated users can save and sync entries to the Laravel backend — existing
- ✓ User can browse prior entries through History — existing
- ✓ User can see flashbacks from one week ago and one year ago when available — existing
- ✓ User can sign in with passwordless magic links — existing
- ✓ User can configure timezone and flashback preferences in Settings — existing
- ✓ Project can run locally with SQLite-first Laravel defaults and Vite-built React assets — existing
- ✓ Quality tooling exists for PHP tests, PHPStan/Larastan, Pint, TypeScript, ESLint, frontend build, and GitHub Actions — existing
- ✓ Local-first sync reliability now includes explicit sync states, canonical server payload storage, rejected-entry handling, safer conflict behavior, and user-visible recovery affordances — Phase 1

### Active

- [ ] Ship notification MVP with a clear first delivery channel, opt-in/out controls, and delivery verification.
- [ ] Add baseline observability for app errors, request latency, auth, sync, queue jobs, and critical user flows.
- [ ] Build an internal admin MVP for beta operations: user lookup, status visibility, and basic support actions.
- [ ] Harden magic-link authentication and abuse controls for beta, including Turnstile and session/token safeguards.
- [ ] Strengthen production readiness with hosting/deploy documentation, email deliverability, backup/restore runbooks, and a beta go/no-go checklist.
- [ ] Expand test coverage for auth, sync, timezone-sensitive behavior, notifications, and frontend local-first workflows.
- [ ] Improve friend-share onboarding, failure states, and privacy copy without starting broad marketing work.

### Out of Scope

- Broad marketing campaigns — pre-beta scope is friend-shareable product readiness and product-led sharing, not acquisition campaigns.
- Native mobile apps — current app is web-first and should prove beta value before platform expansion.
- Advanced analytics dashboards — MVP observability should focus on operational health and critical flows.
- Full real-time collaboration or social networking — not required for the daily reflection core value.
- Large refactors unrelated to beta gates — changes should remain small and reviewable.

## Context

The codebase is an existing brownfield Laravel 13 monolith with Inertia React pages and local-first browser persistence.

- Backend routes and controllers live in `routes/web.php` and `app/Http/Controllers`.
- Entry write behavior is centralized in `app/Actions/Entries/UpsertEntry.php`.
- Entry read helpers live in `app/Queries/EntryQueries.php`.
- Browser persistence and sync helpers live in `resources/js/lib/db.ts`.
- Primary workflows are implemented in `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, and `resources/js/Pages/Settings.tsx`.
- Magic-link auth is implemented through `app/Http/Controllers/Auth/MagicLinkController.php`, `app/Models/MagicLoginToken.php`, and `app/Mail/MagicLinkMail.php`.
- Current planning context was imported from `_planning/`, whose active focus is beta readiness after timezone support.
- Codebase mapping lives in `.planning/codebase/` and should be treated as the current architecture reference.

Known concerns from the codebase map:

- Sync conflict handling depends on client-provided timestamps and can diverge across devices.
- Rejected sync entries remain unsynced and can retry forever.
- Authenticated write endpoints are currently CSRF-exempt while using session auth.
- Demo/local seeding query parameters can affect guest IndexedDB state in production bundles.
- Frontend local-first behavior has limited automated coverage.
- Production hosting, email deliverability, observability, backup, and restore processes need clearer implementation and documentation.

## Constraints

- **Tech stack**: Preserve Laravel 13, PHP 8.4, Inertia React, TypeScript, Vite, Tailwind, daisyUI, Dexie, and SQLite-first defaults unless a phase explicitly changes them.
- **Auth model**: Preserve passwordless magic-link sign-in unless authentication hardening requires narrowly scoped changes.
- **Local-first behavior**: Guest writing must continue to work without sign-in, and authenticated sync must not make local capture feel unreliable.
- **Reviewability**: Prefer stacked pull requests around foundation, core behavior, integration, UI, and cleanup. Each PR should be independently reviewable and roughly 100-300 lines when practical.
- **Verification**: Use `composer test`, targeted `php artisan test --filter=...`, `npm run typecheck`, `npm run build`, and `XDEBUG_MODE=off vendor/bin/grumphp run` according to risk.
- **Deployment posture**: Keep local and cloud-ready development SQLite-first, but document any production database and worker requirements before beta use.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat the existing app as brownfield scope | The repo already contains working journaling, magic-link auth, local-first save, history, settings, tests, and CI | ✓ Good |
| Use the generated `.planning/codebase/` map as planning input | The map captures stack, architecture, integrations, conventions, testing, and concerns before GSD initialization | — Pending |
| Focus the next milestone on friend-shareable beta readiness | `_planning/ROADMAP.md` and `_planning/BACKLOG.md` identify beta gates as the active product objective | — Pending |
| Keep web-first, local-first capture as the product center | The core value depends on daily capture working quickly and reliably, even before sign-in | — Pending |
| Reuse saved GSD defaults for workflow configuration | `~/.gsd/defaults.json` exists and matches a high-structure workflow with research, checks, verifier, and fine granularity | — Pending |
| Complete sync hardening before auth hardening | Phase 1 established canonical sync responses, explicit browser sync states, recoverable rejected/conflict paths, and honest restore-limit copy before exposing the app to broader beta traffic | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 after Phase 1*
