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
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$dataDir = __DIR__ . '/data';

// Matriks Token Resmi Berdasarkan Hash SHA-256 (Tersinkronisasi dengan auth-handler.php)
$OFFICIAL_TOKEN_HASHES = [
    // Super Admin Pusat
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [
        'displayName'  => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'         => 'SUPER ADMIN',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => true
    ],
    // Pemimpin Rekan
    '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8' => [
        'displayName'  => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'         => 'PEMIMPIN_REKAN',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => true
    ],
    // Divisi Keuangan Pusat
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [
        'displayName'  => 'Milda Hidayati Dewi, S.E.',
        'role'         => 'KEUANGAN',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => true
    ],
    '47c94b7c1328905fb55ad9c12204c8aa302ab84a9e52c8b355476a6cf042fb14' => [
        'displayName'  => 'Admin Keuangan Pusat',
        'role'         => 'KEUANGAN',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => true
    ],
    // Admin Cabang Padang
    'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b' => [
        'displayName'  => 'Kantor Cabang Padang',
        'role'         => 'ADMIN_CABANG',
        'wilayah'      => 'PADANG',
        'wilayahLabel' => 'Kantor Cabang Padang',
        'wilayahCode'  => '01',
        'kodeKemenkeu' => '2.19.0160-01',
        'isCabang'     => true,
        'seeFee'       => true
    ],
    // Admin Cabang Bandung
    '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b' => [
        'displayName'  => 'Kantor Cabang Bandung',
        'role'         => 'ADMIN_CABANG',
        'wilayah'      => 'BANDUNG',
        'wilayahLabel' => 'Kantor Cabang Bandung',
        'wilayahCode'  => '04',
        'kodeKemenkeu' => '2.19.0160-04',
        'isCabang'     => true,
        'seeFee'       => true
    ],
    // Admin Cabang Makassar
    '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff' => [
        'displayName'  => 'Kantor Cabang Makassar',
        'role'         => 'ADMIN_CABANG',
        'wilayah'      => 'MAKASSAR',
        'wilayahLabel' => 'Kantor Cabang Makassar',
        'wilayahCode'  => '02',
        'kodeKemenkeu' => '2.19.0160-02',
        'isCabang'     => true,
        'seeFee'       => true
    ],
    // Admin Cabang Palembang
    '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce' => [
        'displayName'  => 'Kantor Cabang Palembang',
        'role'         => 'ADMIN_CABANG',
        'wilayah'      => 'PALEMBANG',
        'wilayahLabel' => 'Kantor Cabang Palembang',
        'wilayahCode'  => '03',
        'kodeKemenkeu' => '2.19.0160-03',
        'isCabang'     => true,
        'seeFee'       => true
    ],
    // Penilai Publik (Nominal Keuangan Wajib Disensor)
    'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e' => [
        'displayName'  => 'Penilai Publik Terdaftar',
        'role'         => 'PENILAI',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => false
    ],
    // Reviewer QC (Nominal Keuangan Wajib Disensor)
    'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9' => [
        'displayName'  => 'Reviewer QC',
        'role'         => 'REVIEWER',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => false
    ],
    // Marketing (Nominal Keuangan Wajib Disensor)
    '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59' => [
        'displayName'  => 'Divisi Marketing',
        'role'         => 'MARKETING',
        'wilayah'      => 'PUSAT',
        'wilayahLabel' => 'Kantor Pusat Jakarta',
        'wilayahCode'  => '00',
        'isCabang'     => false,
        'seeFee'       => false
    ]
];

// Dukungan Injeksi Token Sintesis Khusus Environment Pengujian Terisolasi (Hanya Aktif jika NSR_TEST_MODE=1)
if (getenv('NSR_TEST_MODE') === '1' && !empty(getenv('NSR_TEST_SYNTHETIC_REGISTRY'))) {
    $injected = json_decode(getenv('NSR_TEST_SYNTHETIC_REGISTRY'), true);
    if (is_array($injected)) {
        foreach ($injected as $h => $u) {
            $OFFICIAL_TOKEN_HASHES[$h] = $u;
        }
    }
}

/**
 * Verifikasi Autentikasi Pengguna Secara Ketat (Fail-Closed)
 * Dilarang menggunakan fallback ke SUPER ADMIN atau mengenali substring peran.
 */
function resolveCurrentUserStrict($officialTokenHashes) {
    // A. Dari Sesi Aktif PHP (NSR_SESSION)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            return $_SESSION['nsr_user'];
        }
    }

    // B. Dari Authorization Header: Bearer <TOKEN> atau X-NSR-Token
    $rawToken = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $rawToken = trim($matches[1]);
    } elseif (isset($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawToken = trim($_SERVER['HTTP_X_NSR_TOKEN']);
    } elseif (isset($_GET['token'])) {
        $rawToken = trim($_GET['token']);
    }

    if ($rawToken) {
        $clean = trim($rawToken);
        // 1. Direct Hash Match (Jika input adalah SHA-256 hash resmi)
        if (isset($officialTokenHashes[$clean])) {
            return $officialTokenHashes[$clean];
        }
        // 2. Hash SHA-256 dari token mentah
        $h = hash('sha256', $clean);
        if (isset($officialTokenHashes[$h])) {
            return $officialTokenHashes[$h];
        }
        // 3. Hash SHA-256 dari token uppercase
        $hUp = hash('sha256', strtoupper($clean));
        if (isset($officialTokenHashes[$hUp])) {
            return $officialTokenHashes[$hUp];
        }
    }

    // Fail-Closed: Tidak ada kecocokan sah
    return null;
}

$currentUser = resolveCurrentUserStrict($OFFICIAL_TOKEN_HASHES);

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
$isCabang = !empty($currentUser['isCabang']) || in_array($userRole, ['CABANG', 'ADMIN_CABANG', 'KEUANGAN_CABANG'], true);
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

// 7. Penegakan Kerahasiaan Nilai Finansial (Fee Masking)
$canSeeFinancialFee = ($currentUser['seeFee'] ?? true) && !in_array($userRole, ['PENILAI', 'REVIEWER', 'MARKETING', 'SURVEYOR'], true);

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
