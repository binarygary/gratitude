---
phase: 1
slug: sync-contract-local-state
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | Pest / Laravel feature tests |
| **Frontend framework** | Vitest with fake-indexeddb, installed in Wave 0 |
| **Backend config file** | `phpunit.xml` |
| **Frontend config file** | `vitest.config.ts`, created in Wave 0 |
| **Quick run command** | `php artisan test --filter=SyncPushTest` and `npm run test:unit -- resources/js/lib/db.test.ts` |
| **Full suite command** | `composer test`, `npm run typecheck`, `npm run build`, `XDEBUG_MODE=off vendor/bin/grumphp run` |
| **Estimated runtime** | ~90 seconds after dependencies are installed |

---

## Sampling Rate

- **After every task commit:** Run the narrow command for the touched surface: `php artisan test --filter=SyncPushTest`, `php artisan test --filter=EntryUpsertTest`, or `npm run test:unit -- resources/js/lib/db.test.ts`.
- **After every plan wave:** Run `composer test`, `npm run typecheck`, and `npm run build`.
- **Before `/gsd-verify-work`:** Run `XDEBUG_MODE=off vendor/bin/grumphp run`.
- **Max feedback latency:** 120 seconds for targeted checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-00-01 | 00 | 0 | SYNC-01, SYNC-03, SYNC-04, SYNC-07 | T-1-01 | IndexedDB migration preserves existing entries and exposes explicit sync states. | frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts` | no - Wave 0 creates | pending |
| 1-00-02 | 00 | 0 | SYNC-01, SYNC-04, SYNC-07 | T-1-01 | fake-indexeddb setup isolates local sync-state tests from browser storage. | frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts` | no - Wave 0 creates | pending |
| 1-01-01 | 01 | 1 | SYNC-05, SYNC-06 | T-1-02 | Direct save and sync reject invalid dates, oversized fields, and malformed payloads from one shared rule source. | PHP feature | `php artisan test --filter=EntryUpsertTest` and `php artisan test --filter=SyncPushTest` | yes, needs expansion | pending |
| 1-02-01 | 02 | 1 | SYNC-02, SYNC-03, SYNC-07 | T-1-01 | Sync responses include canonical payloads for `upserted` and `skipped` results without leaking unrelated entries. | PHP feature | `php artisan test --filter=SyncPushTest` | yes, needs expansion | pending |
| 1-03-01 | 03 | 2 | SYNC-01, SYNC-03, SYNC-04, SYNC-07 | T-1-01 | Client stores canonical payloads, stops auto-retrying rejected entries, and preserves recovery metadata. | frontend unit | `npm run test:unit -- resources/js/lib/db.test.ts` | no - Wave 0 creates | pending |
| 1-04-01 | 04 | 2 | SYNC-01, SYNC-08 | T-1-03 | UI copy distinguishes local save, sync result, rejected/conflict recovery, and no full fresh-device restore promise. | frontend type/build | `npm run typecheck` and `npm run build` | yes, needs expansion | pending |
| 1-05-01 | 05 | 3 | SYNC-01 through SYNC-08 | T-1-01 / T-1-02 / T-1-03 | Full phase contract is covered before handoff. | full gate | `XDEBUG_MODE=off vendor/bin/grumphp run` | yes | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` - Vite-native unit test configuration for TypeScript sync-state tests.
- [ ] `tests/js/setup.ts` - imports `fake-indexeddb/auto` before Dexie tests run.
- [ ] `resources/js/lib/db.test.ts` - covers Dexie migration, canonical writes, rejected state, failed state, and conflict state.
- [ ] `package.json` script `test:unit` - runs Vitest without watch mode.
- [ ] Dev dependencies: `vitest` and `fake-indexeddb`.
- [ ] Environment repair: run `npm install` so `node_modules` matches `package-lock.json` before frontend verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User-facing status copy and recovery affordance are understandable in the live page layout. | SYNC-01, SYNC-04, SYNC-08 | No browser E2E harness exists in this phase unless the planner adds one. | Open `/today` authenticated and unauthenticated, create local-only, synced, failed, rejected, and conflict fixtures, then confirm visible copy matches the plan acceptance criteria. |

---

## Threat References

| Ref | Threat | Expected Mitigation |
|-----|--------|---------------------|
| T-1-01 | Local and server state diverge silently after skipped or conflict sync results. | Server returns canonical payloads; client writes canonical data or records recoverable conflict metadata before showing synced/conflict status. |
| T-1-02 | Oversized or malformed sync payloads create validation drift or resource pressure. | Shared server validation contract limits fields and batch size across direct save and batch sync. |
| T-1-03 | Product copy promises fresh-device restore that the app cannot verify. | Help/Today copy avoids full restore claims unless a verified pull/restore flow is implemented. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing test infrastructure references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 120s for targeted checks.
- [ ] `nyquist_compliant: true` set in frontmatter after the planner maps final task IDs.

**Approval:** pending
