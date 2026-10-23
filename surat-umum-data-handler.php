<?php
/**
 * KJPP NSR — Server-Side Protected Data Proxy untuk Portal Buku Agenda Surat Umum (SU) (cPanel Native Edition)
 * Versi 1.0: Concurrency Lock, Atomic Write, Anti-Duplikasi Nomor Resmi, Full Head Office RBAC & Automated Backup
 * 
 * Karakteristik Keamanan & Integritas:
 * 1. Single Source of Truth (SSOT): Penyimpanan terpusat di cPanel (data/surat_umum_database.json).
 * 2. Autentikasi Fail-Closed: 401 Unauthorized jika tidak memiliki sesi sah atau Bearer/Header token terdaftar.
 * 3. Strict Branch Lockdown (RBAC): 403 Forbidden untuk seluruh akun cabang (Surat Umum adalah wewenang eksklusif Kantor Pusat Jakarta).
 * 4. Concurrency Safe & Atomic Write: Menggunakan file lock eksklusif (.surat_umum_txn.lock) via flock(LOCK_EX).
 * 5. Anti-Duplikasi Nomor Surat: Pemeriksaan atomik nomor dan urutan di dalam lock transaksi (HTTP 409 Conflict).
 * 6. Idempotency Support: Menghindari duplikasi bila request identik dikirim ulang karena latensi jaringan (HTTP 200 OK).
 * 7. Automated Backup: Snapshot ke data/backups/ sebelum mutasi data.
 * 8. Protected Directory: data/ dan data/backups/ dilindungi .htaccess (Require all denied).
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
    // ROLE 1: SUPER ADMIN / ADMIN PUSAT (Full Access & Manage SU)
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => 'c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f'
    ],
    'c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f' => [
        'sub'          => 'admin_master',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => 'c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f'
    ],
    '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99' => [
        'sub'          => 'cabang_jkt_adm',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04' => [
        'sub'          => 'cabang_jkt_adm',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '90dcc577539898e27a73039150b137fe6ef7d437eb3e2425ff52d3a7cb7cfd3c' => [
        'sub'          => 'cabang_jkt',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => 'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b'
    ],
    'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b' => [
        'sub'          => 'cabang_jkt',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => 'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b'
    ],
    '12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c' => [
        'sub'          => 'admin_pusat_ops',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c'
    ],
    'b347f814a2f3d21306b0b8eae02611c1f4947abfd2f4e17d3bff343cfb6339c1' => [
        'sub'          => 'admin_pusat_ops',
        'branch'       => 'PUSAT',
        'displayName'  => 'Kantor Pusat Jakarta',
        'role'         => 'SUPER ADMIN',
        'roleLabel'    => 'SUPER ADMIN • KANTOR PUSAT',
        'wilayah'      => 'PUSAT',
        'isSuperAdmin' => true,
        'isCabang'     => false,
        'canManageSU'  => true,
        'mode'         => 'PUSAT',
        'tokenHash'    => '12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c'
    ],

    // ROLE 2: ADMIN CABANG (LOCKED OUT - 403 FORBIDDEN FOR SURAT UMUM)
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => [
        'sub'         => 'cabang_bdg',
        'branch'      => 'Bandung',
        'displayName' => 'Kantor Cabang Bandung',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Bandung',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d' => [
        'sub'         => 'cabang_bdg',
        'branch'      => 'Bandung',
        'displayName' => 'Kantor Cabang Bandung',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Bandung',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => [
        'sub'         => 'cabang_pdg',
        'branch'      => 'Padang',
        'displayName' => 'Kantor Cabang Padang',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Padang',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495' => [
        'sub'         => 'cabang_pdg',
        'branch'      => 'Padang',
        'displayName' => 'Kantor Cabang Padang',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Padang',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => [
        'sub'         => 'cabang_mks',
        'branch'      => 'Makassar',
        'displayName' => 'Kantor Cabang Makassar',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Makassar',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569' => [
        'sub'         => 'cabang_mks',
        'branch'      => 'Makassar',
        'displayName' => 'Kantor Cabang Makassar',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Makassar',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => [
        'sub'         => 'cabang_plb',
        'branch'      => 'Palembang',
        'displayName' => 'Kantor Cabang Palembang',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Palembang',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ],
    'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827' => [
        'sub'         => 'cabang_plb',
        'branch'      => 'Palembang',
        'displayName' => 'Kantor Cabang Palembang',
        'role'        => 'ADMIN_CABANG',
        'wilayah'     => 'Palembang',
        'isCabang'    => true,
        'canManageSU' => false,
        'mode'        => 'CABANG'
    ]
];

// -------------------------------------------------------------
// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)
// -------------------------------------------------------------
$currentUser = null;

// A. Dari Sesi PHP (NSR_SESSION)
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    if (time() - $loginTime < 28800) {
        $currentUser = $_SESSION['nsr_user'];
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
        $tokenHash = hash('sha256', $trimmed);
            if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
            } else {
                $upperHash = hash('sha256', strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
                } else {
                    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
                    if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                        $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                    }
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

// C. RBAC LOCKDOWN: Evaluasi Wewenang Kantor Pusat
$rawRole = $currentUser['role'] ?? 'CABANG';
$isPusatOrSuper = in_array(strtoupper($rawRole), ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN', 'ADMIN'], true) ||
                  !empty($currentUser['isSuperAdmin']) ||
                  (!empty($currentUser['canManageSU']) && empty($currentUser['isCabang']));

if (!$isPusatOrSuper || !empty($currentUser['isCabang']) || ($currentUser['mode'] ?? '') === 'CABANG') {
    http_response_code(403);
    echo json_encode([
        'success'   => false,
        'error'     => 'Akses Ditolak (403 Forbidden): Modul Buku Agenda Surat Umum (SU) merupakan wewenang eksklusif Kantor Pusat (Jakarta) dan tidak dapat diakses oleh Kantor Cabang.',
        'violation' => 'BRANCH_ACCESS_DENIED'
    ]);
    exit;
}

$userDisplayName = $currentUser['displayName'] ?? ($currentUser['sub'] ?? 'Admin Pusat Jakarta');
$userRole = 'ADMIN_PUSAT';

// -------------------------------------------------------------
// 3. DEFINISI DATABASE SSOT & FILE LOCKING (TRANSAKSI ATOMIK)
// -------------------------------------------------------------
$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/surat_umum_database.json';

function muatDatabaseSuratUmum($dataFile) {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }

    // Baseline Data Historis Resmi Surat Umum (2026)
    $baseline = [
        [
            'Timestamp'           => '2026-10-10T08:30:00.000Z',
            'No_Urut'             => 15,
            'No_Surat'            => '0015/NSR/SU-REG/X/2026',
            'Tanggal_Surat'       => '2026-10-10',
            'Tujuan_Penerima'     => 'Pusat Pembinaan Profesi Keuangan (PPPK) Kemenkeu RI',
            'Perihal'             => 'Laporan Triwulan Realisasi Kantor Cabang & Personil Penilai',
            'Klasifikasi_Perihal' => 'SU-REG',
            'Penandatangan'       => 'Pemimpin Rekan',
            'Link_Arsip_Final'    => 'https://drive.google.com/file/d/demo_final_0015/view',
            'Link_File_Mentah'    => 'https://drive.google.com/file/d/demo_draf_0015/view',
            'File_ID_Final'       => 'demo_final_0015',
            'File_ID_Mentah'      => 'demo_draf_0015',
            'Status_Arsip'        => 'Lengkap'
        ],
        [
            'Timestamp'           => '2026-10-06T10:15:00.000Z',
            'No_Urut'             => 14,
            'No_Surat'            => '0014/NSR/SU-KET/X/2026',
            'Tanggal_Surat'       => '2026-10-06',
            'Tujuan_Penerima'     => 'PT Bank Mandiri (Persero) Tbk - Kantor Pusat',
            'Perihal'             => 'Surat Keterangan Pembaruan Izin Cabang & Sertifikasi Penilai Publik',
            'Klasifikasi_Perihal' => 'SU-KET',
            'Penandatangan'       => 'Manager Legal & Admin',
            'Link_Arsip_Final'    => 'https://drive.google.com/file/d/demo_final_0014/view',
            'Link_File_Mentah'    => '',
            'File_ID_Final'       => 'demo_final_0014',
            'File_ID_Mentah'      => '',
            'Status_Arsip'        => 'Hanya Scan'
        ],
        [
            'Timestamp'           => '2026-09-28T14:20:00.000Z',
            'No_Urut'             => 13,
            'No_Surat'            => '0013/NSR/SU-MAP/IX/2026',
            'Tanggal_Surat'       => '2026-09-28',
            'Tujuan_Penerima'     => 'Masyarakat Profesi Penilai Indonesia (MAPPI) DPD DKI Jakarta',
            'Perihal'             => 'Pengiriman Delegasi Pelatihan Standar Penilaian Indonesia SPI 103',
            'Klasifikasi_Perihal' => 'SU-MAP',
            'Penandatangan'       => 'Pemimpin Rekan',
            'Link_Arsip_Final'    => '',
            'Link_File_Mentah'    => 'https://drive.google.com/file/d/demo_draf_0013/view',
            'File_ID_Final'       => '',
            'File_ID_Mentah'      => 'demo_draf_0013',
            'Status_Arsip'        => 'Hanya Draf'
        ]
    ];

    simpanDatabaseSuratUmum($dataFile, $baseline);
    return $baseline;
}

function simpanDatabaseSuratUmum($dataFile, $records) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    
    $backupDir = $dir . '/backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }
    
    // Tulis atomik dengan locking (LOCK_EX)
    $tempFile = tempnam($dir, 'tmp_su_');
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
            $backupFile = $backupDir . '/surat_umum_backup_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.json';
            @copy($dataFile, $backupFile);

            $allBackups = glob($backupDir . '/surat_umum_backup_*.json');
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

/**
 * Transaksi Atomik Database Surat Umum dengan Exclusive File Lock (flock LOCK_EX)
 * Menjamin pembacaan data paling mutakhir di dalam lock (Anti-Race Condition & Anti-Duplikasi Nomor)
 */
function transaksiDatabaseSuratUmum($dataFile, callable $callback) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $lockFile = $dir . '/.surat_umum_txn.lock';
    $fpLock = fopen($lockFile, 'c+');
    if (!$fpLock) {
        return [
            'success'   => false,
            'http_code' => 500,
            'error'     => 'Gagal inisialisasi file lock transaksi database surat umum'
        ];
    }

    if (!flock($fpLock, LOCK_EX)) {
        fclose($fpLock);
        return [
            'success'   => false,
            'http_code' => 503,
            'error'     => 'Sistem sibuk: Gagal memperoleh antrean lock transaksi atomik surat umum'
        ];
    }

    try {
        // 1. Baca data paling segar di dalam lock
        $records = muatDatabaseSuratUmum($dataFile);

        // 2. Eksekusi callback transaksional
        $res = $callback($records);

        // 3. Jika berhasil dan terdapat records yang dimutasi, simpan atomik
        if (is_array($res) && !empty($res['success']) && isset($res['records'])) {
            simpanDatabaseSuratUmum($dataFile, $res['records']);
            unset($res['records']);
        }

        return $res;
    } finally {
        flock($fpLock, LOCK_UN);
        fclose($fpLock);
    }
}

// Helper ekstrak urut integer
function extractSeqSU($val) {
    if (!$val) return 0;
    $s = trim((string)$val);
    if (strpos($s, '/') !== false) {
        $parts = explode('/', $s);
        $num = (int)preg_replace('/\D/', '', $parts[0]);
        return ($num > 0 && $num < 100000) ? $num : 0;
    }
    $num = (int)preg_replace('/\D/', '', $s);
    return ($num > 0 && $num < 100000) ? $num : 0;
}

// -------------------------------------------------------------
// 4. METODE GET: PEMBACAAN DAFTAR SURAT UMUM (HEAD OFFICE ONLY)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $records = muatDatabaseSuratUmum($dataFile);

    // Hitung max sequence untuk tahun 2026
    $targetYear = isset($_GET['target_year']) ? (int)$_GET['target_year'] : 2026;
    $maxSeq = 0;
    foreach ($records as $item) {
        $seq = (int)($item['No_Urut'] ?? extractSeqSU($item['No_Surat'] ?? ''));
        $itemYear = !empty($item['Tanggal_Surat']) ? (int)date('Y', strtotime($item['Tanggal_Surat'])) : $targetYear;
        if ($itemYear === $targetYear && $seq > $maxSeq && $seq < 50000) {
            $maxSeq = $seq;
        }
    }

    // Urutkan descending (surat terbaru di posisi pertama)
    usort($records, function($a, $b) {
        $seqA = (int)($a['No_Urut'] ?? extractSeqSU($a['No_Surat'] ?? ''));
        $seqB = (int)($b['No_Urut'] ?? extractSeqSU($b['No_Surat'] ?? ''));
        return $seqB - $seqA;
    });

    echo json_encode([
        'success'      => true,
        'status'       => 'success',
        'scope'        => 'HEAD_OFFICE_EXCLUSIVE',
        'userRole'     => $userRole,
        'year'         => $targetYear,
        'maxSeq'       => max($maxSeq, 15),
        'totalRecords' => count($records),
        'data'         => $records
    ]);
    exit;
}

// -------------------------------------------------------------
// 5. METODE POST: CREATE SURAT, UPLOAD ARSIP, DAN TRANSAKSI ATOMIK
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Format payload tidak valid (JSON required)']);
        exit;
    }

    $action = $body['action'] ?? '';

    // =========================================================================
    // A. TINDAKAN CREATE SURAT UMUM BARU
    // =========================================================================
    if ($action === 'CREATE_SURAT_UMUM') {
        $data = $body['data'] ?? $body;
        $noSurat = trim((string)($data['No_Surat'] ?? $data['no_surat'] ?? ''));
        $tujuan = trim((string)($data['Tujuan_Penerima'] ?? $data['tujuan_penerima'] ?? ''));
        $perihal = trim((string)($data['Perihal'] ?? $data['perihal'] ?? ''));
        $tanggal = trim((string)($data['Tanggal_Surat'] ?? $data['tanggal_surat'] ?? date('Y-m-d')));
        $klasifikasi = trim((string)($data['Klasifikasi_Perihal'] ?? $data['klasifikasi_perihal'] ?? 'SU-KET'));
        $penandatangan = trim((string)($data['Penandatangan'] ?? $data['penandatangan'] ?? 'Pemimpin Rekan'));

        if (empty($noSurat) || empty($tujuan) || empty($perihal)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Nomor Surat, Tujuan Penerima, dan Perihal wajib diisi lengkap.'
            ]);
            exit;
        }

        $inputSeq = extractSeqSU($noSurat);

        $txnResult = transaksiDatabaseSuratUmum($dataFile, function(&$records) use ($noSurat, $tujuan, $perihal, $tanggal, $klasifikasi, $penandatangan, $inputSeq) {
            // 1. Deteksi Duplikasi Seketika & Idempotency Check di Dalam Lock
            foreach ($records as $item) {
                $existNo = trim((string)($item['No_Surat'] ?? ''));
                $existSeq = (int)($item['No_Urut'] ?? extractSeqSU($existNo));

                if (strcasecmp($existNo, $noSurat) === 0) {
                    // Cek Idempotency: Jika perihal dan tujuan identik persis, kembalikan 200 OK
                    if (strcasecmp(trim($item['Perihal'] ?? ''), $perihal) === 0 &&
                        strcasecmp(trim($item['Tujuan_Penerima'] ?? ''), $tujuan) === 0) {
                        return [
                            'success'    => true,
                            'idempotent' => true,
                            'http_code'  => 200,
                            'message'    => "Surat umum nomor {$noSurat} sudah tersimpan sebelumnya (Idempotent).",
                            'record'     => $item
                        ];
                    }

                    // Duplikasi berbeda perihal -> Tolak Keras 409 Conflict
                    return [
                        'success'   => false,
                        'http_code' => 409,
                        'code'      => 'DUPLICATE_NUMBER',
                        'error'     => "Nomor surat {$noSurat} sudah terdaftar di Buku Agenda untuk perihal: \"" . ($item['Perihal'] ?? '-') . "\".",
                        'conflict'  => $item
                    ];
                }

                if ($inputSeq > 0 && $existSeq === $inputSeq) {
                    return [
                        'success'   => false,
                        'http_code' => 409,
                        'code'      => 'DUPLICATE_SEQUENCE',
                        'error'     => "Nomor urut #{$inputSeq} sudah digunakan oleh surat {$existNo} untuk perihal: \"" . ($item['Perihal'] ?? '-') . "\".",
                        'conflict'  => $item
                    ];
                }
            }

            // 2. Susun Record Baru
            $newRecord = [
                'Timestamp'           => date('c'),
                'No_Urut'             => $inputSeq > 0 ? $inputSeq : (count($records) + 1),
                'No_Surat'            => $noSurat,
                'Tanggal_Surat'       => $tanggal,
                'Tujuan_Penerima'     => $tujuan,
                'Perihal'             => $perihal,
                'Klasifikasi_Perihal' => $klasifikasi,
                'Penandatangan'       => $penandatangan,
                'Link_Arsip_Final'    => '',
                'Link_File_Mentah'    => '',
                'File_ID_Final'       => '',
                'File_ID_Mentah'      => '',
                'Status_Arsip'        => 'Kosong'
            ];

            // Tambahkan di awal daftar (unshift)
            array_unshift($records, $newRecord);

            return [
                'success'   => true,
                'http_code' => 201,
                'message'   => "Nomor surat {$noSurat} berhasil diregistrasi di Buku Agenda Resmi Kantor Pusat.",
                'record'    => $newRecord,
                'records'   => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // B. TINDAKAN UPLOAD / UPDATE STATUS ARSIP DIGITAL
    // =========================================================================
    if ($action === 'UPLOAD_ARSIP_SURAT_UMUM') {
        $noSurat = trim((string)($body['no_surat'] ?? ''));
        $tipeSlot = strtoupper(trim((string)($body['tipe_slot'] ?? 'FINAL')));
        $fileName = trim((string)($body['file_name'] ?? 'dokumen.pdf'));

        if (empty($noSurat)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nomor surat target wajib disertakan.']);
            exit;
        }

        $txnResult = transaksiDatabaseSuratUmum($dataFile, function(&$records) use ($noSurat, $tipeSlot, $fileName, $body) {
            $foundIndex = -1;
            foreach ($records as $i => $item) {
                if (strcasecmp(trim($item['No_Surat'] ?? ''), $noSurat) === 0) {
                    $foundIndex = $i;
                    break;
                }
            }

            if ($foundIndex === -1) {
                return [
                    'success'   => false,
                    'http_code' => 404,
                    'error'     => "Surat umum nomor {$noSurat} tidak ditemukan di Buku Agenda."
                ];
            }

            // Generate URL penyimpanan / drive
            $fileId = 'drive_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 8);
            $fileUrl = $body['file_url'] ?? "https://drive.google.com/file/d/{$fileId}/view";

            if ($tipeSlot === 'FINAL') {
                $records[$foundIndex]['Link_Arsip_Final'] = $fileUrl;
                $records[$foundIndex]['File_ID_Final'] = $fileId;
            } else {
                $records[$foundIndex]['Link_File_Mentah'] = $fileUrl;
                $records[$foundIndex]['File_ID_Mentah'] = $fileId;
            }

            $hasFinal = !empty($records[$foundIndex]['Link_Arsip_Final']);
            $hasMentah = !empty($records[$foundIndex]['Link_File_Mentah']);
            $statusArsip = ($hasFinal && $hasMentah) ? 'Lengkap' : ($hasFinal ? 'Hanya Scan' : ($hasMentah ? 'Hanya Draf' : 'Kosong'));
            $records[$foundIndex]['Status_Arsip'] = $statusArsip;

            return [
                'success'      => true,
                'http_code'    => 200,
                'status'       => 'success',
                'file_id'      => $fileId,
                'file_url'     => $fileUrl,
                'status_arsip' => $statusArsip,
                'record'       => $records[$foundIndex],
                'records'      => $records
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => "Aksi '{$action}' tidak dikenal oleh handler surat umum."
    ]);
    exit;
}
