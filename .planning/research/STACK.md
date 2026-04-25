# Stack Research

**Domain:** Beta-readiness additions for an existing Laravel 13 + Inertia React local-first gratitude journal
**Researched:** 2026-04-25
**Confidence:** HIGH for Laravel-native recommendations; MEDIUM for hosted service choices because deployment provider is still undecided

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Laravel framework | 13.x, existing 13.6.0 | Backend, auth/session, mail, validation, queues, scheduler, CSRF, rate limiting | Keep Laravel as the center of beta readiness. The target capabilities map directly to first-party Laravel features, and adding parallel frameworks would increase operational risk. Confidence: HIGH |
| PHP | 8.4, existing | Runtime | Matches the app and Laravel Cloud default for new environments. Do not downgrade for beta. Confidence: HIGH |
| Inertia Laravel + React | Existing Inertia v3 / React 19 | User-facing app shell and friend-share onboarding/failure states | Preserve the current Inertia model for product UI. Beta work should not introduce a second frontend architecture except for an isolated admin panel. Confidence: HIGH |
| Dexie | 4.4.2 current npm | IndexedDB local-first storage | Keep Dexie for local capture and sync state. It is already embedded and current; beta work should improve schema/revision handling rather than replace storage. Confidence: HIGH |
| Laravel Notifications + queued mail | Laravel 13 built-in | Notification MVP and delivery verification | Use Laravel notifications for reminder and lifecycle emails, with `mail` as the first channel and optional `database` records for delivery audit/status UI. Queue notifications and dispatch after commit. Confidence: HIGH |
| Postmark via Symfony Mailer | `symfony/postmark-mailer` 8.0.4 existing | Production transactional email | Postmark support is already installed, is a strong fit for magic links and reminder email, and avoids adding a second email provider. Configure SPF/DKIM/DMARC in runbooks. Confidence: HIGH |
| Database queue | Laravel 13 built-in | Notification delivery, token cleanup, support actions | Good enough for friend beta and already configured. Move to Redis only after queue latency or lock contention appears. Set queue `after_commit=true` for notification/job correctness. Confidence: HIGH |
| Laravel Scheduler | Laravel 13 built-in | Daily reminder dispatch, expired token cleanup, backup checks | Use `routes/console.php` schedules and one scheduler process/cron. This is the standard Laravel path and keeps operational tasks in source control. Confidence: HIGH |
| Sentry Laravel + Sentry React | `sentry/sentry-laravel` 4.25.0; `@sentry/react` 10.50.0 | Cross-stack error reporting, frontend errors, performance sampling, critical-flow traces | Best default observability baseline because this app has both Laravel and browser/local-first failure modes. Start with errors, low-rate tracing, release tags, user IDs only after privacy review, and source maps for React. Confidence: HIGH |
| Filament Panel Builder | 5.x, latest observed 5.6.1 | Internal beta admin panel | Standard Laravel admin choice for user lookup, entry/sync status inspection, and simple support actions. Install as an isolated `/admin` panel and authorize with an explicit admin gate/flag. Confidence: MEDIUM-HIGH |
| Cloudflare Turnstile | Current Siteverify API + `@marsidev/react-turnstile` 1.5.0 | Abuse protection for magic-link requests | Use Turnstile only on abuse-prone unauthenticated forms, especially magic-link requests. Validate tokens server-side against Cloudflare Siteverify; the widget alone is not protection. Confidence: HIGH |
| Playwright Test | 1.59.1 | Browser coverage for IndexedDB/offline/sync/failure states | The largest app risk is local-first browser behavior. Add Playwright for workflows PHP tests cannot cover: local save, offline retry, auth transition, rejected sync visibility, and onboarding failure states. Confidence: HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `filament/filament` | `^5.0` | Admin resources, tables, infolists, actions | Use for the admin MVP if the phase includes multiple admin screens or support actions. Install manually for an existing app; do not run broad scaffold commands. |
| `sentry/sentry-laravel` | `^4.25` | Laravel exception and tracing instrumentation | Use in the observability baseline. Configure in `bootstrap/app.php`, publish config, set DSN only outside local/test. |
| `@sentry/react` | `^10.50` | React render/runtime error capture and frontend traces | Use when adding user-facing failure-state instrumentation. Keep replay off by default for privacy unless explicitly approved. |
| `@marsidev/react-turnstile` | `^1.5` | Turnstile widget integration in React | Use on unauthenticated magic-link request forms. Pair with backend Siteverify validation and rate limits. |
| Laravel HTTP client | Laravel 13 built-in | Turnstile Siteverify calls, future provider checks | Prefer this over a Turnstile PHP package so validation rules, timeouts, hostname/action checks, and logging stay explicit. |
| Laravel `RateLimiter` | Laravel 13 built-in | Auth and notification abuse controls | Use named limiters segmented by IP, normalized email hash, and authenticated user ID where relevant. |
| Laravel notification fakes / queue fakes / mail fakes | Laravel 13 built-in | Notification and auth tests | Use in PHP feature tests before any external provider contract tests. |
| `@playwright/test` | `^1.59` | End-to-end/browser tests | Add for local-first and onboarding flows. Configure `webServer` for Laravel/Vite test environment and collect traces on retry. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Existing Pest + Pest Laravel | Backend feature/unit tests | Keep as the default for controllers, actions, validation, notifications, auth hardening, sync conflict rules, scheduled commands, and admin authorization. |
| Existing Larastan/PHPStan + Pint + ESLint + TypeScript | Static safety and formatting | Keep GrumPHP as the final local gate. New beta stack packages should not bypass existing quality checks. |
| Playwright HTML report and trace viewer | Debugging browser failures | Enable trace on first retry in CI. Test Chromium first for MVP; add WebKit only if mobile Safari confidence becomes a beta gate. |
| Sentry releases and source maps | Useful production stack traces | Upload frontend source maps in CI/deploy only after release naming is stable. Do not expose source maps publicly without access control. |
| Laravel logs to stderr/provider log drain | Baseline runbook/debug support | Keep application logs useful even with Sentry. In production, prefer structured context fields for auth, sync batch IDs, notification IDs, and request IDs. |

## Installation

```bash
# Observability baseline
composer require sentry/sentry-laravel
npm install @sentry/react

# Admin MVP
composer require filament/filament:"^5.0"
php artisan filament:install --panels

# Abuse hardening UI
npm install @marsidev/react-turnstile

# Browser workflow tests
npm install -D @playwright/test
npx playwright install --with-deps

# Already present and should remain
composer require symfony/postmark-mailer
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Sentry Laravel + React | Laravel Nightwatch | Use Nightwatch if deploying on Laravel Cloud and the priority is Laravel-only request/job/query/log observability. It has first-party Laravel integration, but it does not replace React/local-first browser error capture. |
| Sentry Laravel + React | Laravel Pulse | Use Pulse only after production uses MySQL/MariaDB/PostgreSQL or a separate supported Pulse database. Official docs say first-party Pulse storage currently requires MySQL, MariaDB, or PostgreSQL, so it is not the first choice for SQLite-first beta. |
| Filament 5 admin panel | Custom Inertia admin screens | Use custom Inertia only if admin scope stays at one or two read-only pages. Once support actions, filters, and resources are needed, Filament is faster and more reviewable. |
| Laravel Notifications + Postmark mail | Web Push / SMS / Slack notifications | Use only after email reminders prove useful. Push adds browser permission, service worker, and deliverability complexity; SMS adds cost, consent, and compliance work. |
| Database queue | Redis queue | Use Redis when queue latency, rate limiter precision, or SQLite/database contention becomes a measured issue. For friend beta, database queue is simpler and already configured. |
| Custom Turnstile validator with Laravel HTTP client | Third-party Laravel Turnstile validation package | Use a package only if it is already maintained for Laravel 13 and materially reduces code. Current needs are small enough that explicit validation is safer. |
| Playwright Test | Laravel Dusk | Use Dusk only if the team strongly prefers PHP-only browser tests. Playwright has stronger modern browser tooling, traces, isolation, and direct IndexedDB/offline controls. |
| Laravel Cloud | Forge/VPS or other PaaS | Use Forge/VPS if cost/control matters more than managed queues/scheduler/Nightwatch integration. Use Laravel Cloud if the beta needs the least ops surface and managed Laravel primitives. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Web Push as the notification MVP | Browser permissions, service workers, device variance, and quiet-delivery behavior create a larger beta surface than the value justifies. | Email notifications through Laravel Notifications and Postmark first. |
| Broad analytics/event pipelines | The stated goal is operational beta readiness, not growth analytics. Privacy-sensitive journaling also raises the bar for behavioral tracking. | Sentry/Nightwatch operational telemetry plus explicit app events for auth/sync/notification failures. |
| Full marketing/email automation platforms for reminders | Adds contact-list semantics and user-data export risks for simple transactional reminders. | Postmark transactional email through Laravel notifications. |
| Replacing magic-link auth with a full auth suite | The existing product already centers on magic links; replacement would mix behavior change with beta hardening. | Harden the current flow with Turnstile, rate limiters, cleanup, session safeguards, and audit logs. |
| Sanctum for current same-origin session write routes | Sanctum is useful for token/SPAs across origins, but this app already uses same-origin Inertia/session auth. Adding Sanctum does not fix the known CSRF exemption by itself. | Restore CSRF/origin protections for session-backed routes and keep same-origin axios CSRF headers. |
| Laravel Pulse as the first observability tool on SQLite | Pulse storage is not SQLite-first and would force a database/platform decision before basic error visibility. | Sentry now; optionally add Pulse later on a supported production database. |
| Filament scaffold overwrite commands in the existing Inertia app | Filament docs warn scaffold commands are suitable for new apps and can overwrite existing files. | Install the panel manually and keep assets/layout changes isolated. |
| Client timestamp-only sync conflict resolution | Existing concerns show clock skew can cause data divergence. | Add server revision/canonical payloads and explicit rejected/conflict states while keeping Dexie. |

## Stack Patterns by Variant

**If beta deploys on Laravel Cloud:**
- Use Laravel Cloud app environment, database resource, queue/background process, scheduler toggle, Postmark, and built-in Nightwatch integration.
- Still use Sentry React or another browser-side error channel if frontend/local-first failures must be visible.
- Because Cloud reduces queue/scheduler/runbook burden and Nightwatch is first-party there.

**If beta deploys on Forge/VPS or a generic PaaS:**
- Use Laravel deployment checklist, `php artisan optimize`, a queue worker supervised by the platform/Supervisor, one scheduler cron, Sentry, Postmark, and provider log drains.
- Because these are portable Laravel primitives and do not lock the app into a managed platform.

**If production remains SQLite for beta:**
- Keep database queue/cache/session only for very small friend beta, document lock/contention risk, and add backup/restore tests.
- Avoid Pulse and high-concurrency queue workloads.
- Because SQLite is operationally simple but not ideal for concurrent session, sync, queue, and admin writes.

**If production moves to PostgreSQL/MySQL for beta:**
- Keep local SQLite for development/test, but run production migrations and backup/restore runbooks against the production engine.
- Consider Pulse after Sentry if internal performance dashboarding becomes useful.
- Because server-side sync, sessions, admin support actions, and queued notifications become less lock-sensitive.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Laravel 13.x | PHP 8.4 | Existing app uses Laravel 13.6.0 and PHP 8.4. Laravel 13 deployment docs require PHP >= 8.3. |
| Filament 5.x | PHP 8.2+, Laravel 11.28+, Tailwind 4.1+ | Compatible with this app's PHP/Laravel/Tailwind versions. Adds Livewire/Alpine surface isolated to admin. |
| `sentry/sentry-laravel` 4.25.0 | Laravel 6-13, PHP 7.2/8.x | Official docs require Laravel 11+ for current guide; Packagist permits illuminate/support ^13. |
| `@sentry/react` 10.50.0 | React SPA/Vite | Official React docs cover client-side React apps built with Vite/custom bundlers and React 19 error hooks. |
| Laravel Nightwatch 1.26.1 | Laravel 10-13, PHP 8.2+ | Strong backend observability option, especially on Laravel Cloud. Requires a running agent unless Cloud manages it. |
| Laravel Pulse 1.7.3 | Laravel 10-13, Livewire 3.6+/4 | Do not choose first on SQLite because official Pulse storage requires MySQL/MariaDB/PostgreSQL. |
| Playwright 1.59.1 | Node latest 20/22/24 | Existing Node 22.12.0 satisfies Playwright system requirements. |
| Dexie 4.4.2 | Browser IndexedDB | Existing dependency is current. Add migrations/revisions rather than replacing. |

## Confidence Assessment

| Recommendation Area | Confidence | Reason |
|---------------------|------------|--------|
| Laravel-native notifications, queues, scheduler, rate limiting, CSRF | HIGH | Verified against Laravel 13 official docs and directly matches existing app architecture. |
| Postmark for email | HIGH | Existing Symfony Postmark bridge is installed and current; transactional email is the right first notification channel. |
| Sentry baseline | HIGH | Official Laravel/React docs and package metadata show current Laravel 13 and React/Vite support. Best fit for cross-stack visibility. |
| Filament admin | MEDIUM-HIGH | Official Filament 5 docs show compatibility and admin-panel fit; risk is added Livewire/asset surface in an Inertia app. |
| Turnstile hardening | HIGH | Cloudflare docs are explicit that server-side Siteverify is mandatory and tokens are short-lived/single-use. |
| Laravel Cloud deployment variant | MEDIUM | Official docs show strong fit, but the project has not selected a hosting provider or cost constraints. |
| Playwright browser tests | HIGH | Official docs support Node 22 and webServer workflows; directly covers known untested IndexedDB/offline behavior. |

## Sources

- https://laravel.com/docs/13.x/notifications — notification channels, database notifications, queued notification behavior.
- https://laravel.com/docs/13.x/queues — queue `after_commit`, job rate limiting, queue middleware.
- https://laravel.com/docs/13.x/scheduling — scheduler definitions and production cron/process requirements.
- https://laravel.com/docs/13.x/routing — named route rate limiters and multiple segmented limits.
- https://laravel.com/docs/13.x/csrf — session CSRF/origin protection for mutating requests.
- https://laravel.com/docs/13.x/deployment — production optimization and deployment baseline.
- https://symfony.com/packages/postmark-mailer — verified `symfony/postmark-mailer` 8.0.4.
- https://symfony.com/doc/master/mailer.html — Postmark DSN support and mailer failover behavior.
- https://docs.sentry.io/platforms/php/guides/laravel/ — Laravel SDK install/configuration, tracing, local/test disabling.
- https://docs.sentry.io/platforms/javascript/guides/react/ — React/Vite setup, React 19 error hooks, source maps.
- https://packagist.org/packages/sentry/sentry-laravel — verified latest stable 4.25.0 and Laravel 13 compatibility.
- https://nightwatch.laravel.com/docs/getting-started/requirements — Nightwatch Laravel/PHP requirements.
- https://nightwatch.laravel.com/docs/getting-started/start-guide — Nightwatch package/agent setup.
- https://packagist.org/packages/laravel/nightwatch — verified latest stable 1.26.1 and Laravel 13 compatibility.
- https://laravel.com/docs/pulse — Pulse capabilities and storage requirement caveat.
- https://packagist.org/packages/laravel/pulse — verified latest stable 1.7.3 and Laravel 13 compatibility.
- https://filamentphp.com/docs/5.x/introduction/installation — Filament 5 requirements and installation path for existing apps.
- https://packagist.org/packages/filament/filament — verified latest stable 5.6.1.
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ — mandatory Siteverify validation, token expiry/single-use, security guidance.
- https://playwright.dev/docs/intro — Playwright install, Node/browser support.
- https://playwright.dev/docs/test-webserver — Playwright webServer configuration for app tests.
- npm registry checks on 2026-04-25: `@playwright/test` 1.59.1, `@sentry/react` 10.50.0, `@marsidev/react-turnstile` 1.5.0, `dexie` 4.4.2.

---
*Stack research for: beta readiness in Gratitude*
*Researched: 2026-04-25*
