# Timezone Support Design

## Context
The project already stores a `timezone` on `users`, and the signed-in `/today` route already resolves the default date with that timezone. The missing pieces are making timezone an explicit account setting, ensuring the behavior is verified by tests, and keeping local-only behavior device-driven.

## Decisions
- `entry_date` is canonical stored data and must remain unchanged when a user changes timezone later.
- Signed-in users resolve the default "today" date from their saved account timezone, even if the current browser/device timezone differs.
- Signed-out users resolve "today" from the browser/device timezone with no separate local timezone preference.
- Changing account timezone affects which date `/today` selects going forward; it does not rewrite existing entries.

## Approaches Considered
1. Explicit account timezone setting with tests.
- Recommended. Smallest change, matches current architecture, and keeps user intent explicit.

2. Auto-detect browser timezone and silently overwrite account timezone.
- Rejected. This makes "today" unstable for traveling users and breaks the rule that the saved account timezone is authoritative.

3. Full timezone normalization across local storage, sync payloads, and history.
- Rejected for now. Too large for the immediate task and not necessary to satisfy the required behavior.

## Implementation Shape
- Add feature tests around `/today` date resolution for timezone boundary cases.
- Extend settings update validation to persist a valid IANA timezone.
- Add a timezone field to settings and save it alongside existing settings.
- Redirect back to `/today` after a timezone change so the user immediately lands on the date for the saved account timezone.

## Error Handling
- Reject invalid timezone identifiers at validation time.
- Keep existing `entry_date` values unchanged when timezone changes.
- Continue falling back to device/browser timezone for signed-out usage.

## Verification
- Feature tests prove `/today` resolves the correct default date for users in different saved timezones.
- Feature tests prove invalid timezone updates are rejected.
- Manual check: update timezone in settings and confirm `/today` changes to the expected date without moving existing entries.
