---
quick_id: 260424-spi
status: complete
autonomous: true
files_modified:
  - app/Http/Controllers/RootRedirectController.php
  - routes/web.php
  - tests/Feature/RootRedirectTest.php
---

# Quick Task 260424-spi - Root URL Response Time

## Objective

Reduce fresh root URL response overhead for `https://consider.today/` by removing unnecessary session/CSRF/Inertia work from the plain redirect to `/today`.

## Root Cause

Fresh no-cookie requests to `/` were spending most of their time waiting for the origin and returned `Set-Cookie` headers for `XSRF-TOKEN` and `considertoday-session`, even though the route only redirects to `/today`.

## Tasks

<task id="260424-spi-01">
<read_first>
- routes/web.php
- config/session.php
- bootstrap/app.php
- tests/Feature/ExampleTest.php
</read_first>
<action>
Add a regression test proving the root redirect returns `/today`, emits no `Set-Cookie` header, and sends `Cache-Control: max-age=300, public`.
</action>
<acceptance_criteria>
- `tests/Feature/RootRedirectTest.php` exists.
- `php artisan test --filter=RootRedirectTest` passes.
</acceptance_criteria>
</task>

<task id="260424-spi-02">
<read_first>
- routes/web.php
- app/Http/Controllers/Controller.php
- bootstrap/app.php
</read_first>
<action>
Replace the root `Route::redirect('/', '/today')` with `RootRedirectController`, exclude unnecessary web middleware for that route, and return a public-cacheable 302 redirect.
</action>
<acceptance_criteria>
- `routes/web.php` uses `RootRedirectController::class` for `GET /`.
- `routes/web.php` excludes `AddQueuedCookiesToResponse`, `HandleInertiaRequests`, `PreventRequestForgery`, `ShareErrorsFromSession`, and `StartSession` for the root route.
- `app/Http/Controllers/RootRedirectController.php` returns a redirect to `/today` with `Cache-Control: public, max-age=300`.
</acceptance_criteria>
</task>

## Verification

- `php artisan test --filter=RootRedirectTest`
- `php artisan test --filter=ExampleTest`
- `php artisan route:cache`
- Local HTTP check: `curl -s -D /tmp/local-root-cached.headers -o /tmp/local-root-cached.html http://127.0.0.1:8019/`

