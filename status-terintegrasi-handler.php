<?php
/**
 * KJPP NSR — Backend Handler: Integrasi Status Lintas Portal (Tahap 3 - Hardened Security)
 * Endpoint: /api/status-terintegrasi-proxy
 * 
 * Menghubungkan status operasional 4 pilar berdasarkan ID Resmi:
 * 1. Penugasan / JO
 * 2. NoLap (Nomor Laporan)
 * 3. e-Operasional (Biaya Survey & Operasional)
 * 4. Kwitansi (Administrasi Keuangan & Penagihan)
 * 
 * Standar Keamanan & Integritas:
 * - Anti-Celah Autentikasi: Token kosong, tidak valid, atau kedaluwarsa -> HTTP 401.
 * - Tanpa Fallback: Tidak ada fallback otomatis ke SUPER ADMIN.
 * - Anti-Bypass String / Substring: Dilarang mengenali peran dari teks token atau nama peran.
 * - Strict Server-Side RBAC: Cabang penugasan ditentukan oleh backend (bukan parameter client).
 * - Fail-Closed: Jika cabang penugasan tidak dapat dipastikan secara resmi, tolak (HTTP 403).
 * - Sensor Kerahasiaan (Fee Masking): Nominal disensor untuk Penilai, Reviewer, dan Marketing.
 * - Pembedaan Kegagalan Sumber Data: Bedakan data tidak tersedia vs dokumen belum terhubung.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

date_default_timezone_set('Asia/Jakarta');

// 1. CORS Setup
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
if ($origin) {
    $parsedOrigin = parse_url($origin, PHP_URL_HOST);
    $selfHost = parse_url("http://" . ($_SERVER["HTTP_HOST"] ?? ""), PHP_URL_HOST);
    if (in_array($parsedOrigin, $allowedHosts, true) || $parsedOrigin === $selfHost || preg_match("/\.(lhr\.life|trycloudflare\.com|loca\.lt)$/i", (string)$parsedOrigin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With, X-NSR-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Sesi & Autentikasi Pengguna
ini_set('session.gc_maxlifetime', 28800);
session_name('NSR_SESSION');
$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
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
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
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

// Pencegahan Circular Request / Loopback
if (isset($_SERVER['HTTP_X_NSR_PROXY_ORIGIN']) && $_SERVER['HTTP_X_NSR_PROXY_ORIGIN'] === 'cpanel-handler') {
    http_response_code(508);
    echo json_encode([
        'success'   => false,
        'error'     => 'Loopback Terdeteksi (508): Request berulang ke handler backend cPanel.',
        'violation' => 'CIRCULAR_LOOPBACK'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$dataDir = __DIR__ . '/data';

/**
 * Validasi Token JWT (HS256) Konsisten dengan Netlify Functions
 */
function verifyJwtSessionToken($token, $secret) {
    if (!$token || !is_string($token)) return null;
    $parts = explode('.', trim($token));
    if (count($parts) !== 3) return null;
    list($head64, $body64, $crypto64) = $parts;

    $sigInput = "$head64.$body64";
    $expectedSig = rtrim(strtr(base64_encode(hash_hmac('sha256', $sigInput, $secret, true)), '+/', '-_'), '=');

    if (!hash_equals($expectedSig, $crypto64)) {
        return null;
    }

    $payloadJson = base64_decode(strtr($body64, '-_', '+/'));
    $payload = json_decode($payloadJson, true);
    if (!$payload || !is_array($payload)) return null;

    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return null; // Kedaluwarsa
    }

    return $payload;
}

/**
 * Resolusi Pengguna Resmi (Fail-Closed, Non-Hash Credential Bypass)
 */
function resolveCurrentUserStrict() {
    // A. Dari Sesi Aktif PHP (NSR_SESSION)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            return $_SESSION['nsr_user'];
        }
    }

    // Resolusi Kunci Rahasia Server untuk JWT & Server-to-Server
    // Di lingkungan produksi, rahasia server WAJIB berasal dari environment dan menolak fallback development
    $isProd = (getenv('NSR_ENV') === 'production') || 
              (!empty($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], 'kjppnanangrahayu.com') !== false);

    $jwtSecret = getenv('NSR_JWT_SECRET') ?: getenv('NSR_AUTH_SECRET_PRODUCTION');
    if (!$jwtSecret) {
        if ($isProd) {
            // Fail-closed di lingkungan produksi jika kunci belum disetel di server environment
            $jwtSecret = null;
        } else {
            $jwtSecret = getenv('NSR_AUTH_SECRET_STAGING') ?: getenv('NSR_TEST_SECRET') ?: 'nsr_dev_secret_key_change_in_production_9988';
        }
    }

    // B. Dari Komunikasi Server-to-Server Terverifikasi (Netlify -> cPanel)
    $incomingServerSecret = $_SERVER['HTTP_X_NSR_SERVER_SECRET'] ?? '';
    if ($jwtSecret && $incomingServerSecret && hash_equals($jwtSecret, $incomingServerSecret)) {
        $forwardedContextRaw = $_SERVER['HTTP_X_NSR_USER_CONTEXT'] ?? '';
        if ($forwardedContextRaw) {
            $userCtx = json_decode(base64_decode($forwardedContextRaw), true);
            if (is_array($userCtx) && !empty($userCtx['role'])) {
                return $userCtx;
            }
        }
    }

    // C. Dari Authorization Header: Bearer <TOKEN> atau X-NSR-Token (HANYA HEADER, DILARANG QUERY STRING)
    $rawToken = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $rawToken = trim($matches[1]);
    } elseif (isset($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawToken = trim($_SERVER['HTTP_X_NSR_TOKEN']);
    }

    if ($rawToken) {
        $clean = trim($rawToken);

        // 1. Verifikasi Format JWT (HS256)
        if ($jwtSecret && substr_count($clean, '.') === 2) {
            $jwtPayload = verifyJwtSessionToken($clean, $jwtSecret);
            if ($jwtPayload && is_array($jwtPayload)) {
                return $jwtPayload;
            }
        }

        // 2. Verifikasi Token Operasional Resmi dari Secret Store / Environment
        // DILARANG KERAS MENYIMPAN KREDENSIAL ATAU HASH HARDCODED DALAM FILE KODE SUMBER
        $registry = [];

        // Dukungan registry dari variabel lingkungan / secrets manager resmi
        $envRegistryJson = getenv('NSR_AUTH_TOKEN_REGISTRY');
        if ($envRegistryJson) {
            $decoded = json_decode($envRegistryJson, true);
            if (is_array($decoded)) {
                $registry = $decoded;
            }
        }

        // Dukungan inject test mode terisolasi (HANYA AKTIF SAAT NSR_TEST_MODE=1)
        if (getenv('NSR_TEST_MODE') === '1' && !empty(getenv('NSR_TEST_SYNTHETIC_REGISTRY'))) {
            $injected = json_decode(getenv('NSR_TEST_SYNTHETIC_REGISTRY'), true);
            if (is_array($injected)) {
                $registry = array_merge($registry, $injected);
            }
        }

        if (!empty($registry)) {
            $hSalt = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($clean));
            if (isset($registry[$hSalt])) {
                return $registry[$hSalt];
            }

            $hRawUpper = hash('sha256', strtoupper($clean));
            if (isset($registry[$hRawUpper])) {
                return $registry[$hRawUpper];
            }

            $hRaw = hash('sha256', $clean);
            if (isset($registry[$hRaw])) {
                return $registry[$hRaw];
            }
        }
    }

    // Fail-Closed: Tidak ada kecocokan sah
    return null;
}

$currentUser = resolveCurrentUserStrict();

// Jika autentikasi gagal: Tolak dengan HTTP 401 Unauthorized secara mutlak
if (!$currentUser) {
    http_response_code(401);
    echo json_encode([
        'success'   => false,
        'error'     => 'Autentikasi Ditolak (401 Unauthorized): Sesi telah berakhir atau token autentikasi tidak valid. Silakan login kembali.',
        'violation' => 'UNAUTHORIZED_ACCESS'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Baca Input Permintaan
$rawInput = file_get_contents('php://input');
$payload = [];
if ($rawInput) {
    $payload = json_decode($rawInput, true) ?: [];
}

$projectId = trim($_GET['id'] ?? $payload['id'] ?? $payload['projectId'] ?? $payload['ID_Penugasan'] ?? '');
$noSpk     = trim($_GET['noSpk'] ?? $payload['noSpk'] ?? $payload['nomor_lp'] ?? $payload['No_Lingkup_Penugasan'] ?? '');
$noJo      = trim($_GET['noJo'] ?? $payload['noJo'] ?? $payload['nomor_adm'] ?? $payload['No_Adm_JO'] ?? '');

if (!$projectId && !$noSpk && !$noJo) {
    http_response_code(400);
    echo json_encode([
        'success'   => false,
        'error'     => 'Parameter ID Penugasan tidak lengkap. Minimal satu identitas resmi (ID, No. SPK, atau No. JO) wajib disertakan.',
        'violation' => 'MISSING_SEARCH_PARAM'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Kumpulkan Daftar Identitas Kandidat Resmi (Strict Candidate IDs)
$candidateIds = array_values(array_filter(array_unique([
    strtolower($projectId),
    strtolower($noSpk),
    strtolower($noJo)
]), function($v) { return $v !== ''; }));

// 4. Muat Database Masing-Masing Modul & Catat Ketersediaan Sumber Data
// Modul A: NoLap
$nolapFile = $dataDir . '/nolap_database.json';
$nolapAltFile = __DIR__ . '/nolap-data.json';
$nolapSourceAvailable = false;
$nolapList = [];

if (file_exists($nolapFile)) {
    $raw = @file_get_contents($nolapFile);
    $nolapList = json_decode($raw, true);
    if (is_array($nolapList)) $nolapSourceAvailable = true;
} elseif (file_exists($nolapAltFile)) {
    $raw = @file_get_contents($nolapAltFile);
    $nolapList = json_decode($raw, true);
    if (is_array($nolapList)) $nolapSourceAvailable = true;
}

// Modul B: e-Operasional
$operasionalFile = $dataDir . '/operasional_database.json';
$operasionalSourceAvailable = false;
$operasionalList = [];

if (file_exists($operasionalFile)) {
    $raw = @file_get_contents($operasionalFile);
    $operasionalList = json_decode($raw, true);
    if (is_array($operasionalList)) $operasionalSourceAvailable = true;
}

// Modul C: Kwitansi
$kwitansiFile = $dataDir . '/kwitansi_database.json';
$kwitansiSourceAvailable = false;
$kwitansiList = [];

if (file_exists($kwitansiFile)) {
    $raw = @file_get_contents($kwitansiFile);
    $kwitansiList = json_decode($raw, true);
    if (is_array($kwitansiList)) $kwitansiSourceAvailable = true;
}

// 5. Penentuan Cabang Penugasan dari Basis Data Resmi & Pola ID (Bukan Parameter Client)
function normalizeBranchCode($str) {
    if (!$str) return '';
    $s = strtoupper(trim((string)$str));
    if (strpos($s, 'PADANG') !== false || strpos($s, 'PDG') !== false || $s === '01') return 'PADANG';
    if (strpos($s, 'MAKASSAR') !== false || strpos($s, 'MKS') !== false || $s === '02') return 'MAKASSAR';
    if (strpos($s, 'PALEMBANG') !== false || strpos($s, 'PLB') !== false || $s === '03') return 'PALEMBANG';
    if (strpos($s, 'BANDUNG') !== false || strpos($s, 'BDG') !== false || $s === '04') return 'BANDUNG';
    if (strpos($s, 'PEKANBARU') !== false || strpos($s, 'PKU') !== false) return 'PEKANBARU';
    if (strpos($s, 'PUSAT') !== false || strpos($s, 'JAKARTA') !== false || strpos($s, 'PST') !== false || $s === '00') return 'PUSAT';
    return '';
}

function resolveJobBranchStrict($candidateIds, $nolapList, $operasionalList, $kwitansiList) {
    // 1. Cari dari data resmi NoLap
    foreach ($nolapList as $item) {
        $spkItem  = strtolower(trim((string)($item['noSpk'] ?? '')));
        $reqItem  = strtolower(trim((string)($item['noPermintaan'] ?? '')));
        $lapItem  = strtolower(trim((string)($item['nomorLaporan'] ?? '')));
        $joItem   = strtolower(trim((string)($item['noJo'] ?? $item['idPenugasan'] ?? '')));
        foreach ($candidateIds as $cId) {
            if ($cId !== '' && ($spkItem === $cId || $joItem === $cId || $reqItem === $cId || $lapItem === $cId)) {
                $b = normalizeBranchCode($item['cabang'] ?? $item['kantorWilayah'] ?? $item['wilayah'] ?? '');
                if ($b) return $b;
            }
        }
    }

    // 2. Cari dari data resmi e-Operasional
    foreach ($operasionalList as $opr) {
        $sId  = strtolower(trim((string)($opr['survey']['idPenugasan'] ?? $opr['idPenugasan'] ?? '')));
        $sLap = strtolower(trim((string)($opr['survey']['nomorLaporan'] ?? '')));
        foreach ($candidateIds as $cId) {
            if ($cId !== '' && ($sId === $cId || $sLap === $cId)) {
                $b = normalizeBranchCode($opr['cabang'] ?? $opr['kantorCabang'] ?? $opr['wilayah'] ?? '');
                if ($b) return $b;
            }
        }
    }

    // 3. Cari dari data resmi Kwitansi
    foreach ($kwitansiList as $kw) {
        $spkKw = strtolower(trim((string)($kw['noSpk'] ?? '')));
        $reqKw = strtolower(trim((string)($kw['noPermintaan'] ?? '')));
        $idKw  = strtolower(trim((string)($kw['idKwitansi'] ?? '')));
        $noRes = strtolower(trim((string)($kw['noKwitansiResmi'] ?? '')));
        foreach ($candidateIds as $cId) {
            if ($cId !== '' && ($spkKw === $cId || $reqKw === $cId || $idKw === $cId || $noRes === $cId)) {
                $b = normalizeBranchCode($kw['cabang'] ?? $kw['kantorCabang'] ?? $kw['kantorWilayah'] ?? '');
                if ($b) return $b;
            }
        }
    }

    // 4. Analisis dari pola nomor resmi SPK / JO / ID penugasan
    foreach ($candidateIds as $cId) {
        $up = strtoupper($cId);
        // Padang: e.g. SPK-PDG-001, PDG-001, /0160-01/, /PDG/
        if (preg_match('/(?:^|[\/\-_])(PDG|0160-01)(?:$|[\/\-_])/i', $up) || preg_match('/^PDG-?\d+/i', $up)) {
            return 'PADANG';
        }
        // Bandung: e.g. SPK-BDG-001, BDG-001, /0160-04/, /BDG/
        if (preg_match('/(?:^|[\/\-_])(BDG|0160-04)(?:$|[\/\-_])/i', $up) || preg_match('/^BDG-?\d+/i', $up)) {
            return 'BANDUNG';
        }
        // Makassar: e.g. SPK-MKS-001, MKS-001, /0160-02/, /MKS/
        if (preg_match('/(?:^|[\/\-_])(MKS|0160-02)(?:$|[\/\-_])/i', $up) || preg_match('/^MKS-?\d+/i', $up)) {
            return 'MAKASSAR';
        }
        // Palembang: e.g. SPK-PLB-001, PLB-001, /0160-03/, /PLB/
        if (preg_match('/(?:^|[\/\-_])(PLB|0160-03)(?:$|[\/\-_])/i', $up) || preg_match('/^PLB-?\d+/i', $up)) {
            return 'PALEMBANG';
        }
        // Pusat: e.g. 0415/LP/NSR/..., NSR-2026-..., /PST/, /JKT/, /0160-00/
        if (preg_match('/(?:^|[\/\-_])(PST|JKT|0160-00)(?:$|[\/\-_])/i', $up) || preg_match('/^\d{4}\/LP\/NSR\//i', $up) || preg_match('/^NSR-2026-/i', $up)) {
            return 'PUSAT';
        }
    }

    return null; // Tidak dapat diverifikasi
}

// 6. Penegakan Hak Akses Cabang (RBAC Data Isolation)
$userRole = strtoupper($currentUser['role'] ?? '');
$isCabang = !empty($currentUser['isCabang']) ||
            in_array($userRole, ['CABANG', 'ADMIN_CABANG', 'KEUANGAN_CABANG', 'STAF_CABANG', 'KASIR_CABANG', 'OPERATOR_CABANG'], true) ||
            ($currentUser['mode'] ?? '') === 'CABANG' ||
            (isset($currentUser['wilayahCode']) && in_array($currentUser['wilayahCode'], ['01', '02', '03', '04', 'PDG', 'MKS', 'PLB', 'BDG', 'PKU'], true));
$userBranch = normalizeBranchCode($currentUser['branch'] ?? $currentUser['wilayah'] ?? $currentUser['wilayahCode'] ?? '');

$resolvedJobBranch = resolveJobBranchStrict($candidateIds, $nolapList, $operasionalList, $kwitansiList);

if ($isCabang) {
    // FAIL-CLOSED: Jika cabang penugasan tidak dapat diverifikasi secara resmi -> HTTP 403
    if (!$resolvedJobBranch) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Identitas kantor penugasan tidak dapat diverifikasi secara resmi dari basis data atau nomor penugasan. Akses ditolak (fail-closed protection).',
            'violation' => 'UNVERIFIED_BRANCH_JOB'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Periksa apakah cabang pengguna berhak memeriksa pekerjaan kantor ini
    if ($userBranch !== $resolvedJobBranch) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Anda hanya berwenang memeriksa status penugasan yang menjadi tanggung jawab kantor cabang Anda (' . ($currentUser['wilayahLabel'] ?? $userBranch) . ').',
            'violation' => 'CROSS_BRANCH_ACCESS_DENIED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 7. Penegakan Kerahasiaan Nilai Finansial (DEFAULT DENY)
// Nilai nominal finansial HANYA terbuka jika role terdaftar eksplisit dan seeFee bernilai true
$canSeeFinancialFee = false;
$EXPLICIT_AUTHORIZED_FEE_ROLES = [
    'SUPER ADMIN',
    'SUPER_ADMIN',
    'PEMIMPIN_REKAN',
    'KEUANGAN',
    'ADMIN_PUSAT',
    'KEPALA_KEUANGAN',
    'MANAGER_KEUANGAN'
];

if (!empty($currentUser['seeFee']) && in_array($userRole, $EXPLICIT_AUTHORIZED_FEE_ROLES, true)) {
    $canSeeFinancialFee = true;
} elseif ($isCabang && !empty($currentUser['seeFee']) && in_array($userRole, ['ADMIN_CABANG', 'KEUANGAN_CABANG'], true)) {
    // Akun cabang berwenang hanya dapat melihat nominal penugasan cabangnya sendiri
    $canSeeFinancialFee = true;
}

// 8. Pencocokan Ketat: NoLap
$matchedNolap = [];
if ($nolapSourceAvailable) {
    foreach ($nolapList as $item) {
        $spkItem  = strtolower(trim((string)($item['noSpk'] ?? '')));
        $reqItem  = strtolower(trim((string)($item['noPermintaan'] ?? '')));
        $lapItem  = strtolower(trim((string)($item['nomorLaporan'] ?? '')));
        $joItem   = strtolower(trim((string)($item['noJo'] ?? $item['idPenugasan'] ?? '')));

        $isMatch = false;
        foreach ($candidateIds as $cId) {
            if ($cId === '') continue;
            if (($spkItem && $spkItem === $cId) ||
                ($joItem && $joItem === $cId) ||
                ($reqItem && $reqItem === $cId) ||
                ($lapItem && $lapItem === $cId)) {
                $isMatch = true;
                break;
            }
        }

        if ($isMatch) {
            $st = $item['status'] ?? 'DIAJUKAN';
            $statusLabel = 'Diajukan';
            if (strcasecmp($st, 'NOMOR DITERBITKAN') === 0) {
                $statusLabel = 'Nomor Laporan Diterbitkan';
            } elseif (stripos($st, 'Review Mutu') !== false || stripos($st, 'QA') !== false) {
                $statusLabel = 'Dalam Verifikasi / Review QA';
            } elseif (stripos($st, 'Disetujui Partner') !== false) {
                $statusLabel = 'Disetujui Partner';
            } elseif (stripos($st, 'Perbaikan') !== false) {
                $statusLabel = 'Perlu Revisi / Perbaikan Cabang';
            }

            $matchedNolap[] = [
                'noPermintaan' => $item['noPermintaan'] ?? '-',
                'nomorLaporan' => !empty($item['nomorLaporan']) ? $item['nomorLaporan'] : 'Belum Diterbitkan',
                'status'       => $st,
                'statusLabel'  => $statusLabel,
                'tglTerbit'    => $item['tglTerbit'] ?? $item['timestamp'] ?? '-',
                'penilai'      => $item['penilai'] ?? '-'
            ];
        }
    }
}

// 9. Pencocokan Ketat: e-Operasional
$matchedOperasional = [];
if ($operasionalSourceAvailable) {
    foreach ($operasionalList as $opr) {
        $surveyIdPenugasan = strtolower(trim((string)($opr['survey']['idPenugasan'] ?? $opr['idPenugasan'] ?? '')));
        $surveyNoLaporan   = strtolower(trim((string)($opr['survey']['nomorLaporan'] ?? '')));

        $isMatch = false;
        foreach ($candidateIds as $cId) {
            if ($cId === '') continue;
            if (($surveyIdPenugasan && $surveyIdPenugasan === $cId) ||
                ($surveyNoLaporan && $surveyNoLaporan === $cId)) {
                $isMatch = true;
                break;
            }
        }

        if ($isMatch) {
            $stOpr = $opr['status'] ?? 'SUBMITTED';
            $statusLabel = 'Menunggu Persetujuan Tingkat 1';
            if ($stOpr === 'APPROVED_TIER_1') {
                $statusLabel = 'Menunggu Persetujuan Tingkat 2 (Manager Keuangan)';
            } elseif ($stOpr === 'APPROVED_TIER_2') {
                $statusLabel = 'Menunggu Persetujuan Tingkat 3 (Kepala Keuangan)';
            } elseif ($stOpr === 'APPROVED') {
                $statusLabel = 'Disetujui Final';
            } elseif ($stOpr === 'REJECTED') {
                $statusLabel = 'Ditolak / Perlu Revisi';
            }

            $totEst = $opr['totalEstimasi'] ?? $opr['nominalTotal'] ?? 0;
            $totalFormatted = $canSeeFinancialFee 
                ? 'Rp ' . number_format((float)$totEst, 0, ',', '.') . ',-'
                : '[Akses Terbatas: Sesuai Kebijakan Peran]';

            $matchedOperasional[] = [
                'noRegistrasi'     => $opr['noRegistrasi'] ?? $opr['id'] ?? '-',
                'jenisOperasional' => $opr['jenisOperasional'] ?? 'OPR-SRV',
                'jenisLabel'       => $opr['jenisLabel'] ?? 'Biaya Operasional Lapangan',
                'status'           => $stOpr,
                'statusLabel'      => $statusLabel,
                'tglPengajuan'     => $opr['tglPengajuan'] ?? '-',
                'totalEstimasi'    => $totalFormatted,
                'isFeeMasked'      => !$canSeeFinancialFee
            ];
        }
    }
}

// 10. Pencocokan Ketat: Kwitansi
$matchedKwitansi = [];
if ($kwitansiSourceAvailable) {
    foreach ($kwitansiList as $kw) {
        $spkKw   = strtolower(trim((string)($kw['noSpk'] ?? '')));
        $reqKw   = strtolower(trim((string)($kw['noPermintaan'] ?? '')));
        $idKw    = strtolower(trim((string)($kw['idKwitansi'] ?? '')));
        $noResmi = strtolower(trim((string)($kw['noKwitansiResmi'] ?? '')));

        $isMatch = false;
        foreach ($candidateIds as $cId) {
            if ($cId === '') continue;
            if (($spkKw && $spkKw === $cId) ||
                ($reqKw && $reqKw === $cId) ||
                ($idKw && $idKw === $cId) ||
                ($noResmi && $noResmi === $cId)) {
                $isMatch = true;
                break;
            }
        }

        if ($isMatch) {
            $stKw = $kw['status'] ?? 'DRAFT';
            $statusLabel = 'Draf Kwitansi (Menunggu Verifikasi)';
            if (strcasecmp($stKw, 'DISAHKAN') === 0) {
                $statusLabel = 'Kwitansi Resmi Diterbitkan';
            } elseif (strcasecmp($stKw, 'VOID') === 0 || strcasecmp($stKw, 'DIBATALKAN') === 0) {
                $statusLabel = 'Dibatalkan (Void)';
            }

            $nominalKw = $kw['totalBayar'] ?? $kw['sejumlahUang'] ?? 0;
            $nominalFormatted = $canSeeFinancialFee
                ? 'Rp ' . number_format((float)$nominalKw, 0, ',', '.') . ',-'
                : '[Akses Terbatas: Sesuai Kebijakan Peran]';

            // Anti-Asumsi Lunas: Kwitansi terbit tidak otomatis berarti lunas
            $statusBayarResmi = $kw['statusBayar'] ?? 'MENUNGGU_PEMBAYARAN_REKENING';
            $statusBayarLabel = 'Menunggu Konfirmasi Rekening / Pelunasan';
            if (strcasecmp($statusBayarResmi, 'LUNAS') === 0) {
                $statusBayarLabel = 'Pembayaran Resmi Terkonfirmasi (Lunas)';
            }

            $matchedKwitansi[] = [
                'idKwitansi'       => $kw['idKwitansi'] ?? '-',
                'noKwitansiResmi'  => $kw['noKwitansiResmi'] ?? 'DRAFT (Belum Terbit)',
                'status'           => $stKw,
                'statusLabel'      => $statusLabel,
                'statusPembayaran' => $statusBayarLabel,
                'tglSah'           => $kw['tglSah'] ?? $kw['tglPengajuan'] ?? '-',
                'totalBayar'       => $nominalFormatted,
                'isFeeMasked'      => !$canSeeFinancialFee
            ];
        }
    }
}

// 11. Format Response Akhir dengan Pembedaan Kegagalan Sumber Data (Point 4)
$response = [
    'success'     => true,
    'query'       => [
        'id'             => $projectId,
        'noSpk'          => $noSpk,
        'noJo'           => $noJo,
        'resolvedOffice' => $resolvedJobBranch ?: 'TIDAK_DAPAT_DIPASTIKAN'
    ],
    'aksesPengguna'=> [
        'role'        => $userRole,
        'isCabang'    => $isCabang,
        'wilayah'     => $currentUser['wilayahLabel'] ?? $currentUser['wilayah'] ?? 'Pusat',
        'canSeeFee'   => $canSeeFinancialFee
    ],
    'nolap' => [
        'terhubung'     => count($matchedNolap) > 0,
        'statusKoneksi' => $nolapSourceAvailable ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        'statusUtama'   => !$nolapSourceAvailable
            ? 'Sumber Data Tidak Tersedia'
            : (count($matchedNolap) > 0 ? $matchedNolap[0]['statusLabel'] : 'Belum Terhubung'),
        'keterangan'    => !$nolapSourceAvailable
            ? 'Basis data NoLap sedang offline atau berkas tidak tersedia di server.'
            : (count($matchedNolap) > 0 ? 'Ditemukan ' . count($matchedNolap) . ' dokumen resmi.' : 'Tidak ada dokumen resmi NoLap yang terdaftar.'),
        'total'         => count($matchedNolap),
        'items'         => $matchedNolap
    ],
    'operasional' => [
        'terhubung'     => count($matchedOperasional) > 0,
        'statusKoneksi' => $operasionalSourceAvailable ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        'statusUtama'   => !$operasionalSourceAvailable
            ? 'Sumber Data Tidak Tersedia'
            : (count($matchedOperasional) > 0 ? $matchedOperasional[0]['statusLabel'] : 'Belum Ada Pengajuan Biaya'),
        'keterangan'    => !$operasionalSourceAvailable
            ? 'Basis data e-Operasional sedang offline atau berkas tidak tersedia di server.'
            : (count($matchedOperasional) > 0 ? 'Ditemukan ' . count($matchedOperasional) . ' pengajuan biaya operasional.' : 'Belum ada pengajuan biaya operasional.'),
        'total'         => count($matchedOperasional),
        'items'         => $matchedOperasional
    ],
    'kwitansi' => [
        'terhubung'     => count($matchedKwitansi) > 0,
        'statusKoneksi' => $kwitansiSourceAvailable ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        'statusUtama'   => !$kwitansiSourceAvailable
            ? 'Sumber Data Tidak Tersedia'
            : (count($matchedKwitansi) > 0 ? $matchedKwitansi[0]['statusLabel'] : 'Belum Ada Kwitansi'),
        'keterangan'    => !$kwitansiSourceAvailable
            ? 'Basis data Kwitansi sedang offline atau berkas tidak tersedia di server.'
            : (count($matchedKwitansi) > 0 ? 'Ditemukan ' . count($matchedKwitansi) . ' kwitansi resmi.' : 'Belum ada kwitansi resmi yang diterbitkan.'),
        'total'         => count($matchedKwitansi),
        'items'         => $matchedKwitansi
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
