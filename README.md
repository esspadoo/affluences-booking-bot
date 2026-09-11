# Affluences Reservation

Personal browser utility for making Affluences library reservations and editing weekly booking intervals through a PHP administration page.

**Opening `Online/booking.html` starts real reservation requests automatically.** The current configuration attempts bookings for MATE and VALLI for five weekdays starting with the next Monday, including today if today is Monday. Review the account settings and schedule before opening that page.

## Repository layout

| Path | Purpose |
| --- | --- |
| `Online/` | Current application; deploy this directory as the website root. |
| `Online/config.example.js` | Account configuration template; copy to ignored `config.local.js`. |
| `Online/booking-intervals.json` | Weekly schedule read by booking code and updated by the editor. |
| `archive/legacy/` | Earlier root HTML/JavaScript versions, retained for reference. |
| `archive/online-backup/` | Previous online version with its original hardcoded schedule. |
| `docs/REVIEW.md` | Existing errors, limitations, and cleanup verification. |
| `scripts/check.mjs` | Offline syntax, local-link, and JSON checks. |

The application uses vanilla JavaScript, Axios and Bootstrap from CDNs, and PHP with sessions and JSON support. There is no build step, database, or package installation. Node.js is only needed for repository checks.

## Local setup

1. Install a maintained PHP 8.x release with the CLI available on your PATH.
2. Copy `Online/config.example.js` to `Online/config.local.js` and fill in your email and the two Affluences user identifiers. Existing local values were preserved during the repository cleanup; do not overwrite them unless intended.
3. Configure `CONFIG_ADMIN_USER` and `CONFIG_ADMIN_PASSWORD_HASH` in the PHP process environment. Generate a hash with PHP, replacing the example password:

   ```sh
   php -r 'echo password_hash("REPLACE_WITH_A_STRONG_PASSWORD", PASSWORD_DEFAULT), PHP_EOL;'
   ```

   In PowerShell, set the environment variables before starting PHP:

   ```powershell
   $env:CONFIG_ADMIN_USER = 'admin'
   $env:CONFIG_ADMIN_PASSWORD_HASH = 'PASTE_GENERATED_HASH_HERE'
   ```

   There is no default admin password. Login and authenticated configuration access are disabled until `CONFIG_ADMIN_PASSWORD_HASH` is set. `CONFIG_ADMIN_USER` defaults to `admin` if omitted. An `.env` file is not loaded by this application. Use the process environment or your hosting provider's environment settings.

4. From the repository root, start the local server:

   ```sh
   php -S 127.0.0.1:8000 -t Online
   ```

5. Open `http://127.0.0.1:8000/index.html`. Use **Open Config** to inspect the schedule before using **Open Booking**.

The PHP process needs read/write access to `Online/booking-intervals.json` and a writable PHP session directory. The booking page needs network access to its CDNs and Affluences; browser requests also depend on Affluences accepting cross-origin requests.

## Hosting and GitHub sync

Upload the contents of `Online/` to a PHP-capable server. Supply `config.local.js` separately because it is intentionally excluded from Git. Preserve the deployed `booking-intervals.json` if you have edited it through the website; deploying the repository copy overwrites that schedule.

GitHub hosts the source repository. GitHub Pages cannot run the PHP login or configuration API; a static-only deployment does not provide the complete application.

Before syncing, review [the existing issues](docs/REVIEW.md), especially public browser credentials and the midnight booking-date bug. `.gitignore` prevents normal Git staging of local configuration; manual file uploads and forced adds bypass it. Keep `config.local.js`, `.env` files, and the local legacy launcher out of GitHub. If real identifiers were published previously, removing them from the current files does not remove earlier Git history; replace exposed identifiers where the service supports it.

This cleanup did not initialize Git, create a commit, configure a remote, or publish anything. No license has been selected; add a license before granting reuse rights to others.

## Validation

With Node.js 20 or newer:

```sh
node scripts/check.mjs
```

With PHP on PATH, PowerShell can check every current PHP file:

```powershell
Get-ChildItem Online -Filter *.php | ForEach-Object { php -l $_.FullName }
php scripts/check-auth.php
```

The included GitHub Actions workflow checks JavaScript syntax, inline HTML scripts, local links, JSON, PHP syntax, and administrator authentication on pushes and pull requests. It does not send reservations. These checks are not an end-to-end service test.
