<?php
declare(strict_types=1);
require_once __DIR__ . "/config-auth.php";
config_auth_require_login_page("lib_config.php");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Library Intervals Config</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <nav class="navbar navbar-light bg-light border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand fw-semibold" href="index.html">Reservation Utility</a>
      <div class="d-flex gap-2">
        <a class="btn btn-outline-secondary btn-sm" href="index.html">Intro</a>
        <a class="btn btn-outline-danger btn-sm" href="config-logout.php">Logout</a>
      </div>
    </div>
  </nav>

  <div id="app"></div>
  <script src="intervals-editor.js?v=3.0.0"></script>
</body>
</html>
