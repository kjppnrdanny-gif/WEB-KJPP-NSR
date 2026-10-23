<?php
/**
 * KJPP NSR — Server-Side Protected Data Proxy untuk Portal Kwitansi (cPanel Native Edition)
 * Versi 1.0: Concurrency Lock, Atomic Write, Branch Isolation & Automated Backup
 * 
 * Karakteristik Keamanan & Integritas:
 * 1. Single Source of Truth (SSOT): Penyimpanan terpusat di cPanel (data/kwitansi_database.json).
 * 2. Autentikasi Fail-Closed: 401 Unauthorized jika tidak memiliki sesi sah atau Bearer token terdaftar.
 * 3. Strict Branch Isolation (RBAC): 403 Forbidden untuk akses lintas cabang.
 * 4. Verifikasi & Approval Otoritas Keuangan Pusat: Penetapan nomor resmi urut dan pengesahan TTD/Stempel.
 * 5. Concurrency Safe & Atomic Write: Menggunakan temp file dan flock(LOCK_EX).
 * 6. Automated Backup: Snapshot ke data/backups/ sebelum mutasi data.
 * 7. Protected Directory: data/ dan data/backups/ dilindungi .htaccess (Require all denied).
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
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With, X-NSR-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

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
// 1. DATA TOKENS RESMI UNTUK VALIDASI API / BEARER / HEADER
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0' => [ // Keuangan Pusat (Salted)
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d' => [ // Keuangan Pusat (Raw)
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    // Otorisasi Kasir & Keuangan Cabang
    'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9' => [ // Otorisasi Kasir & Keuangan Cabang
        'sub'               => 'kasir_cabang',
        'branch'            => 'CABANG',
        'displayName'       => 'Kantor Cabang Operasional',
        'role'              => 'KEUANGAN_CABANG',
        'roleLabel'         => 'Keuangan Cabang',
        'title'             => 'Kasir & Keuangan Cabang',
        'wilayah'           => 'CABANG',
        'wilayahLabel'      => 'Kantor Cabang Operasional',
        'wilayahCode'       => 'CAB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ],
    'a01d6024094ea8618268233f1e73d79e400c76d36abb144b2d087896f2e3a6ca' => [ // Otorisasi Kasir & Keuangan Cabang
        'sub'               => 'kasir_cabang',
        'branch'            => 'CABANG',
        'displayName'       => 'Kantor Cabang Operasional',
        'role'              => 'KEUANGAN_CABANG',
        'roleLabel'         => 'Keuangan Cabang',
        'title'             => 'Kasir & Keuangan Cabang',
        'wilayah'           => 'CABANG',
        'wilayahLabel'      => 'Kantor Cabang Operasional',
        'wilayahCode'       => 'CAB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ],
    // Penilai Properti
    'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e' => [ // Penilai Properti
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai Properti (Valuer)',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],
    '5801bb3891c492e6497bd5c0eb4d583606d07eed0058c05f8d4238c114b9f3e1' => [ // Penilai Properti
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai Properti (Valuer)',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],
    // Surveyor Lapangan
    'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721' => [ // Surveyor Lapangan
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],
    '422e642284f66071b52b6cd23e4856ee7e5acf6735f0bc5754173c270c487d4b' => [ // Surveyor Lapangan
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],

    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99' => [
        'sub'               => 'cabang_jkt_adm',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04' => [
        'sub'               => 'cabang_jkt_adm',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '90dcc577539898e27a73039150b137fe6ef7d437eb3e2425ff52d3a7cb7cfd3c' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b'
    ],
    'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b'
    ],
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => [
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu'      => '2.0160-04'
    ],
    '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d' => [
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu'      => '2.0160-04'
    ],
    '8d8ec827ee483752270d6256bb79de6662253f891e52842625ecc60af6e25878' => [
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053',
        'kodeKemenkeu'      => '2.0160-04'
    ],
    '2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053' => [
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053',
        'kodeKemenkeu'      => '2.0160-04'
    ],
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => [
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495' => [
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'a9df00e327795467cd60fad518eee698a0d82730f5c940816c07f176bf77f2c3' => [
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f' => [
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => [
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569' => [
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    '05080f9dc585d39a2234f19ba420a83162249731bfea9e3ca0e733953d5efd95' => [
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6' => [
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => [
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827' => [
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    '4ea09485c491d4b43e42ebf0b64f912fcfa9608b5ceecd8b413f6b349298fadb' => [
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'd54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    'd54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97' => [
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'd54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97',
        'kodeKemenkeu'      => '2.0160-05'
    ],
    '336c1d03b83f9a89f3f1fc33cc42192345b435f6e72f8e72ad43aaaaae6310fe' => [
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],
    '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59' => [
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],
    '5dba8ce519ce82d7bb8bfe2ef01238f64a07d8cca1739b8cb717e63ede11f2b6' => [
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '1c30064deeacf28f1ecf2bce27d91d3824c1c5ce8aff62a409729e8702ddf4e7'
    ],
    '1c30064deeacf28f1ecf2bce27d91d3824c1c5ce8aff62a409729e8702ddf4e7' => [
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '1c30064deeacf28f1ecf2bce27d91d3824c1c5ce8aff62a409729e8702ddf4e7'
    ],
    'da9ed250de0559c0e8cf6631bbd6e93375eec43c4d114d0f4f1ae17a4f5dd3a9' => [
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer QC',
        'title'             => 'Reviewer QC',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],
    'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9' => [
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer QC',
        'title'             => 'Reviewer QC',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],
    '9f5137bd18e31ae431c3aa998400f73e83168cae567420cc08e6c02a116e19a1' => [
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer QC',
        'title'             => 'Reviewer QC',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e094d23c6cc9580a7122705d5651d327682c301c3ecaea93c6debf7a1f6349'
    ],
    'f0e094d23c6cc9580a7122705d5651d327682c301c3ecaea93c6debf7a1f6349' => [
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer QC',
        'title'             => 'Reviewer QC',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e094d23c6cc9580a7122705d5651d327682c301c3ecaea93c6debf7a1f6349'
    ],
    '52dd65caf53c6a54b9fa2bbbfdedbfbe5e31dcda86a09dc4b325f107f511e68b' => [
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e'
    ],
    'd50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e' => [
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e'
    ],
    'fdfbb69e0de283a8c061c6eaee9173bd15cbc8890a12ddbe1b85642f3350d902' => [
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'c84442605e24bd6cce6370f43e8dbe7e5761c3959bd5dd5a4deccf263b4c8909'
    ],
    'c84442605e24bd6cce6370f43e8dbe7e5761c3959bd5dd5a4deccf263b4c8909' => [
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai',
        'title'             => 'Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => false,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'c84442605e24bd6cce6370f43e8dbe7e5761c3959bd5dd5a4deccf263b4c8909'
    ],
];

// -------------------------------------------------------------
// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)
// -------------------------------------------------------------
$currentUser = null;

// A. Dari Sesi PHP (NSR_SESSION) yang belum dicabut
$sessionsFile = __DIR__ . '/data/sessions/active_sessions.json';
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    $sessToken = $_SESSION['nsr_session_token'] ?? null;
    $isSessValid = true;
    if ($sessToken && file_exists($sessionsFile)) {
        $sessData = json_decode(@file_get_contents($sessionsFile), true);
        if (!isset($sessData[$sessToken]) || (($sessData[$sessToken]['expiresAt'] ?? 0) < time() * 1000)) {
            $isSessValid = false;
        }
    }
    if ($isSessValid && (time() - $loginTime < 28800)) {
        $currentUser = $_SESSION['nsr_user'];
    }
}

// A2. Dari Header X-NSR-Session-Token
if (!$currentUser) {
    $sessHdr = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? '');
    if ($sessHdr && file_exists($sessionsFile)) {
        $sessData = json_decode(@file_get_contents($sessionsFile), true);
        if (isset($sessData[$sessHdr]) && (($sessData[$sessHdr]['expiresAt'] ?? 0) >= time() * 1000)) {
            $currentUser = $sessData[$sessHdr]['user'] ?? null;
        }
    }
}

// B. Dari Authorization: Bearer <TOKEN> atau X-NSR-Token
if (!$currentUser) {
    $rawToken = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $rawToken = trim($matches[1]);
    } elseif (isset($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawToken = trim($_SERVER['HTTP_X_NSR_TOKEN']);
    }

    if ($rawToken) {
        $trimmed = trim($rawToken);
        if (strlen($trimmed) === 64 && ctype_xdigit($trimmed)) {
            $currentUser = null;
        } else {
            $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
            }
        }
    }
}

if (!$currentUser) {
    http_response_code(401);
    echo json_encode([
        'success'   => false,
        'error'     => 'Otorisasi Gagal (401 Unauthorized): Sesi telah kedaluwarsa atau token tidak valid.',
        'violation' => 'UNAUTHORIZED_ACCESS'
    ]);
    exit;
}

// Normalisasi Role Pengguna untuk Konsistensi Keuangan & RBAC
$rawRole = $currentUser['role'] ?? 'CABANG';
$isSuperOrPusat = in_array(strtoupper($rawRole), ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN', 'KEUANGAN', 'ADMIN'], true) || !empty($currentUser['isSuperAdmin']) || !empty($currentUser['canApprove']);
$isCabangRole = in_array(strtoupper($rawRole), ['CABANG', 'ADMIN_CABANG'], true) || !empty($currentUser['isCabang']);
$userRole = $isSuperOrPusat ? 'ADMIN_PUSAT' : ($isCabangRole ? 'CABANG' : $rawRole);
$userBranch = trim($currentUser['branch'] ?? 'Pusat');
$userDisplayName = $currentUser['displayName'] ?? ($currentUser['sub'] ?? 'Petugas Terverifikasi');
$isKeuanganOrAdmin = $isSuperOrPusat;

// -------------------------------------------------------------
// 3. PENYIMPANAN DATA TERPUSAT (cPanel SSOT)
// -------------------------------------------------------------
$dataFile = __DIR__ . '/data/kwitansi_database.json';

function muatDatabaseKwitansi($dataFile) {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }

    // Baseline Data Historis Resmi Kwitansi
    $baseline = [
        [
            'idKwitansi'       => 'KW-000001',
            'noKwitansiResmi'  => '017/KW-NSR/IX/2026',
            'noPermintaan'     => 'REQ-000006',
            'noSpk'            => 'SPK/BTN/2026/088',
            'cabang'           => 'Pusat',
            'namaPengaju'      => 'Zahra',
            'waPengaju'        => '0895391057740',
            'klien'            => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. GEMILANG SAKTI PROPERTINDO',
            'keterangan'       => 'Biaya Jasa Penilaian Properti Rumah Tinggal Green Lavender Sukamekar, SPK No. SPK/BTN/2026/088',
            'banyaknya'        => '100% Pelunasan',
            'persentaseTermin' => 100,
            'nilaiKontrakSpk'  => 15000000,
            'hargaDasar'       => 15000000,
            'dpp'              => 15000000,
            'tarifPpn'         => 0.11,
            'nominalPpn'       => 1650000,
            'totalBayar'       => 16650000,
            'terbilang'        => 'Enam Belas Juta Enam Ratus Lima Puluh Ribu Rupiah',
            'status'           => 'DISAHKAN',
            'isApproved'       => true,
            'tglPengajuan'     => '2026-09-23',
            'tglSah'           => '2026-09-23',
            'tempatSah'        => 'Jakarta',
            'namaPejabat'      => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'jabatanPejabat'   => 'Pemimpin Rekan',
            'subjabatanPejabat'=> 'Pemimpin Rekan',
            'approvedBy'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'approvedAt'       => '2026-09-23 17:00:00'
        ],
        [
            'idKwitansi'       => 'KW-000002',
            'noKwitansiResmi'  => '018/KW-NSR/X/2026',
            'noPermintaan'     => 'REQ-000012',
            'noSpk'            => 'SPK/ITB/2026/012',
            'cabang'           => 'Bandung',
            'namaPengaju'      => 'Tiara',
            'waPengaju'        => '081220314609',
            'klien'            => 'Institut Teknologi Bandung (ITB)',
            'keterangan'       => 'Biaya Jasa Penilaian Gedung Kampus Pendidikan Jl. Ganesa No. 10 Bandung, SPK No. SPK/ITB/2026/012',
            'banyaknya'        => '50% (Termin I / Uang Muka)',
            'persentaseTermin' => 50,
            'nilaiKontrakSpk'  => 40000000,
            'hargaDasar'       => 20000000,
            'dpp'              => 20000000,
            'tarifPpn'         => 0.11,
            'nominalPpn'       => 2200000,
            'totalBayar'       => 22200000,
            'terbilang'        => 'Dua Puluh Dua Juta Dua Ratus Ribu Rupiah',
            'status'           => 'DISAHKAN',
            'isApproved'       => true,
            'tglPengajuan'     => '2026-10-07',
            'tglSah'           => '2026-10-07',
            'tempatSah'        => 'Jakarta',
            'namaPejabat'      => 'Milda Hidayati Dewi, S.E.',
            'jabatanPejabat'   => 'Keuangan',
            'subjabatanPejabat'=> 'Bagian Keuangan',
            'approvedBy'       => 'Milda Hidayati Dewi, S.E.',
            'approvedAt'       => '2026-10-07 14:30:00'
        ]
    ];

    simpanDatabaseKwitansi($dataFile, $baseline);
    return $baseline;
}

function simpanDatabaseKwitansi($dataFile, $records) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    
    $backupDir = $dir . '/backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }
    
    // Tulis atomik dengan locking (LOCK_EX)
    $tempFile = tempnam($dir, 'tmp_kw_');
    if ($tempFile === false) return false;

    $json = json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $fp = fopen($tempFile, 'w');
    if (!$fp) {
        @unlink($tempFile);
        return false;
    }

    if (flock($fp, LOCK_EX)) {
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        // Snapshot cadangan berkala sebelum replace
        if (file_exists($dataFile)) {
            $backupFile = $backupDir . '/kwitansi_backup_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.json';
            @copy($dataFile, $backupFile);

            $allBackups = glob($backupDir . '/kwitansi_backup_*.json');
            if (is_array($allBackups) && count($allBackups) > 30) {
                usort($allBackups, function($a, $b) { return filemtime($a) - filemtime($b); });
                while (count($allBackups) > 30) {
                    @unlink(array_shift($allBackups));
                }
            }
        }

        return rename($tempFile, $dataFile);
    }

    fclose($fp);
    @unlink($tempFile);
    return false;
}

function keRomawi($bulan) {
    $map = [
        1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
        7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
    ];
    return $map[(int)$bulan] ?? 'X';
}

function cabangSesuai($recordBranch, $userBranch) {
    $rb = strtolower(trim(preg_replace('/^(kantor\s+cabang|cabang|kantor\s+pusat)\s+/i', '', (string)$recordBranch)));
    $ub = strtolower(trim(preg_replace('/^(kantor\s+cabang|cabang|kantor\s+pusat)\s+/i', '', (string)$userBranch)));
    if ($rb === $ub) return true;
    if ($ub !== '' && (strpos($rb, $ub) !== false || strpos($ub, $rb) !== false)) return true;
    return false;
}

/**
 * Transaksi Atomik Database Kwitansi dengan Exclusive File Lock (flock LOCK_EX)
 * Menjamin pembacaan data paling mutakhir di dalam lock (Anti-Race Condition & Anti-TOCTOU)
 */
function transaksiDatabaseKwitansi($dataFile, callable $callback) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $lockFile = $dir . '/.kwitansi_txn.lock';
    $fpLock = fopen($lockFile, 'c+');
    if (!$fpLock) {
        return [
            'success'   => false,
            'http_code' => 500,
            'error'     => 'Gagal inisialisasi file lock transaksi database kwitansi'
        ];
    }

    if (!flock($fpLock, LOCK_EX)) {
        fclose($fpLock);
        return [
            'success'   => false,
            'http_code' => 503,
            'error'     => 'Sistem sibuk: Gagal memperoleh antrean lock transaksi atomik kwitansi'
        ];
    }

    try {
        // 1. Baca data paling segar di dalam lock
        $records = muatDatabaseKwitansi($dataFile);

        // 2. Eksekusi callback transaksional
        $res = $callback($records);

        // 3. Jika berhasil dan terdapat records yang dimutasi, simpan atomik
        if (is_array($res) && !empty($res['success']) && isset($res['records'])) {
            simpanDatabaseKwitansi($dataFile, $res['records']);
            unset($res['records']);
        }

        return $res;
    } finally {
        flock($fpLock, LOCK_UN);
        fclose($fpLock);
    }
}

$records = muatDatabaseKwitansi($dataFile);

// -------------------------------------------------------------
// 4. METODE GET: PEMBACAAN DATA KWITANSI (RBAC CABANG & PUSAT)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $targetId = $_GET['idKwitansi'] ?? null;

    if ($targetId) {
        $found = null;
        foreach ($records as $item) {
            if ($item['idKwitansi'] === $targetId) {
                $found = $item;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "Data kwitansi '{$targetId}' tidak ditemukan"]);
            exit;
        }

        // Isolasi Cabang
        if (!$isKeuanganOrAdmin && !cabangSesuai($found['cabang'] ?? '', $userBranch)) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => "Akses Ditolak (403 Forbidden): Cabang '{$userBranch}' tidak berhak melihat kwitansi milik cabang '{$found['cabang']}'.",
                'violation' => 'CROSS_BRANCH_ACCESS_DENIED'
            ]);
            exit;
        }

        echo json_encode(['success' => true, 'record' => $found]);
        exit;
    }

    // Role Keuangan Pusat / Admin Pusat: Melihat seluruh kwitansi nasional
    if ($isKeuanganOrAdmin) {
        echo json_encode([
            'success'      => true,
            'scope'        => 'GLOBAL_ALL_BRANCHES',
            'userRole'     => $userRole,
            'totalRecords' => count($records),
            'data'         => $records
        ]);
        exit;
    }

    // Role Cabang: HANYA berhak melihat kwitansi cabangnya sendiri
    $filtered = array_values(array_filter($records, function($item) use ($userBranch) {
        return cabangSesuai($item['cabang'] ?? '', $userBranch);
    }));

    echo json_encode([
        'success'      => true,
        'scope'        => 'BRANCH_ISOLATED',
        'userRole'     => $userRole,
        'branch'       => $userBranch,
        'totalRecords' => count($filtered),
        'data'         => $filtered
    ]);
    exit;
}

// -------------------------------------------------------------
// 5. METODE POST: SUBMIT DRAF, APPROVAL, REVISI & INTEGRASI SPK
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Format payload tidak valid (JSON required)']);
        exit;
    }

    $action = $body['action'] ?? null;
    $payload = $body['payload'] ?? null;

    // =========================================================================
    // A. TINDAKAN SUBMIT PENGAJUAN DRAF KWITANSI (CABANG & PUSAT)
    // =========================================================================
    if ($action === 'submitDraft') {
        if (!isset($payload['klien']) || empty(trim($payload['klien']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Identitas klien dan penugasan wajib diisi']);
            exit;
        }

        // Penegakan Isolasi Cabang pada Form Pengajuan
        $cabangPengaju = $isKeuanganOrAdmin ? ($payload['cabang'] ?? 'Pusat') : $userBranch;
        
        $dpp = isset($payload['dpp']) ? (float)$payload['dpp'] : (isset($payload['hargaDasar']) ? (float)$payload['hargaDasar'] : 0);
        if ($dpp <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nominal DPP (Harga Dasar) wajib lebih besar dari 0']);
            exit;
        }

        $tarifPpn = isset($payload['tarifPpn']) ? (float)$payload['tarifPpn'] : 0.11;
        $nominalPpn = isset($payload['nominalPpn']) ? (float)$payload['nominalPpn'] : round($dpp * $tarifPpn);
        $totalBayar = isset($payload['totalBayar']) ? (float)$payload['totalBayar'] : ($dpp + $nominalPpn);

        $noSpk = trim($payload['noSpk'] ?? '');
        $nilaiKontrakSpk = isset($payload['nilaiKontrakSpk']) ? (float)$payload['nilaiKontrakSpk'] : 0;

        $txnResult = transaksiDatabaseKwitansi($dataFile, function(&$records) use ($payload, $cabangPengaju, $dpp, $tarifPpn, $nominalPpn, $totalBayar, $noSpk, $nilaiKontrakSpk, $userDisplayName, $userRole) {
            // Pengecekan Akumulasi Termin Terhadap Nilai Kontrak SPK (Requirement 6)
            $totalTertagihSebelumnya = 0;
            if ($noSpk !== '') {
                foreach ($records as $r) {
                    if (($r['status'] ?? '') !== 'VOID' && ($r['status'] ?? '') !== 'DIKEMBALIKAN') {
                        if (strcasecmp($r['noSpk'] ?? '', $noSpk) === 0) {
                            $totalTertagihSebelumnya += (float)($r['dpp'] ?? $r['hargaDasar'] ?? 0);
                        }
                    }
                }
            }

            $akumulasiDenganDrafIni = $totalTertagihSebelumnya + $dpp;
            $isOverbilling = false;
            $catatanAkumulasi = "Akumulasi tertagih untuk SPK {$noSpk}: Rp " . number_format($akumulasiDenganDrafIni, 0, ',', '.');
            if ($nilaiKontrakSpk > 0) {
                if ($akumulasiDenganDrafIni > $nilaiKontrakSpk) {
                    $isOverbilling = true;
                    $kelebihan = $akumulasiDenganDrafIni - $nilaiKontrakSpk;
                    $catatanAkumulasi .= " [PERINGATAN: Melebihi Nilai Kontrak SPK sebesar Rp " . number_format($kelebihan, 0, ',', '.') . "]";
                } else {
                    $sisa = $nilaiKontrakSpk - $akumulasiDenganDrafIni;
                    $catatanAkumulasi .= " (Sisa pagu kontrak: Rp " . number_format($sisa, 0, ',', '.') . ")";
                }
            }

            // Generate ID Draf Baru secara atomik (Monoton naik: DRAFT-KW-XXXXXX)
            $maxNum = 0;
            foreach ($records as $r) {
                if (isset($r['idKwitansi']) && preg_match('/^(?:KW|DRAFT-KW)-(\d+)$/', $r['idKwitansi'], $m)) {
                    $num = (int)$m[1];
                    if ($num > $maxNum) $maxNum = $num;
                }
            }
            $newId = 'DRAFT-KW-' . str_pad((string)($maxNum + 1), 6, '0', STR_PAD_LEFT);
            $serverTimestamp = date('Y-m-d H:i:s');

            $newRecord = [
                'idKwitansi'       => $newId,
                'noKwitansiResmi'  => 'DRAFT (Belum Disahkan)',
                'noPermintaan'     => trim($payload['noPermintaan'] ?? ''),
                'noSpk'            => $noSpk,
                'cabang'           => $cabangPengaju,
                'modePenerbitan'   => $payload['modePenerbitan'] ?? 'cabang',
                'idPejabat'        => $payload['idPejabat'] ?? '1',
                'namaPejabat'      => trim($payload['namaPejabat'] ?? 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)'),
                'jabatanPejabat'   => trim($payload['jabatanPejabat'] ?? 'Pemimpin Rekan'),
                'subjabatanPejabat'=> trim($payload['subjabatanPejabat'] ?? 'Pemimpin Rekan'),
                'namaPengaju'      => trim($payload['namaPengaju'] ?? $userDisplayName),
                'waPengaju'        => trim($payload['waPengaju'] ?? ''),
                'klien'            => trim($payload['klien']),
                'keterangan'       => trim($payload['keterangan'] ?? ''),
                'banyaknya'        => trim($payload['banyaknya'] ?? '100% Pelunasan'),
                'persentaseTermin' => (float)($payload['persentaseTermin'] ?? 0),
                'nilaiKontrakSpk'  => $nilaiKontrakSpk,
                'hargaDasar'       => $dpp,
                'dpp'              => $dpp,
                'tarifPpn'         => $tarifPpn,
                'nominalPpn'       => $nominalPpn,
                'totalBayar'       => $totalBayar,
                'terbilang'        => trim($payload['terbilang'] ?? ''),
                'rekeningTujuan'   => $payload['rekeningTujuan'] ?? 'MANDIRI',
                'rekeningResmi'    => $payload['rekeningResmi'] ?? 'Bank Mandiri Cab. Jakarta Ampera Raya No. Rek. 127-00-1014166-9 an KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (Cantumkan No. Invoice Pada Copy Transfer)',
                'status'           => 'DRAFT',
                'isApproved'       => false,
                'isOverbilling'    => $isOverbilling,
                'totalTertagih'    => $akumulasiDenganDrafIni,
                'catatanAkumulasi' => $catatanAkumulasi,
                'tglPengajuan'     => $payload['tglPengajuan'] ?? date('Y-m-d'),
                'createdAt'        => $serverTimestamp,
                'createdBy'        => $userDisplayName,
                'createdRole'      => $userRole
            ];

            array_unshift($records, $newRecord);

            return [
                'success'       => true,
                'http_code'     => 200,
                'message'       => "Draf kwitansi {$newId} berhasil dikirim dan tersimpan di server terpusat cPanel.",
                'idKwitansi'    => $newId,
                'isOverbilling' => $isOverbilling,
                'record'        => $newRecord,
                'records'       => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // B. TINDAKAN PENGESAHAN & PENETAPAN NOMOR RESMI (KHUSUS KEUANGAN PUSAT)
    // =========================================================================
    if ($action === 'approveKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang pengesahan kwitansi resmi mutlak milik Bagian Keuangan Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        if (empty($idKwitansi)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter idKwitansi wajib diisi']);
            exit;
        }

        $txnResult = transaksiDatabaseKwitansi($dataFile, function(&$records) use ($idKwitansi, $payload, $userDisplayName, $userRole) {
            $targetIndex = -1;
            foreach ($records as $idx => $item) {
                if ($item['idKwitansi'] === $idKwitansi) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return [
                    'success'   => false,
                    'http_code' => 404,
                    'error'     => "Data draf kwitansi '{$idKwitansi}' tidak ditemukan"
                ];
            }

            $targetItem = &$records[$targetIndex];

            if (($targetItem['status'] ?? '') === 'VOID' || !empty($targetItem['isTestRecord'])) {
                return [
                    'success'   => false,
                    'http_code' => 400,
                    'error'     => "Kwitansi {$idKwitansi} berstatus VOID / DATA UJI dan tidak dapat disahkan.",
                    'violation' => 'VOID_RECORD_CANNOT_BE_APPROVED'
                ];
            }

            $requestedNoResmi = trim($payload['noKwitansiResmi'] ?? '');

            // IDEMPOTENCY CHECK: Jika record ini sudah disahkan
            if (!empty($targetItem['isApproved']) && ($targetItem['status'] ?? '') === 'DISAHKAN') {
                $currentNo = $targetItem['noKwitansiResmi'] ?? '';
                if ($requestedNoResmi === '' || strcasecmp($currentNo, $requestedNoResmi) === 0 || $requestedNoResmi === 'DRAFT (Belum Disahkan)') {
                    return [
                        'success'         => true,
                        'http_code'       => 200,
                        'idempotent'      => true,
                        'message'         => "Kwitansi {$idKwitansi} telah berstatus DISAHKAN dengan nomor {$currentNo} (Idempotent).",
                        'noKwitansiResmi' => $currentNo,
                        'record'          => $targetItem
                    ];
                }
            }

            // Hitung nomor kwitansi urut otomatis jika kosong atau masih berstatus draft
            $noResmi = $requestedNoResmi;
            if ($noResmi === '' || $noResmi === 'DRAFT (Belum Disahkan)') {
                $maxKwNum = 0;
                foreach ($records as $r) {
                    if (isset($r['noKwitansiResmi']) && preg_match('/^(\d+)\/KW-NSR\//i', $r['noKwitansiResmi'], $m)) {
                        $val = (int)$m[1];
                        if ($val > $maxKwNum) $maxKwNum = $val;
                    }
                }
                $bulanRomawi = keRomawi(date('n'));
                $tahunSekarang = date('Y');
                $noResmi = str_pad((string)($maxKwNum + 1), 3, '0', STR_PAD_LEFT) . "/KW-NSR/{$bulanRomawi}/{$tahunSekarang}";
            }

            // ATOMIC ANTI-DUPLICATION CHECK: Cek apakah noResmi sudah pernah digunakan oleh kwitansi lain!
            foreach ($records as $r) {
                if (($r['idKwitansi'] ?? '') !== $idKwitansi) {
                    $otherNo = trim($r['noKwitansiResmi'] ?? '');
                    if ($otherNo !== '' && $otherNo !== 'DRAFT (Belum Disahkan)' && strcasecmp($otherNo, $noResmi) === 0) {
                        return [
                            'success'   => false,
                            'http_code' => 409,
                            'error'     => "Pengesahan Ditolak (409 Conflict): Nomor Kwitansi Resmi '{$noResmi}' sudah digunakan oleh kwitansi {$r['idKwitansi']}.",
                            'violation' => 'DUPLICATE_RECEIPT_NUMBER'
                        ];
                    }
                }
            }

            $serverTimestamp = date('Y-m-d H:i:s');

            $targetItem['status']           = 'DISAHKAN';
            $targetItem['isApproved']       = true;
            $targetItem['noKwitansiResmi']  = $noResmi;
            $targetItem['tglSah']           = $payload['tglSah'] ?? date('Y-m-d');
            $targetItem['tempatSah']        = $payload['tempatSah'] ?? 'Jakarta';
            $targetItem['namaPejabat']      = $payload['namaPejabat'] ?? ($targetItem['namaPejabat'] ?? 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)');
            $targetItem['jabatanPejabat']   = $payload['jabatanPejabat'] ?? ($targetItem['jabatanPejabat'] ?? 'Pemimpin Rekan');
            $targetItem['subjabatanPejabat']= $payload['subjabatanPejabat'] ?? ($targetItem['subjabatanPejabat'] ?? 'Pemimpin Rekan');
            $targetItem['approvedBy']       = $userDisplayName;
            $targetItem['approvedRole']     = $userRole;
            $targetItem['approvedAt']       = $serverTimestamp;
            $targetItem['catatanAdmin']     = $payload['catatanAdmin'] ?? 'Disahkan Bagian Keuangan Kantor Pusat.';
            if (!empty($payload['rekeningTujuan'])) {
                $targetItem['rekeningTujuan'] = $payload['rekeningTujuan'];
            }
            if (!empty($payload['rekeningResmi'])) {
                $targetItem['rekeningResmi'] = $payload['rekeningResmi'];
            }

            return [
                'success'         => true,
                'http_code'       => 200,
                'message'         => "Kwitansi {$idKwitansi} berhasil DISAHKAN dengan Nomor Resmi {$noResmi}.",
                'noKwitansiResmi' => $noResmi,
                'record'          => $targetItem,
                'records'         => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // C. TINDAKAN PENGEMBALIAN DRAF / REVISI KE CABANG (KHUSUS KEUANGAN PUSAT)
    // =========================================================================
    if ($action === 'returnKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Hanya Bagian Keuangan Pusat yang berhak mengembalikan draf tagihan.',
                'violation' => 'UNAUTHORIZED_RETURN_ATTEMPT'
            ]);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        if (empty($idKwitansi)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter idKwitansi wajib diisi']);
            exit;
        }

        $txnResult = transaksiDatabaseKwitansi($dataFile, function(&$records) use ($idKwitansi, $payload, $userDisplayName) {
            $targetIndex = -1;
            foreach ($records as $idx => $item) {
                if ($item['idKwitansi'] === $idKwitansi) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return [
                    'success'   => false,
                    'http_code' => 404,
                    'error'     => "Data draf kwitansi '{$idKwitansi}' tidak ditemukan"
                ];
            }

            $records[$targetIndex]['status']        = 'DIKEMBALIKAN';
            $records[$targetIndex]['catatanRevisi'] = $payload['catatanRevisi'] ?? 'Draf dikembalikan untuk penyesuaian data penugasan.';
            $records[$targetIndex]['returnedBy']    = $userDisplayName;
            $records[$targetIndex]['returnedAt']    = date('Y-m-d H:i:s');

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => "Draf kwitansi {$idKwitansi} berhasil dikembalikan ke Cabang dengan status revisi.",
                'record'    => $records[$targetIndex],
                'records'   => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // D. TINDAKAN VOID / DIBATALKAN UNTUK RECORD UJI QA
    // =========================================================================
    if ($action === 'voidKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Wewenang VOID mutlak milik Kantor Pusat']);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        if (empty($idKwitansi)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter idKwitansi wajib diisi']);
            exit;
        }

        $txnResult = transaksiDatabaseKwitansi($dataFile, function(&$records) use ($idKwitansi, $userDisplayName) {
            $targetIndex = -1;
            foreach ($records as $idx => $item) {
                if ($item['idKwitansi'] === $idKwitansi) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return [
                    'success'   => false,
                    'http_code' => 404,
                    'error'     => 'Record tidak ditemukan'
                ];
            }

            $records[$targetIndex]['status']       = 'VOID';
            $records[$targetIndex]['isTestRecord'] = true;
            $records[$targetIndex]['voidBy']       = $userDisplayName;
            $records[$targetIndex]['voidAt']       = date('Y-m-d H:i:s');

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => "Record {$idKwitansi} ditandai sebagai VOID (Data Uji).",
                'record'    => $records[$targetIndex],
                'records'   => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Action '{$action}' tidak dikenal"]);
    exit;
}
