<?php
/**
 * KJPP NSR — Secure Server-Side Authentication & Access Token Gate
 * Endpoint untuk Portal Layanan Internal, NoLap, dan Kwitansi
 * 
 * Melayani:
 * - POST /api/auth-token   (Validasi token akses kantor cabang / petugas)
 * - POST /api/auth-login   (Autentikasi akun staf & kantor cabang)
 * - GET  /api/auth-verify  (Pemeriksaan status sesi aktif server-side)
 * - POST /api/auth-logout  (Pencabutan sesi dan pembersihan cookie)
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Access-Control-Allow-Credentials: true');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
if ($origin) {
    $parsedOrigin = parse_url($origin, PHP_URL_HOST);
    $selfHost = parse_url("http://" . ($_SERVER["HTTP_HOST"] ?? ""), PHP_URL_HOST);
    if (in_array($parsedOrigin, $allowedHosts, true) || $parsedOrigin === $selfHost || preg_match("/\.(lhr\.life|trycloudflare\.com|loca\.lt)$/i", (string)$parsedOrigin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

// Sesi 8 Jam Kerja
ini_set('session.gc_maxlifetime', 28800);
session_name('NSR_SESSION');
session_set_cookie_params([
    'lifetime' => 28800,
    'path'     => '/',
    'domain'   => '',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    '66c3e90cae0df094bda66fa99602fb18',
    'bcd790d3a97f63d115f3bd06f59bb84d',
    '8a12b1ef6a7dd5895c2369261633f637'
];
$incomingCookieSess = $_COOKIE['NSR_SESSION'] ?? '';
$currentSessionId = session_id();
if (($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) ||
    ($incomingCookieSess && in_array($incomingCookieSess, $REVOKED_SESSION_IDS, true))) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}

// -------------------------------------------------------------
// 1. DATA TOKENS RESMI & REGISTRY PRIVAT SERVER
// Memuat kredensial dan hash otorisasi dari vault privat server
require_once __DIR__ . '/auth-registry-loader.php';
$authRegistry = loadPrivateAuthRegistry();
$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];
$USER_ACCOUNTS = $authRegistry['user_accounts'] ?? [];
$OFFICIAL_SERVICE_KEYS = $authRegistry['service_hashes'] ?? [];

// -------------------------------------------------------------
// HELPER RESOLVER TOKEN RESMI DARI SERVER
// -------------------------------------------------------------
function resolveServerToken($rawToken, $hashRegistry) {
    if (!$rawToken || !is_string($rawToken)) return null;
    $clean = trim($rawToken);

    // TOLAK MUTLAK: Input 64-karakter hexadecimal (Anti Pass-the-Hash)
    if (strlen($clean) === 64 && ctype_xdigit($clean)) {
        return null;
    }

    // Salted SHA-256 resmi
    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($clean));
    if (isset($hashRegistry[$saltedHash])) {
        return [$hashRegistry[$saltedHash], $saltedHash];
    }

    return null;
}


// -------------------------------------------------------------
// MANAJEMEN SESI SERVER TERLINDUNGI & PENCABUTAN LOGOUT ATOMIK
// -------------------------------------------------------------
$sessionsDir = __DIR__ . '/data/sessions';
if (!is_dir($sessionsDir)) {
    @mkdir($sessionsDir, 0755, true);
    @file_put_contents($sessionsDir . '/.htaccess', "Require all denied\nDeny from all\n");
}
$sessionsFile = $sessionsDir . '/active_sessions.json';

function simpanSesiServer($sessionsFile, $sessionToken, $userData, $expiresAt) {
    if (!$sessionToken) return;
    $fp = @fopen($sessionsFile . '.lock', 'c+');
    if ($fp && @flock($fp, LOCK_EX)) {
        $data = file_exists($sessionsFile) ? (json_decode(@file_get_contents($sessionsFile), true) ?: []) : [];
        $now = time();
        foreach ($data as $t => $s) {
            if (($s['expiresAt'] ?? 0) < $now * 1000) {
                unset($data[$t]);
            }
        }
        $data[$sessionToken] = [
            'user'      => $userData,
            'createdAt' => $now,
            'expiresAt' => $expiresAt,
            'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ];
        @file_put_contents($sessionsFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }
}

function cabutSesiServer($sessionsFile, $sessionToken = null) {
    $fp = @fopen($sessionsFile . '.lock', 'c+');
    if ($fp && @flock($fp, LOCK_EX)) {
        $data = file_exists($sessionsFile) ? (json_decode(@file_get_contents($sessionsFile), true) ?: []) : [];
        if ($sessionToken && isset($data[$sessionToken])) {
            unset($data[$sessionToken]);
        }
        if (!empty($_SESSION['nsr_session_token']) && isset($data[$_SESSION['nsr_session_token']])) {
            unset($data[$_SESSION['nsr_session_token']]);
        }
        @file_put_contents($sessionsFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }
}

function verifikasiSesiServer($sessionsFile, $sessionToken) {
    if (!$sessionToken || !file_exists($sessionsFile)) return null;
    $data = json_decode(@file_get_contents($sessionsFile), true);
    if (!is_array($data) || !isset($data[$sessionToken])) return null;
    $sess = $data[$sessionToken];
    if (($sess['expiresAt'] ?? 0) < time() * 1000) {
        return null;
    }
    return $sess['user'] ?? null;
}

// 3. DETEKSI ACTION ROUTING
// -------------------------------------------------------------
$action = $_GET['action'] ?? $_POST['action'] ?? null;
if (!$action) {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (strpos($path, 'auth-token') !== false) {
        $action = 'token';
    } elseif (strpos($path, 'auth-login') !== false) {
        $action = 'login';
    } elseif (strpos($path, 'auth-verify') !== false) {
        $action = 'verify';
    } elseif (strpos($path, 'auth-logout') !== false) {
        $action = 'logout';
    } elseif (strpos($path, 'auth') !== false) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = 'login';
        } else {
            $action = 'verify';
        }
    }
}

// -------------------------------------------------------------
// 4. RATE LIMITING RINGAN (ANTI BRUTE-FORCE)
// -------------------------------------------------------------
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

$rateFile = sys_get_temp_dir() . '/nsr_rate_limit_' . md5($clientIp) . '.json';
$rateData = ['fails' => 0, 'last' => time()];
if (file_exists($rateFile)) {
    $raw = @file_get_contents($rateFile);
    $parsed = json_decode($raw, true);
    if ($parsed && is_array($parsed)) {
        if (time() - ($parsed['last'] ?? 0) < 300) { // Jendela 5 menit
            $rateData = $parsed;
        }
    }
}

function recordFail($rateFile, &$rateData) {
    $rateData['fails']++;
    $rateData['last'] = time();
    @file_put_contents($rateFile, json_encode($rateData), LOCK_EX);
}

function clearFail($rateFile) {
    if (file_exists($rateFile)) {
        @unlink($rateFile);
    }
}

// -------------------------------------------------------------
// 5. PARSE INPUT BODY (JSON ATAU POST DATA) & RATE LIMITING
// -------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$body = [];
if ($rawInput) {
    $body = json_decode($rawInput, true) ?: [];
}
if (empty($body)) {
    $body = $_POST;
}

// PEMULIHAN CEPAT: Jika request menyertakan token resmi yang valid,
// segera bersihkan lockout rate-limiter tanpa harus menunggu 5 menit.
$checkCandidate = trim($body['token'] ?? $body['identifier'] ?? $body['username'] ?? $body['password'] ?? '');
if ($checkCandidate) {
    $candidateResolved = resolveServerToken($checkCandidate, $OFFICIAL_TOKEN_HASHES);
    if ($candidateResolved) {
        clearFail($rateFile);
        $rateData = ['fails' => 0, 'last' => time()];
    }
}

// Proteksi brute force: hanya tolak jika kredensial/token TIDAK valid dan gagal >= 10x
if ($rateData['fails'] >= 10 && (time() - $rateData['last']) < 300) {
    http_response_code(429);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Terlalu banyak percobaan gagal. Silakan tunggu 5 menit sebelum mencoba kembali.'
    ]);
    exit;
}

// -------------------------------------------------------------
// 6. EKSEKUSI SESUAI ACTION
// -------------------------------------------------------------

// ==========================================
// A. ACTION: TOKEN (POST /api/auth-token)
// ==========================================
if ($action === 'token') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed (POST required)']);
        exit;
    }

    $rawToken = trim($body['token'] ?? '');
    if ($rawToken === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token otorisasi wajib diisi.']);
        exit;
    }

    $resolved = resolveServerToken($rawToken, $OFFICIAL_TOKEN_HASHES);

    if ($resolved) {
        clearFail($rateFile);
        list($user, $tokenHash) = $resolved;
        session_regenerate_id(true);
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();

        $sessionToken = 'nsr_sess_' . bin2hex(random_bytes(16));
        $_SESSION['nsr_session_token'] = $sessionToken;
        $expiresAt = (time() + 28800) * 1000;
        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);
        $checksumPayload = implode('::', [
            'NSR_SESSION_INTEGRITY_2026_x7k9::',
            $user['tokenHash'] ?? $tokenHash,
            $user['role'],
            $user['wilayah'],
            $expiresAt,
            !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
            'NSR_ZERO_TRUST_SIG_2026_9x4m'
        ]);
        $sessionChecksum = hash('sha256', $checksumPayload);

        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'branch'          => $user['displayName'],
            'user'            => $user,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);
        exit;
    } else {
        recordFail($rateFile, $rateData);
        http_response_code(401);
        echo json_encode([
            'success'       => false,
            'authenticated' => false,
            'error'         => 'Token akses tidak valid atau belum terdaftar. Pastikan memasukkan token resmi KJPP NSR.'
        ]);
        exit;
    }
}

// ==========================================
// B. ACTION: LOGIN (POST /api/auth-login)
// ==========================================
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed (POST required)']);
        exit;
    }

    $token = trim($body['token'] ?? '');
    $identifier = trim(strtolower($body['identifier'] ?? $body['username'] ?? ''));
    $password = $body['password'] ?? '';

    // Cek 1: Token otorisasi langsung
    $tokenCandidate = $token ?: ($identifier ?: $password);
    $resolved = resolveServerToken($tokenCandidate, $OFFICIAL_TOKEN_HASHES);

    if ($resolved) {
        clearFail($rateFile);
        list($user, $tokenHash) = $resolved;
        session_regenerate_id(true);
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();

        $sessionToken = 'nsr_sess_' . bin2hex(random_bytes(16));
        $_SESSION['nsr_session_token'] = $sessionToken;
        $expiresAt = (time() + 28800) * 1000;
        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);
        $checksumPayload = implode('::', [
            'NSR_SESSION_INTEGRITY_2026_x7k9::',
            $user['tokenHash'] ?? $tokenHash,
            $user['role'],
            $user['wilayah'],
            $expiresAt,
            !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
            'NSR_ZERO_TRUST_SIG_2026_9x4m'
        ]);
        $sessionChecksum = hash('sha256', $checksumPayload);

        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $user,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);
        exit;
    }

    // Cek 2: User Account Login (Khusus Staf Keuangan / NoLap Staging)
    if (isset($USER_ACCOUNTS[$identifier])) {
        $acc = $USER_ACCOUNTS[$identifier];
        $inputPassSalted = hash('sha256', 'KJPP_NSR_2026_CORE_PASS::' . $password);
        $inputPassRaw = hash('sha256', $password);
        if (hash_equals($acc['passHash'], $inputPassSalted) || hash_equals($acc['passHash'], $inputPassRaw)) {
            clearFail($rateFile);
            session_regenerate_id(true);
            $user = [
                'sub'               => $identifier,
                'branch'            => $acc['branch'],
                'displayName'       => $acc['displayName'],
                'role'              => $acc['role'],
                'roleLabel'         => $acc['displayName'],
                'title'             => $acc['title'],
                'wilayah'           => $acc['branch'],
                'wilayahLabel'      => 'Kantor Pusat Jakarta',
                'wilayahCode'       => 'PST',
                'isSuperAdmin'      => false,
                'isKing'            => false,
                'isCabang'          => ($acc['role'] === 'CABANG'),
                'canAccessKwitansi' => true,
                'canApprove'        => ($acc['role'] === 'ADMIN_PUSAT'),
                'canSubmit'         => true,
                'seeFee'            => true,
                'mode'              => ($acc['role'] === 'CABANG') ? 'CABANG' : 'PUSAT'
            ];
            $_SESSION['nsr_user'] = $user;
            $_SESSION['nsr_login_time'] = time();

            $sessionToken = bin2hex(random_bytes(16));
            $_SESSION['nsr_session_token'] = $sessionToken;
            $expiresAt = (time() + 28800) * 1000;
            simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);

            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                hash('sha256', $identifier),
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);

            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    recordFail($rateFile, $rateData);
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Akses Ditolak: Token atau kredensial pengguna tidak valid.'
    ]);
    exit;
}

// ==========================================
// C. ACTION: VERIFY (GET/POST /api/auth-verify)
// ==========================================
if ($action === 'verify' || $action === 'check') {
    // 0. Service Key Integration (GAS Sync & Cron via Header X-NSR-Service-Key)
    $serviceKey = trim($_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '');
    if ($serviceKey !== '') {
        $keyHash = hash('sha256', $serviceKey);
        if (isset($OFFICIAL_SERVICE_KEYS[$keyHash])) {
            echo json_encode([
                'success'       => true,
                'authenticated' => true,
                'service'       => $OFFICIAL_SERVICE_KEYS[$keyHash]
            ]);
            exit;
        }
    }

    // 1. Sesi PHP (jika belum dicabut)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isSessValid = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $isSessValid = (verifikasiSesiServer($sessionsFile, $sessToken) !== null);
        }
        if ($isSessValid && (time() - $loginTime < 28800)) {
            $user = $_SESSION['nsr_user'];
            $expiresAt = ($loginTime + 28800) * 1000;
            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                $user['tokenHash'] ?? '',
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);
            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    // 2. Cek Session Token Server
    $incomingSessionToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? ($body['sessionToken'] ?? ''));
    if ($incomingSessionToken && ($userFromSess = verifikasiSesiServer($sessionsFile, $incomingSessionToken))) {
        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $userFromSess,
            'expiresAt'       => (time() + 28800) * 1000
        ]);
        exit;
    }

    // 3. Bearer token / X-NSR-Token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $rawBearer = '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
        $rawBearer = $m[1];
    } elseif (!empty($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawBearer = $_SERVER['HTTP_X_NSR_TOKEN'];
    }
    if ($rawBearer) {
        $resolved = resolveServerToken($rawBearer, $OFFICIAL_TOKEN_HASHES);
        if ($resolved) {
            list($user, $tokenHash) = $resolved;
            $expiresAt = (time() + 28800) * 1000;
            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                $user['tokenHash'] ?? $tokenHash,
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);
            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi tidak aktif atau telah kedaluwarsa. Silakan masukkan token akses.'
    ]);
    exit;
}

// ==========================================
// D. ACTION: LOGOUT (POST /api/auth-logout)
// ==========================================
if ($action === 'logout') {
    $incomingSessionToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? ($body['sessionToken'] ?? ''));
    cabutSesiServer($sessionsFile, $incomingSessionToken);
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode([
        'success'       => true,
        'authenticated' => false
    ]);
    exit;
}

// Default Fallback jika route tidak dikenali
http_response_code(404);
echo json_encode([
    'success' => false,
    'error'   => 'Endpoint tidak ditemukan.'
]);
