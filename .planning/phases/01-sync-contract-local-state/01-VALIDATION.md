---
phase: 1
slug: sync-contract-local-state
status: ready
nyquist_compliant: true
wave_0_complete: false
wave_0_status: planned_in_plan_03_task_1
created: 2026-04-25
updated: 2026-04-25
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

`nyquist_compliant: true` means the final five plans below have a current per-task map and every planned task has an `<automated>` verification command. `wave_0_complete: false` is execution state only: the frontend test harness does not exist before execution and is created by Plan 03 Task 1, then exercised by Plan 03 Task 3 and Plan 04.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | Pest / Laravel feature tests |
| **Frontend framework** | Vitest with fake-indexeddb, installed by Plan 03 Task 1 |
| **Backend config file** | `phpunit.xml` |
| **Frontend config file** | `vitest.config.ts`, created by Plan 03 Task 1 |
| **Quick run command** | `php artisan test --filter=SyncPushTest` and `npm run test:unit -- resources/js/lib/db.test.ts` |
| **Full suite command** | `composer test`, `npm run typecheck`, `npm run build`, `XDEBUG_MODE=off vendor/bin/grumphp run` |
| **Estimated runtime** | ~90-120 seconds after dependencies are installed |

---

## Sampling Rate

- **After every task commit:** Run the `<automated>` command listed for that task in the map below.
- **After backend contract waves:** Run `php artisan test --filter=EntryUpsertTest` and `php artisan test --filter=SyncPushTest`.
- **After frontend local-state/UI waves:** Run `npm run test:unit -- resources/js/lib/db.test.ts`, `npm run typecheck`, and `npm run build` as applicable.
- **Before `/gsd-verify-work`:** Run the Plan 05 Task 3 gate: `npm run build`, both targeted PHP filters, `composer test`, and `XDEBUG_MODE=off vendor/bin/grumphp run`.
- **Max feedback latency:** 120 seconds for targeted checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SYNC-05, SYNC-06 | T-01-01-01 / T-01-01-02 / T-01-01-03 | Shared rules and serializer bound prompt length, batch size, device ID length, and future skew without logging private prompt text. | PHP syntax/static | `php -l app/Support/Entries/EntryPayloadRules.php && php -l app/Support/Entries/EntryPayload.php` | created by task | planned |
| 1-01-02 | 01 | 1 | SYNC-05, SYNC-06 | T-01-01-01 / T-01-01-02 / T-01-01-03 | Direct save and sync use one rule source and return canonical direct-save payloads with limit coverage. | PHP feature | `php artisan test --filter=EntryUpsertTest && php artisan test --filter=SyncPushTest` | existing tests expanded | planned |
| 1-02-01 | 02 | 2 | SYNC-02, SYNC-05, SYNC-07 | T-01-02-01 / T-01-02-02 / T-01-02-03 | Backend tests lock canonical `upserted`/`skipped`, client-newer/server-newer, and duplicate-date semantics. | PHP feature | `php artisan test --filter=SyncPushTest` | existing test expanded | planned |
| 1-02-02 | 02 | 2 | SYNC-02, SYNC-05, SYNC-07 | T-01-02-01 / T-01-02-02 / T-01-02-03 / T-01-02-04 | Sync responses include canonical server entries for accepted/skipped items and deterministic item-level duplicate rejection. | PHP feature | `php artisan test --filter=SyncPushTest` | existing implementation changed | planned |
| 1-03-01 | 03 | 3 | SYNC-01, SYNC-04 | T-01-03-03 | Vitest and fake-indexeddb test infrastructure is installed without watch mode. | frontend unit harness | `npm run test:unit -- --passWithNoTests` | created by task | planned - Wave 0 harness |
| 1-03-02 | 03 | 3 | SYNC-01, SYNC-04 | T-01-03-01 / T-01-03-02 / T-01-03-04 | Dexie version 2 migration preserves entries and adds durable local sync status fields. | TypeScript | `npm run typecheck` | existing source changed | planned |
| 1-03-03 | 03 | 3 | SYNC-01, SYNC-04 | T-01-03-01 / T-01-03-02 / T-01-03-04 | Local tests prove migration defaults and retry filtering for local, failed, pending, synced, rejected, and conflict states. | frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts && npm run typecheck` | created by task | planned |
| 1-04-01 | 04 | 4 | SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-07 | T-01-04-01 / T-01-04-02 / T-01-04-03 / T-01-04-04 | Tests lock canonical writes, rejected non-retry, failed retry, and preserved conflict local copy behavior. | frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts` | existing test expanded | planned |
| 1-04-02 | 04 | 4 | SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-07 | T-01-04-01 / T-01-04-02 / T-01-04-03 / T-01-04-04 | Result-aware client sync chunks at 50, applies canonical server payloads, and persists failed/rejected/conflict outcomes. | frontend unit + TypeScript | `npm run test:unit -- resources/js/lib/db.test.ts && npm run typecheck` | existing source changed | planned |
| 1-05-01 | 05 | 5 | SYNC-01, SYNC-04, SYNC-08 | T-01-05-01 / T-01-05-02 | Accessible status component renders all sync states and action affordances with required copy. | TypeScript | `npm run typecheck` | created by task | planned |
| 1-05-02 | 05 | 5 | SYNC-01, SYNC-04, SYNC-08 | T-01-05-01 / T-01-05-02 / T-01-05-03 / T-01-05-05 | Today, History, and HistoryEntry display durable statuses and recovery actions without retry loops. | frontend unit + TypeScript | `npm run test:unit -- resources/js/lib/db.test.ts && npm run typecheck` | existing UI changed | planned |
| 1-05-03 | 05 | 5 | SYNC-08, SYNC-01 through SYNC-07 | T-01-05-04 | Restore-limit copy is corrected and final phase quality gates cover backend, frontend, and full PHP suite. | full gate | `npm run build && php artisan test --filter=EntryUpsertTest && php artisan test --filter=SyncPushTest && composer test && XDEBUG_MODE=off vendor/bin/grumphp run` | existing UI changed | planned |

*Status values describe execution state: planned, green, red, flaky.*

---

## Wave 0 Coverage Semantics

There is no standalone Plan 00 in the final stack. Wave 0 means "missing test infrastructure that must be created before frontend state tests can run." It is fully planned but not executed yet, so `wave_0_complete: false` remains truthful.

| Requirement | Created By | Verified By | Execution Status |
|-------------|------------|-------------|------------------|
| `vitest.config.ts` | Plan 03 Task 1 | `npm run test:unit -- --passWithNoTests` | planned, not executed |
| `tests/js/setup.ts` with `fake-indexeddb/auto` | Plan 03 Task 1 | `npm run test:unit -- --passWithNoTests` | planned, not executed |
| `package.json` `test:unit` script | Plan 03 Task 1 | `npm run test:unit -- --passWithNoTests` | planned, not executed |
| `vitest` and `fake-indexeddb` dev dependencies | Plan 03 Task 1 | `npm run test:unit -- --passWithNoTests` | planned, not executed |
| `resources/js/lib/db.test.ts` | Plan 03 Task 3, extended in Plan 04 Task 1 | `npm run test:unit -- resources/js/lib/db.test.ts` | planned, not executed |
| Environment repair via `npm install` | Plan 03 Task 1 | frontend unit/typecheck/build commands | planned, not executed |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User-facing status copy and recovery affordance are understandable in the live page layout. | SYNC-01, SYNC-04, SYNC-08 | No browser E2E harness exists in this phase; automated coverage is type/build plus local-state unit tests. | Open `/today` authenticated and unauthenticated, create local-only, synced, failed, rejected, and conflict fixtures, then confirm visible copy matches the plan acceptance criteria. |

---

## Threat References

| Ref | Threat | Expected Mitigation |
|-----|--------|---------------------|
| T-1-01 | Local and server state diverge silently after skipped or conflict sync results. | Server returns canonical payloads; client writes canonical data or records recoverable conflict metadata before showing synced/conflict status. |
| T-1-02 | Oversized or malformed sync payloads create validation drift or resource pressure. | Shared server validation contract limits fields, batch size, device IDs, and future timestamps across direct save and batch sync. |
| T-1-03 | Product copy promises fresh-device restore that the app cannot verify. | Help/Today copy avoids full restore claims unless a verified pull/restore flow is implemented. |

---

## Validation Sign-Off

- [x] All 12 final planned tasks have `<automated>` verify commands.
- [x] Sampling continuity: no consecutive planned task lacks automated verification.
- [x] Wave 0 prerequisites are mapped to Plan 03 Task 1 and Plan 03 Task 3; they are planned but not executed.
- [x] No watch-mode flags.
- [x] Feedback latency < 120s for targeted checks.
- [x] `nyquist_compliant: true` is set in frontmatter because the final task map is current.

**Approval:** approved for execution; `wave_0_complete` remains false until Plan 03 Task 1 is executed.
