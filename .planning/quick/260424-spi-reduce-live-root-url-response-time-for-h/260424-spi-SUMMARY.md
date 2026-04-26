# Quick Task 260424-spi - Summary

## Completed

- Reproduced the live symptom with `curl`: fresh no-cookie `https://consider.today/` returned a 302 with session and XSRF cookies and roughly 700ms total time from this environment.
- Confirmed repeat requests with an existing cookie jar were materially faster, pointing at first-session work on the redirect path.
- Added `RootRedirectTest` to lock the expected behavior.
- Replaced the root redirect route with `RootRedirectController`.
- Excluded session, CSRF-cookie, queued-cookie, Inertia shared-prop, and session-error middleware from the root redirect route.
- Added `Cache-Control: public, max-age=300` to make the redirect reusable by clients and compatible with cache layers that honor origin cache headers.

## Verification

- `php artisan test --filter=RootRedirectTest` - passed.
- `php artisan test --filter=ExampleTest` - passed.
- `php artisan route:cache` - passed.
- Local cached-route HTTP check returned 302, no `Set-Cookie`, and `Cache-Control: max-age=300, public`.
- Local dev-server `curl` timing after the change: `total=0.008348` for `/`.

## Code Commit

`71dfb18 perf: slim root redirect`

## Notes

The live site will keep showing the old timing until this commit is deployed and production routes/config are refreshed. If first-hit latency still stays above the target after deploy, the remaining bottleneck is likely origin/runtime baseline rather than the Laravel session work on `/`; the next step would be an edge redirect at Cloudflare or the hosting layer.
