# Architecture

**Analysis Date:** 2026-04-25

## Pattern Overview

**Overall:** Laravel 13 monolith with Inertia React pages, local-first browser persistence, and small domain-service slices.

**Key Characteristics:**
- HTTP requests enter through `routes/web.php` and are handled by single-purpose controllers in `app/Http/Controllers`.
- Server-rendered application shell is `resources/views/app.blade.php`; React pages are resolved dynamically from `resources/js/Pages` by `resources/js/app.tsx`.
- Entry writes are local-first in IndexedDB through `resources/js/lib/db.ts`; authenticated users also push server copies through `app/Http/Controllers/EntryController.php` and `app/Http/Controllers/Api/SyncController.php`.
- Reusable entry write behavior lives in `app/Actions/Entries/UpsertEntry.php`; reusable entry read behavior lives in `app/Queries/EntryQueries.php`.
- Eloquent models in `app/Models` map directly to database tables created by `database/migrations`.

## Layers

**Routing Layer:**
- Purpose: Declare web, authentication, settings, entry, sync, and console entry points.
- Location: `routes/web.php`, `routes/console.php`
- Contains: Route definitions, middleware attachment, route names, inline Artisan commands.
- Depends on: Controllers in `app/Http/Controllers`, models in `app/Models` for console commands.
- Used by: Laravel HTTP kernel configured in `bootstrap/app.php`, Artisan command discovery.

**HTTP Controller Layer:**
- Purpose: Validate requests, coordinate domain actions/queries, and return Inertia pages, redirects, or JSON.
- Location: `app/Http/Controllers`
- Contains: Page controllers such as `app/Http/Controllers/TodayController.php`, mutation controllers such as `app/Http/Controllers/EntryController.php`, API controllers such as `app/Http/Controllers/Api/SyncController.php`, auth controllers such as `app/Http/Controllers/Auth/MagicLinkController.php`.
- Depends on: `Illuminate\Http\Request`, Inertia, Eloquent models, `app/Actions/Entries/UpsertEntry.php`, `app/Queries/EntryQueries.php`, mailables in `app/Mail`.
- Used by: Routes in `routes/web.php`.

**Domain Action Layer:**
- Purpose: Encapsulate reusable write-side business behavior that multiple controllers call.
- Location: `app/Actions`
- Contains: `app/Actions/Entries/UpsertEntry.php`, which resolves one entry per user/date and applies last-write-wins using client `updated_at` milliseconds.
- Depends on: `app/Models/Entry.php`, `app/Models/User.php`, Carbon.
- Used by: `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`.

**Query Layer:**
- Purpose: Encapsulate reusable read-side entry queries and response shaping helpers.
- Location: `app/Queries`
- Contains: `app/Queries/EntryQueries.php`, including `forUserDate`, `weekAgo`, `yearAgo`, and `snippet`.
- Depends on: `app/Models/Entry.php`, `app/Models/User.php`, Carbon.
- Used by: `app/Http/Controllers/TodayController.php`, `app/Http/Controllers/HistoryEntryController.php`.

**Persistence Layer:**
- Purpose: Store authenticated account data, server-synced entries, sessions, cache, jobs, and magic-login tokens.
- Location: `app/Models`, `database/migrations`, `database/factories`, `database/seeders`
- Contains: `app/Models/User.php`, `app/Models/Entry.php`, `app/Models/MagicLoginToken.php`; migrations such as `database/migrations/2026_02_12_132221_create_entries_table.php`.
- Depends on: Laravel Eloquent, database configuration in `config/database.php`.
- Used by: Controllers, actions, queries, tests, console commands.

**Inertia Middleware Layer:**
- Purpose: Bridge Laravel responses into shared React props and normalize signed magic-link query strings.
- Location: `app/Http/Middleware`
- Contains: `app/Http/Middleware/HandleInertiaRequests.php`, `app/Http/Middleware/NormalizeHtmlEscapedSignature.php`.
- Depends on: Laravel request/session/auth facilities and Inertia middleware.
- Used by: Web middleware stack configured in `bootstrap/app.php`.

**Frontend Application Layer:**
- Purpose: Render user workflows and coordinate browser-side local state, sync, navigation, theme, auth forms, export, and SEO metadata.
- Location: `resources/js`
- Contains: Inertia bootstrap in `resources/js/app.tsx`, pages in `resources/js/Pages`, shared UI in `resources/js/Components`, browser utilities in `resources/js/lib`.
- Depends on: React, `@inertiajs/react`, Axios, Dexie, Tailwind CSS, daisyUI.
- Used by: Vite build configured in `vite.config.js` and loaded from `resources/views/app.blade.php`.

**Blade Shell Layer:**
- Purpose: Provide the root HTML document, initial meta tags, theme bootstrap script, Vite assets, and Inertia mount point.
- Location: `resources/views`
- Contains: `resources/views/app.blade.php`, email views in `resources/views/emails`.
- Depends on: Laravel Blade, config values, request path checks, Vite, Inertia.
- Used by: Inertia root view configured by `app/Http/Middleware/HandleInertiaRequests.php`.

**Test Layer:**
- Purpose: Verify routes, validation, auth flows, sync behavior, settings updates, and console output.
- Location: `tests`
- Contains: Feature tests such as `tests/Feature/EntryUpsertTest.php`, `tests/Feature/SyncPushTest.php`, `tests/Feature/TodayRouteTest.php`, and base test setup in `tests/Pest.php`.
- Depends on: Pest/PHPUnit, Laravel testing helpers, `Illuminate\Foundation\Testing\RefreshDatabase`.
- Used by: `composer test`, `vendor/bin/grumphp run`, `.github/workflows/quality.yml`.

## Data Flow

**Inertia Page Request:**

1. Browser requests a page such as `/today`, `/history`, `/settings`, or `/policies`.
2. `routes/web.php` dispatches to a controller such as `app/Http/Controllers/TodayController.php`.
3. The controller validates route/query inputs, reads authenticated user state from `Request`, and fetches model data through Eloquent or `app/Queries/EntryQueries.php`.
4. The controller returns `Inertia::render(...)` with page-specific props.
5. `app/Http/Middleware/HandleInertiaRequests.php` adds shared `auth`, `flash`, and `seo` props.
6. `resources/views/app.blade.php` provides the Inertia root, and `resources/js/app.tsx` resolves the requested component from `resources/js/Pages`.

**Local-First Entry Save:**

1. `resources/js/Pages/Today.tsx` keeps prompt values in React state and saves through `saveEntry`.
2. `saveEntry` writes the entry immediately to IndexedDB through `upsertLocalEntry` in `resources/js/lib/db.ts` with `synced_at: null`.
3. If the user is authenticated, `Today.tsx` posts the same payload to `/entries/upsert` using Axios.
4. `app/Http/Controllers/EntryController.php` validates the payload and delegates to `app/Actions/Entries/UpsertEntry.php`.
5. `UpsertEntry` creates or updates `app/Models/Entry.php` for the authenticated `app/Models/User.php` only when the client timestamp is newer than the stored timestamp.
6. On successful server save, `Today.tsx` updates the local IndexedDB record with a fresh `synced_at`.

**Batch Sync Push:**

1. `resources/js/lib/db.ts` finds unsynced local entries through `listUnsyncedEntries`.
2. `pushUnsyncedEntries` posts `device_id` and entry payloads to `/api/sync/push`.
3. `app/Http/Controllers/Api/SyncController.php` validates the batch envelope and validates each entry independently.
4. Valid entries are upserted through `app/Actions/Entries/UpsertEntry.php`; invalid entries receive per-item `rejected` responses.
5. `pushUnsyncedEntries` marks `upserted` and `skipped` entries as synced through `markEntriesSynced`.

**Magic-Link Authentication:**

1. Guest users submit email from `resources/js/Components/AppShell.tsx` to `/auth/magic-link/request`.
2. `app/Http/Controllers/Auth/MagicLinkController.php` validates the email, creates or finds `app/Models/User.php`, stores a hashed token in `app/Models/MagicLoginToken.php`, creates a relative signed URL, and sends `app/Mail/MagicLinkMail.php`.
3. The magic-link email view is `resources/views/emails/auth/magic-link.blade.php`.
4. The consume route `/auth/magic-link/{token}` uses `signed:relative`; `app/Http/Middleware/NormalizeHtmlEscapedSignature.php` handles HTML-escaped signature query names before validation.
5. `MagicLinkController::consume` verifies the token hash, marks it used, logs in through the web guard, regenerates the session, and redirects to `today.show`.

**History Read and Merge:**

1. `app/Http/Controllers/HistoryController.php` returns up to 365 authenticated server entries as snippets.
2. `resources/js/Pages/History.tsx` loads all local IndexedDB entries through `listAllEntries`.
3. `History.tsx` merges server and local entries by normalized `entry_date`, keeping the newest `updated_at`.
4. Search, sort, and open-link behavior are handled client-side in `History.tsx`.

**Settings Update:**

1. `resources/js/Pages/Settings.tsx` uses Inertia `useForm` to post timezone and `show_flashbacks` to `/settings`.
2. `app/Http/Controllers/SettingsController.php` validates timezone and boolean preferences.
3. The authenticated `app/Models/User.php` is updated.
4. A timezone change redirects to `today.show`; unchanged timezone redirects back to `settings.show`.

**State Management:**
- Server state uses Eloquent models in `app/Models` with migrations in `database/migrations`.
- Browser entry state uses Dexie/IndexedDB in `resources/js/lib/db.ts`; `LocalEntry` records are keyed by `local_id` with a unique `entry_date` index.
- Page state uses React hooks inside page components such as `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, and `resources/js/Pages/Settings.tsx`.
- Shared authenticated user, flash, and SEO base URL props come from `app/Http/Middleware/HandleInertiaRequests.php`.
- Theme preference, device ID, intro state, and save count use browser `localStorage` in `resources/js/Components/AppShell.tsx`, `resources/js/lib/db.ts`, and `resources/js/Pages/Today.tsx`.

## Key Abstractions

**Entry Domain Record:**
- Purpose: Represents one daily reflection for one user/date.
- Examples: `app/Models/Entry.php`, `database/migrations/2026_02_12_132221_create_entries_table.php`, `resources/js/lib/db.ts`
- Pattern: Server model with unique `user_id`/`entry_date`; browser mirror with unique `entry_date` and sync metadata.

**UpsertEntry Action:**
- Purpose: Provide the canonical server-side write behavior for direct saves and sync pushes.
- Examples: `app/Actions/Entries/UpsertEntry.php`
- Pattern: Invokable-style service class with an `execute(User $user, array $payload): array` method; returns status plus model.

**EntryQueries:**
- Purpose: Keep repeated entry lookup and snippet formatting outside controllers.
- Examples: `app/Queries/EntryQueries.php`
- Pattern: Small query service injected into controllers by Laravel's container.

**Inertia Page Components:**
- Purpose: Map server `Inertia::render('Name')` calls to React route views.
- Examples: `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, `resources/js/Pages/Settings.tsx`
- Pattern: Default-exported React function components resolved by `resources/js/app.tsx`.

**AppShell:**
- Purpose: Provide navigation, theme switching, auth dropdown, flash/export status, footer links, and page layout.
- Examples: `resources/js/Components/AppShell.tsx`
- Pattern: Shared wrapper component used directly by each page component.

**Local Entry Store:**
- Purpose: Persist entries offline and coordinate eventual sync.
- Examples: `resources/js/lib/db.ts`
- Pattern: Dexie class `GratitudeDb` plus exported functions for reads, writes, seeding, unsynced listing, sync push, and marking synced entries.

**SEO Head Wrapper:**
- Purpose: Keep page-level metadata generation consistent across Inertia pages.
- Examples: `resources/js/Components/SeoHead.tsx`, `resources/views/app.blade.php`
- Pattern: React `<Head>` metadata layered on top of Blade defaults.

**Magic Login Token:**
- Purpose: Store single-use, expiring, hashed auth tokens for passwordless login.
- Examples: `app/Models/MagicLoginToken.php`, `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`
- Pattern: Eloquent model related to `app/Models/User.php`; raw token only appears in generated link/email.

## Entry Points

**HTTP Front Controller:**
- Location: `public/index.php`
- Triggers: Web server requests.
- Responsibilities: Bootstrap Laravel and dispatch HTTP requests.

**Laravel Application Bootstrap:**
- Location: `bootstrap/app.php`
- Triggers: Laravel startup.
- Responsibilities: Register web routes, console routes, health route `/up`, CSRF exceptions for `entries/upsert` and `api/sync/push`, and web middleware ordering.

**Web Routes:**
- Location: `routes/web.php`
- Triggers: Browser navigation, Inertia visits, form posts, Axios JSON requests.
- Responsibilities: Route `/today`, `/history`, `/help`, `/policies`, `/settings`, magic-link auth, `/entries/upsert`, and `/api/sync/push`.

**Console Routes:**
- Location: `routes/console.php`
- Triggers: Artisan command execution.
- Responsibilities: Provide `inspire` and `metrics:counts`.

**React/Inertia Bootstrap:**
- Location: `resources/js/app.tsx`
- Triggers: Vite-loaded browser entry.
- Responsibilities: Load global CSS/bootstrap, resolve Inertia pages from `resources/js/Pages/**/*.tsx`, mount React with `createRoot`, and configure progress color.

**Blade Root View:**
- Location: `resources/views/app.blade.php`
- Triggers: Inertia root view rendering.
- Responsibilities: Set document metadata, theme bootstrap script, Vite entry, `@inertiaHead`, and `@inertia` mount.

**Vite Build Entry:**
- Location: `vite.config.js`
- Triggers: `npm run dev`, `npm run build`, Laravel Vite integration.
- Responsibilities: Compile `resources/css/app.css` and `resources/js/app.tsx`, configure Tailwind CSS plugin, and ignore compiled Blade view changes.

## Error Handling

**Strategy:** Use Laravel validation/abort/redirect behavior on the server and conservative catch/ignore handling for opportunistic browser sync.

**Patterns:**
- Request validation is inline in controllers through `$request->validate(...)`, as in `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`, and `app/Http/Controllers/SettingsController.php`.
- Per-entry sync validation uses `Validator::make(...)` in `app/Http/Controllers/Api/SyncController.php` so one bad item does not reject the whole batch.
- Invalid history dates produce `abort(404)` in `app/Http/Controllers/HistoryEntryController.php`.
- Invalid or expired magic links produce `abort_if(..., 403, ...)` in `app/Http/Controllers/Auth/MagicLinkController.php`.
- Browser sync calls from `resources/js/Pages/Today.tsx` and `resources/js/Pages/History.tsx` catch background `pushUnsyncedEntries()` failures and continue without blocking page rendering.
- Export errors in `resources/js/Components/AppShell.tsx` set user-visible status text.

## Cross-Cutting Concerns

**Logging:** Laravel logging is configured in `config/logging.php`; no custom logging abstraction is present in `app`. Magic-link emails use the configured mailer through `app/Mail/MagicLinkMail.php`, with local defaults documented in `AGENTS.md` as log mailer behavior.

**Validation:** Server-side validation belongs in controllers at request boundaries. Use Laravel validation rules in `app/Http/Controllers/*`; use per-item validators for partial-success batch endpoints like `app/Http/Controllers/Api/SyncController.php`.

**Authentication:** Passwordless magic-link auth is implemented in `app/Http/Controllers/Auth/MagicLinkController.php`, persisted with `app/Models/MagicLoginToken.php`, guarded by session auth middleware in `routes/web.php`, and shared to React through `app/Http/Middleware/HandleInertiaRequests.php`.

**CSRF:** `bootstrap/app.php` exempts `entries/upsert` and `api/sync/push` from CSRF validation; both routes still require `auth` middleware in `routes/web.php`.

**SEO:** Static/default metadata is set in `resources/views/app.blade.php`; page-level overrides and structured data are handled through `resources/js/Components/SeoHead.tsx`.

**Styling/Theming:** Tailwind CSS and daisyUI are configured in `resources/css/app.css` and `vite.config.js`. Runtime theme selection is controlled by `resources/js/Components/AppShell.tsx` and the early theme script in `resources/views/app.blade.php`.

---

*Architecture analysis: 2026-04-25*
