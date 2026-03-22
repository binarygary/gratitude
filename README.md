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
XDEBUG_MODE=off vendor/bin/grumphp run
```

Current baseline tests are in:
- `tests/Feature`
- `tests/Unit`
