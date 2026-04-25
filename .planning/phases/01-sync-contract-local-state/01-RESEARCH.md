# Phase 1: Sync Contract & Local State - Research

**Researched:** 2026-04-25
**Domain:** Laravel/Inertia React local-first sync contracts, Dexie/IndexedDB state, validation, conflict handling
**Confidence:** HIGH for backend and codebase facts; MEDIUM-HIGH for frontend test harness recommendations because the harness is not installed yet.

## User Constraints

No phase `CONTEXT.md` exists for this run, so there are no locked discuss-phase decisions to copy. [VERIFIED: gsd init phase-op 1]

### Locked Decisions

- Phase 1 must address `SYNC-01` through `SYNC-08`. [VERIFIED: .planning/REQUIREMENTS.md]
- Fresh-device restore is out of v1 unless a restore/pull flow is implemented and verified; beta copy must not overpromise restore behavior. [VERIFIED: .planning/STATE.md]
- Preserve Laravel 13, PHP 8.4, Inertia React, TypeScript, Vite, Tailwind, daisyUI, Dexie, SQLite-first defaults, passwordless magic-link auth, and local-first capture. [VERIFIED: .planning/PROJECT.md]
- Prefer stacked, independently reviewable PRs around foundation, core behavior, integration, UI/external interfaces, and cleanup/docs, roughly 100-300 lines when practical. [VERIFIED: AGENTS.md]

### Claude's Discretion

- Choose the exact shared validation abstraction, local sync-state schema, and frontend test harness, as long as they preserve the stack and satisfy the phase requirements. [VERIFIED: no phase CONTEXT.md found]

### Deferred Ideas (OUT OF SCOPE)

- Full historical fresh-device restore is v2 unless implemented and verified in this phase. [VERIFIED: .planning/REQUIREMENTS.md]
- Account deletion, import, AI features, native mobile, social feeds, multiple notification channels, and end-to-end encrypted sync claims are out of v1 scope. [VERIFIED: .planning/REQUIREMENTS.md]

## Project Constraints (from AGENTS.md)

- Use the repo root as the working directory for commands. [VERIFIED: AGENTS.md]
- Prefer small, reviewable changes that focus on one concern at a time. [VERIFIED: AGENTS.md]
- Use repository-local files, commands, and documentation as primary context. [VERIFIED: AGENTS.md]
- Keep local/cloud-ready development SQLite-first. [VERIFIED: AGENTS.md]
- Magic-link emails use the `log` mailer locally. [VERIFIED: AGENTS.md]
- Frontend state is local-first through Dexie/IndexedDB, with authenticated sync to Laravel. [VERIFIED: AGENTS.md]
- Run `composer test` for the full PHP suite and use `php artisan test --filter=...` while iterating. [VERIFIED: AGENTS.md]
- Prefer `XDEBUG_MODE=off vendor/bin/grumphp run` as the final handoff gate. [VERIFIED: AGENTS.md]
- Preserve the current SQLite-first and magic-link workflow unless the task explicitly changes it. [VERIFIED: AGENTS.md]

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-01 | User can see local, pending sync, synced, failed, rejected, and conflict states. | Add a persisted `sync_status` enum in Dexie and a small status UI near the save action/history rows. [VERIFIED: .planning/REQUIREMENTS.md; resources/js/lib/db.ts; resources/js/Pages/Today.tsx] |
| SYNC-02 | Server returns canonical entry payload for accepted or skipped sync items. | Update `/api/sync/push` result items to include a full canonical entry payload for `upserted` and `skipped`; reuse the same serializer used by `/entries/upsert`. [VERIFIED: app/Http/Controllers/Api/SyncController.php; app/Http/Controllers/EntryController.php] |
| SYNC-03 | Client stores canonical server data after sync. | Replace `markEntriesSynced(entryDates)` with result-aware local updates that write canonical prompt fields, canonical `updated_at`, `server_entry_date`, and status metadata. [VERIFIED: resources/js/lib/db.ts] |
| SYNC-04 | Rejected entries stop retrying and show recoverable state. | Persist per-item validation errors and set `sync_status: "rejected"` instead of leaving `synced_at: null`; retry only after user edits or chooses retry. [VERIFIED: resources/js/lib/db.ts; tests/Feature/SyncPushTest.php] |
| SYNC-05 | Oversized batches and fields are rejected with clear feedback. | Add shared prompt `max` rules and request-level `entries` array/list/max rules; Laravel applies `max` to strings and arrays by rule semantics. [CITED: https://laravel.com/docs/13.x/validation] |
| SYNC-06 | Direct save and batch sync share one server validation contract. | Introduce one shared entry rule provider and use it from both `EntryController` and `SyncController`. [VERIFIED: duplicated rules in app/Http/Controllers/EntryController.php and app/Http/Controllers/Api/SyncController.php] |
| SYNC-07 | Conflict handling is defined for server-newer, client-newer, duplicate, and clock-skew scenarios. | Keep one-entry-per-day bounded last-writer-wins for accepted items, return canonical server payload for skipped/server-newer items, reject duplicate batch dates, and reject timestamps outside an explicit skew bound. [VERIFIED: app/Actions/Entries/UpsertEntry.php; ASSUMED: exact skew limit needs product/engineering confirmation] |
| SYNC-08 | Beta docs/UI do not promise full fresh-device restore unless verified. | Update Help/Today copy that currently says account sync makes the journal available across devices; say signed-in sync backs up accepted entries and fresh-device full restore is limited unless a pull flow ships. [VERIFIED: resources/js/Pages/Help.tsx; resources/js/Pages/Today.tsx; .planning/STATE.md] |

</phase_requirements>

## Summary

The phase should be planned as a sync contract and local-state migration, not as a UI-only status badge. The current backend has a useful `UpsertEntry` action and existing feature tests, but `/entries/upsert` and `/api/sync/push` duplicate validation rules, `/api/sync/push` returns only `entry_date` and `status`, and the browser marks `upserted`/`skipped` dates as synced without storing server-canonical content. [VERIFIED: app/Actions/Entries/UpsertEntry.php; app/Http/Controllers/EntryController.php; app/Http/Controllers/Api/SyncController.php; resources/js/lib/db.ts]

The current local store has only `synced_at` and `server_entry_date` as sync metadata. That is too little state for `local`, `pending`, `synced`, `failed`, `rejected`, and `conflict`, and it causes rejected entries to retry forever because rejected results remain `synced_at: null`. [VERIFIED: resources/js/lib/db.ts; .planning/codebase/CONCERNS.md]

Planning should sequence the work as a reviewable stack: shared validation/constants, canonical response contract, Dexie versioned migration plus result-aware sync state transitions, UI copy/status surfaces, and focused tests. The phase should not add a full pull/restore endpoint unless the plan explicitly expands scope and verifies it end to end. [VERIFIED: .planning/ROADMAP.md; .planning/STATE.md; AGENTS.md]

**Primary recommendation:** Use the existing Laravel + Dexie stack, add a shared server validation contract, return canonical server payloads for every accepted/skipped sync item, migrate IndexedDB to an explicit sync-state enum, and update copy to distinguish local save from verified cross-device restore. [VERIFIED: codebase grep; CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Laravel Framework | Installed v13.3.0 | Routing, validation, auth middleware, Eloquent writes, feature tests | Already owns both sync endpoints and validation. [VERIFIED: composer show laravel/framework; routes/web.php] |
| PHP | 8.4.20 local CLI | Backend runtime | Matches project requirement and installed local runtime. [VERIFIED: php --version; composer.json] |
| Inertia Laravel | Installed v3.0.1 | Server-to-React page props | Already serves `Today`, `History`, `Help`, and `Policies` pages. [VERIFIED: composer show inertiajs/inertia-laravel; app/Http/Controllers/TodayController.php] |
| React + `@inertiajs/react` | Lockfile `@inertiajs/react` 3.0.3; local `node_modules` is stale at 2.3.18 | UI status/copy updates | Use the lockfile version after `npm install`; current `node_modules` is invalid against `package.json`. [VERIFIED: package-lock.json; npm list output; npm view @inertiajs/react] |
| Dexie | Lockfile 4.4.2; current npm 4.4.2 | IndexedDB local-first storage and migration | Already stores local entries; Dexie supports versioned schema upgrades. [VERIFIED: package-lock.json; npm view dexie; CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29] |
| Axios | Current npm 1.15.2; local package 1.13.6 | Same-origin JSON posts | Already used by direct save and sync push. [VERIFIED: npm view axios; resources/js/bootstrap.js; resources/js/lib/db.ts] |
| Pest + PHPUnit | Pest v4.4.3, Pest Laravel plugin v4.1.0 | Backend contract/feature tests | Existing sync and entry tests already use class-based Laravel feature tests. [VERIFIED: composer show pestphp/pest; composer show pestphp/pest-plugin-laravel; tests/Feature/SyncPushTest.php] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | Current npm 4.1.5 | Fast TypeScript tests for sync-state utilities | Add in Wave 0 for `resources/js/lib/db.ts` and extracted sync-state functions. [VERIFIED: npm view vitest; CITED: https://vitest.dev/guide/] |
| fake-indexeddb | Current npm 6.2.5 | IndexedDB implementation in Node tests | Use with Vitest so Dexie local-state transitions can be tested without a browser. [VERIFIED: npm view fake-indexeddb; CITED: https://github.com/dumbmatter/fakeIndexedDB] |
| `@testing-library/react` | Current npm 16.3.2 | Component tests for status UI | Use if the status UI is extracted to a component or hook; otherwise keep this out of Phase 1. [VERIFIED: npm view @testing-library/react; ASSUMED: planner may decide a component test is worth the added dependency] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest + fake-indexeddb | Playwright browser tests | Playwright is stronger for full IndexedDB/offline workflows but larger to install/configure; keep Phase 1 focused unless UI flows cannot be validated with unit/component tests. [VERIFIED: no Playwright config in repo; ASSUMED: Phase 8 will broaden browser coverage] |
| Shared rule provider class | Laravel FormRequest per endpoint | FormRequests are standard for whole requests, but batch sync needs per-item validation inside a loop, so a shared rule provider is simpler and directly reusable. [VERIFIED: SyncController per-item Validator::make usage; CITED: https://laravel.com/docs/13.x/validation] |
| Full CRDT/merge engine | Bounded last-writer-wins plus conflict snapshots | The product has one entry per user/date and three text fields, so a CRDT is unnecessary for Phase 1; preserve local recovery data when server canonical wins. [VERIFIED: entries unique index; ASSUMED: no collaborative editing requirement] |

**Installation:**

```bash
npm install --save-dev vitest fake-indexeddb
```

Add `@testing-library/react` only if planning includes component-level tests for the sync-status UI. [ASSUMED]

**Version verification:** `npm view` verified Dexie 4.4.2 (modified 2026-04-16), Vitest 4.1.5 (modified 2026-04-23), fake-indexeddb 6.2.5 (modified 2025-11-07), `@testing-library/react` 16.3.2 (modified 2026-01-19), `@inertiajs/react` 3.0.3 (modified 2026-04-07), Axios 1.15.2 (modified 2026-04-21), and React 19.2.5 (modified 2026-04-24). [VERIFIED: npm view]

## Architecture Patterns

### Recommended Project Structure

```text
app/
├── Actions/Entries/UpsertEntry.php          # Keep the write decision point
├── Support/Entries/EntryPayloadRules.php    # Shared direct-save and sync item rules
├── Support/Entries/EntryPayload.php         # Canonical server JSON shape from Entry model
└── Http/Controllers/
    ├── EntryController.php                  # Direct save contract
    └── Api/SyncController.php               # Batch sync contract

resources/js/
├── lib/db.ts                                # Dexie schema v2 and local entry persistence
├── lib/sync.ts                              # Optional result handling/chunking helpers if db.ts grows too large
├── Components/EntrySyncStatus.tsx           # Small status surface, if extracted
└── Pages/
    ├── Today.tsx                            # Save status and recovery CTA
    ├── History.tsx                          # Row-level status/conflict cues if needed
    └── Help.tsx                             # Restore/sync copy correction

tests/
├── Feature/EntryUpsertTest.php              # Direct save canonical payload + shared limits
├── Feature/SyncPushTest.php                 # Batch contract, canonical payloads, conflicts, limits
└── js/db.test.ts                            # Dexie status transitions after Wave 0 harness
```

This structure keeps the existing action/controller/page layout while adding only the support classes and tests needed for the phase. [VERIFIED: .planning/codebase/ARCHITECTURE.md; rg --files]

### Pattern 1: Shared Entry Validation Contract

**What:** Use one PHP rule source for direct save and per-item sync validation, with constants for `MIN_ENTRY_DATE`, `MAX_PROMPT_LENGTH`, `MAX_BATCH_ENTRIES`, and `MAX_FUTURE_SKEW_MS`. [VERIFIED: duplicated validation arrays in EntryController and SyncController; ASSUMED: exact constants need confirmation]

**When to use:** Use it any time a server path accepts `entry_date`, `person`, `grace`, `gratitude`, or `updated_at`. [VERIFIED: app/Http/Controllers/EntryController.php; app/Http/Controllers/Api/SyncController.php]

**Example:**

```php
<?php

namespace App\Support\Entries;

final class EntryPayloadRules
{
    public const MIN_ENTRY_DATE = '2026-01-01';
    public const MAX_PROMPT_LENGTH = 5000;

    /** @return array<string, list<string>> */
    public static function rules(): array
    {
        return [
            'entry_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.self::MIN_ENTRY_DATE],
            'person' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'grace' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'gratitude' => ['nullable', 'string', 'max:'.self::MAX_PROMPT_LENGTH],
            'updated_at' => ['required', 'integer', 'min:0'],
        ];
    }
}
```

Source basis: Laravel supports array-form validation rules and `max` applies to strings and arrays according to size semantics. [CITED: https://laravel.com/docs/13.x/validation]

### Pattern 2: Canonical Server Payloads

**What:** Build one canonical server entry shape and include it in direct-save and sync responses whenever the server accepts or skips an item. [VERIFIED: direct save currently returns only `entry_date` and `updated_at`; sync push currently returns no entry payload]

**When to use:** Use it for `status: "upserted"` and `status: "skipped"`; do not include private data in rejected item errors beyond the item key and validation messages. [VERIFIED: phase requirements SYNC-02 and SYNC-05]

**Example response shape:**

```json
{
  "ok": true,
  "results": [
    {
      "entry_date": "2026-04-25",
      "status": "skipped",
      "entry": {
        "entry_date": "2026-04-25",
        "person": "Server canonical person",
        "grace": "Server canonical grace",
        "gratitude": "Server canonical gratitude",
        "updated_at": 1777123456789
      }
    }
  ]
}
```

This satisfies canonical local replacement for accepted/skipped items without introducing a pull/restore endpoint. [VERIFIED: SYNC-02 and SYNC-03]

### Pattern 3: Explicit Local Sync State Machine

**What:** Add a `SyncStatus` enum to `LocalEntry` and treat sync as state transitions, not as `synced_at === null`. [VERIFIED: current LocalEntry only has `synced_at` and `server_entry_date`]

**Recommended statuses:**

| Status | Meaning | Automatic retry? |
|--------|---------|------------------|
| `local` | Saved locally and not yet attempted. | Yes, when authenticated. [VERIFIED: SYNC-01] |
| `pending` | Currently being posted. | No parallel retry. [ASSUMED: prevents duplicate posts] |
| `synced` | Local primary payload matches server canonical payload. | No. [VERIFIED: SYNC-03] |
| `failed` | Request-level or network failure prevented a known result. | Yes, with backoff or next manual/app-triggered attempt. [VERIFIED: SYNC-01] |
| `rejected` | Server rejected this item validation-wise. | No, until edited or explicitly retried. [VERIFIED: SYNC-04] |
| `conflict` | Server canonical item differs from local item and server wins/skips. | No, until user resolves. [VERIFIED: SYNC-07; ASSUMED: conflict copy keeps local recovery snapshot] |

**Dexie migration example:**

```typescript
export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed' | 'rejected' | 'conflict';

this.version(2).stores({
    entries: 'local_id, &entry_date, updated_at, synced_at, sync_status',
}).upgrade((tx) =>
    tx.table('entries').toCollection().modify((entry) => {
        entry.sync_status = entry.synced_at ? 'synced' : 'local';
        entry.sync_error = null;
        entry.server_payload = null;
        entry.conflict_local_payload = null;
    }),
);
```

Source basis: Dexie documents versioned schema upgrades and `upgrade` functions for migrating existing records. [CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]

### Pattern 4: Bounded Batch Sync

**What:** Validate the envelope with request-level rules, chunk client pushes to the same limit, and return request-level `422` for oversized batches while keeping per-item rejection for item-specific errors. [VERIFIED: current `entries` rule has no max; current client posts all unsynced entries]

**When to use:** Use on `/api/sync/push`; direct save remains single-item. [VERIFIED: routes/web.php]

**Recommended server rules:**

```php
$validated = $request->validate([
    'device_id' => ['required', 'string', 'max:64'],
    'entries' => ['required', 'array', 'list', 'max:50'],
]);
```

Laravel documents `list` for consecutive numeric keys and `max` for arrays. [CITED: https://laravel.com/docs/13.x/validation]

### Anti-Patterns to Avoid

- **Status-by-timestamp:** Do not infer all user-facing states from `synced_at`; rejected, failed, pending, and conflict need durable states. [VERIFIED: resources/js/lib/db.ts; SYNC-01]
- **Marking skipped as synced without replacement:** A skipped item can represent server-newer data; write canonical server data or preserve a conflict snapshot before claiming synced. [VERIFIED: UpsertEntry returns `skipped` for client timestamps less than or equal to server `updated_at`]
- **Duplicated validation arrays:** Direct save and batch sync already drift risk by duplicating rules; shared limits must live in one place. [VERIFIED: EntryController and SyncController]
- **Unbounded sync batches:** The current endpoint accepts any array size and the client posts all unsynced entries; add server limits and client chunking together. [VERIFIED: SyncController; resources/js/lib/db.ts]
- **Restore promises without pull:** `/history` returns snippets and `/today` returns one date, but no full local restore/pull endpoint exists. [VERIFIED: HistoryController; TodayController; routes/web.php]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entry validation | Separate ad hoc rule arrays in each controller | Laravel Validator with one shared rule provider | Prevents direct-save and sync drift. [VERIFIED: duplicated rules; CITED: https://laravel.com/docs/13.x/validation] |
| IndexedDB schema migration | Manual localStorage flags or destructive clears | Dexie `version(...).stores(...).upgrade(...)` | Preserves existing local entries while adding state. [CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29] |
| IndexedDB test environment | Custom fake IndexedDB objects | fake-indexeddb | Official README documents Dexie compatibility through `fake-indexeddb/auto`. [CITED: https://github.com/dumbmatter/fakeIndexedDB] |
| Sync conflict engine | CRDT/operational transform | Bounded last-writer-wins plus conflict snapshots | One-entry-per-day text records do not justify collaborative merge machinery. [VERIFIED: entries unique index; ASSUMED: no collaborative editing requirement] |
| Browser storage layer | Raw IndexedDB calls | Existing Dexie wrapper | The app already centralizes local persistence in `resources/js/lib/db.ts`. [VERIFIED: resources/js/lib/db.ts] |
| Test runner from scratch | Custom TypeScript script runner | Vitest | Vitest is Vite-native and supports `.test.`/`.spec.` files by default. [CITED: https://vitest.dev/guide/] |

**Key insight:** The hard part is preserving trust after partial success, rejection, and server-wins outcomes; custom one-off flags will hide the edge cases that this phase exists to make visible. [VERIFIED: SYNC-01 through SYNC-07]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Browser IndexedDB database `gratitude_journal`, table `entries`, schema version 1, records keyed by `local_id` with unique `entry_date`; fields include `synced_at` and `server_entry_date`. [VERIFIED: resources/js/lib/db.ts] | Add Dexie version 2 migration; default existing `synced_at` records to `synced`, unsynced records to `local`, and preserve prompt fields. This is a data migration in browser storage. |
| Stored data | Server `entries` table has `user_id`, `entry_date`, `person`, `grace`, `gratitude`, timestamps, and unique `user_id`/`entry_date`. [VERIFIED: database/migrations/2026_02_12_132221_create_entries_table.php] | No required server data migration for status visibility if conflicts/rejections stay local; add server columns only if planner chooses server revision metadata. |
| Live service config | No external sync service config is used; sync endpoints are same-origin Laravel routes. [VERIFIED: routes/web.php; .planning/codebase/INTEGRATIONS.md] | None. |
| OS-registered state | No OS-registered state for sync was detected in repo context. [VERIFIED: .planning/codebase/INTEGRATIONS.md] | None. |
| Secrets/env vars | No sync-specific env var names were detected; auth/session/database env remains existing Laravel config. [VERIFIED: .planning/codebase/INTEGRATIONS.md] | None for Phase 1. |
| Build artifacts | `node_modules` does not match `package.json`/`package-lock.json`: `@inertiajs/react` is installed as 2.3.18 but lockfile/package require 3.0.x; Dexie local install reports 4.3.0 while lockfile resolves 4.4.2. [VERIFIED: npm list; package-lock.json] | Run `npm install` before frontend test/build verification. This is an environment repair, not a source migration. |

**Canonical question answer:** After source changes, existing browser IndexedDB records still need a versioned local migration; otherwise old records will not have explicit sync status or recoverability metadata. [VERIFIED: resources/js/lib/db.ts; CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]

## Common Pitfalls

### Pitfall 1: Treating `skipped` as success without canonical replacement

**What goes wrong:** The browser claims the entry is synced while retaining stale local content. [VERIFIED: resources/js/lib/db.ts]

**Why it happens:** `pushUnsyncedEntries()` maps `upserted` and `skipped` to entry dates and calls `markEntriesSynced()` without consuming server payloads. [VERIFIED: resources/js/lib/db.ts]

**How to avoid:** Return canonical payload for `skipped`, compare it with local content, write canonical fields, and mark either `synced` or `conflict` depending on whether content differed. [VERIFIED: SYNC-02; SYNC-03; SYNC-07]

**Warning signs:** A test can create a newer server entry, sync an older local entry, and the browser still shows the older local text. [VERIFIED: app/Actions/Entries/UpsertEntry.php; ASSUMED: exact frontend test shape]

### Pitfall 2: Rejected entries retry forever

**What goes wrong:** Invalid entries keep posting on every page load or history visit and never become user-recoverable. [VERIFIED: resources/js/Pages/Today.tsx; resources/js/Pages/History.tsx; resources/js/lib/db.ts]

**Why it happens:** Rejected results are ignored by local persistence and remain `synced_at: null`. [VERIFIED: resources/js/lib/db.ts]

**How to avoid:** Store `sync_status: "rejected"` plus `sync_error`, remove it from automatic retry selection, and return it to retry only after an edit changes the payload. [VERIFIED: SYNC-04]

**Warning signs:** `listUnsyncedEntries()` continues returning rows with known validation errors. [VERIFIED: resources/js/lib/db.ts]

### Pitfall 3: Adding local fields without a Dexie version bump

**What goes wrong:** Existing users' local records lack new sync status fields, and behavior depends on undefined values. [VERIFIED: current version 1 schema]

**Why it happens:** Dexie schema is declared in the constructor, and existing browser databases need a version upgrade path. [CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]

**How to avoid:** Add `this.version(2)` with an `upgrade` callback before relying on new fields. [CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]

**Warning signs:** New code checks `entry.sync_status` but no migration backfills it for existing entries. [ASSUMED]

### Pitfall 4: Request-level and item-level validation get mixed up

**What goes wrong:** Oversized batches become many per-item errors, or one invalid item rejects a whole otherwise-valid batch. [VERIFIED: current SyncController partial item validation]

**Why it happens:** Batch envelope validation and per-entry validation are separate concerns. [VERIFIED: app/Http/Controllers/Api/SyncController.php]

**How to avoid:** Use request-level `422` for invalid envelopes such as missing `entries` or too many entries, and per-item `rejected` results for entry payload failures. [VERIFIED: SYNC-05; CITED: https://laravel.com/docs/13.x/validation]

**Warning signs:** Tests cannot distinguish oversized request rejection from one invalid item. [ASSUMED]

### Pitfall 5: Copy overpromises restore

**What goes wrong:** Users believe signing in restores their whole journal onto a fresh browser, but no pull endpoint exists. [VERIFIED: resources/js/Pages/Help.tsx; routes/web.php]

**Why it happens:** Current copy says account creation makes the journal available across devices while the implementation only pushes local unsynced entries and serves limited server views. [VERIFIED: resources/js/Pages/Help.tsx; HistoryController; TodayController]

**How to avoid:** Update Help/Today text to say local save is immediate, signed-in sync backs up accepted entries, and full fresh-device restore is limited unless implemented later. [VERIFIED: SYNC-08; .planning/STATE.md]

**Warning signs:** The UI says "backup across devices" or "available across devices" without caveats and no `/api/sync/pull` route exists. [VERIFIED: routes/web.php]

## Key Files/Modules To Inspect During Planning

| File | Why It Matters |
|------|----------------|
| `app/Http/Controllers/EntryController.php` | Direct save response and validation contract. [VERIFIED: codebase grep] |
| `app/Http/Controllers/Api/SyncController.php` | Batch sync response, per-item validation, batch limits, duplicate handling. [VERIFIED: codebase grep] |
| `app/Actions/Entries/UpsertEntry.php` | Current last-writer-wins and `skipped`/`upserted` decision point. [VERIFIED: codebase grep] |
| `database/migrations/2026_02_12_132221_create_entries_table.php` | Unique per-user/date model and prompt field storage. [VERIFIED: codebase grep] |
| `resources/js/lib/db.ts` | Dexie schema, local entry shape, sync retry selection, canonical write location. [VERIFIED: codebase grep] |
| `resources/js/Pages/Today.tsx` | Primary save flow, copy, visible status location. [VERIFIED: codebase grep] |
| `resources/js/Pages/History.tsx` | Background sync trigger and merged local/server list. [VERIFIED: codebase grep] |
| `resources/js/Pages/HistoryEntry.tsx` | Local/server resolution for historical entries. [VERIFIED: codebase grep] |
| `resources/js/Pages/Help.tsx` | Current restore/sync overpromise. [VERIFIED: codebase grep] |
| `tests/Feature/SyncPushTest.php` | Existing batch sync contract coverage to extend. [VERIFIED: codebase grep] |
| `tests/Feature/EntryUpsertTest.php` | Existing direct save validation coverage to extend. [VERIFIED: codebase grep] |
| `bootstrap/app.php` | Current CSRF exemptions for session-backed write routes; avoid expanding this surface in Phase 1. [VERIFIED: codebase grep] |

## Code Examples

Verified patterns from official sources and local code:

### Shared Laravel Validation Rules

```php
$entryValidator = Validator::make($entry, EntryPayloadRules::rules());
```

Use `Validator::make()` for per-item batch validation because `SyncController` intentionally continues after one item fails. [VERIFIED: app/Http/Controllers/Api/SyncController.php; CITED: https://laravel.com/docs/13.x/validation]

### Canonical Payload Helper

```php
final class EntryPayload
{
    /** @return array{entry_date:string,person:?string,grace:?string,gratitude:?string,updated_at:int} */
    public static function fromModel(Entry $entry): array
    {
        return [
            'entry_date' => (string) $entry->entry_date,
            'person' => $entry->person,
            'grace' => $entry->grace,
            'gratitude' => $entry->gratitude,
            'updated_at' => $entry->updated_at->valueOf(),
        ];
    }
}
```

This mirrors existing controller serialization while adding missing prompt fields to the direct-save and sync contracts. [VERIFIED: app/Http/Controllers/EntryController.php; app/Http/Controllers/TodayController.php]

### Result-Aware Local Sync Application

```typescript
type SyncResult =
    | { entry_date: string; status: 'upserted' | 'skipped'; entry: CanonicalEntry }
    | { entry_date: string | null; status: 'rejected'; errors: Record<string, string[]> };

async function applySyncResult(local: LocalEntry, result: SyncResult): Promise<void> {
    if (result.status === 'rejected') {
        await db.entries.put({
            ...local,
            sync_status: 'rejected',
            sync_error: result.errors,
        });
        return;
    }

    const canonical = result.entry;
    const contentChanged =
        local.person !== (canonical.person ?? '')
        || local.grace !== (canonical.grace ?? '')
        || local.gratitude !== (canonical.gratitude ?? '');

    await db.entries.put({
        ...local,
        entry_date: canonical.entry_date,
        person: canonical.person ?? '',
        grace: canonical.grace ?? '',
        gratitude: canonical.gratitude ?? '',
        updated_at: canonical.updated_at,
        synced_at: Date.now(),
        server_entry_date: canonical.entry_date,
        sync_status: result.status === 'skipped' && contentChanged ? 'conflict' : 'synced',
        conflict_local_payload: result.status === 'skipped' && contentChanged ? local : null,
    });
}
```

The exact recovery fields can be narrowed during planning, but the state transition should be result-aware and canonical-payload-aware. [VERIFIED: SYNC-01 through SYNC-04; ASSUMED: conflict snapshot field shape]

### Vitest + fake-indexeddb Setup

```typescript
// tests/js/setup.ts
import 'fake-indexeddb/auto';
```

fake-indexeddb documents importing `fake-indexeddb/auto` before Dexie so Dexie can use the mocked IndexedDB globals. [CITED: https://github.com/dumbmatter/fakeIndexedDB]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| One-way push marks dates synced by status only. | Sync responses carry canonical payloads and the client applies item-level state transitions. | Needed in Phase 1. [VERIFIED: SYNC-02; SYNC-03] | Prevents silent local/server divergence after `skipped`. |
| `synced_at` doubles as all local sync state. | Explicit `sync_status` plus error/conflict metadata. | Needed in Phase 1. [VERIFIED: SYNC-01; SYNC-04] | Makes failed/rejected/conflict recoverable and visible. |
| Duplicated controller validation arrays. | Shared validation rule source and constants. | Needed in Phase 1. [VERIFIED: SYNC-06] | Keeps direct save and batch sync aligned. |
| Unbounded batch and text fields. | Request-level batch max and prompt field max rules. | Needed in Phase 1. [VERIFIED: SYNC-05] | Provides clear failure modes and protects request size. |
| Copy says signed-in journal is available across devices. | Copy distinguishes local save, accepted sync backup, and missing full restore. | Needed in Phase 1 unless pull/restore ships. [VERIFIED: SYNC-08] | Avoids beta trust mismatch. |

**Deprecated/outdated for this app:**

- Treating client `updated_at` as the only conflict authority is insufficient for beta trust because clock skew can cause incorrect overwrites. [VERIFIED: .planning/codebase/CONCERNS.md; app/Actions/Entries/UpsertEntry.php]
- Swallowing `pushUnsyncedEntries()` failures is acceptable only for non-critical background refresh, not for user-visible save/sync reliability. [VERIFIED: resources/js/Pages/Today.tsx; resources/js/Pages/History.tsx; SYNC-01]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `MAX_PROMPT_LENGTH`, `MAX_BATCH_ENTRIES`, and future-skew tolerance should be chosen during planning. | Standard Stack / Architecture Patterns | If the limits are too strict, valid beta entries may be rejected; if too loose, oversized requests remain risky. |
| A2 | A conflict can be represented by storing server canonical fields as primary and preserving the local losing payload as recovery metadata. | Architecture Patterns / Code Examples | If product wants manual choice before replacement, the local transition and UI need a different workflow. |
| A3 | Vitest + fake-indexeddb is enough for Phase 1 local-state verification, with broader browser E2E deferred to Phase 8. | Standard Stack / Validation Architecture | If UI behavior is complex or browser-only APIs matter, Phase 1 needs Playwright earlier. |
| A4 | No collaborative editing or CRDT-style merging is needed for one daily private entry. | Don't Hand-Roll / State of the Art | If multi-device simultaneous editing becomes a hard requirement, bounded LWW may not be enough. |

## Open Questions (RESOLVED)

1. **What exact size and clock-skew limits should the product accept? (RESOLVED)**
   - What we know: Current prompt fields and batch size are unbounded at app validation level. [VERIFIED: EntryController; SyncController]
   - Resolution: Phase 1 plans lock 5,000 characters per prompt, 50 entries per sync batch, and a 15-minute future timestamp skew bound (`MAX_FUTURE_SKEW_MILLISECONDS = 900000`). [PLANNED: 01-01-PLAN.md]
   - Recommendation applied: Use `MAX_PROMPT_LENGTH = 5000`, `MAX_BATCH_ENTRIES = 50`, and reject `updated_at` values more than 15 minutes in the future. [PLANNED: 01-01-PLAN.md]

2. **Should server-newer conflicts overwrite the displayed local draft immediately? (RESOLVED)**
   - What we know: SYNC-03 requires canonical server data to be stored after accepted/skipped sync items. [VERIFIED: .planning/REQUIREMENTS.md]
   - Resolution: Store server-canonical fields as the primary local record, set `sync_status: 'conflict'` when the skipped server payload differs, and preserve the losing local text in `conflict_local_payload` for review. [PLANNED: 01-04-PLAN.md; 01-05-PLAN.md]
   - Recommendation applied: Show the synced/server version first with a recovery action to review the preserved local copy. [PLANNED: 01-05-PLAN.md]

3. **Should Phase 1 add server revision metadata? (RESOLVED)**
   - What we know: Current server conflict logic uses client-provided `updated_at`, and the entries table has no revision column. [VERIFIED: UpsertEntry; entries migration]
   - Resolution: Phase 1 does not add a server revision column or server data migration. Conflict coverage uses bounded timestamp validation, duplicate-date rejection, canonical sync responses, and local conflict metadata. [PLANNED: 01-01-PLAN.md; 01-02-PLAN.md; 01-04-PLAN.md]
   - Recommendation applied: Keep the server schema unchanged for Phase 1. [PLANNED: 01-01-PLAN.md through 01-05-PLAN.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| PHP CLI | Laravel tests and tooling | Yes | 8.4.20 | None needed. [VERIFIED: php --version] |
| Composer | PHP dependency/tooling commands | Yes | 2.9.5 | None needed. [VERIFIED: composer --version] |
| Laravel framework | Backend implementation | Yes | 13.3.0 installed | None needed. [VERIFIED: composer show laravel/framework] |
| Node.js | Vite/TypeScript/Vitest | Yes | 22.12.0 | None needed. [VERIFIED: node --version] |
| npm | Frontend dependency install | Yes | 10.9.0 | None needed. [VERIFIED: npm --version] |
| SQLite CLI | Local SQLite inspection if needed | Yes | command present | Laravel/PDO SQLite tests still work without CLI. [VERIFIED: command -v sqlite3] |
| ripgrep | Codebase research/planning searches | Yes | command present | Use `find`/`grep` if unavailable. [VERIFIED: command -v rg] |
| Vitest | Proposed frontend state tests | No | current npm 4.1.5 | Add dev dependency in Wave 0 or use manual verification only, which is weaker. [VERIFIED: npm view vitest; package.json] |
| fake-indexeddb | Proposed Dexie tests | No | current npm 6.2.5 | Browser-only manual tests, weaker and slower. [VERIFIED: npm view fake-indexeddb; package.json] |
| Frontend `node_modules` consistency | Typecheck/build/test verification | Partially | `npm list` reports invalid `@inertiajs/react` and stale Dexie install | Run `npm install` before verification. [VERIFIED: npm list; package-lock.json] |

**Missing dependencies with no fallback:**

- None blocking backend research. [VERIFIED: local tool probes]

**Missing dependencies with fallback:**

- Vitest and fake-indexeddb are missing; the fallback is manual or browser-level testing, but that is weaker for deterministic state transitions. [VERIFIED: package.json; npm view]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | Pest v4.4.3 + Pest Laravel v4.1.0 on PHPUnit 12. [VERIFIED: composer show] |
| Backend config file | `phpunit.xml`. [VERIFIED: phpunit.xml] |
| Frontend framework | None installed; recommend Vitest 4.1.5 + fake-indexeddb 6.2.5. [VERIFIED: package.json; npm view] |
| Quick backend command | `php artisan test --filter=SyncPushTest` and `php artisan test --filter=EntryUpsertTest`. [VERIFIED: .planning/codebase/TESTING.md] |
| Quick frontend command | `npm run test:unit -- resources/js/lib/db.test.ts` after adding script/config. [ASSUMED] |
| Full suite command | `composer test`, `npm run typecheck`, `npm run build`, then `XDEBUG_MODE=off vendor/bin/grumphp run`. [VERIFIED: AGENTS.md; composer.json; package.json; grumphp.yml] |

Laravel HTTP tests disable CSRF middleware by default, so Phase 1 should not rely on ordinary feature tests to prove CSRF posture. [CITED: https://laravel.com/docs/13.x/http-tests]

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SYNC-01 | Local status transitions: local, pending, synced, failed, rejected, conflict. | Frontend unit/component | `npm run test:unit -- resources/js/lib/db.test.ts` | No - Wave 0. [VERIFIED: no JS test config] |
| SYNC-02 | `/api/sync/push` returns canonical entry payload for `upserted` and `skipped`. | PHP feature | `php artisan test --filter=SyncPushTest` | Yes, needs expansion. [VERIFIED: tests/Feature/SyncPushTest.php] |
| SYNC-03 | Client applies canonical payload after accepted/skipped results. | Frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts` | No - Wave 0. [VERIFIED: resources/js/lib/db.ts] |
| SYNC-04 | Rejected entries stop automatic retry and surface recoverable metadata. | Frontend unit + PHP feature | `php artisan test --filter=SyncPushTest` and `npm run test:unit -- resources/js/lib/db.test.ts` | PHP exists; JS missing. [VERIFIED: tests/Feature/SyncPushTest.php] |
| SYNC-05 | Oversized batch gets request-level feedback; oversized prompt gets per-item/direct feedback. | PHP feature | `php artisan test --filter=SyncPushTest` and `php artisan test --filter=EntryUpsertTest` | Yes, needs expansion. [VERIFIED: tests/Feature] |
| SYNC-06 | Direct save and sync use shared rule source. | PHP feature/static review | `php artisan test --filter=EntryUpsertTest` and `php artisan test --filter=SyncPushTest` | Tests exist; shared source missing. [VERIFIED: duplicated rules] |
| SYNC-07 | Server-newer, client-newer, duplicate, and clock-skew outcomes are explicit. | PHP feature + frontend unit | `php artisan test --filter=SyncPushTest` and `npm run test:unit -- resources/js/lib/db.test.ts` | PHP exists; JS missing. [VERIFIED: tests/Feature/SyncPushTest.php] |
| SYNC-08 | Help/Today copy does not promise full restore without pull flow. | PHP/Inertia or component snapshot/manual | `npm run typecheck` plus focused review; add component test if Testing Library added | No automated UI text test currently. [VERIFIED: Help.tsx; Today.tsx] |

### Sampling Rate

- **Per task commit:** Run the narrow PHP filter or frontend unit file that maps to the changed layer. [VERIFIED: AGENTS.md; .planning/codebase/TESTING.md]
- **Per wave merge:** Run `composer test`, `npm run typecheck`, and `npm run build`. [VERIFIED: AGENTS.md; composer.json; package.json]
- **Phase gate:** Run `XDEBUG_MODE=off vendor/bin/grumphp run` after repairing frontend `node_modules` with `npm install`. [VERIFIED: AGENTS.md; npm list]

### Wave 0 Gaps

- [ ] `app/Support/Entries/EntryPayloadRules.php` - shared server validation rules for SYNC-05 and SYNC-06. [VERIFIED: no `app/Support` path detected]
- [ ] `app/Support/Entries/EntryPayload.php` - canonical server payload shape for SYNC-02 and SYNC-03. [VERIFIED: no shared serializer detected]
- [ ] `vitest.config.ts` - frontend unit test harness. [VERIFIED: no Vitest config detected]
- [ ] `tests/js/setup.ts` - imports `fake-indexeddb/auto`. [CITED: https://github.com/dumbmatter/fakeIndexedDB]
- [ ] `tests/js/db.test.ts` or colocated `resources/js/lib/db.test.ts` - Dexie migration and sync result transitions for SYNC-01, SYNC-03, SYNC-04, and SYNC-07. [VERIFIED: no JS tests detected]
- [ ] `package.json` script `test:unit` - runs Vitest. [VERIFIED: package.json]
- [ ] Environment repair: run `npm install` so `node_modules` matches `package-lock.json`. [VERIFIED: npm list; package-lock.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Indirect | Preserve existing `auth` middleware on write routes; auth hardening is Phase 2. [VERIFIED: routes/web.php; .planning/ROADMAP.md] |
| V3 Session Management | Indirect | Do not expand session-backed write endpoints or CSRF exemptions during sync work. [VERIFIED: bootstrap/app.php; routes/web.php] |
| V4 Access Control | Yes | Keep `/entries/upsert` and `/api/sync/push` behind Laravel `auth` middleware and add unauthenticated tests if missing. [VERIFIED: routes/web.php] |
| V5 Input Validation | Yes | Shared Laravel validation rules, prompt max rules, batch max/list rules, duplicate-date rejection, timestamp bounds. [VERIFIED: SYNC-05; SYNC-06; CITED: https://laravel.com/docs/13.x/validation] |
| V6 Cryptography | No new crypto | Do not add cryptographic sync claims or custom crypto in this phase. [VERIFIED: .planning/REQUIREMENTS.md out-of-scope E2E encrypted sync claim] |

### Known Threat Patterns for Laravel/Dexie Sync

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized sync batch or prompt text | Denial of Service | Request-level `entries` max/list and per-field `max` rules. [VERIFIED: current unbounded rules; CITED: https://laravel.com/docs/13.x/validation] |
| Session-authenticated write tampering | Tampering | Keep auth middleware; avoid new CSRF exemptions; leave CSRF posture fix to Phase 2 unless touched. [VERIFIED: routes/web.php; bootstrap/app.php] |
| Clock-skew overwrite | Tampering/Data integrity | Bound future timestamps, return canonical payloads, and surface conflict/rejected state. [VERIFIED: UpsertEntry timestamp logic; ASSUMED: exact skew tolerance] |
| Private content leakage in errors/logs | Information Disclosure | Return validation field errors without echoing full journal text in logs or UI diagnostics. [VERIFIED: privacy-sensitive journal content in PROJECT.md; ASSUMED: error shape can omit payload echo] |
| Local/server divergence | Integrity/Repudiation | Store canonical server payload after sync and persist conflict metadata. [VERIFIED: SYNC-02; SYNC-03; SYNC-07] |

## Sources

### Primary (HIGH confidence)

- `.planning/REQUIREMENTS.md` - Phase requirement IDs and sync reliability scope. [VERIFIED: file read]
- `.planning/ROADMAP.md` - Phase 1 success criteria and UI hint. [VERIFIED: file read]
- `.planning/STATE.md` - current focus, restore scope, reviewability guidance. [VERIFIED: file read]
- `.planning/PROJECT.md` - stack constraints, known concerns, core value. [VERIFIED: file read]
- `AGENTS.md` - repo-specific command, workflow, and verification rules. [VERIFIED: file read]
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md` - current codebase maps. [VERIFIED: file reads/codebase grep]
- `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`, `app/Actions/Entries/UpsertEntry.php`, `resources/js/lib/db.ts`, `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, `resources/js/Pages/Help.tsx` - live implementation evidence. [VERIFIED: codebase grep]
- Laravel 13 validation docs - validation responses, array-form rules, `max`, `list`. [CITED: https://laravel.com/docs/13.x/validation]
- Laravel 13 HTTP/database testing docs - HTTP test behavior, `RefreshDatabase`, JSON validation assertions, CSRF disabled in tests. [CITED: https://laravel.com/docs/13.x/http-tests; https://laravel.com/docs/13.x/database-testing]
- Dexie docs - versioned IndexedDB schema upgrades. [CITED: https://dexie.org/docs/Dexie/Dexie.version%28%29]
- fake-indexeddb README - Dexie-compatible test setup. [CITED: https://github.com/dumbmatter/fakeIndexedDB]
- Vitest docs - Vite-native test setup and Node/Vite requirements. [CITED: https://vitest.dev/guide/]
- MDN IndexedDB API - IndexedDB is transactional client-side structured storage. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API]

### Secondary (MEDIUM confidence)

- `npm view` registry metadata for current package versions and modified timestamps. [VERIFIED: npm registry]
- `composer show` local installed package metadata for Laravel/Pest/Inertia/Larastan. [VERIFIED: Composer local install]

### Tertiary (LOW confidence)

- None used as authoritative input. [VERIFIED: source review]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH for existing Laravel/Dexie/Pest stack; MEDIUM-HIGH for adding Vitest/fake-indexeddb because packages are verified but not installed. [VERIFIED: package.json; npm view; composer show]
- Architecture: HIGH for backend contract and local-state needs; MEDIUM for exact conflict UX fields. [VERIFIED: codebase grep; ASSUMED: UX recovery shape]
- Pitfalls: HIGH for skipped/rejected/unbounded/copy risks because they are visible in live code and requirements. [VERIFIED: codebase grep; .planning/codebase/CONCERNS.md]
- Validation architecture: HIGH for PHP tests; MEDIUM-HIGH for frontend tests because Wave 0 harness work is required. [VERIFIED: tests directory; package.json]

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 for Laravel/Dexie patterns; re-check npm versions before installing frontend test packages. [ASSUMED]

## RESEARCH COMPLETE

Research is complete for Phase 1. The planner can now create stacked PLAN.md files around shared validation, canonical sync responses, local Dexie migration/state transitions, UI/docs, and validation gaps. [VERIFIED: research artifact complete]
