# consider.today

consider.today is a Laravel + Inertia (React) app for daily reflection.

Core behavior:
- Write one entry per day with three prompts: person, grace, gratitude.
- Browse prior entries in History.
- See optional flashbacks from 1 week ago and 1 year ago.
- Sign in with passwordless magic links.
- Work locally-first in the browser (Dexie/IndexedDB) and sync to server when authenticated.

## Project Planning

- Planning index: [`_planning/README.md`](./_planning/README.md)
- Status: [`_planning/STATUS.md`](./_planning/STATUS.md)
- Current focus: [`_planning/NOW.md`](./_planning/NOW.md)
- Backlog: [`_planning/BACKLOG.md`](./_planning/BACKLOG.md)
- Roadmap: [`_planning/ROADMAP.md`](./_planning/ROADMAP.md)
- Runbooks: [`_planning/RUNBOOKS.md`](./_planning/RUNBOOKS.md)
- Recurring tasks: [`_planning/tasks/recurring.md`](./_planning/tasks/recurring.md)

## Tech Stack

- Backend: Laravel 12, PHP 8.2+
- Frontend: Inertia.js + React + Vite + Tailwind + daisyUI
- Database: SQLite by default
- Auth: Email magic links

## Setup

### 1. Prerequisites

- PHP 8.2+
- Composer
- Node.js 22.12+ and npm 10+
- SQLite

### 2. Install and bootstrap

```bash
composer setup
```

`composer setup` will:
- install PHP dependencies
- create `.env` from `.env.example` (if missing)
- generate `APP_KEY`
- run migrations
- install frontend dependencies
- build frontend assets

### Codex Cloud / isolated repo use

This repo is intended to work cleanly as a standalone checkout in Codex cloud.

From the repo root, a fresh session should usually start with:

```bash
composer setup
```

Then use:

```bash
composer test
npm run typecheck
XDEBUG_MODE=off vendor/bin/grumphp run
```

Use `composer dev` only when you need the full local app stack.

### 3. Run the app locally

```bash
composer dev
```

This starts:
- Laravel web server
- queue listener
- Laravel Pail log tailing
- Vite dev server

Open `http://127.0.0.1:8000` (or the URL shown by `php artisan serve`).

## Configuration Notes

- Default local DB is SQLite (`DB_CONNECTION=sqlite`).
- The checked-in `database/database.sqlite` file supports SQLite-first bootstrap in fresh environments.
- Magic-link emails use the `log` mailer by default (`MAIL_MAILER=log`), so links are written to `storage/logs/laravel.log`.
- If you need externally usable magic-link URLs in a cloud session, set `APP_URL` to the active app URL for that session.
- Automated dependency update PRs are configured with Dependabot for both Composer and npm on a weekly cadence. Minor and patch updates are grouped per ecosystem to keep review volume manageable.

### Auth and session beta posture

Magic-link requests use account-enumeration resistant response copy and segmented throttling before mail is sent. Configure these keys per environment:

- `MAGIC_LINK_EXPIRES_MINUTES`
- `MAGIC_LINK_REMEMBER_MINUTES`
- `MAGIC_LINK_REMEMBER_DEFAULT`
- `SESSION_SECURE_COOKIE`
- `SESSION_SAME_SITE`
- `SESSION_LIFETIME`
- `SESSION_DOMAIN`

Beta production recommendations:

- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=lax`
- Host-only `SESSION_DOMAIN=null` unless subdomains are required.
- Database-backed `SESSION_DRIVER=database`.

Magic-link request throttling is segmented by request IP and normalized email address. Accepted and throttled requests use the same public response: `If your email is valid, we sent a sign-in link.`

Expired and used magic-link rows can be removed with:

```bash
php artisan auth:prune-magic-links
```

Scheduler wiring for that command belongs with production operations.

The session-authenticated write routes `/entries/upsert` and `/api/sync/push` are protected by Laravel CSRF. Same-origin Axios requests send the Blade meta token through `X-CSRF-TOKEN`.
Main routes:
- `/today`
- `/history`
- `/settings` (authenticated)

Local dev helper:
- Open `/today?seed=366` to seed anonymous entries into the browser's local Dexie DB.
- Optional query args: `seed_local_end=YYYY-MM-DD`, `seed_local_reset=1`.

## Testing

### Run all tests

```bash
composer test
```

or:

```bash
php artisan test
```

### Run specific tests

```bash
php artisan test --filter=ExampleTest
```

### Test environment details

- PHPUnit is configured in `phpunit.xml`.
- Tests run with `APP_ENV=testing`.
- DB is in-memory SQLite (`DB_DATABASE=:memory:`).
- Mailer is `array` in tests (emails are not sent).
- Final repo-local verification is:

```bash
npm run typecheck
XDEBUG_MODE=off vendor/bin/grumphp run
```

Current baseline tests are in:
- `tests/Feature`
- `tests/Unit`
