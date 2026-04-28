# Codebase Concerns

**Analysis Date:** 2026-04-25

## Tech Debt

**Local-first sync conflict model:**
- Issue: Sync uses client-provided `updated_at` timestamps as the only conflict signal. A client with a skewed clock can overwrite fresher server data or keep stale data marked as newer.
- Files: `app/Actions/Entries/UpsertEntry.php`, `app/Http/Controllers/Api/SyncController.php`, `resources/js/lib/db.ts`, `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`
- Impact: Cross-device edits can be silently lost. The UI marks entries synced after a `skipped` response without fetching the server-winning content, so local state can diverge from server state.
- Fix approach: Return canonical entry payloads from `/api/sync/push` for both `upserted` and `skipped` statuses. Store a server revision or monotonic version per entry instead of relying only on client wall-clock milliseconds. Add tests for "server newer than local", "local newer than server", and "clock skew" cases.

**Sync route duplicates single-entry write behavior:**
- Issue: `/entries/upsert` and `/api/sync/push` validate the same entry shape in separate controllers. Any new entry field, size limit, or date rule must be changed in two places.
- Files: `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`, `app/Actions/Entries/UpsertEntry.php`, `tests/Feature/EntryUpsertTest.php`, `tests/Feature/SyncPushTest.php`
- Impact: Validation drift can create bugs where interactive saves and batch sync accept different payloads.
- Fix approach: Move entry payload validation into a shared FormRequest or value object. Keep batch-level validation in `SyncController` and delegate per-entry validation to the shared rule set.

**Demo seeding is reachable through production UI query parameters:**
- Issue: Guest users can trigger local IndexedDB seeding with `seed` or `seed_local_days`, and `seed_local_reset=1` clears existing local entries.
- Files: `resources/js/Pages/Today.tsx`, `resources/js/lib/db.ts`
- Impact: A shared URL can write up to 2,000 generated entries or clear guest local entries in a browser. This is local-only, but it affects real user data before sign-in.
- Fix approach: Gate seeding behind an explicit development flag, remove it from the production bundle, or require a namespaced debug route that is absent in production builds.

**Large frontend modules combine unrelated responsibilities:**
- Issue: `Today` handles seeding, local/server merge resolution, persistence, flashbacks, intro state, login prompting, structured data, and rendering in one component. `AppShell` handles layout, theme persistence, login form, export orchestration, nav, footer, and flash messages.
- Files: `resources/js/Pages/Today.tsx`, `resources/js/Components/AppShell.tsx`
- Impact: Behavior changes in the main screen are high-risk because data flow and UI state are tightly interleaved.
- Fix approach: Extract local-entry loading/saving into a hook such as `resources/js/lib/useEntryDraft.ts`, extract seeding/debug behavior, and move account/export dropdowns into dedicated components under `resources/js/Components/`.

## Known Bugs

**Rejected sync entries remain unsynced forever:**
- Symptoms: `pushUnsyncedEntries()` only marks `upserted` or `skipped` results as synced. Rejected entries stay in IndexedDB with `synced_at: null` and are retried on every sync attempt.
- Files: `resources/js/lib/db.ts`, `app/Http/Controllers/Api/SyncController.php`, `tests/Feature/SyncPushTest.php`
- Trigger: Save or seed a local entry that fails server validation, such as an entry before `2026-01-01`, then sign in and allow sync to run.
- Workaround: None in the UI. Users can only stop retries by editing/removing the local IndexedDB record manually.

**Guest "open today" history link can ignore selected date:**
- Symptoms: History rows link today's entry to `/today?date=...`, but the server intentionally ignores date query overrides for guests.
- Files: `resources/js/Pages/History.tsx`, `app/Http/Controllers/TodayController.php`, `tests/Feature/TodayRouteTest.php`
- Trigger: As a guest, open History, select an entry whose date equals the browser's `todayIso()` calculation but differs from the server-resolved `props.date` because of timezone boundaries.
- Workaround: Open non-today history entries through `/history/{date}`. Today entries depend on server date resolution.

**Save failure gives no user-visible error:**
- Symptoms: `saveEntry()` uses `try/finally` without `catch`. Network or validation failures leave the local record unsynced and clear the saving state without a visible failure message.
- Files: `resources/js/Pages/Today.tsx`, `resources/js/lib/db.ts`, `app/Http/Controllers/EntryController.php`
- Trigger: Authenticated user saves while offline, with an expired session, or with a server-side validation error.
- Workaround: The local entry is retained and `pushUnsyncedEntries()` can retry later, but the user does not get explicit feedback.

## Security Considerations

**CSRF protection is disabled for authenticated write endpoints:**
- Risk: `entries/upsert` and `api/sync/push` are excluded from Laravel CSRF validation while they rely on session authentication.
- Files: `bootstrap/app.php`, `routes/web.php`, `config/session.php`
- Current mitigation: Session cookies are `http_only` and default to `same_site=lax`; routes require `auth`.
- Recommendations: Remove CSRF exemptions for session-backed routes, or move sync/write APIs to token-based authentication with explicit CORS policy. Add tests that a request without a CSRF token is rejected when using session auth.

**Unlimited entry text size accepts arbitrarily large content:**
- Risk: `person`, `grace`, and `gratitude` validate only as nullable strings. Batch sync also accepts an unbounded number of entries.
- Files: `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`, `database/migrations/2026_02_12_132221_create_entries_table.php`
- Current mitigation: Database columns are `text`, and Laravel request parsing provides broad platform-level limits.
- Recommendations: Add explicit `max` rules per text field and a maximum `entries` array size. Match frontend textarea guidance and export assumptions to the same limits.

**Magic-link token rows accumulate and token requests create accounts immediately:**
- Risk: Every valid email request that passes segmented throttling creates a `users` row and a `magic_login_tokens` row.
- Files: `app/Http/Controllers/Auth/MagicLinkController.php`, `app/Models/MagicLoginToken.php`, `database/migrations/2026_02_12_132221_create_magic_login_tokens_table.php`, `routes/web.php`
- Current mitigation: Request route uses `throttle:magic-link-request` segmented by IP and normalized email; tokens are hashed, expire after the configured window, can be used once, and can be pruned with `php artisan auth:prune-magic-links`.
- Recommendations: Schedule the documented cleanup command in production operations. Consider creating users only after a token is consumed, or track pending login requests separately.

**Long remember-me duration expands account exposure after magic-link login:**
- Risk: Magic-link login sets a 45-day remember duration for every successful consume.
- Files: `app/Http/Controllers/Auth/MagicLinkController.php`, `config/session.php`
- Current mitigation: Magic links expire after 30 minutes and are single-use.
- Recommendations: Make remember duration configurable, expose a "remember this device" choice, and document the security tradeoff in account settings.

## Performance Bottlenecks

**Batch sync processes and responds to every entry in one request:**
- Problem: `/api/sync/push` accepts an unbounded `entries` array, validates each item, performs one query/save path per entry, and builds a full per-entry result response.
- Files: `app/Http/Controllers/Api/SyncController.php`, `app/Actions/Entries/UpsertEntry.php`, `resources/js/lib/db.ts`
- Cause: There is no request-level batch size limit, no chunking in the client, and no bulk upsert path on the server.
- Improvement path: Add an `entries` max rule, chunk client sync, and use bulk queries/upserts where supported. Return compact error summaries for rejected batches.

**Local history/export loads all IndexedDB entries into memory:**
- Problem: `listAllEntries()` loads the full local table for history and export. Export then builds full JSON/CSV/PDF strings in memory.
- Files: `resources/js/lib/db.ts`, `resources/js/Pages/History.tsx`, `resources/js/lib/export.ts`, `resources/js/Components/AppShell.tsx`
- Cause: Dexie queries use `toArray()` and export generation is monolithic.
- Improvement path: Paginate history and stream/chunk exports. Keep a hard practical limit for PDF export or use a tested PDF generation library with pagination and memory controls.

**Server history fetches and maps up to 365 entries on every page load:**
- Problem: Authenticated `/history` fetches 365 rows and maps all snippets server-side on every request.
- Files: `app/Http/Controllers/HistoryController.php`, `resources/js/Pages/History.tsx`
- Cause: There is no server pagination or search endpoint; client search/sort operates on the entire returned set.
- Improvement path: Add cursor or page-based history endpoints. Keep local search client-side for guest entries, but page authenticated server entries.

## Fragile Areas

**Date and timezone handling crosses server, browser local time, and UTC helpers:**
- Files: `app/Http/Controllers/TodayController.php`, `app/Http/Controllers/HistoryEntryController.php`, `resources/js/lib/date.ts`, `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`
- Why fragile: Server date resolution uses user timezone or `X-Timezone`; browser helpers mix local `Date`, UTC noon math, and UTC formatting. Around midnight or DST boundaries, "today" and flashback dates can diverge between server and browser.
- Safe modification: Centralize date parsing/formatting around `YYYY-MM-DD` strings. Add browser-level tests for timezone boundary cases and keep server route tests for `X-Timezone` behavior.
- Test coverage: Server timezone cases exist in `tests/Feature/TodayRouteTest.php`; frontend date behavior has no dedicated test suite.

**Local IndexedDB is the source of truth for guests and a cache for authenticated users:**
- Files: `resources/js/lib/db.ts`, `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, `resources/js/lib/export.ts`
- Why fragile: The same table stores guest-only entries, authenticated drafts, sync state, generated seed data, and export source data. There is no migration beyond Dexie version 1 and no recovery UI for inconsistent records.
- Safe modification: Add explicit local schema migrations for any field changes. Keep sync state transitions in one module and test them with mocked Dexie tables or browser tests.
- Test coverage: PHP tests cover backend entry validation and sync responses; local database and merge behavior have no automated tests.

**Magic-link middleware normalizes query strings before signed URL validation:**
- Files: `app/Http/Middleware/NormalizeHtmlEscapedSignature.php`, `bootstrap/app.php`, `tests/Feature/MagicLinkConsumeTest.php`
- Why fragile: Signed URL correctness depends on middleware order and exact query mutation semantics.
- Safe modification: Keep this middleware prepended before signed-route validation. Any change to link generation or middleware order needs tests for normal, tampered, alternate host, and HTML-escaped signature cases.
- Test coverage: `tests/Feature/MagicLinkConsumeTest.php` covers alternate host/scheme, tampering, and `amp;signature` normalization.

## Scaling Limits

**SQLite-first persistence limits concurrent write throughput:**
- Current capacity: Suitable for local/cloud-ready development and small deployments.
- Limit: Concurrent authenticated sync writes and session/database writes can contend on SQLite locks.
- Scaling path: Keep SQLite for development, but document the production database path and verify migrations/indexes on a server database before traffic grows.

**Per-entry sync has no pagination or pull endpoint:**
- Current capacity: One-way push of unsynced local entries is straightforward for small journals.
- Limit: New devices do not receive historical server entries through a sync API; `/history` returns summaries and `/today` returns one date.
- Scaling path: Add a paginated pull endpoint with revision cursors before relying on multi-device sync as a full backup/restore mechanism.

## Dependencies at Risk

**Custom PDF export implementation:**
- Risk: PDF bytes are handwritten with ASCII-only escaping and fixed line/page layout.
- Impact: Non-ASCII journal content is replaced with `?`, long entries may format poorly, and PDF correctness relies on manual object offsets.
- Migration plan: Use a maintained client-side PDF library or offer Markdown/HTML export in addition to JSON/CSV. Keep the custom exporter covered by browser tests if it remains.

**Optional native npm bindings pinned by platform:**
- Risk: `package.json` includes linux-specific optional packages for Rolldown, Tailwind oxide, and Lightning CSS.
- Impact: Builds on other platforms rely on package-manager optional dependency resolution. A lockfile/platform mismatch can cause setup friction.
- Migration plan: Keep `package-lock.json` regenerated by the supported npm version and verify `npm run build` on the deployment target.

## Missing Critical Features

**No server-to-client restore flow:**
- Problem: Authenticated sync only pushes local unsynced entries. A user signing into a fresh browser does not get all historical entries restored into IndexedDB.
- Blocks: Reliable backup/restore and cross-device continuity.

**No user-facing sync status or conflict resolution:**
- Problem: Sync failures are swallowed in `pushUnsyncedEntries().catch(() => null)`, and skipped server-wins conflicts are not surfaced.
- Blocks: Users cannot tell whether entries are backed up, pending, rejected, or overwritten by another device.

**No account deletion or data purge flow detected:**
- Problem: Policies and local export exist, but no route/controller for deleting an account, server entries, magic tokens, or local IndexedDB data was detected.
- Blocks: Complete privacy lifecycle and support operations for user-requested deletion.

## Test Coverage Gaps

**Frontend local-first workflow:**
- What's not tested: IndexedDB writes, local/server merge decisions, sync retry behavior, seed query behavior, guest save count, export output, and error UI.
- Files: `resources/js/lib/db.ts`, `resources/js/Pages/Today.tsx`, `resources/js/Pages/History.tsx`, `resources/js/lib/export.ts`
- Risk: The most complex application behavior can regress while PHP tests still pass.
- Priority: High

**CSRF and session-auth write behavior:**
- What's not tested: Whether authenticated write routes require CSRF tokens or are intentionally exempt, and whether cross-site form-like requests can mutate entries.
- Files: `bootstrap/app.php`, `routes/web.php`, `app/Http/Controllers/EntryController.php`, `app/Http/Controllers/Api/SyncController.php`
- Risk: Security behavior can change accidentally because the exemption is centralized in bootstrap configuration.
- Priority: High

**Sync conflict and stale response handling:**
- What's not tested: Server-newer entries, client clock skew, `skipped` responses, rejected local entries, duplicate entries in one batch, and partial batch persistence.
- Files: `app/Actions/Entries/UpsertEntry.php`, `app/Http/Controllers/Api/SyncController.php`, `resources/js/lib/db.ts`, `tests/Feature/SyncPushTest.php`
- Risk: Data-loss and divergence bugs can ship unnoticed.
- Priority: High

**Magic-link request lifecycle cleanup:**
- What's not tested: Request throttling behavior, repeated requests for the same email, cleanup of expired/used tokens, and account creation timing.
- Files: `app/Http/Controllers/Auth/MagicLinkController.php`, `app/Models/MagicLoginToken.php`, `routes/web.php`, `tests/Feature/MagicLinkConsumeTest.php`
- Risk: Token rows and unused accounts grow without coverage or operational guardrails.
- Priority: Medium

---

*Concerns audit: 2026-04-25*
