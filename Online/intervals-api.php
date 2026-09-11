<?php
declare(strict_types=1);
require_once __DIR__ . "/config-auth.php";
config_auth_require_login_api();

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$jsonPath = __DIR__ . DIRECTORY_SEPARATOR . "booking-intervals.json";
$days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function is_valid_time(string $value): bool
{
    return preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value) === 1;
}

function validate_payload(array $payload, array $validDays): array
{
    $normalized = [];

    foreach ($payload as $libName => $dayMap) {
        if (!is_string($libName) || $libName === "" || !is_array($dayMap)) {
            throw new RuntimeException("Invalid library block.");
        }

        $normalized[$libName] = [];
        foreach ($validDays as $day) {
            $intervals = $dayMap[$day] ?? [];
            if (!is_array($intervals)) {
                throw new RuntimeException("Invalid intervals for {$libName} {$day}.");
            }

            $normalized[$libName][$day] = [];
            foreach ($intervals as $interval) {
                if (!is_array($interval)) {
                    throw new RuntimeException("Invalid interval type for {$libName} {$day}.");
                }

                $start = $interval["start"] ?? null;
                $end = $interval["end"] ?? null;
                if (!is_string($start) || !is_string($end) || !is_valid_time($start) || !is_valid_time($end)) {
                    throw new RuntimeException("Invalid time format in {$libName} {$day}.");
                }
                if ($start >= $end) {
                    throw new RuntimeException("Start must be before end in {$libName} {$day}.");
                }

                $normalized[$libName][$day][] = ["start" => $start, "end" => $end];
            }
        }
    }

    return $normalized;
}

if ($method === "GET") {
    if (!is_file($jsonPath)) {
        respond(404, ["ok" => false, "error" => "booking-intervals.json not found"]);
    }
    $content = file_get_contents($jsonPath);
    if ($content === false) {
        respond(500, ["ok" => false, "error" => "Unable to read booking-intervals.json"]);
    }
    $decoded = json_decode($content, true);
    if (!is_array($decoded)) {
        respond(500, ["ok" => false, "error" => "Invalid JSON in booking-intervals.json"]);
    }
    respond(200, ["ok" => true, "data" => $decoded]);
}

if ($method === "POST") {
    $raw = file_get_contents("php://input");
    if ($raw === false || trim($raw) === "") {
        respond(400, ["ok" => false, "error" => "Empty request body"]);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        respond(400, ["ok" => false, "error" => "Invalid JSON payload"]);
    }

    try {
        $normalized = validate_payload($decoded, $days);
    } catch (RuntimeException $e) {
        respond(422, ["ok" => false, "error" => $e->getMessage()]);
    }

    $json = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        respond(500, ["ok" => false, "error" => "Failed to encode JSON"]);
    }

    if (file_put_contents($jsonPath, $json . PHP_EOL, LOCK_EX) === false) {
        respond(500, ["ok" => false, "error" => "Failed to write booking-intervals.json"]);
    }

    respond(200, ["ok" => true]);
}

respond(405, ["ok" => false, "error" => "Method not allowed"]);
