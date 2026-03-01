# Recurring Tasks

## Dependency vulnerability check (daily)

- How to run:
  - PHP: `composer audit`
  - JS: `npm audit --omit=dev` (or repo standard equivalent)
- Done means:
  - Vulnerability report reviewed.
  - New actionable findings are triaged into backlog with severity.
  - Non-actionable findings are documented with rationale.
- Output/evidence:
  - Link to CI/job output or attach command output summary in `_planning/LOG.md`.
- Failure playbook:
  - If critical/high vulnerability is confirmed, create a P0/P1 backlog item with owner and mitigation target date.
  - If fix is blocked, document compensating controls and re-check cadence.
