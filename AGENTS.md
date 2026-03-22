# Repository Guidelines

## Codex Cloud Context
- Treat this repository as having awareness only of the files and instructions contained inside it.
- Use the repo root as the working directory for all commands.
- Prefer small, reviewable changes that focus on one concern at a time.
- Use only files, commands, and documentation that are present in this repository.

## Project Structure
- `app/`: Laravel application code.
- `routes/`: Web and console routes.
- `resources/`: React, CSS, and Blade assets.
- `database/`: SQLite database file, migrations, factories, and seeders.
- `tests/`: Pest tests grouped into `Feature/` and `Unit/`.

## Bootstrap And Development
- `composer setup`: install PHP and npm dependencies, create `.env` if needed, generate the app key, run migrations, and build frontend assets.
- `composer dev`: run the Laravel server, queue listener, log tailing, and Vite dev server together.
- `composer test`: clear config and run the full test suite.
- `XDEBUG_MODE=off vendor/bin/grumphp run`: preferred quality verification command before handoff.

## Environment Notes
- Local and cloud-ready development defaults to SQLite.
- Magic-link emails use the `log` mailer by default, so login URLs are written to `storage/logs/laravel.log`.
- Frontend state is locally first in the browser via Dexie/IndexedDB, with authenticated sync to the Laravel backend.

## Testing And Verification
- Run `composer test` for the full test suite.
- Run `php artisan test --filter=...` for targeted checks while iterating.
- Prefer `XDEBUG_MODE=off vendor/bin/grumphp run` as the final verification step because it covers formatting, static analysis, and tests.

## Implementation Notes
- Keep documentation and commands aligned with the repo's actual behavior.
- Preserve the current SQLite-first and magic-link-based workflow unless the task explicitly changes it.
