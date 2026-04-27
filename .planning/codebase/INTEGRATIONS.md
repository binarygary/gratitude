# External Integrations

**Analysis Date:** 2026-04-25

## APIs & External Services

**Application HTTP APIs:**
- Internal authenticated sync API - Browser clients push local IndexedDB entries to Laravel.
  - Endpoint: `POST /api/sync/push` in `routes/web.php`.
  - Controller: `app/Http/Controllers/Api/SyncController.php`.
  - Client: `axios` call in `resources/js/lib/db.ts`.
  - Auth: Laravel `auth` middleware/session guard from `config/auth.php`.
- Internal authenticated entry upsert API - Browser clients save today's entry to Laravel.
  - Endpoint: `POST /entries/upsert` in `routes/web.php`.
  - Controller: `app/Http/Controllers/EntryController.php`.
  - Client: `axios` call in `resources/js/Pages/Today.tsx`.
  - Auth: Laravel `auth` middleware/session guard from `config/auth.php`.

**Email Delivery:**
- Laravel Mail - Magic-link sign-in emails.
  - Implementation: `app/Http/Controllers/Auth/MagicLinkController.php` sends `app/Mail/MagicLinkMail.php`.
  - Template: `resources/views/emails/auth/magic-link.blade.php`.
  - Default transport: `log` via `config/mail.php`, so local magic links are written to `storage/logs/laravel.log`.
  - SDK/Client: Laravel Mail/Symfony Mailer, with `symfony/postmark-mailer` v8.0.4 and `symfony/http-client` v8.0.8 installed.
  - Auth: `MAIL_*`, `POSTMARK_TOKEN`, `POSTMARK_API_KEY`, `RESEND_API_KEY`, or AWS SES variables depending on selected mailer in `config/mail.php` and `config/services.php`.

**Optional Third-Party Service Config:**
- Postmark - Configured mail transport and service credentials.
  - SDK/Client: `symfony/postmark-mailer` v8.0.4.
  - Auth: `POSTMARK_TOKEN` in `config/mail.php`; `POSTMARK_API_KEY` in `config/services.php`.
- Resend - Configured service key and mail transport placeholder.
  - SDK/Client: Laravel/Symfony mail transport name in `config/mail.php`; no dedicated `resend/resend-php` package is installed in `composer.lock`.
  - Auth: `RESEND_API_KEY` in `config/services.php`.
- AWS SES - Configured mail transport option.
  - SDK/Client: Laravel mail SES driver configuration in `config/mail.php`; no `aws/aws-sdk-php` package is installed in `composer.lock`.
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION` in `config/services.php`.
- Slack notifications/logging - Configured channels only.
  - SDK/Client: Laravel notification/logging configuration in `config/services.php` and `config/logging.php`.
  - Auth: `SLACK_BOT_USER_OAUTH_TOKEN`, `SLACK_BOT_USER_DEFAULT_CHANNEL`, and `LOG_SLACK_WEBHOOK_URL`.

## Data Storage

**Databases:**
- SQLite - Default database connection for local and app defaults.
  - Connection: `DB_CONNECTION=sqlite`; database path from `DB_DATABASE` or `database/database.sqlite` in `config/database.php`.
  - Client: Laravel Eloquent/PDO SQLite.
  - Schema: `database/migrations/0001_01_01_000000_create_users_table.php`, `database/migrations/2026_02_12_132221_create_entries_table.php`, and `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`.
- In-memory SQLite - Test database.
  - Connection: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:` in `phpunit.xml`.
  - Client: Laravel Eloquent/PDO SQLite.
- MySQL, MariaDB, PostgreSQL, and SQL Server - Configured Laravel connection options, not used by default.
  - Connection: `DB_URL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and driver-specific variables in `config/database.php`.
  - Client: Laravel Database/PDO.

**Browser Storage:**
- IndexedDB - Local-first journal storage.
  - Client: Dexie 4.4.2.
  - Implementation: `resources/js/lib/db.ts` creates database `gratitude_journal` and `entries` table.
  - Sync target: `POST /api/sync/push` in `routes/web.php`.
- Browser `localStorage` - Device ID persistence.
  - Implementation: `getDeviceId()` in `resources/js/lib/db.ts`.
  - Key: `gratitude_device_id`.

**File Storage:**
- Local filesystem by default.
  - Disk: `local` in `config/filesystems.php`, rooted at `storage/app/private`.
  - Public disk: `public` in `config/filesystems.php`, rooted at `storage/app/public`.
- S3-compatible storage configured as optional.
  - Connection: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_URL`, `AWS_ENDPOINT`, `AWS_USE_PATH_STYLE_ENDPOINT` in `config/filesystems.php`.
  - Client: Laravel filesystem S3 disk; no AWS SDK package is installed in `composer.lock`.

**Caching:**
- Database cache is the default.
  - Connection: `CACHE_STORE=database`, `DB_CACHE_CONNECTION`, `DB_CACHE_TABLE`, `DB_CACHE_LOCK_CONNECTION`, `DB_CACHE_LOCK_TABLE` in `config/cache.php`.
  - Schema: `database/migrations/0001_01_01_000001_create_cache_table.php`.
- Array cache is used for tests.
  - Connection: `CACHE_STORE=array` in `phpunit.xml` and `.github/workflows/quality.yml`.
- Redis, Memcached, DynamoDB, file, octane, failover, and null cache stores are configured options in `config/cache.php`.

**Queues:**
- Database queue is the default.
  - Connection: `QUEUE_CONNECTION=database`, `DB_QUEUE_CONNECTION`, `DB_QUEUE_TABLE`, `DB_QUEUE`, `DB_QUEUE_RETRY_AFTER` in `config/queue.php`.
  - Schema: `database/migrations/0001_01_01_000002_create_jobs_table.php`.
- Sync queue is used for tests.
  - Connection: `QUEUE_CONNECTION=sync` in `phpunit.xml` and `.github/workflows/quality.yml`.
- SQS, Redis, Beanstalkd, deferred, background, failover, and null queue drivers are configured options in `config/queue.php`.

## Authentication & Identity

**Auth Provider:**
- Custom passwordless magic-link authentication on Laravel session auth.
  - Implementation: `app/Http/Controllers/Auth/MagicLinkController.php`.
  - Token model: `app/Models/MagicLoginToken.php`.
  - Token schema: `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`.
  - User model: `app/Models/User.php`.
  - User schema: `database/migrations/0001_01_01_000000_create_users_table.php`.
  - Guard: Laravel `web` session guard in `config/auth.php`.
  - Email request route: `POST /auth/magic-link/request` in `routes/web.php`, protected by Turnstile verification and `throttle:magic-link-request`.
  - Consume route: `GET /auth/magic-link/{token}` in `routes/web.php`, protected by relative signed URLs.
  - Logout route: `POST /logout` in `routes/web.php`, protected by `auth`.

**Sessions:**
- Database-backed sessions are the default.
  - Connection: `SESSION_DRIVER=database`, `SESSION_CONNECTION`, and `SESSION_TABLE` in `config/session.php`.
  - Schema: `sessions` table in `database/migrations/0001_01_01_000000_create_users_table.php`.
- Array sessions are used for tests through `phpunit.xml` and `.github/workflows/quality.yml`.

## Monitoring & Observability

**Error Tracking:**
- Dedicated hosted error tracking service not detected.
- Laravel logging channels are configured in `config/logging.php`.

**Logs:**
- Default log channel: `stack` in `config/logging.php`.
- Default stack contents: `single`, writing to `storage/logs/laravel.log`.
- Local development log tailing: `php artisan pail --timeout=0` in the `composer dev` script in `composer.json`.
- Optional log integrations in `config/logging.php`: Slack via `LOG_SLACK_WEBHOOK_URL`, Papertrail via `PAPERTRAIL_URL`/`PAPERTRAIL_PORT`, syslog, stderr, daily files, and null logging.
- Magic-link emails use the log mailer by default through `config/mail.php`, so local sign-in URLs appear in `storage/logs/laravel.log`.

## CI/CD & Deployment

**Hosting:**
- Not detected in repository files.
- No `Dockerfile`, `docker-compose*`, `Procfile`, `fly.toml`, `render.yaml`, `vercel.json`, `netlify.toml`, or `railway.toml` was detected.

**CI Pipeline:**
- GitHub Actions quality workflow in `.github/workflows/quality.yml`.
  - Triggers: pushes to `main` and pull requests.
  - Runtime: Ubuntu latest, PHP 8.4, Node from `.nvmrc`.
  - Services: in-memory SQLite, array cache/mail/session, sync queue through workflow env.
  - Checks: `npm run typecheck`, `npm run build`, and `vendor/bin/grumphp run`.
- Dependabot dependency updates in `.github/dependabot.yml`.
  - Ecosystems: Composer and npm.
  - Schedule: weekly Monday runs.

## Environment Configuration

**Required env vars:**
- Core Laravel: `APP_KEY`, `APP_ENV`, `APP_URL`, `APP_DEBUG`, `APP_NAME`.
- Database: `DB_CONNECTION`, `DB_DATABASE`; optional `DB_URL`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`.
- Mail: `MAIL_MAILER`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`; optional SMTP values `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_URL`.
- Auth/session: `AUTH_GUARD`, `AUTH_MODEL`, `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE`.
- Cache/queue: `CACHE_STORE`, `QUEUE_CONNECTION`.
- Optional providers: `POSTMARK_TOKEN`, `POSTMARK_API_KEY`, `RESEND_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `SQS_PREFIX`, `SQS_QUEUE`, `REDIS_*`, `MEMCACHED_*`, `DYNAMODB_*`, `SLACK_BOT_USER_OAUTH_TOKEN`, `LOG_SLACK_WEBHOOK_URL`, `PAPERTRAIL_URL`, `PAPERTRAIL_PORT`.

**Secrets location:**
- `.env` file present - contains environment configuration and was not read.
- `.env.example` file present - template exists and was not read because `.env.*` files are excluded from mapping reads.
- GitHub Actions workflow uses non-secret testing values inline in `.github/workflows/quality.yml`.

## Webhooks & Callbacks

**Incoming:**
- No external webhook receiver routes detected in `routes/web.php`.
- Internal browser-origin callbacks/API posts:
  - `POST /entries/upsert` in `routes/web.php`.
  - `POST /api/sync/push` in `routes/web.php`.
  - `POST /auth/magic-link/request` in `routes/web.php`.
  - `GET /auth/magic-link/{token}` in `routes/web.php`.

**Outgoing:**
- Outgoing email via Laravel Mail from `app/Http/Controllers/Auth/MagicLinkController.php`.
- Optional external mail transports configured in `config/mail.php`: SMTP, Postmark, SES, Resend, Sendmail, failover, and round-robin.
- Optional Slack logging/notifications configured in `config/logging.php` and `config/services.php`.
- No direct `Http::`, `fetch()`, or third-party API client calls detected in `app/`, `routes/`, or `resources/js/`; browser `axios` calls target same-origin Laravel routes.

---

*Integration audit: 2026-04-25*
