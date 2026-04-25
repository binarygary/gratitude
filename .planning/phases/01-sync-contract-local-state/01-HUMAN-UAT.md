---
status: partial
phase: 01-sync-contract-local-state
source: [01-VERIFICATION.md]
started: 2026-04-25T02:47:54Z
updated: 2026-04-25T11:46:33Z
---

# Phase 1 Human UAT

## Current Test

Status presentation redesign needed before UAT can pass.

## Tests

### 1. Status and Recovery UI Pass

expected: Today, History, and HistoryEntry visibly show local, pending, synced, failed, rejected, and conflict states with the right recovery actions.
result: issue - current rejected/error presentation is too intrusive; the error copy is hard to read, vertically awkward inside the red block, and recovery actions feel disconnected from the message.

### 2. Conflict Local-Copy Review and Discard

expected: Conflict entries show server-canonical text, preserve the local copy in Review local copy, and require confirmation before discard.
result: [pending]

### 3. Responsive and Assistive Behavior

expected: Status badges and alerts remain readable on mobile/desktop and announce changes through the intended role/status/aria-live semantics.
result: issue - status messaging needs a less intrusive visual model, and the History status column should use a simple brand-colored sync indicator instead of long visible status text.

## Summary

total: 3
passed: 0
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

### GAP-01: Sync Status UI Is Too Intrusive

status: failed
source: user UAT screenshot and feedback

Problem:
- Alert-mode status messages use large colored blocks for recoverable sync states.
- Rejected/error text is low-contrast and visually sits awkwardly in the block.
- Recovery buttons beside the block feel unrelated to the message.
- History needs compact scan-friendly status, not long explanatory text in a table cell.

Next steps:
1. Redesign `EntrySyncStatus` around compact visible labels:
   - History/table mode: small brand-colored dot plus short label (`Local`, `Pending`, `Synced`, `Failed`, `Rejected`, `Conflict`).
   - Inline mode: compact indicator for Today and HistoryEntry normal state.
   - Alert/callout mode: restrained neutral/light notice for failed, rejected, and conflict, with action buttons below the message.
2. Keep full explanatory copy available through accessible labels/titles and in callout body text only where action is needed.
3. Add/update component tests so:
   - History/compact mode does not render the long sentence copy visibly.
   - Rejected callout does not use `alert-error` as a full-width red panel.
   - Action buttons render below the callout message.
4. Re-run `npm run test:unit -- resources/js/Components/EntrySyncStatus.test.ts`, `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Repeat UAT for History, Today, and HistoryEntry before marking Phase 1 complete.
