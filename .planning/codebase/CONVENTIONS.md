# Coding Conventions

**Analysis Date:** 2026-04-25

## Naming Patterns

**Files:**
- Use Laravel's conventional StudlyCase class filenames for PHP classes under `app/`, such as `app/Actions/Entries/UpsertEntry.php`, `app/Http/Controllers/TodayController.php`, `app/Http/Middleware/NormalizeHtmlEscapedSignature.php`, and `app/Queries/EntryQueries.php`.
- Use StudlyCase React component/page filenames under `resources/js/Components/` and `resources/js/Pages/`, such as `resources/js/Components/AppShell.tsx`, `resources/js/Components/SeoHead.tsx`, `resources/js/Pages/Today.tsx`, and `resources/js/Pages/Settings.tsx`.
- Use lower camelCase utility module filenames under `resources/js/lib/`, such as `resources/js/lib/db.ts`, `resources/js/lib/date.ts`, and `resources/js/lib/export.ts`.
- Use Laravel timestamped snake_case migration filenames under `database/migrations/`, such as `database/migrations/2026_02_12_132221_create_entries_table.php`.
- Use `*Test.php` suffixes for PHP tests under `tests/Feature/` and `tests/Unit/`, such as `tests/Feature/SyncPushTest.php` and `tests/Unit/ExampleTest.php`.

**Functions:**
- Use camelCase for PHP methods, following Laravel conventions: `upsert()` in `app/Http/Controllers/EntryController.php`, `push()` in `app/Http/Controllers/Api/SyncController.php`, `resolveGuestTimezone()` in `app/Http/Controllers/TodayController.php`, and `forUserDate()` in `app/Queries/EntryQueries.php`.
- Use snake_case test method names prefixed with `test_` in PHPUnit-style Pest tests: `test_sync_push_accepts_valid_entries_and_rejects_older_entries_in_same_batch()` in `tests/Feature/SyncPushTest.php` and `test_settings_update_rejects_invalid_timezone()` in `tests/Feature/SettingsUpdateTest.php`.
- Use camelCase for TypeScript functions and handlers: `getDeviceId()`, `upsertLocalEntry()`, and `pushUnsyncedEntries()` in `resources/js/lib/db.ts`; `handleExport()` and `setThemeMode()` in `resources/js/Components/AppShell.tsx`.
- Use PascalCase for React function components: `Today()` in `resources/js/Pages/Today.tsx`, `Settings()` in `resources/js/Pages/Settings.tsx`, and `AppShell()` in `resources/js/Components/AppShell.tsx`.

**Variables:**
- Use camelCase in PHP local variables even when database fields are snake_case: `$entryDate`, `$clientUpdatedAt`, and `$existingUpdatedAtMs` in `app/Actions/Entries/UpsertEntry.php`; `$requestedDate` in `app/Http/Controllers/TodayController.php`.
- Preserve snake_case for request payload keys, database attributes, and JSON fields that map to persisted data: `entry_date`, `updated_at`, `show_flashbacks`, and `server_entry_date` appear in `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/SettingsController.php`, `resources/js/lib/db.ts`, and `resources/js/Pages/Today.tsx`.
- Use camelCase for TypeScript state, locals, and derived values: `isSaving`, `lastSavedAt`, `savedCount`, `resolvedFlashbacks`, and `formattedDate` in `resources/js/Pages/Today.tsx`.
- Use uppercase constants for storage keys and fixed configuration values: `INTRO_COLLAPSED_STORAGE_KEY` in `resources/js/Pages/Today.tsx` and `MAGIC_LINK_REMEMBER_MINUTES` in `app/Http/Controllers/Auth/MagicLinkController.php`.

**Types:**
- Use PascalCase for TypeScript types: `PageProps`, `Flashback`, `LocalSeedRequest`, and `LocalEntry` in `resources/js/Pages/Today.tsx` and `resources/js/lib/db.ts`.
- Use explicit PHP return types on controllers, actions, queries, factories, and models: `JsonResponse` in `app/Http/Controllers/EntryController.php`, `RedirectResponse` in `app/Http/Controllers/SettingsController.php`, `?Entry` in `app/Queries/EntryQueries.php`, and `array` in `database/factories/UserFactory.php`.
- Use PHPDoc array shapes where static analysis needs more detail than PHP types provide: `app/Actions/Entries/UpsertEntry.php` documents the payload and return shape, and `app/Queries/EntryQueries.php` documents the snippet return shape.
- Use PHPDoc generics for Eloquent relationships and factories: `BelongsTo<User, $this>` in `app/Models/Entry.php`, `HasMany<Entry, $this>` in `app/Models/User.php`, and `@extends Factory<User>` in `database/factories/UserFactory.php`.

## Code Style

**Formatting:**
- Use Laravel Pint for PHP formatting. GrumPHP runs the `laravel_pint` task from `grumphp.yml`; no custom `pint.json` is present, so use the Laravel Pint defaults.
- Use four-space indentation in PHP files, as shown in `app/Actions/Entries/UpsertEntry.php`, `routes/web.php`, and `tests/Feature/EntryUpsertTest.php`.
- Use semicolons in TypeScript and TSX, as shown across `resources/js/app.tsx`, `resources/js/lib/db.ts`, and `resources/js/Pages/Settings.tsx`.
- Use four-space indentation in TypeScript/TSX files, matching `resources/js/Components/AppShell.tsx`, `resources/js/Pages/Today.tsx`, and `resources/js/lib/export.ts`.
- No Prettier configuration is present. Follow the existing TSX wrapping style: multi-line props for complex JSX and one-line JSX only for short elements, as in `resources/js/Pages/Today.tsx` and `resources/js/Components/AppShell.tsx`.

**Linting:**
- Use ESLint 9 flat config from `eslint.config.js` for `resources/js/**/*.{js,ts,tsx}`.
- ESLint extends `@eslint/js` recommended rules, `typescript-eslint` recommended rules, and `eslint-plugin-react-hooks` latest recommended rules in `eslint.config.js`.
- Do not use `any`; `@typescript-eslint/no-explicit-any` is set to `error` in `eslint.config.js`.
- Use TypeScript's compiler for frontend type checking. `package.json` defines `npm run typecheck` as `tsc --noEmit`.
- Use Larastan/PHPStan for PHP static analysis. `phpstan.neon` analyzes `app`, `routes`, and `database` at level 6, while `grumphp.yml` runs phpstan for PHP changes with `level: 5` and ignores `tests/`, `config/`, and `routes/` in the GrumPHP task.

## Import Organization

**Order:**
1. PHP imports are grouped after the namespace and sorted by class/package without blank subgroup separators, as shown in `app/Http/Controllers/Auth/MagicLinkController.php`, `app/Http/Controllers/TodayController.php`, and `app/Actions/Entries/UpsertEntry.php`.
2. TypeScript external imports come first: `@inertiajs/react`, `axios`, `react`, `dexie`, and `laravel-vite-plugin/inertia-helpers` in `resources/js/Pages/Today.tsx`, `resources/js/lib/db.ts`, and `resources/js/app.tsx`.
3. TypeScript local component/helper imports follow external imports using relative paths: `../Components/AppShell`, `../Components/SeoHead`, and `../lib/db` in `resources/js/Pages/Today.tsx`; `./BrandName` and `../lib/export` in `resources/js/Components/AppShell.tsx`.
4. Type-only imports are included with the source import when practical using `type`, such as `import { useEffect, useRef, useState, type ReactNode } from 'react';` in `resources/js/Components/AppShell.tsx` and `import Dexie, { type Table } from 'dexie';` in `resources/js/lib/db.ts`.

**Path Aliases:**
- No TypeScript path aliases are configured in `tsconfig.json`; use relative imports under `resources/js/`.
- PHP uses Composer PSR-4 namespaces from `composer.json`: `App\\` maps to `app/`, `Database\\Factories\\` maps to `database/factories/`, `Database\\Seeders\\` maps to `database/seeders/`, and `Tests\\` maps to `tests/`.
- Inertia page resolution uses `resolvePageComponent()` with `./Pages/${name}.tsx` and `import.meta.glob('./Pages/**/*.tsx')` in `resources/js/app.tsx`; add new pages under `resources/js/Pages/`.

## Error Handling

**Patterns:**
- Use Laravel request validation for top-level HTTP inputs. `app/Http/Controllers/EntryController.php` validates `entry_date`, prompt fields, and `updated_at`; `app/Http/Controllers/SettingsController.php` validates `timezone` and `show_flashbacks`; `app/Http/Controllers/Auth/MagicLinkController.php` validates `email`.
- Use per-item validators for batch endpoints where partial success is expected. `app/Http/Controllers/Api/SyncController.php` validates each entry with `Validator::make()` and returns per-entry `status: rejected` plus validation errors while continuing the batch.
- Use `abort_if()` or `abort()` for invalid resources and forbidden auth flows. `app/Http/Controllers/Auth/MagicLinkController.php` rejects invalid magic links with 403, and `app/Http/Controllers/HistoryEntryController.php` aborts 404 for invalid date parsing.
- Catch expected parsing exceptions and fall back deliberately. `app/Http/Controllers/TodayController.php` catches `InvalidFormatException` and uses the current day; `app/Http/Controllers/HistoryEntryController.php` catches `InvalidFormatException` and aborts.
- Throw regular `Error` objects for impossible frontend/local data states. `resources/js/lib/db.ts` throws when `entry_date` is missing during local upsert and when local seeding cannot resolve an end date.
- For user-facing frontend operations, handle failures with local UI state rather than surfacing raw exceptions. `resources/js/Components/AppShell.tsx` catches export failures and sets `Export failed. Please try again.`; `resources/js/Pages/Today.tsx` uses `finally` to clear saving state.
- Fire-and-forget background sync errors are intentionally swallowed in page effects. `resources/js/Pages/Today.tsx` and `resources/js/Pages/History.tsx` call `pushUnsyncedEntries().catch(() => null)`.

## Logging

**Framework:** Laravel logging via framework defaults; frontend code does not use `console`.

**Patterns:**
- Do not add ad hoc `console.log()` calls in `resources/js/`; existing frontend files such as `resources/js/Pages/Today.tsx`, `resources/js/Components/AppShell.tsx`, and `resources/js/lib/db.ts` avoid console logging.
- Do not add direct `Log::` calls unless there is an explicit observability requirement; existing application code under `app/` and `routes/` does not use direct logging.
- User-visible success/failure feedback is usually session flash or component state: `with('status', ...)` in `app/Http/Controllers/Auth/MagicLinkController.php` and `app/Http/Controllers/SettingsController.php`, and `exportStatus` in `resources/js/Components/AppShell.tsx`.

## Comments

**When to Comment:**
- Keep comments sparse and use them only to explain a non-obvious reason. `app/Http/Controllers/Auth/MagicLinkController.php` comments why passwordless magic-link accounts still receive a random hashed password.
- Avoid comments for direct framework behavior or obvious assignments. Most controllers, components, and utilities such as `app/Http/Controllers/EntryController.php`, `resources/js/lib/date.ts`, and `resources/js/Pages/Settings.tsx` are self-documenting.

**JSDoc/TSDoc:**
- TypeScript code uses explicit types instead of JSDoc/TSDoc. Add exported types or function signatures in files like `resources/js/lib/db.ts` and `resources/js/lib/export.ts` rather than comments.
- PHP uses PHPDoc for static-analysis details that PHP cannot express natively, especially array shapes and Eloquent generics in `app/Actions/Entries/UpsertEntry.php`, `app/Queries/EntryQueries.php`, `app/Models/Entry.php`, and `app/Models/User.php`.

## Function Design

**Size:** Keep backend controller/action/query methods focused on one request or domain operation. Examples: `EntryController::upsert()` in `app/Http/Controllers/EntryController.php`, `UpsertEntry::execute()` in `app/Actions/Entries/UpsertEntry.php`, and `EntryQueries::snippet()` in `app/Queries/EntryQueries.php`. Larger frontend page components such as `resources/js/Pages/Today.tsx` contain local helper functions near the component when helpers are page-specific.

**Parameters:** Use dependency injection for Laravel services and actions: `EntryController::upsert(Request $request, UpsertEntry $upsertEntry)` in `app/Http/Controllers/EntryController.php`, `SyncController::push(Request $request, UpsertEntry $upsertEntry)` in `app/Http/Controllers/Api/SyncController.php`, and `TodayController::show(Request $request, EntryQueries $entryQueries)` in `app/Http/Controllers/TodayController.php`. Use typed object payloads for frontend utility inputs, such as `SeedLocalEntriesOptions` in `resources/js/lib/db.ts`.

**Return Values:** Return concrete Laravel response types from controllers (`JsonResponse`, `RedirectResponse`, `Inertia\Response`) as in `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/SettingsController.php`, and `app/Http/Controllers/TodayController.php`. Return typed promises from async frontend helpers, such as `Promise<LocalEntry>` in `resources/js/lib/db.ts` and `Promise<number>` in `resources/js/lib/export.ts`.

## Module Design

**Exports:** Prefer named exports for shared frontend utilities and types in `resources/js/lib/`, such as `LocalEntry`, `db`, `getEntryByDate()`, `pushUnsyncedEntries()`, `formatHumanDate()`, and `exportEntries()`. Prefer default exports for React pages and components in `resources/js/Pages/` and `resources/js/Components/`, such as `resources/js/Pages/Today.tsx` and `resources/js/Components/AppShell.tsx`.

**Barrel Files:** Not used. Import concrete modules directly, such as `../Components/AppShell` and `../lib/db` in `resources/js/Pages/Today.tsx`. Do not add new `index.ts` barrel files unless the codebase adopts that pattern broadly.

---

*Convention analysis: 2026-04-25*
