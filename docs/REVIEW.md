# Repository review

Reviewed on 2026-09-10 and 2026-09-11. Booking and scheduling logic were preserved during organization. Hardcoded account values and the administrator-password fallback were addressed as requested.

## Major findings

1. **Fixed: hardcoded default administrator password.** Removed the public default password and its display on the login page. `Online/config-auth.php` now requires `CONFIG_ADMIN_PASSWORD_HASH` from the server environment. Login and authenticated configuration access are disabled when it is absent, including access through an existing session. Set this variable before using the configuration editor; existing deployments that already supply a hash keep their configured credentials.
2. **Browser account identifiers are public on an accessible deployment.** Email and identifiers were embedded in five booking scripts. They now come from ignored `config.local.js` files, with the original local values preserved. This prevents their inclusion in ordinary Git staging, but anyone able to load the deployed JavaScript can still read them and attempt requests with those values. The booking page has no login requirement. Restrict access to the whole deployment if these values must stay private; protecting just the editor does not protect them.
3. **Bookings can use the previous calendar date near midnight.** `getNextWorkdays()` in the current app and table-based archived versions determines the weekday in local time but derives the date with `toISOString()`, which uses UTC. In Europe/Rome, at 00:30 a local Monday can be sent as Sunday's date. Use a local calendar formatter in a separate behavior fix.
4. **The editor supports settings the booking code ignores.** The editor permits adding or renaming libraries and configuring weekends. Booking only iterates the hardcoded MATE and VALLI resources and five Monday-to-Friday dates; `getBookingIntervals()` explicitly excludes weekends. New library names or weekend intervals can save successfully without producing bookings.

## Other existing issues

- After an initially offline load, the `online` listener remains registered. Later reconnects can trigger another batch of reservation requests.
- If fetching or parsing `booking-intervals.json` fails, the booking page logs an error to the console and uses an empty schedule, without a visible failure message.
- Booking dates start at the next Monday, not the next available weekday. On Tuesday this skips the rest of the current week. Confirm that this is intended before changing it.
- The visualization only covers 08:30-20:00 in complete 30-minute cells. The editor accepts arbitrary valid times, so accepted intervals may be partly or entirely invisible in results.
- In `archive/legacy/reserve.js`, `setTimeout(3000)` does not delay execution, request headers include browser-controlled headers, and the error handler assumes `err.response.data` exists. Network failures without a response can cause a secondary exception.
- The local, ignored `archive/legacy/runAuto.txt` has mismatched Bash quoting, an old absolute path, and launches an ordinary browser despite its comment about hiding the UI. It was retained as historical material, not installed as a working launcher.
- Axios is loaded from an unversioned CDN URL; its behavior can change without a repository update. External API compatibility and browser CORS acceptance were not tested against the live service.

## Cleanup scope

- Kept the current application in `Online/`, retaining all its existing URLs.
- Moved older root pages/scripts and the backup to `archive/`, documenting the path changes.
- Replaced literal account values with reads from `window.AFFLUENCES_CONFIG` and loaded the corresponding local configuration before booking scripts.
- Added a sanitized configuration example, ignore rules, text/editor settings, setup documentation, and offline validation in GitHub Actions.
- Preserved schedules, resource IDs, payload construction, booking UI logic, and automatic execution behavior. The authentication change removes the hardcoded password; the login page displays an unavailable message if no password hash is configured.
- No Git repository or remote was created, and nothing was synced or deployed.

## Validation

Executed locally:

- Compiled eight JavaScript scripts, including the inline script, checked 19 local links, and validated schedule JSON. Repeated these checks on a temporary copy containing only Git-eligible files, without private configuration.
- Compared 40 mocked request batches against the original sources across five booking scripts, Monday and Thursday start dates, mobile and desktop widths, and successful/already-booked responses. Every outgoing URL, payload, and header matched. Mock DOM elements were used; this is not a visual browser test.
- Confirmed all five booking sources match the originals exactly after reversing only the account-value extraction. The interval editor, API, schedule, and PHP pages other than authentication/login remain unchanged.
- Reproduced the date bug: local Monday 2026-09-07 at 00:30 in Europe/Rome produces `{"date":"2026-09-06","dayName":"Monday"}`.
- Verified with Git ignore rules that all three local configuration files and the original launcher are excluded. Scanned Git-eligible files for the original email and identifiers; none were present.

PHP was not available locally, so PHP syntax and authentication tests were not executed here. The GitHub Actions workflow includes PHP linting and `scripts/check-auth.php`, but the workflow has not run yet. The authentication checks cover missing/empty/invalid hashes, valid and invalid credentials, session rotation, and logout. No live booking requests were sent, and external service compatibility was not verified.
