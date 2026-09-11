<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
        "httponly" => true,
        "samesite" => "Strict"
    ]);
    session_start();
}

function config_auth_username(): string
{
    $envUser = getenv("CONFIG_ADMIN_USER");
    if (is_string($envUser) && $envUser !== "") {
        return $envUser;
    }
    return "admin";
}

function config_auth_password_hash(): string
{
    $envHash = getenv("CONFIG_ADMIN_PASSWORD_HASH");
    if (is_string($envHash) && $envHash !== "") {
        return $envHash;
    }

    return "";
}

function config_auth_is_configured(): bool
{
    return config_auth_password_hash() !== "";
}

function config_auth_is_logged_in(): bool
{
    return config_auth_is_configured() && !empty($_SESSION["config_admin_logged_in"]);
}

function config_auth_login(string $username, string $password): bool
{
    if (!config_auth_is_configured() || !hash_equals(config_auth_username(), $username)) {
        return false;
    }

    if (!password_verify($password, config_auth_password_hash())) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION["config_admin_logged_in"] = true;
    $_SESSION["config_admin_user"] = $username;
    return true;
}

function config_auth_logout(): void
{
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            "",
            time() - 42000,
            $params["path"] ?? "/",
            $params["domain"] ?? "",
            (bool)($params["secure"] ?? false),
            (bool)($params["httponly"] ?? true)
        );
    }
    session_destroy();
}

function config_auth_redirect(string $path): void
{
    header("Location: " . $path);
    exit;
}

function config_auth_safe_next(?string $next): string
{
    if (!is_string($next) || $next === "") {
        return "lib_config.php";
    }

    if (preg_match('/^[a-zA-Z0-9._\\/-]+$/', $next) !== 1) {
        return "lib_config.php";
    }

    if (preg_match('/^https?:\\/\\//i', $next) === 1) {
        return "lib_config.php";
    }

    return ltrim($next, "/");
}

function config_auth_require_login_page(?string $next = null): void
{
    if (config_auth_is_logged_in()) {
        return;
    }

    $target = config_auth_safe_next($next ?? ($_SERVER["REQUEST_URI"] ?? "lib_config.php"));
    config_auth_redirect("config-login.php?next=" . rawurlencode($target));
}

function config_auth_require_login_api(): void
{
    if (config_auth_is_logged_in()) {
        return;
    }

    http_response_code(401);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode([
        "ok" => false,
        "error" => "Authentication required"
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
