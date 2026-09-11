<?php
declare(strict_types=1);
require_once __DIR__ . "/config-auth.php";

$next = config_auth_safe_next($_GET["next"] ?? "lib_config.php");
$error = null;

if (config_auth_is_logged_in()) {
    config_auth_redirect($next);
}

if (($_SERVER["REQUEST_METHOD"] ?? "GET") === "POST") {
    $postedUser = trim((string)($_POST["username"] ?? ""));
    $postedPass = (string)($_POST["password"] ?? "");
    $postedNext = config_auth_safe_next((string)($_POST["next"] ?? $next));

    if (config_auth_login($postedUser, $postedPass)) {
        config_auth_redirect($postedNext);
    }

    $error = "Invalid credentials.";
    $next = $postedNext;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Config Login</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-6 col-lg-4">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h1 class="h4 mb-3 text-center">Config Access</h1>
            <p class="text-muted small text-center mb-4">Login to edit booking intervals.</p>

            <?php if ($error !== null): ?>
              <div class="alert alert-danger py-2"><?= htmlspecialchars($error, ENT_QUOTES, "UTF-8") ?></div>
            <?php endif; ?>

            <?php if (!config_auth_is_configured()): ?>
              <div class="alert alert-warning py-2 small">
                Configuration access is unavailable. Contact the site administrator.
              </div>
            <?php endif; ?>

            <form method="post" action="config-login.php">
              <input type="hidden" name="next" value="<?= htmlspecialchars($next, ENT_QUOTES, "UTF-8") ?>">

              <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" name="username" class="form-control" autocomplete="username" required>
              </div>

              <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" autocomplete="current-password" required>
              </div>

              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>

            <a href="index.html" class="btn btn-link w-100 mt-2">Back to intro</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
