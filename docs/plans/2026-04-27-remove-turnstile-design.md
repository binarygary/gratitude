# Remove Turnstile Design

## Decision

Remove Cloudflare Turnstile from Phase 2 auth hardening. Keep the rest of the auth/session hardening already built: segmented magic-link request throttling, uniform request responses, safe magic-link consume failures, token cleanup, explicit remember-device behavior, and CSRF-protected session write routes.

## Approach

Use rate limiting as the only magic-link request abuse control for now. The request route keeps the named `magic-link-request` limiter with IP and normalized-email buckets. The controller no longer accepts or verifies a browser challenge token before creating the user, token row, and mail.

## Scope

Remove:

- `TURNSTILE_*` env keys and `services.turnstile` config.
- `App\Support\Auth\Turnstile*` verifier classes.
- The Turnstile container binding.
- Controller validation/injection for `cf-turnstile-response`.
- AppShell Turnstile script loading, widget rendering, hidden response field, and fallback copy.
- Turnstile-specific tests, README copy, planning requirements, verification, and UAT items.

Keep:

- Uniform magic-link request copy.
- IP and normalized-email throttling.
- Remember-device checkbox and token persistence.
- Magic-link consume hardening and cleanup command.
- CSRF restoration and Axios `X-CSRF-TOKEN` header.

## Testing

Update request tests so successful magic-link requests no longer require a verifier binding and throttled requests still preserve uniform copy. Remove Turnstile verifier tests. Run targeted auth/session tests, frontend typecheck/build, full PHP tests, and GrumPHP.
