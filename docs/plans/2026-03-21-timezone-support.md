# Timezone Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make timezone handling explicit and verified so signed-in users get "today" from their saved account timezone, signed-out users keep using device time, and existing `entry_date` values remain stable.

**Architecture:** Build this in three sequential reviewable steps. First, lock down `/today` behavior with feature tests. Second, extend backend settings validation and persistence for timezone changes. Third, expose timezone editing in the settings UI. Keep implementation minimal and test-first for each step.

**Tech Stack:** Laravel, Inertia, React, PHPUnit feature tests, existing settings and today controllers.

---

### Task 1: Lock Down Today Timezone Resolution

**Files:**
- Modify: `tests/Feature/TodayRouteTest.php`
- Test: `tests/Feature/TodayRouteTest.php`

**Step 1: Write the failing test**
- Add a feature test showing that an authenticated user with timezone `Pacific/Kiritimati` gets `/today` date `2026-03-22` when server time is frozen at `2026-03-21 10:30:00 UTC`.
- Add a feature test showing that an authenticated user with timezone `America/Los_Angeles` gets `/today` date `2026-03-21` when server time is frozen at `2026-03-22 00:30:00 UTC`.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/TodayRouteTest.php`
Expected: FAIL if timezone handling is not correctly anchored to the saved user timezone.

**Step 3: Write minimal implementation**
- Update `app/Http/Controllers/TodayController.php` only if the new tests expose a real gap.

**Step 4: Run test to verify it passes**
Run: `php artisan test tests/Feature/TodayRouteTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add tests/Feature/TodayRouteTest.php app/Http/Controllers/TodayController.php
git commit -m "test: lock down today timezone resolution"
```

### Task 2: Persist Account Timezone in Settings

**Files:**
- Modify: `app/Http/Controllers/SettingsController.php`
- Modify: `tests/Feature/SettingsUpdateTest.php`
- Test: `tests/Feature/SettingsUpdateTest.php`

**Step 1: Write the failing test**
- Add a test that a signed-in user can update `timezone` and `show_flashbacks`.
- Add a test that an invalid timezone string is rejected with a validation error.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: FAIL because timezone is not yet validated or persisted.

**Step 3: Write minimal implementation**
- Extend settings validation to include a valid timezone identifier.
- Include `timezone` in the settings payload returned to the page.
- Redirect to `/today` after successful save if timezone changed; otherwise keep existing redirect.

**Step 4: Run test to verify it passes**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add app/Http/Controllers/SettingsController.php tests/Feature/SettingsUpdateTest.php
git commit -m "feat: persist account timezone setting"
```

### Task 3: Expose Timezone in Settings UI

**Files:**
- Modify: `resources/js/Pages/Settings.tsx`
- Test: `resources/js/Pages/Settings.tsx` (manual verification)

**Step 1: Write the failing check**
- Verify settings page currently exposes `show_flashbacks` only and has no timezone input.

**Step 2: Run check**
Run: `sed -n '1,260p' resources/js/Pages/Settings.tsx`
Expected: No timezone field is present.

**Step 3: Write minimal implementation**
- Add a timezone input bound to the form.
- Initialize it from server props.
- Keep the page copy clear that timezone controls which date counts as "today" for signed-in use.

**Step 4: Run verification**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add resources/js/Pages/Settings.tsx
git commit -m "feat: add timezone field to settings"
```
