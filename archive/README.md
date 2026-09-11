# Historical versions

These versions are retained for reference and are not part of the current deployment. Their original booking schedules and request logic are preserved.

| Original location | Current location | Behavior |
| --- | --- | --- |
| Root `index.html`, `index2.html`, `reserve.js` | `legacy/` | Original automatic booking pages. |
| Root `index3.html`, `res3.js` | `legacy/` | Table-based booking page. |
| Root `res.js` | `legacy/res.js` | Alternate script, not referenced by the supplied pages. |
| `Online - Backup/` | `online-backup/` | Earlier responsive online page with fixed intervals. |
| Root `runAuto.txt` | `legacy/runAuto.txt` (local, ignored) | Original machine-specific Bash launcher; contains broken quoting and an obsolete path. |

Opening an archived booking page also sends real reservation requests. Each directory needs its own `config.local.js`; copy `../../Online/config.example.js` into that directory as `config.local.js` and supply your account values. Local copies with the original values were retained during cleanup.

Existing shortcuts to the old root pages or `Online - Backup/` need their paths updated. The current `Online/` URLs remain unchanged. Do not deploy the archive with the current application.
