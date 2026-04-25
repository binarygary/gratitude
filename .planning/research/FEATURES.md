# Feature Research

**Domain:** Friend-shareable beta for a local-first gratitude journal
**Researched:** 2026-04-25
**Confidence:** HIGH for beta readiness features; MEDIUM for competitor landscape; MEDIUM for product differentiators

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = beta users lose trust, need handholding, or cannot rely on the journal.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reliable local autosave with visible saved state | Journaling competitors emphasize "saves as you go"; a private reflection app cannot lose text during network or auth failures. | MEDIUM | Existing local-first IndexedDB save is a strength. Add explicit saved/pending/error state and test browser workflows. |
| User-visible sync status and rejected-entry recovery | Local-first users need to know whether entries are backed up, pending, rejected, or stale. Silent retry loops undermine trust. | HIGH | Handle rejected server validation as an actionable local state, not endless retry. Return canonical server entries for skipped/server-wins results. |
| Safe cross-device continuity | Authenticated users expect "log in elsewhere and see my journal," even in beta. | HIGH | Current push-only sync is not enough for restore. MVP can be limited, but should document limits or add a paginated pull/restore path before claiming backup. |
| Magic-link email that works in production | Open friend signup depends on users receiving links without the owner intervening. | MEDIUM | Requires real mail provider, SPF/DKIM/DMARC, branded sender, delayed/missing email copy, and invalid/expired/used-link states. |
| Auth and abuse hardening | Public email signup invites automated requests, inbox flooding, and token abuse. | MEDIUM | Add Turnstile with server-side verification, rate-limit validation, token cleanup, session hardening, CSRF protection for session-backed writes, and tests. |
| Clear privacy and data ownership copy | A journal is sensitive by default; competitors lead with privacy, encryption, lock, export, and user data ownership. | LOW | Do not overclaim end-to-end encryption. State what is local, what sync stores, how export works, and what beta support can access. |
| Notification MVP with opt-in/out controls | Reminders are common in journaling products and directly support daily habit formation. | MEDIUM | Choose one first channel, likely email because magic-link email already exists. Include settings, timezone-aware scheduling, delivery logging, and unsubscribe/disable. |
| Notification delivery verification | Reminder systems fail quietly without queue/mail visibility; beta users will blame the app for missed prompts. | MEDIUM | Track attempted/sent/failed status and expose enough admin/support state to debug. Laravel notifications have built-in test fakes for coverage. |
| Baseline observability | A friend-shareable beta needs the maintainer to know when auth, sync, notification, or request latency breaks. | MEDIUM | Capture unhandled exceptions, request latency, auth failures, sync push results, notification failures, and queue job failures. Avoid analytics dashboards as a first step. |
| Admin/support MVP | Beta support needs user lookup, sync/auth/notification status, and safe recovery actions without database spelunking. | MEDIUM | Keep internal-only. Minimum: user lookup by email, token/session visibility summary, recent sync/notification failures, basic account support actions. |
| Production readiness runbooks | A hosted beta needs repeatable deploy, worker, backup, restore, mail, and incident steps. | LOW | Include go/no-go checklist, env vars, queue worker expectations, backup schedule, restore drill, and rollback notes. |
| Stronger critical-path tests | Existing code has PHP coverage, but beta risk sits in frontend local-first state, auth lifecycle, timezone, sync conflicts, and notifications. | HIGH | Add focused PHP feature tests and browser/frontend tests around save, sync retry, rejected records, settings, timezone boundaries, and reminder preferences. |
| Friend-share onboarding and failure states | Friends should understand local-first capture, optional sync, beta expectations, and what to do when email/save/sync fails. | LOW | Keep it product-led and concise. This is not a marketing campaign. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required for beta trust, but valuable because they reinforce the app's narrow gratitude ritual.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Three-prompt gratitude ritual | Stronger focus than general diary apps: person, grace, and gratitude reduce blank-page friction. | LOW | Already core. Improve onboarding around the ritual rather than adding broad templates. |
| Local-first guest capture before signup | Friends can start writing immediately and decide later whether to sync. | MEDIUM | This is a real differentiator if save/sync status is transparent and seed/debug behavior cannot affect production users. |
| Flashbacks from one week and one year ago | Supports reflection and habit reinforcement without building a large analytics product. | MEDIUM | Existing feature. Keep timezone behavior correct and show empty states when no flashback exists. |
| Gentle, privacy-forward sharing posture | Friend-shareable means share the app, not users' private entries by default. | LOW | Favor private-by-default onboarding, export, and direct app sharing over social feeds. |
| Lightweight support visibility for a personal beta | A small beta can feel reliable if the owner can resolve auth/sync/notification failures quickly. | MEDIUM | Differentiates from unsupported hobby apps; avoid turning admin into broad analytics. |
| Data export as trust builder | Users are more willing to write sensitive entries when they can leave with their data. | MEDIUM | Existing export exists; improve copy and test output. Avoid complex import migration for beta. |
| Timezone-aware daily experience | Daily journaling is sensitive to "today" around travel, midnight, and DST. | MEDIUM | Existing active concern. Reliable date handling is both table stakes and a differentiator for daily ritual quality. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this beta.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Social feed or public gratitude stream | Sharing can drive growth and engagement. | Conflicts with private journal trust, creates moderation burden, and is out of scope for friend-shareable beta. | Product-led sharing of the app plus private export/share later if validated. |
| Entry-level friend collaboration/comments | Feels like a natural "friend" feature. | Turns private reflection into collaboration, complicates permissions, abuse, notifications, and deletion. | Keep entries private; add simple invite/referral tracking later if needed. |
| Multiple reminder channels at launch | Users may want push, SMS, email, and Slack. | Multiplies consent, deliverability, queue, unsubscribe, and observability work. | Launch one verified channel with opt-out and delivery logs. |
| Advanced analytics dashboards | Operators want insight during beta. | Pulls effort away from operational health and risks over-collecting sensitive behavior. | Capture errors, latency, auth/sync/notification health, and a few support-oriented counters. |
| AI-generated prompts or summaries | Current journaling products are moving toward AI assistance. | Sensitive content plus beta-stage privacy copy makes AI a trust liability before core reliability is proven. | Keep static prompts and flashbacks; revisit after privacy model and consent are explicit. |
| Native mobile apps | Journaling is often mobile-first. | Splits engineering focus before web beta reliability, auth, sync, and ops are proven. | Make the web app responsive and reliable; evaluate PWA/mobile later. |
| Full end-to-end encryption claim | Competitors use encryption as a strong privacy differentiator. | The current Laravel sync model likely allows server-side access; overclaiming would be worse than omitting it. | Be precise: local-first storage, HTTPS, server storage practices, export, and support access boundaries. Research encryption separately if made a goal. |
| Broad customization themes/fonts/covers | Competitors offer custom journals and aesthetics. | Does not address beta trust gates and can bloat UI/testing. | Keep visual polish restrained; prioritize readable writing and error states. |
| Import from every journal app | Lowers switching friction. | High format variance and support burden; not needed for friend beta. | Offer export first; consider one import path only after beta feedback. |

## Feature Dependencies

```text
Production mail deliverability
    ├──requires──> Real mail provider + SPF/DKIM/DMARC
    ├──enables──> Magic-link production signup
    └──enables──> Email notification MVP

Notification MVP
    ├──requires──> User timezone and reminder preferences
    ├──requires──> Queue worker in production
    ├──requires──> Delivery attempt logging
    └──enhances──> Daily gratitude habit

Safer sync behavior
    ├──requires──> Shared entry validation rules
    ├──requires──> Canonical server response for conflicts/skips
    ├──requires──> Rejected-entry local state
    └──enables──> Trustworthy cross-device continuity

Admin MVP
    ├──requires──> Auth/admin authorization boundary
    ├──requires──> Observable auth/sync/notification events
    └──enables──> Beta support without database access

Observability baseline
    ├──requires──> Error capture
    ├──requires──> Critical-flow event instrumentation
    └──enables──> Go/no-go beta readiness review

Friend-share onboarding
    ├──requires──> Accurate privacy and beta reliability copy
    ├──requires──> Email/save/sync failure states
    └──enhances──> Open signup conversion without handholding

Broad social sharing
    └──conflicts──> Private-by-default journal trust
```

### Dependency Notes

- **Production mail deliverability comes before auth and notification confidence:** magic links and email reminders both fail if sender identity, queue workers, and delivery troubleshooting are not ready.
- **Notification MVP requires observability, not just scheduling:** a reminder that cannot be debugged becomes a support problem.
- **Safer sync comes before promising backup/restore:** push-only local sync can preserve capture, but it does not satisfy fresh-device restore expectations.
- **Admin MVP depends on instrumentation:** user lookup is useful only if it shows auth, sync, and notification status.
- **Onboarding copy depends on actual guarantees:** privacy and reliability copy must match implemented behavior, especially around local storage, sync, export, and support access.
- **Social features conflict with beta trust:** friend-shareable should mean "safe to send the app link to friends," not "friends interact with entries."

## MVP Definition

### Launch With (v1 Beta)

Minimum viable beta: enough that a friend can sign in, write, recover from common failures, and the maintainer can debug issues.

- [ ] Reliable local autosave with visible saved/pending/error state.
- [ ] Safer sync behavior for rejected entries, server-wins conflicts, and user-visible sync status.
- [ ] Production magic-link email with real deliverability setup and failure copy.
- [ ] Auth and abuse hardening for public email signup: Turnstile, rate limits, token cleanup, secure sessions, CSRF-safe session writes.
- [ ] Notification MVP on one channel with opt-in/out, timezone-aware schedule, and delivery verification.
- [ ] Observability baseline for exceptions, latency, auth, sync, notifications, and queues.
- [ ] Admin MVP for user lookup and critical beta support status.
- [ ] Production readiness docs: deploy, worker, mail, backup, restore, incident, and beta go/no-go checklist.
- [ ] Critical-path tests across auth, sync, timezone, notifications, and local-first frontend workflows.
- [ ] Friend-share onboarding, privacy note, beta expectations, and save/sync/email failure states.

### Add After Validation (v1.x)

Features to add once core beta reliability is proven.

- [ ] Paginated pull/restore sync if users expect multi-device continuity beyond today/history pages.
- [ ] Account deletion and data purge flow once support requests or privacy expectations demand self-service.
- [ ] Richer admin audit log for support actions after admin MVP usage patterns are known.
- [ ] Lightweight in-app feedback collection if support is happening through scattered channels.
- [ ] Referral/invite tracking if friend sharing needs measurement.
- [ ] Reminder personalization beyond the first channel after delivery reliability is demonstrated.

### Future Consideration (v2+)

Features to defer until the beta has validated retention and trust.

- [ ] Native mobile app or deeper PWA investment.
- [ ] End-to-end encrypted sync, after separate cryptographic architecture research.
- [ ] Import from other journal apps.
- [ ] Media attachments, tags, search expansion, mood tracking, and custom templates.
- [ ] AI prompts, summaries, or reflection insights with explicit privacy and consent design.
- [ ] Public sharing, shared journals, or collaboration.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Reliable local autosave with visible status | HIGH | MEDIUM | P1 |
| Safer sync rejected/conflict handling | HIGH | HIGH | P1 |
| Production magic-link deliverability | HIGH | MEDIUM | P1 |
| Auth and abuse hardening | HIGH | MEDIUM | P1 |
| Notification MVP with opt-in/out | HIGH | MEDIUM | P1 |
| Notification delivery verification | HIGH | MEDIUM | P1 |
| Observability baseline | HIGH | MEDIUM | P1 |
| Admin/support MVP | HIGH | MEDIUM | P1 |
| Production readiness runbooks | HIGH | LOW | P1 |
| Critical-path test expansion | HIGH | HIGH | P1 |
| Friend-share onboarding and failure states | MEDIUM | LOW | P1 |
| Data export trust polish | MEDIUM | MEDIUM | P2 |
| Account deletion/data purge | MEDIUM | MEDIUM | P2 |
| In-app feedback | MEDIUM | LOW | P2 |
| Referral/invite tracking | LOW | MEDIUM | P3 |
| Advanced analytics dashboard | LOW | HIGH | P3 |
| AI prompts/summaries | LOW | HIGH | P3 |
| Native mobile app | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for friend-shareable beta
- P2: Should have soon after beta feedback clarifies need
- P3: Nice to have or intentionally deferred

## Competitor Feature Analysis

| Feature | Day One | Penzu | Diarly | Our Approach |
|---------|---------|-------|--------|--------------|
| Autosave / write anywhere | Cross-platform journal with sync and local access patterns. | Promotes save-as-you-type and browser/mobile access. | Promotes automatic save and device sync. | Keep local-first browser save as a core strength and make saved/sync state visible. |
| Privacy / encryption | End-to-end encryption is a major positioning feature. | Promotes private journals, locks, and encryption. | Stores locally/iCloud and offers password/encryption controls. | Be privacy-forward but precise. Do not claim E2EE unless implemented and reviewed. |
| Reminders | Programmable reminders are part of habit formation. | Daily/weekly/custom reminders are a core feature. | Daily reminders, streaks, and stats support consistency. | Ship one reliable reminder channel with opt-out and delivery verification. |
| Reflection / flashbacks | "On This Day" and search/tags help revisit memories. | Sends future links to past entries and supports search. | Timelines/calendars and On This Day reflection. | Lean into existing flashbacks rather than broad search/tag expansion for beta. |
| Sharing | Supports broader journaling ecosystem and exports. | Entry sharing exists, including anonymous sharing. | Focuses more on private device/iCloud journaling. | Defer entry sharing; friend-share the app, not private content. |
| Customization/media | Photos, multiple journals, metadata, maps, rich media. | Custom covers, backgrounds, fonts, tags, search. | Themes, layouts, photos, audio, calendar/weather integrations. | Avoid broad feature parity. The beta differentiator is a focused gratitude ritual with reliable local-first capture. |

## Sources

- Project context: `.planning/PROJECT.md`, `_planning/ROADMAP.md`, `_planning/BACKLOG.md`, `.planning/codebase/CONCERNS.md` (HIGH confidence for current product constraints and known gaps).
- Day One encryption and journaling feature positioning: https://dayoneapp.com/guides/day-one-sync/end-to-end-encryption-faq and https://dayoneapp.com/features/end-to-end-encryption/ (MEDIUM confidence for competitor expectations).
- Day One Google Play listing for reminders, prompts, backups, export, sync, search, and flashback-style features: https://play.google.com/store/apps/details?id=com.dayoneapp.dayone (MEDIUM confidence; app-store copy).
- Penzu feature positioning for autosave, reminders, privacy, entry sharing, search, customization: https://penzu.com/ and https://penzu.com/diary (MEDIUM confidence).
- Diarly privacy and sync docs: https://diarly.app/help/privacy-and-security and https://diarly.app/help/using-diarly-on-multiple-devices (MEDIUM confidence).
- Laravel 13 notification docs for channel support and testability: https://laravel.com/docs/13.x/notifications (HIGH confidence).
- OWASP Authentication Cheat Sheet for login throttling, CAPTCHA as defense-in-depth, and monitoring guidance: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (HIGH confidence).
- OWASP Forgot Password Cheat Sheet for token security, consistent responses, rate-limiting, and one-time expiration patterns applicable to magic links: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html (HIGH confidence).
- Cloudflare Turnstile docs for server-side token validation, expiry, single-use tokens, hostname separation, and testing keys: https://developers.cloudflare.com/turnstile/get-started/ (HIGH confidence).
- Sentry Laravel docs for Laravel exception capture, configuration, verification, and tracing setup: https://docs.sentry.io/platforms/php/guides/laravel/ (HIGH confidence for an observability implementation option).

---
*Feature research for: friend-shareable local-first gratitude journal beta*
*Researched: 2026-04-25*
