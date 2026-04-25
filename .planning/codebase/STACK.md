# Technology Stack

**Analysis Date:** 2026-04-25

## Languages

**Primary:**
- PHP 8.4 - Laravel application code in `app/`, routes in `routes/`, database migrations/factories/seeders in `database/`, and Pest tests in `tests/`. Required by `composer.json`.
- TypeScript 5.9.3 - React/Inertia frontend entry point and pages in `resources/js/app.tsx`, `resources/js/Pages/`, `resources/js/Components/`, and `resources/js/lib/`.

**Secondary:**
- JavaScript ES modules - Vite and tooling config in `vite.config.js`, `eslint.config.js`, and browser bootstrap in `resources/js/bootstrap.js`.
- CSS - Tailwind/DaisyUI application stylesheet in `resources/css/app.css`.
- Blade - Laravel server-rendered shell and mail templates in `resources/views/app.blade.php`, `resources/views/welcome.blade.php`, and `resources/views/emails/auth/magic-link.blade.php`.
- SQL schema via Laravel migrations - SQLite-first schema definitions in `database/migrations/`.

## Runtime

**Environment:**
- PHP `^8.4` from `composer.json`; CI installs PHP 8.4 with `mbstring` and `pdo_sqlite` in `.github/workflows/quality.yml`.
- Node.js `22.12.0` from `.nvmrc`; `package.json` allows Node `>=22.12.0`.
- npm `>=10` from `package.json`.

**Package Manager:**
- Composer - PHP dependencies and scripts in `composer.json`.
- Lockfile: `composer.lock` present.
- npm - frontend dependencies and scripts in `package.json`.
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- Laravel Framework v13.6.0 - MVC backend, routing, auth/session, mail, validation, queues, cache, and Eloquent models in `app/`, `routes/web.php`, and `config/`.
- Inertia Laravel v3.0.6 and `@inertiajs/react` 3.0.3 - server-to-React page bridge via `app/Http/Middleware/HandleInertiaRequests.php`, `resources/views/app.blade.php`, and `resources/js/app.tsx`.
- React 19.2.5 / React DOM 19.2.5 - frontend page/component runtime in `resources/js/Pages/` and `resources/js/Components/`.
- Vite 8.0.10 with `laravel-vite-plugin` 3.0.1 - frontend bundling configured in `vite.config.js`.
- Tailwind CSS 4.2.4 with `@tailwindcss/vite` 4.2.4 - CSS pipeline configured in `vite.config.js` and `resources/css/app.css`.
- DaisyUI 5.5.19 - component/theme plugin available to frontend CSS, with a Vite alias in `vite.config.js`.

**Testing:**
- Pest v4.6.3 with `pestphp/pest-plugin-laravel` v4.1.0 - PHP tests in `tests/Feature/` and `tests/Unit/`.
- PHPUnit 12.5.23 - underlying test runner configured by `phpunit.xml`.
- Laravel test environment uses in-memory SQLite, array mailer/cache/session, and sync queue in `phpunit.xml`.
- Vitest 4.1.5 with fake-indexeddb 6.2.5 - frontend unit tests for Dexie/IndexedDB local-state behavior in `resources/js/**/*.test.ts`, configured by `vitest.config.ts` and `tests/js/setup.ts`.

**Build/Dev:**
- Composer scripts in `composer.json`:
  - `composer setup` installs dependencies, creates `.env` if missing, generates app key, migrates, installs npm packages, and builds assets.
  - `composer dev` runs Laravel server, queue listener, Pail log tailing, and Vite concurrently.
  - `composer test` clears config and runs `php artisan test`.
- npm scripts in `package.json`:
  - `npm run dev` starts Vite.
  - `npm run build` builds frontend assets.
  - `npm run test:unit` runs Vitest frontend unit tests.
  - `npm run typecheck` runs `tsc --noEmit`.
  - `npm run lint` runs ESLint against `resources/js`.
- GrumPHP v2.20.0 coordinates quality checks in `grumphp.yml`.
- Laravel Pint v1.29.1 formats PHP through the GrumPHP `laravel_pint` task in `grumphp.yml`.
- Larastan v3.9.6 / PHPStan runs static analysis with config in `phpstan.neon`.
- ESLint 9.39.4 and `typescript-eslint` 8.57.1 lint frontend code through `eslint.config.js` and `grumphp.yml`.

## Key Dependencies

**Critical:**
- `laravel/framework` v13.6.0 - backend framework, Eloquent, validation, queues, cache, session, mail, routing.
- `inertiajs/inertia-laravel` v3.0.6 and `@inertiajs/react` 3.0.3 - page delivery between Laravel controllers and React views.
- `react` 19.2.5 and `react-dom` 19.2.5 - frontend UI runtime.
- `dexie` 4.4.2 - IndexedDB wrapper for local-first journal entries in `resources/js/lib/db.ts`.
- `axios` 1.15.2 - browser HTTP client configured in `resources/js/bootstrap.js` and used for entry upsert/sync in `resources/js/Pages/Today.tsx` and `resources/js/lib/db.ts`.
- `vitest` 4.1.5 and `fake-indexeddb` 6.2.5 - Node-based frontend unit testing for IndexedDB-backed local state.
- `symfony/postmark-mailer` v8.0.4 - Postmark mail transport support configured by `config/mail.php`.
- `symfony/http-client` v8.0.8 - HTTP transport support for Symfony/Laravel mail integrations.

**Infrastructure:**
- SQLite via PDO - default database connection in `config/database.php`, local database path `database/database.sqlite`, and in-memory testing in `phpunit.xml`.
- Database-backed cache, queues, and sessions - default stores in `config/cache.php`, `config/queue.php`, and `config/session.php`.
- Laravel Pail v1.2.6 - local log tailing used by `composer dev`.
- Laravel Tinker v3.0.2 - interactive Laravel shell from `composer.json`.
- Concurrently 9.0.1 - local multi-process dev orchestration in `composer dev`.
- Optional Linux native packages in `package.json` and `.github/workflows/quality.yml`: `@rolldown/binding-linux-x64-gnu`, `@tailwindcss/oxide-linux-x64-gnu`, and `lightningcss-linux-x64-gnu`.

## Configuration

**Environment:**
- Environment files exist at `.env` and `.env.example`; contents were not read.
- Laravel environment values are consumed through `config/app.php`, `config/auth.php`, `config/cache.php`, `config/database.php`, `config/filesystems.php`, `config/logging.php`, `config/mail.php`, `config/queue.php`, `config/services.php`, and `config/session.php`.
- Core required deployment values: `APP_KEY`, `APP_ENV`, `APP_URL`, `DB_CONNECTION`, `DB_DATABASE`, `MAIL_MAILER`, `QUEUE_CONNECTION`, `CACHE_STORE`, and `SESSION_DRIVER`.
- Mail provider values are configured through `MAIL_*`, `POSTMARK_TOKEN`, `POSTMARK_API_KEY`, `RESEND_API_KEY`, and AWS SES variables in `config/mail.php` and `config/services.php`.
- Optional cloud/storage/queue/cache values are exposed through `AWS_*`, `SQS_*`, `REDIS_*`, `MEMCACHED_*`, and `DYNAMODB_*` variables in `config/filesystems.php`, `config/queue.php`, `config/database.php`, and `config/cache.php`.

**Build:**
- `vite.config.js` defines Laravel/Vite inputs `resources/css/app.css` and `resources/js/app.tsx`, enables refresh, registers Tailwind, and ignores `storage/framework/views` for Vite watch.
- `vitest.config.ts` runs frontend unit tests in Node, loads `tests/js/setup.ts`, and includes `resources/js/**/*.test.ts`.
- `tsconfig.json` controls TypeScript checking for the frontend.
- `eslint.config.js` controls frontend linting.
- `phpunit.xml` controls PHP test suites and testing environment.
- `grumphp.yml` controls final quality gates: typecheck, ESLint, PHPStan, Pint, Composer validation, and Pest.
- `.github/workflows/quality.yml` runs typecheck, build, and GrumPHP on push to `main` and pull requests.

## Platform Requirements

**Development:**
- PHP 8.4 with SQLite PDO support.
- Composer with dependencies from `composer.lock`.
- Node.js 22.12.0 and npm 10+ with dependencies from `package-lock.json`.
- Local SQLite file at `database/database.sqlite` for default development.
- `.env` file present; `composer setup` creates it from `.env.example` if missing without exposing values.

**Production:**
- Laravel-capable PHP 8.4 runtime.
- Default production application environment in `config/app.php` assumes `APP_ENV=production` unless overridden.
- SQLite works by default through `config/database.php`; MySQL, MariaDB, PostgreSQL, and SQL Server are configured options.
- Database-backed cache, queue, and session storage are defaults through `config/cache.php`, `config/queue.php`, and `config/session.php`.
- Frontend assets are built by `npm run build` through Vite.
- Hosting platform is not detected in repository files; no `Dockerfile`, `docker-compose*`, `Procfile`, `fly.toml`, `render.yaml`, `vercel.json`, `netlify.toml`, or `railway.toml` was detected.

---

*Stack analysis: 2026-04-25*
