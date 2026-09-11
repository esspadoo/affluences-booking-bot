<?php
declare(strict_types=1);
require_once __DIR__ . "/config-auth.php";

config_auth_logout();
config_auth_redirect("index.html");
