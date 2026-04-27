# Codebase Structure

**Analysis Date:** 2026-04-25

## Directory Layout

```text
gratitude/
├── app/                    # Laravel application code: controllers, middleware, models, actions, queries, mail
├── bootstrap/              # Laravel bootstrap and provider registration
├── config/                 # Laravel configuration files
├── database/               # SQLite database, migrations, factories, and seeders
├── docs/                   # Project planning/design documentation
├── public/                 # Public web root, built assets, favicon, robots, sitemap, social image
├── resources/              # Blade views, React/Inertia frontend, CSS
├── routes/                 # Web and console route definitions
├── storage/                # Laravel runtime storage and logs
├── tests/                  # Feature and unit tests
├── _planning/              # Project planning workspace
├── .planning/codebase/     # Generated codebase map documents
├── composer.json           # PHP dependencies and Laravel scripts
├── package.json            # Node dependencies and frontend scripts
├── vite.config.js          # Vite/Laravel/Tailwind build configuration
├── tsconfig.json           # TypeScript configuration for resources/js
├── phpunit.xml             # PHP test configuration
├── phpstan.neon            # Larastan/PHPStan configuration
├── grumphp.yml             # Quality gate configuration
└── eslint.config.js        # Frontend lint configuration
```

## Directory Purposes

**`app/`:**
- Purpose: Laravel application layer.
- Contains: HTTP controllers, middleware, Eloquent models, mailables, domain actions, query services, service providers.
- Key files: `app/Http/Controllers/TodayController.php`, `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`, `app/Actions/Entries/UpsertEntry.php`, `app/Queries/EntryQueries.php`, `app/Models/Entry.php`, `app/Models/User.php`.

**`app/Actions/`:**
- Purpose: Write-side domain operations that should be reused by multiple controllers.
- Contains: Namespaced action classes grouped by domain.
- Key files: `app/Actions/Entries/UpsertEntry.php`.

**`app/Http/Controllers/`:**
- Purpose: HTTP request handlers for pages, redirects, JSON endpoints, and auth.
- Contains: Top-level page/mutation controllers, nested `Api` controllers, nested `Auth` controllers.
- Key files: `app/Http/Controllers/TodayController.php`, `app/Http/Controllers/HistoryController.php`, `app/Http/Controllers/HistoryEntryController.php`, `app/Http/Controllers/SettingsController.php`, `app/Http/Controllers/Auth/MagicLinkController.php`.

**`app/Http/Middleware/`:**
- Purpose: Request/response middleware for Inertia shared props and signed-link normalization.
- Contains: `app/Http/Middleware/HandleInertiaRequests.php`, `app/Http/Middleware/NormalizeHtmlEscapedSignature.php`.
- Key files: `app/Http/Middleware/HandleInertiaRequests.php`.

**`app/Mail/`:**
- Purpose: Laravel mailables.
- Contains: Magic-link email class.
- Key files: `app/Mail/MagicLinkMail.php`.

**`app/Models/`:**
- Purpose: Eloquent model definitions and relationships.
- Contains: User, entry, and magic-login-token models.
- Key files: `app/Models/User.php`, `app/Models/Entry.php`, `app/Models/MagicLoginToken.php`.

**`app/Queries/`:**
- Purpose: Read-side query helpers used by controllers.
- Contains: Query service classes.
- Key files: `app/Queries/EntryQueries.php`.

**`bootstrap/`:**
- Purpose: Laravel application bootstrap.
- Contains: Application configuration and provider list.
- Key files: `bootstrap/app.php`, `bootstrap/providers.php`.

**`config/`:**
- Purpose: Framework and package configuration.
- Contains: Auth, app, cache, database, filesystems, logging, mail, queue, services, session config.
- Key files: `config/app.php`, `config/auth.php`, `config/database.php`, `config/mail.php`, `config/session.php`.

**`database/`:**
- Purpose: Local SQLite database plus schema/data scaffolding.
- Contains: `database/database.sqlite`, migration files, factories, seeders.
- Key files: `database/migrations/2026_02_12_132221_create_entries_table.php`, `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`, `database/factories/UserFactory.php`, `database/seeders/DatabaseSeeder.php`.

**`docs/`:**
- Purpose: Human-readable implementation and design plans.
- Contains: Markdown planning docs.
- Key files: `docs/plans/2026-03-21-timezone-support.md`, `docs/plans/2026-03-21-timezone-support-design.md`.

**`public/`:**
- Purpose: Web-accessible assets and Laravel front controller.
- Contains: `public/index.php`, static assets, built Vite assets under `public/build`.
- Key files: `public/index.php`, `public/favicon.ico`, `public/social-preview.png`, `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`.

**`resources/css/`:**
- Purpose: Frontend stylesheet entry and theme customization.
- Contains: Tailwind CSS import, daisyUI plugin config, custom theme tokens, Tailwind source directives.
- Key files: `resources/css/app.css`.

**`resources/js/`:**
- Purpose: React/Inertia frontend application.
- Contains: Browser bootstrap files, page components, shared components, and frontend utilities.
- Key files: `resources/js/app.tsx`, `resources/js/bootstrap.js`, `resources/js/Pages/Today.tsx`, `resources/js/Components/AppShell.tsx`, `resources/js/lib/db.ts`.

**`resources/js/Pages/`:**
- Purpose: Inertia page components matched by server `Inertia::render(...)` names.
- Contains: Route-level React components.
- Key files: `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, `resources/js/Pages/HistoryEntry.tsx`, `resources/js/Pages/Settings.tsx`, `resources/js/Pages/Help.tsx`, `resources/js/Pages/Policies.tsx`.

**`resources/js/Components/`:**
- Purpose: Reusable React UI pieces used across pages.
- Contains: Layout shell, prompt cards, flashback cards, SEO head wrapper, brand mark.
- Key files: `resources/js/Components/AppShell.tsx`, `resources/js/Components/PromptCard.tsx`, `resources/js/Components/FlashbackCard.tsx`, `resources/js/Components/SeoHead.tsx`, `resources/js/Components/BrandName.tsx`.

**`resources/js/lib/`:**
- Purpose: Browser-side utility modules and local-first persistence.
- Contains: Date formatting, Dexie database/sync helpers, export builders.
- Key files: `resources/js/lib/db.ts`, `resources/js/lib/date.ts`, `resources/js/lib/export.ts`.

**`resources/views/`:**
- Purpose: Blade views for the Inertia root shell and email templates.
- Contains: `resources/views/app.blade.php`, welcome view, email templates.
- Key files: `resources/views/app.blade.php`, `resources/views/emails/auth/magic-link.blade.php`, `resources/views/welcome.blade.php`.

**`routes/`:**
- Purpose: Laravel route definitions.
- Contains: Web routes and console commands.
- Key files: `routes/web.php`, `routes/console.php`.

**`storage/`:**
- Purpose: Laravel runtime files.
- Contains: Application storage, compiled views, cache files, sessions, testing storage, logs.
- Key files: `storage/logs/.gitignore`, `storage/framework/views/.gitignore`, `storage/framework/cache/.gitignore`.

**`tests/`:**
- Purpose: PHP automated tests.
- Contains: Feature tests, unit tests, base test case, Pest configuration.
- Key files: `tests/Feature/EntryUpsertTest.php`, `tests/Feature/SyncPushTest.php`, `tests/Feature/TodayRouteTest.php`, `tests/Feature/MagicLinkConsumeTest.php`, `tests/Pest.php`, `tests/TestCase.php`.

**`.github/`:**
- Purpose: Repository automation.
- Contains: GitHub Actions quality workflow and Dependabot config.
- Key files: `.github/workflows/quality.yml`, `.github/dependabot.yml`.

**`_planning/`:**
- Purpose: Project planning artifacts separate from generated codebase maps.
- Contains: Roadmap, now/backlog/status, tasks, runbooks, logs.
- Key files: `_planning/ROADMAP.md`, `_planning/NOW.md`, `_planning/BACKLOG.md`, `_planning/STATUS.md`.

**`.planning/codebase/`:**
- Purpose: Generated codebase analysis for GSD planning/execution workflows.
- Contains: Architecture and structure documents for this focus area.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `public/index.php`: Laravel HTTP front controller.
- `bootstrap/app.php`: Laravel route, middleware, health, and exception bootstrap.
- `routes/web.php`: Web, auth, entry, sync, settings, and policy routes.
- `routes/console.php`: Inline Artisan commands including `metrics:counts`.
- `resources/js/app.tsx`: React/Inertia browser entry.
- `resources/views/app.blade.php`: Root HTML document for Inertia.
- `vite.config.js`: Frontend build entry configuration.

**Configuration:**
- `composer.json`: PHP dependencies and scripts such as `composer setup`, `composer dev`, and `composer test`.
- `package.json`: Frontend dependencies and scripts such as `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`.
- `tsconfig.json`: Strict TypeScript config for `resources/js`.
- `eslint.config.js`: ESLint rules for frontend files.
- `grumphp.yml`: Combined quality gate.
- `phpunit.xml`: Test environment and PHPUnit/Pest configuration.
- `phpstan.neon`: Static analysis configuration.
- `.github/workflows/quality.yml`: CI setup for PHP 8.4, Node from `.nvmrc`, typecheck, build, and GrumPHP.
- `.nvmrc`: Node version for local/CI frontend tooling.

**Core Logic:**
- `app/Actions/Entries/UpsertEntry.php`: Canonical server-side entry create/update behavior.
- `app/Queries/EntryQueries.php`: Reusable date-based entry reads and snippets.
- `resources/js/lib/db.ts`: Local IndexedDB schema, local entry CRUD, seeding, unsynced listing, sync push, and synced marking.
- `resources/js/lib/export.ts`: JSON, CSV, and PDF export generation.
- `resources/js/lib/date.ts`: Date normalization and display formatting.
- `app/Http/Controllers/Auth/MagicLinkController.php`: Passwordless login request, consume, and logout behavior.
- `app/Http/Middleware/HandleInertiaRequests.php`: Shared Inertia props for auth, flash, and SEO.

**Data Models and Schema:**
- `app/Models/User.php`: Authenticated account model and `entries` relationship.
- `app/Models/Entry.php`: Server entry model.
- `app/Models/MagicLoginToken.php`: Magic-link token model.
- `database/migrations/0001_01_01_000000_create_users_table.php`: Users, password reset tokens, sessions.
- `database/migrations/2026_02_12_132221_create_entries_table.php`: Entries table and user/date uniqueness.
- `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`: Magic-login token table and indexes.

**Frontend Pages:**
- `resources/js/Pages/Today.tsx`: Daily prompt workflow, local save, authenticated save, local flashbacks, seeding query support.
- `resources/js/Pages/History.tsx`: Local/server history merge, search, sort, navigation.
- `resources/js/Pages/HistoryEntry.tsx`: Read-only historical day view with local/server resolution.
- `resources/js/Pages/Settings.tsx`: Account settings, timezone, flashbacks, reminder `.ics` generation.
- `resources/js/Pages/Help.tsx`: Static help page.
- `resources/js/Pages/Policies.tsx`: Static policy page.

**Shared Frontend Components:**
- `resources/js/Components/AppShell.tsx`: Layout, navigation, auth form, theme switcher, export controls, footer.
- `resources/js/Components/PromptCard.tsx`: Reusable writing prompt card.
- `resources/js/Components/FlashbackCard.tsx`: Flashback display card.
- `resources/js/Components/SeoHead.tsx`: Page metadata wrapper.
- `resources/js/Components/BrandName.tsx`: Brand wordmark component.

**Testing:**
- `tests/Pest.php`: Feature test base extension and `RefreshDatabase` usage.
- `tests/TestCase.php`: Laravel base test case.
- `tests/Feature/EntryUpsertTest.php`: Direct entry save validation.
- `tests/Feature/SyncPushTest.php`: Batch sync validation and partial success behavior.
- `tests/Feature/TodayRouteTest.php`: Today date/timezone routing behavior.
- `tests/Feature/SettingsUpdateTest.php`: Settings update redirects and validation.
- `tests/Feature/MagicLinkRequestTest.php`: Turnstile-gated magic-link request and throttling behavior.
- `tests/Feature/MagicLinkConsumeTest.php`: Signed magic-link consumption and signature handling.
- `tests/Feature/MetricsCountsCommandTest.php`: Console metrics command.

## Naming Conventions

**Files:**
- Laravel controllers use singular feature names ending in `Controller.php`: `app/Http/Controllers/TodayController.php`, `app/Http/Controllers/EntryController.php`.
- Nested controller namespaces map to folders: `app/Http/Controllers/Api/SyncController.php`, `app/Http/Controllers/Auth/MagicLinkController.php`.
- Domain actions use verb-noun class names: `app/Actions/Entries/UpsertEntry.php`.
- Query services use plural domain names ending in `Queries.php`: `app/Queries/EntryQueries.php`.
- Eloquent models use singular PascalCase: `app/Models/Entry.php`, `app/Models/MagicLoginToken.php`.
- Inertia pages use PascalCase component names under `resources/js/Pages`: `resources/js/Pages/HistoryEntry.tsx`.
- Shared React components use PascalCase under `resources/js/Components`: `resources/js/Components/SeoHead.tsx`.
- Frontend utility modules use lowercase concise names under `resources/js/lib`: `resources/js/lib/db.ts`, `resources/js/lib/date.ts`, `resources/js/lib/export.ts`.
- Feature tests use behavior/topic names ending in `Test.php`: `tests/Feature/SyncPushTest.php`.
- Migrations use Laravel timestamp naming with action/table names: `database/migrations/2026_02_12_132221_create_entries_table.php`.

**Directories:**
- Laravel namespace directories are PascalCase: `app/Actions`, `app/Http`, `app/Models`, `app/Queries`.
- React page/component directories are PascalCase: `resources/js/Pages`, `resources/js/Components`.
- Browser utility directory is lowercase: `resources/js/lib`.
- Tests are grouped by type: `tests/Feature`, `tests/Unit`.

## Where to Add New Code

**New Inertia Page:**
- Route: Add a named route in `routes/web.php`.
- Controller: Add a controller in `app/Http/Controllers/{Feature}Controller.php` that returns `Inertia::render('{Feature}')`.
- Page component: Add `resources/js/Pages/{Feature}.tsx`.
- Shared layout: Wrap the page with `resources/js/Components/AppShell.tsx`.
- Metadata: Use `resources/js/Components/SeoHead.tsx`; add initial Blade metadata in `resources/views/app.blade.php` when the route should have useful non-JS defaults.
- Tests: Add route/page behavior tests under `tests/Feature/{Feature}RouteTest.php` or a feature-specific test name.

**New Authenticated Server Mutation:**
- Route: Add the route in `routes/web.php` with `auth` middleware.
- Controller: Add or extend a controller in `app/Http/Controllers`.
- Validation: Validate at the controller boundary with `$request->validate(...)`.
- Reusable behavior: Put shared write behavior in `app/Actions/{Domain}` rather than duplicating it between controllers.
- Tests: Add feature tests in `tests/Feature` that cover auth, validation, and persistence.

**New JSON API Endpoint:**
- Route: Add the endpoint in `routes/web.php`; use `app/Http/Controllers/Api` for API-style controllers.
- Controller: Add `app/Http/Controllers/Api/{Feature}Controller.php`.
- Partial batch behavior: Use per-item `Validator::make(...)` when one invalid item should not fail the whole request, matching `app/Http/Controllers/Api/SyncController.php`.
- Tests: Add endpoint tests under `tests/Feature` with `postJson` or related JSON helpers.

**New Entry Read Behavior:**
- Primary code: Add methods to `app/Queries/EntryQueries.php` when the read is reused by multiple controllers.
- Controller usage: Inject `EntryQueries` into controller methods as in `app/Http/Controllers/TodayController.php`.
- Tests: Cover route-level behavior in `tests/Feature`.

**New Entry Write Behavior:**
- Primary code: Add or extend action classes under `app/Actions/Entries`.
- Controller usage: Inject the action into controllers, following `app/Http/Controllers/EntryController.php`.
- Tests: Cover direct save and sync paths when the behavior affects both `app/Http/Controllers/EntryController.php` and `app/Http/Controllers/Api/SyncController.php`.

**New Database Table or Column:**
- Migration: Add a migration under `database/migrations`.
- Model: Add or update an Eloquent model in `app/Models`.
- Factory: Add or update factories in `database/factories`.
- Tests: Use `RefreshDatabase` feature tests under `tests/Feature`.

**New Shared React Component:**
- Implementation: Add `resources/js/Components/{ComponentName}.tsx`.
- Usage: Import relatively from pages/components, following existing imports such as `../Components/AppShell`.
- Styling: Use Tailwind/daisyUI classes and theme tokens from `resources/css/app.css`.

**New Frontend Utility:**
- Shared helpers: Add `resources/js/lib/{name}.ts`.
- Persistence helpers: Extend `resources/js/lib/db.ts` when the helper touches IndexedDB schema or local sync state.
- Export/date helpers: Extend `resources/js/lib/export.ts` or `resources/js/lib/date.ts` for those domains.

**New Email:**
- Mailable: Add a class under `app/Mail`.
- View: Add Blade email templates under `resources/views/emails`.
- Trigger: Send through a controller or action; keep mail construction out of React components.

**New Console Command:**
- Small inline command: Add to `routes/console.php` when the command is simple like `metrics:counts`.
- Larger command: Add a proper command class under Laravel's console command structure if it grows beyond route-file readability.
- Tests: Add command tests under `tests/Feature`, following `tests/Feature/MetricsCountsCommandTest.php`.

**New Tests:**
- Feature tests: Add to `tests/Feature` for routes, controllers, persistence, auth, validation, and commands.
- Unit tests: Add to `tests/Unit` for isolated pure PHP behavior.
- Frontend tests: Not currently established; add test tooling deliberately before adding frontend test files.

## Special Directories

**`public/build/`:**
- Purpose: Vite production build output.
- Generated: Yes.
- Committed: May be present in the working tree; regenerate through `npm run build`.

**`storage/`:**
- Purpose: Runtime application files, logs, cache, sessions, compiled views, and test storage.
- Generated: Yes.
- Committed: Only placeholder `.gitignore` files should be committed.

**`vendor/`:**
- Purpose: Composer dependency install directory.
- Generated: Yes.
- Committed: No.

**`node_modules/`:**
- Purpose: npm dependency install directory.
- Generated: Yes.
- Committed: No.

**`database/database.sqlite`:**
- Purpose: Local SQLite database for development.
- Generated: Yes.
- Committed: Present in this repository; treat schema changes as migrations in `database/migrations` rather than manual database edits.

**`.env` and `.env.example`:**
- Purpose: Runtime environment configuration template and local environment values.
- Generated: `.env` may be created by `composer setup`; `.env.example` is source-controlled.
- Committed: `.env.example` is committed; `.env` should not be read or committed.

**`.planning/codebase/`:**
- Purpose: Generated architecture/codebase reference docs.
- Generated: Yes.
- Committed: Intended as planning artifacts for GSD workflows.

**`_planning/`:**
- Purpose: Human-maintained project planning and task tracking.
- Generated: No.
- Committed: Yes.

**`.idea/` and `.conductor/`:**
- Purpose: Local IDE/tooling metadata.
- Generated: Yes.
- Committed: Treat as local/tooling-specific unless already tracked by repository policy.

---

*Structure analysis: 2026-04-25*
