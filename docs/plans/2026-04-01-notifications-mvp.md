# Notifications MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the first durable reminder/notification flow for signed-in users with explicit opt-in/out controls, saved delivery preferences, and a minimal daily email reminder path that fits the hosted beta.

**Architecture:** Build this as a small stack. First add a durable notification preferences model on `users` and expose it safely through settings. Next add the first delivery path as a queued daily reminder email driven by an Artisan command so it can be run by cron without introducing scheduler complexity into the first slice. Finish by replacing the current reminder placeholder UI with real controls and documenting the operational command and env expectations.

**Tech Stack:** Laravel, Inertia, React, queued mail, Artisan console command, PHPUnit feature tests, existing settings page and user model.

---

### Task 1: Clean Up Planning Priority Before Implementation

**Files:**
- Modify: `_planning/NOW.md`
- Modify: `_planning/BACKLOG.md`
- Modify: `_planning/LOG.md`
- Test: manual review of planning files

**Step 1: Write the failing check**
- Confirm `_planning/NOW.md` still lists timezone support as an active item even though `_planning/STATUS.md` and `_planning/LOG.md` already record it as completed.

**Step 2: Run check to verify the mismatch**
Run: `sed -n '1,220p' _planning/NOW.md`
Expected: timezone support still appears in `This week`.

**Step 3: Write minimal implementation**
- Remove the timezone item from `This week`.
- Move Notifications MVP to the top active slot.
- Keep `NOW` at 3-7 active items.
- Add a concise log line pointing to this plan and the reprioritization.

**Step 4: Run verification**
Run: `sed -n '1,220p' _planning/NOW.md`
Expected: notifications is the top active task and timezone is no longer listed as in-progress.

**Step 5: Commit**
```bash
git add _planning/NOW.md _planning/BACKLOG.md _planning/LOG.md
git commit -m "docs: align planning queue with timezone completion"
```

### Task 2: Add Durable Notification Preference Fields

**Files:**
- Create: `database/migrations/2026_04_01_000000_add_notification_preferences_to_users_table.php`
- Modify: `app/Models/User.php`
- Modify: `database/factories/UserFactory.php`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Modify: `tests/Feature/SettingsUpdateTest.php`
- Test: `tests/Feature/SettingsUpdateTest.php`

**Step 1: Write the failing test**
- Add a settings feature test proving a signed-in user can save:
  - `notifications_enabled`
  - `notification_channel`
  - `daily_reminder_time`
- Add a validation test rejecting unsupported channels and malformed reminder times.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: FAIL because the fields do not exist in schema, validation, or shared page props.

**Step 3: Write minimal implementation**
- Add nullable/boolean user columns:
  - `notifications_enabled`
  - `notification_channel`
  - `daily_reminder_time`
  - optionally `daily_reminder_last_sent_on` to support duplicate protection in the next task
- Add casts/fillable entries in `app/Models/User.php`.
- Extend shared auth props in `app/Http/Middleware/HandleInertiaRequests.php` so the settings page can hydrate from server truth.
- Update factory defaults to keep tests explicit and predictable.

**Step 4: Run test to verify it passes**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add database/migrations/2026_04_01_000000_add_notification_preferences_to_users_table.php app/Models/User.php database/factories/UserFactory.php app/Http/Middleware/HandleInertiaRequests.php tests/Feature/SettingsUpdateTest.php
git commit -m "feat: add notification preference fields"
```

### Task 3: Persist Notification Preferences Through Settings

**Files:**
- Modify: `app/Http/Controllers/SettingsController.php`
- Modify: `resources/js/Pages/Settings.tsx`
- Modify: `tests/Feature/SettingsUpdateTest.php`
- Test: `tests/Feature/SettingsUpdateTest.php`

**Step 1: Write the failing test**
- Add a feature test proving settings updates persist notification preferences without breaking timezone and flashback behavior.
- Add a feature test proving disabled notifications clear or ignore reminder-specific fields consistently.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: FAIL because the controller does not yet validate or persist the new fields.

**Step 3: Write minimal implementation**
- Extend settings validation:
  - `notifications_enabled` required boolean
  - `notification_channel` nullable and limited to the first supported channel (`email`)
  - `daily_reminder_time` nullable `date_format:H:i`
- Persist the new fields in `SettingsController`.
- Keep timezone redirect behavior unchanged.
- Replace the “Coming later” reminder placeholder in `Settings.tsx` with:
  - enable/disable toggle
  - channel display or selector locked to `email`
  - reminder time input
  - explanatory copy about daily reminder delivery
- Continue offering the `.ics` fallback download until real delivery is verified in production.

**Step 4: Run verification**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php`
Expected: PASS

Run: `npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add app/Http/Controllers/SettingsController.php resources/js/Pages/Settings.tsx tests/Feature/SettingsUpdateTest.php
git commit -m "feat: add notification settings controls"
```

### Task 4: Add the First Reminder Delivery Command

**Files:**
- Create: `app/Console/Commands/SendDailyReminders.php`
- Create: `app/Mail/DailyReminderMail.php`
- Create: `resources/views/emails/reminders/daily.blade.php`
- Modify: `routes/console.php`
- Modify: `tests/Feature/MetricsCountsCommandTest.php`
- Create: `tests/Feature/SendDailyRemindersCommandTest.php`
- Test: `tests/Feature/SendDailyRemindersCommandTest.php`

**Step 1: Write the failing test**
- Add a command test proving `notifications:send-daily-reminders` sends exactly one email to eligible users:
  - notifications enabled
  - channel `email`
  - reminder time due in the user’s timezone
  - not already sent for that local date
- Add a negative test proving users with notifications disabled or not-yet-due times are skipped.

**Step 2: Run test to verify it fails**
Run: `php artisan test tests/Feature/SendDailyRemindersCommandTest.php`
Expected: FAIL because the command and mail do not exist.

**Step 3: Write minimal implementation**
- Create a command that:
  - finds users opted into `email`
  - calculates “now” in each user’s saved timezone
  - sends when local time is at or after the configured reminder time
  - records `daily_reminder_last_sent_on` to avoid duplicates for the same local date
- Create a minimal `DailyReminderMail` with a single CTA back to `/today`.
- Register the command in `routes/console.php`.
- Keep this command manually invokable first; do not add full scheduler wiring in this slice.

**Step 4: Run test to verify it passes**
Run: `php artisan test tests/Feature/SendDailyRemindersCommandTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add app/Console/Commands/SendDailyReminders.php app/Mail/DailyReminderMail.php resources/views/emails/reminders/daily.blade.php routes/console.php tests/Feature/SendDailyRemindersCommandTest.php
git commit -m "feat: add daily reminder delivery command"
```

### Task 5: Capture Minimal Beta Ops Documentation

**Files:**
- Modify: `_planning/STATUS.md`
- Modify: `_planning/RUNBOOKS.md`
- Test: manual verification of docs

**Step 1: Write the failing check**
- Confirm the repo still lacks notification-specific operational notes and still has placeholder deploy/runbook guidance.

**Step 2: Run check**
Run: `sed -n '1,220p' _planning/RUNBOOKS.md`
Expected: no reminder delivery command or env guidance is documented.

**Step 3: Write minimal implementation**
- Update `_planning/STATUS.md` to note that email reminders are the first notification channel once shipped.
- Add a short runbook section covering:
  - required mailer configuration
  - queue worker requirement
  - cron invocation for `php artisan notifications:send-daily-reminders`
  - rollback/disable path by turning notifications off at the app or env level

**Step 4: Run verification**
Run: `sed -n '1,220p' _planning/RUNBOOKS.md`
Expected: reminder operations are documented in concise, concrete terms.

**Step 5: Commit**
```bash
git add _planning/STATUS.md _planning/RUNBOOKS.md
git commit -m "docs: add reminder delivery runbook"
```

### Task 6: Final Verification

**Files:**
- Test: `tests/Feature/SettingsUpdateTest.php`
- Test: `tests/Feature/SendDailyRemindersCommandTest.php`
- Test: `tests/Feature/TodayRouteTest.php`
- Test: repo verification commands

**Step 1: Run targeted backend tests**
Run: `php artisan test tests/Feature/SettingsUpdateTest.php tests/Feature/SendDailyRemindersCommandTest.php tests/Feature/TodayRouteTest.php`
Expected: PASS

**Step 2: Run build**
Run: `npm run build`
Expected: PASS

**Step 3: Run final repo verification**
Run: `XDEBUG_MODE=off vendor/bin/grumphp run`
Expected: PASS

**Step 4: Capture planning and release notes**
- Update `_planning/LOG.md` with the shipped notification slice result if implementation is completed in this session.

**Step 5: Commit**
```bash
git add .
git commit -m "chore: verify notifications mvp slice"
```
