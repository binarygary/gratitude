# Runbooks

- Local setup: [Root README](../README.md)
- Deploy: ensure app deploy includes a running queue worker and a recurring `php artisan notifications:send-daily-reminders` invocation on the intended cadence.
- Rollback: _Placeholder - add rollback command sequence and checkpoints._
- Backups: _Placeholder - add backup and restore procedure._
- Incident notes: _Placeholder - capture incident timeline, impact, and remediation._

## Daily Reminder Delivery

- Mailer: configure a real production mailer before enabling reminders for beta users.
- Worker: keep the queue worker running if reminder sending is switched to queued delivery later; current MVP sends directly from the command.
- Cron: run `php artisan notifications:send-daily-reminders` on a recurring schedule that is frequent enough to catch user-local reminder times.
- Disable path: turn reminders off per user in Settings, or stop the recurring command if delivery needs to be paused globally.
