---
phase: 01-sync-contract-local-state
plan: 01
subsystem: sync-backend
tags: [laravel, validation, sync, entries]

requires: []
provides:
  - Shared entry payload validation limits for direct saves and sync pushes
  - Canonical Entry model serializer for backend JSON responses
  - Backend tests for oversized fields, oversized sync batches, future clock skew, and direct-save canonical payloads
affects: [sync-contract-local-state, entry-writes, sync-api]

tech-stack:
  added: []
  patterns:
    - Shared Laravel validation rule provider for entry payloads
    - Canonical model-to-response serializer for Entry JSON payloads

key-files:
  created:
    - app/Support/Entries/EntryPayloadRules.php
    - app/Support/Entries/EntryPayload.php
    - tests/Unit/EntryPayloadContractTest.php
  modified:
    - app/Http/Controllers/EntryController.php
    - app/Http/Controllers/Api/SyncController.php
    - tests/Feature/EntryUpsertTest.php
    - tests/Feature/SyncPushTest.php

key-decisions:
  - "Use one shared EntryPayloadRules contract for direct saves and sync item validation."
  - "Keep the existing sync push result shape in this plan while adding request-level and per-item limits; canonical batch result payloads remain Plan 02 scope."
  - "Commit TDD RED tests together with GREEN implementation because mandatory pre-commit hooks run Pest and reject intentionally failing tests."

patterns-established:
  - "Entry write validation must use EntryPayloadRules::rules() for entry payload fields."
  - "Sync envelope validation must use EntryPayloadRules::batchRules() before item processing."
  - "Direct-save entry responses must use EntryPayload::fromModel()."

requirements-completed: [SYNC-05, SYNC-06]

duration: 6 min
completed: 2026-04-25
---

# Phase 01 Plan 01: Shared Backend Sync Contract Summary

**Shared Laravel entry validation limits and canonical direct-save entry serialization for local-first sync writes**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-25T01:38:23Z
- **Completed:** 2026-04-25T01:45:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `EntryPayloadRules` with prompt, batch, device ID, minimum date, and future-skew limits.
- Added `EntryPayload::fromModel()` for canonical direct-save entry JSON including all prompt fields and millisecond `updated_at`.
- Replaced duplicated controller validation arrays with shared contracts.
- Added backend coverage for oversized prompt fields, oversized sync batches, future timestamps, and direct-save canonical payloads.

## Task Commits

Each task was committed atomically after verification and hook checks:

1. **Task 1: Add shared entry validation and serialization contracts** - `1d20405` (feat)
2. **Task 2: Wire controllers to the shared contracts and cover backend limits** - `34ac866` (feat)

## Files Created/Modified

- `app/Support/Entries/EntryPayloadRules.php` - Shared entry and sync envelope validation constants and rules.
- `app/Support/Entries/EntryPayload.php` - Canonical Entry model response serializer.
- `tests/Unit/EntryPayloadContractTest.php` - Contract tests for shared rules, future-skew validation, and serializer shape.
- `app/Http/Controllers/EntryController.php` - Direct save now uses shared rules and canonical serializer.
- `app/Http/Controllers/Api/SyncController.php` - Sync push now uses shared batch and per-entry rules.
- `tests/Feature/EntryUpsertTest.php` - Direct-save limit, skew, and canonical response coverage.
- `tests/Feature/SyncPushTest.php` - Sync batch max, prompt max, and future-skew item rejection coverage.

## Decisions Made

- Used a support class instead of FormRequests because sync needs the same rules inside per-item `Validator::make()` calls.
- Kept batch sync response payload shape unchanged in this plan; Plan 02 owns canonical batch result payloads and conflict semantics.
- Kept hooks enabled and committed at GREEN points because GrumPHP runs Pest during pre-commit and rejects intentionally failing RED commits.

## Deviations from Plan

None - no functional deviations from the planned backend contract.

Process note: the TDD RED states were verified with failing targeted tests, but RED-only commits were not possible under the user's "normal git commits with hooks" constraint because the pre-commit hook runs Pest.

## Issues Encountered

- The first RED commit attempt was blocked by GrumPHP because Pest correctly failed. Resolution: kept hooks enabled, completed GREEN implementation, and committed each task after verification passed.
- The serializer unit test initially expected arbitrary sub-second preservation on an unsaved Eloquent timestamp. Resolution: adjusted the test to assert millisecond serialization of a second-precision model timestamp, matching Laravel's timestamp behavior.

## Verification

- `php -l app/Support/Entries/EntryPayloadRules.php` - no syntax errors.
- `php -l app/Support/Entries/EntryPayload.php` - no syntax errors.
- `php artisan test --filter=EntryPayloadContractTest` - 3 passed, 20 assertions.
- `php artisan test --filter=EntryUpsertTest` - 6 passed, 20 assertions.
- `php artisan test --filter=SyncPushTest` - 7 passed, 26 assertions.
- `rg "entry_date' => \['required'" app/Http/Controllers` - no remaining duplicated inline entry rule arrays.
- `rg "EntryPayloadRules::rules|EntryPayloadRules::batchRules|EntryPayload::fromModel" app/Http/Controllers` - all required controller usages found.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 02 to extend the sync push response contract with canonical item payloads and conflict semantics using the shared rules and serializer from this plan.

## Self-Check: PASSED

- Created files exist: `EntryPayloadRules.php`, `EntryPayload.php`, `EntryPayloadContractTest.php`, and `01-01-SUMMARY.md`.
- Task commits exist: `1d20405` and `34ac866`.

---
*Phase: 01-sync-contract-local-state*
*Completed: 2026-04-25*
