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
    if (in_array($parsedOrigin, $allowedHosts, true)) {
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

// -------------------------------------------------------------
// 1. DATA TOKENS RESMI (DISIMPAN DALAM BENTUK HASH SHA-256)
// Menjamin token rahasia tidak bocor dalam kode sumber publik
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // Otorisasi Kantor Pusat Jakarta (Rotated Secure Token)
    '1f43a0f065bc44637dbb2b2021932c570ee4d40fb42a294985f00e05aef42285' => [
        'sub'         => 'cabang_jkt',
        'branch'      => 'Pusat',
        'displayName' => 'Akses Resmi Kantor Pusat Jakarta',
        'role'        => 'ADMIN_PUSAT',
        'title'       => 'Admin Operasional Pusat'
    ],
    // Otorisasi Kantor Pusat Jakarta (Secondary Token)
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'         => 'cabang_jkt',
        'branch'      => 'Pusat',
        'displayName' => 'Akses Resmi Kantor Pusat Jakarta',
        'role'        => 'ADMIN_PUSAT',
        'title'       => 'Admin Operasional Pusat'
    ],
    // Otorisasi Cabang Bandung
    'a52e824efe550c1e89aa3026587e4aa54620e597fcc977b2c88876870c88a4cb' => [
        'sub'         => 'cabang_bdg',
        'branch'      => 'Bandung',
        'displayName' => 'Akses Resmi Cabang Bandung',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Bandung'
    ],
    // Otorisasi Cabang Bandung (Secondary Token)
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => [
        'sub'         => 'cabang_bdg',
        'branch'      => 'Bandung',
        'displayName' => 'Akses Resmi Cabang Bandung',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Bandung'
    ],
    // Otorisasi Cabang Padang
    '6b838f77d520840a9bd8adb2e01d75ad511ea2f2d371b1ac16809e8fe1ac11bd' => [
        'sub'         => 'cabang_pdg',
        'branch'      => 'Padang',
        'displayName' => 'Akses Resmi Cabang Padang',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Padang'
    ],
    // Otorisasi Cabang Padang (Secondary Token)
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => [
        'sub'         => 'cabang_pdg',
        'branch'      => 'Padang',
        'displayName' => 'Akses Resmi Cabang Padang',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Padang'
    ],
    // Otorisasi Cabang Makassar
    '3c56bf3fbad429421e401e6ca9b335734a90b9986d9af890c12e2cf69f6129d4' => [
        'sub'         => 'cabang_mks',
        'branch'      => 'Makassar',
        'displayName' => 'Akses Resmi Cabang Makassar',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Makassar'
    ],
    // Otorisasi Cabang Makassar (Secondary Token)
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => [
        'sub'         => 'cabang_mks',
        'branch'      => 'Makassar',
        'displayName' => 'Akses Resmi Cabang Makassar',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Makassar'
    ],
    // Otorisasi Cabang Palembang
    '8eec45b74d429d76724acd10312485fee4f180cddf0fd7210eb0da736c878ab3' => [
        'sub'         => 'cabang_plb',
        'branch'      => 'Palembang',
        'displayName' => 'Akses Resmi Cabang Palembang',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Palembang'
    ],
    // Otorisasi Cabang Palembang (Secondary Token)
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => [
        'sub'         => 'cabang_plb',
        'branch'      => 'Palembang',
        'displayName' => 'Akses Resmi Cabang Palembang',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Palembang'
    ],
    // Otorisasi Cabang Palembang (Tertiary Token)
    'c20c16d688a686f8cd5ac12f4949b8dac6b4937d513f92a00514ee6122368ed2' => [
        'sub'         => 'cabang_plb',
        'branch'      => 'Palembang',
        'displayName' => 'Akses Resmi Cabang Palembang',
        'role'        => 'CABANG',
        'title'       => 'Staf Penilai Palembang'
    ],
    // Otorisasi Master Operasional Pusat
    'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' => [
        'sub'         => 'admin_master',
        'branch'      => 'Pusat',
        'displayName' => 'Master Akses Operasional',
        'role'        => 'ADMIN_PUSAT',
        'title'       => 'Master Operasional'
    ],
    // Otorisasi Master Operasional Pusat (Secondary Token)
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'         => 'admin_master',
        'branch'      => 'Pusat',
        'displayName' => 'Master Akses Operasional',
        'role'        => 'ADMIN_PUSAT',
        'title'       => 'Master Operasional'
    ]
];

// -------------------------------------------------------------
// 2. DATA AKUN RESMI / STAF (USERNAME + PASSWORD)
// Digunakan pada formulir login langsung portal NoLap & Kwitansi
// -------------------------------------------------------------
$USER_ACCOUNTS = [
    'test_admin' => [
        'passHash'    => '747c3e53610214bb5255474dc1bfad91d17d52367d3b954fb6ea805fb3eb3337',
        'role'        => 'ADMIN_PUSAT',
        'branch'      => 'Pusat',
        'displayName' => 'Administrator Staging',
        'title'       => 'Admin Pusat'
    ],
    'admin' => [
        'passHash'    => '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0',
        'role'        => 'ADMIN_PUSAT',
        'branch'      => 'Pusat',
        'displayName' => 'Admin Pusat Jakarta',
        'title'       => 'Admin Operasional Pusat'
    ],
    'test_cabang_bdg' => [
        'passHash'    => '4478ae9789230554c58cf3e244b20a56247c1fbb4ef0fa6963ca287114b097b0',
        'role'        => 'CABANG',
        'branch'      => 'Bandung',
        'displayName' => 'Cabang Bandung',
        'title'       => 'Staf Penilai Bandung'
    ],
    'test_cabang_pdg' => [
        'passHash'    => 'ffc35b6b3e94448722c0211fc5f329976ee6b78db421d0061e89b33a0422d3e4',
        'role'        => 'CABANG',
        'branch'      => 'Padang',
        'displayName' => 'Cabang Padang',
        'title'       => 'Staf Penilai Padang'
    ],
    'test_keuangan' => [
        'passHash'    => 'b1ae67e81881682e850b1d38706bcfe47e7b57b98a0058ec40da42ba15e45a0b',
        'role'        => 'KEUANGAN',
        'branch'      => 'Pusat',
        'displayName' => 'Keuangan Staging',
        'title'       => 'Staf Verifikasi Keuangan'
    ]
];

// -------------------------------------------------------------
// 3. DETEKSI ACTION ROUTING
// -------------------------------------------------------------
$action = $_GET['action'] ?? null;
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
// 5. PARSE INPUT BODY (JSON ATAU POST DATA)
// -------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$body = [];
if ($rawInput) {
    $body = json_decode($rawInput, true) ?: [];
}
if (empty($body)) {
    $body = $_POST;
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

    $tokenHash = hash('sha256', strtoupper($rawToken));

    if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
        clearFail($rateFile);
        $user = $OFFICIAL_TOKEN_HASHES[$tokenHash];
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();

        $sessionToken = bin2hex(random_bytes(16));
        $_SESSION['nsr_session_token'] = $sessionToken;

        echo json_encode([
            'success'       => true,
            'authenticated' => true,
            'branch'        => $user['displayName'],
            'user'          => $user,
            'sessionToken'  => $sessionToken
        ]);
        exit;
    } else {
        recordFail($rateFile, $rateData);
        http_response_code(401);
        echo json_encode([
            'success'       => false,
            'authenticated' => false,
            'error'         => 'Token akses tidak valid atau belum terdaftar. Pastikan memasukkan token kantor cabang resmi KJPP NSR.'
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

    // Cek 1: Jika dikirim token langsung
    if ($token !== '') {
        $tokenHash = hash('sha256', strtoupper($token));
        if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
            clearFail($rateFile);
            $user = $OFFICIAL_TOKEN_HASHES[$tokenHash];
            $_SESSION['nsr_user'] = $user;
            $_SESSION['nsr_login_time'] = time();

            echo json_encode([
                'success'       => true,
                'authenticated' => true,
                'user'          => $user
            ]);
            exit;
        }
    }

    // Cek 2: Jika identifier atau password berisi Token Cabang resmi
    $idHash = hash('sha256', strtoupper($identifier));
    $passHash = hash('sha256', strtoupper($password));
    if (isset($OFFICIAL_TOKEN_HASHES[$idHash])) {
        clearFail($rateFile);
        $user = $OFFICIAL_TOKEN_HASHES[$idHash];
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();
        echo json_encode(['success' => true, 'authenticated' => true, 'user' => $user]);
        exit;
    }
    if (isset($OFFICIAL_TOKEN_HASHES[$passHash])) {
        clearFail($rateFile);
        $user = $OFFICIAL_TOKEN_HASHES[$passHash];
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();
        echo json_encode(['success' => true, 'authenticated' => true, 'user' => $user]);
        exit;
    }

    // Cek 3: Verifikasi kredensial User Account
    if (isset($USER_ACCOUNTS[$identifier])) {
        $acc = $USER_ACCOUNTS[$identifier];
        $inputPassHash = hash('sha256', $password);
        if (hash_equals($acc['passHash'], $inputPassHash)) {
            clearFail($rateFile);
            $user = [
                'sub'         => $identifier,
                'branch'      => $acc['branch'],
                'displayName' => $acc['displayName'],
                'role'        => $acc['role'],
                'title'       => $acc['title']
            ];
            $_SESSION['nsr_user'] = $user;
            $_SESSION['nsr_login_time'] = time();
            echo json_encode(['success' => true, 'authenticated' => true, 'user' => $user]);
            exit;
        }
    }

    recordFail($rateFile, $rateData);
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Akses Ditolak: Nama pengguna atau kata sandi tidak valid.'
    ]);
    exit;
}

// ==========================================
// C. ACTION: VERIFY (GET/POST /api/auth-verify)
// ==========================================
if ($action === 'verify') {
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) { // Dalam 8 jam
            echo json_encode([
                'success'       => true,
                'authenticated' => true,
                'user'          => $_SESSION['nsr_user']
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
