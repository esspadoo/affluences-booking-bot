<?php
declare(strict_types=1);

// Run in an isolated CLI process; no web requests or real credentials are used.
$sessionDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "affluences-auth-" . bin2hex(random_bytes(8));
if (!mkdir($sessionDirectory, 0700)) {
    throw new RuntimeException("Unable to create isolated session directory");
}
ini_set("session.use_cookies", "0");
session_cache_limiter("");
session_save_path($sessionDirectory);

function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

try {
    putenv("CONFIG_ADMIN_USER");
    putenv("CONFIG_ADMIN_PASSWORD_HASH");
    require_once __DIR__ . "/../Online/config-auth.php";
    $password = bin2hex(random_bytes(24));

    check(!config_auth_is_configured(), "Missing hash must disable authentication");
    check(!config_auth_login("admin", $password), "Login without a configured hash must fail");
    $_SESSION["config_admin_logged_in"] = true;
    check(!config_auth_is_logged_in(), "Existing sessions must not bypass missing configuration");
    $_SESSION = [];

    putenv("CONFIG_ADMIN_PASSWORD_HASH=");
    check(!config_auth_login("admin", ""), "Empty hash and password must not permit login");
    putenv("CONFIG_ADMIN_PASSWORD_HASH=invalid-hash");
    check(!config_auth_login("admin", $password), "Invalid hashes must reject login");

    putenv("CONFIG_ADMIN_PASSWORD_HASH=" . password_hash($password, PASSWORD_DEFAULT));
    check(config_auth_login("admin", $password), "Configured hash must support the default username");
    $_SESSION = [];
    putenv("CONFIG_ADMIN_USER=reservation-admin");
    check(!config_auth_login("admin", $password), "Wrong username must fail");
    check(!config_auth_login("reservation-admin", $password . "x"), "Wrong password must fail");
    check(!config_auth_is_logged_in(), "Failed logins must not authenticate");
    $previousSessionId = session_id();
    check(config_auth_login("reservation-admin", $password), "Configured credentials must succeed");
    check(config_auth_is_logged_in(), "Successful login must authenticate the session");
    check(session_id() !== $previousSessionId, "Successful login must rotate the session ID");
    config_auth_logout();
    check(!config_auth_is_logged_in(), "Logout must clear authentication");
} finally {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    rmdir($sessionDirectory);
}

echo "Passed: administrator authentication configuration, login, session rotation, and logout.", PHP_EOL;
