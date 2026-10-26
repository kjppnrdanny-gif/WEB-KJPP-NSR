<?php
/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN
 * Fast NIK Authentication & Routing Gateway (Backend Proxy + Caching)
 * 
 * File: backend/auth-nik-presensi.php
 * Endpoint: POST /api/auth-nik-presensi (via .htaccess rewrite) atau POST backend/auth-nik-presensi.php
 * 
 * Keamanan Zero-Exposure:
 * - Tidak mengekspos database seluruh kantor ke browser (Zero-Exposure).
 * - Mengambil data master NIK dari Google Sheets via GAS endpoint secara berkala.
 * - Menyimpan data cache terenkripsi / terproteksi di direktori privat (data/.master_karyawan_cache.json).
 * - Hanya mengembalikan data spesifik milik NIK yang diminta (nama, nik, office).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// 1. Konfigurasi Path & Konstanta
define('ROOT_DIR', dirname(__DIR__));
define('DATA_DIR', ROOT_DIR . '/data');
define('MASTER_CACHE_FILE', DATA_DIR . '/.master_karyawan_cache.json');
define('RATE_LIMIT_FILE', DATA_DIR . '/.nik_auth_rate.json');
define('CACHE_TTL_SECONDS', 3600); // 1 Jam Cache TTL
define('GAS_WEB_APP_URL', 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec');
define('MASTER_ADMIN_KEY', 'NSR_HR_MASTER_KEY_2026');

// Pastikan direktori data aman
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

// 2. Rate Limiting Sederhana (Maks 30 request / menit per IP)
function cekRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    if ($ip === 'UNKNOWN' || $ip === '127.0.0.1' || $ip === '::1') return true;

    $now = time();
    $rateData = [];
    if (file_exists(RATE_LIMIT_FILE)) {
        $raw = @file_get_contents(RATE_LIMIT_FILE);
        $rateData = json_decode($raw, true) ?: [];
    }

    // Bersihkan entri kedaluwarsa (> 60 detik)
    foreach ($rateData as $k => $v) {
        if ($now - ($v['start'] ?? 0) > 60) {
            unset($rateData[$k]);
        }
    }

    if (!isset($rateData[$ip])) {
        $rateData[$ip] = ['count' => 1, 'start' => $now];
    } else {
        $rateData[$ip]['count']++;
        if ($rateData[$ip]['count'] > 30) {
            @file_put_contents(RATE_LIMIT_FILE, json_encode($rateData), LOCK_EX);
            return false;
        }
    }

    @file_put_contents(RATE_LIMIT_FILE, json_encode($rateData), LOCK_EX);
    return true;
}

if (!cekRateLimit()) {
    http_response_code(429);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Terlalu banyak permintaan verifikasi. Harap tunggu 1 menit.'
    ]);
    exit;
}

// 3. Helper Komunikasi ke Google Apps Script (cURL dengan Redirect Follow)
function fetchMasterFromGAS($timeout = 10) {
    $url = GAS_WEB_APP_URL;
    $postData = json_encode(['action' => 'getMasterKaryawanFull'], JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain;charset=utf-8']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_AUTOREFERER, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($res && !$err) {
            $json = json_decode($res, true);
            if (is_array($json) && !empty($json['success']) && !empty($json['rows'])) {
                return parseGASRowsToRoster($json);
            }
        }
    }

    // Fallback file_get_contents
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: text/plain;charset=utf-8\r\n",
            'content' => $postData,
            'timeout' => $timeout,
            'follow_location' => 1
        ]
    ];
    $ctx = stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res) {
        $json = json_decode($res, true);
        if (is_array($json) && !empty($json['success']) && !empty($json['rows'])) {
            return parseGASRowsToRoster($json);
        }
    }

    return null;
}

function parseGASRowsToRoster($res) {
    $headers = array_map(function($h) { return strtoupper(trim((string)$h)); }, $res['headers'] ?? []);
    $colNik = -1; $colNama = -1; $colJabatan = -1; $colDivisi = -1; $colStatus = -1;
    $colAlamatWfh = -1; $colGpsWfh = -1; $colTglWfh = -1; $colEmail = -1;

    foreach ($headers as $idx => $h) {
        if ($h === 'NIK') $colNik = $idx;
        else if ($h === 'NAMA' || $h === 'NAMA KARYAWAN') $colNama = $idx;
        else if ($h === 'JABATAN') $colJabatan = $idx;
        else if ($h === 'DIVISI') $colDivisi = $idx;
        else if ($h === 'STATUS') $colStatus = $idx;
        else if (strpos($h, 'ALAMAT') !== false) $colAlamatWfh = $idx;
        else if (strpos($h, 'GPS') !== false) $colGpsWfh = $idx;
        else if (strpos($h, 'TANGGAL') !== false || strpos($h, 'REGISTRASI') !== false) $colTglWfh = $idx;
        else if ($h === 'EMAIL' || strpos($h, 'EMAIL') !== false) $colEmail = $idx;
    }

    if ($colNik === -1 || $colNama === -1) {
        $colNik = 0; $colNama = 1; $colJabatan = 2; $colDivisi = 3; $colStatus = 4;
        $colAlamatWfh = 5; $colGpsWfh = 6; $colTglWfh = 7; $colEmail = 8;
    }

    $roster = [];
    foreach ($res['rows'] as $r) {
        $nik = trim((string)($r[$colNik] ?? ''));
        if (empty($nik)) continue;
        $roster[] = [
            'nik' => strtoupper($nik),
            'nama' => trim((string)($r[$colNama] ?? '')),
            'jabatan' => trim((string)($r[$colJabatan] ?? '')),
            'divisi' => trim((string)($r[$colDivisi] ?? '')),
            'cabang' => 'Pusat Jakarta',
            'office' => 'Pusat Jakarta',
            'status' => strtoupper(trim((string)($r[$colStatus] ?? 'AKTIF'))),
            'alamat_wfh' => trim((string)($r[$colAlamatWfh] ?? '')),
            'gps_wfh' => trim((string)($r[$colGpsWfh] ?? '')),
            'tgl_reg_wfh' => trim((string)($r[$colTglWfh] ?? '')),
            'email' => trim((string)($r[$colEmail] ?? ''))
        ];
    }

    if (!empty($roster)) {
        $cacheData = [
            'source' => $res['spreadsheetTitle'] ?? 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
            'sheet_name' => $res['sheetName'] ?? 'MASTER_KARYAWAN',
            'last_synced' => date('Y-m-d H:i:s'),
            'synced_timestamp' => time(),
            'total_karyawan' => count($roster),
            'roster' => $roster
        ];
        @file_put_contents(MASTER_CACHE_FILE, json_encode($cacheData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $roster;
    }
    return null;
}

// 4. Pengelolaan Cache Master Karyawan
function dapatkanRosterMaster($forceSync = false) {
    if (!$forceSync && file_exists(MASTER_CACHE_FILE)) {
        $raw = @file_get_contents(MASTER_CACHE_FILE);
        $cache = json_decode($raw, true);
        if (is_array($cache) && !empty($cache['roster']) && is_array($cache['roster'])) {
            $syncedAt = isset($cache['synced_timestamp']) ? $cache['synced_timestamp'] : (filemtime(MASTER_CACHE_FILE) ?: 0);
            if ((time() - $syncedAt) < CACHE_TTL_SECONDS) {
                return $cache['roster'];
            }
        }
    }

    // Ambil dari Google Apps Script jika cache kedaluwarsa atau belum ada
    $fresh = fetchMasterFromGAS(8);
    if ($fresh !== null) {
        return $fresh;
    }

    // Jika GAS gagal/timeout, fallback ke cache yang ada
    if (file_exists(MASTER_CACHE_FILE)) {
        $raw = @file_get_contents(MASTER_CACHE_FILE);
        $cache = json_decode($raw, true);
        if (is_array($cache) && !empty($cache['roster'])) {
            return $cache['roster'];
        }
    }

    return [];
}

// 5. Normalisasi & Validasi Format NIK
function bersihkanNIK($nik) {
    if (!$nik || !is_string($nik)) return '';
    return strtoupper(trim(preg_replace('/\s+/', '', $nik)));
}

// 6. Tangani Request GET Khusus Admin Sync
if (empty($_GET) && !empty($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $_GET);
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $syncKey = $_GET['key'] ?? $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
    if (isset($_GET['sync']) && $syncKey === MASTER_ADMIN_KEY) {
        $roster = dapatkanRosterMaster(true);

        // 1. Pembersihan berkas sementara sesi OTP di server (data/.otp_storage/*)
        $otpDir = DATA_DIR . '/.otp_storage';
        $cleanedOtp = 0;
        if (is_dir($otpDir)) {
            $files = glob($otpDir . '/*.json');
            if ($files) {
                foreach ($files as $f) {
                    if (is_file($f)) {
                        @unlink($f);
                        $cleanedOtp++;
                    }
                }
            }
        }

        // 2. Pembersihan cache rekaman presensi lama jika ada
        if (file_exists(DATA_DIR . '/.absensi_records_cache.json')) {
            @unlink(DATA_DIR . '/.absensi_records_cache.json');
        }

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Sinkronisasi master Google Sheets berhasil diperbarui dan sesi OTP lama dibersihkan.',
            'total_karyawan' => count($roster),
            'otp_sessions_cleaned' => $cleanedOtp,
            'synced_at' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Metode HTTP tidak diizinkan. Gunakan POST untuk verifikasi NIK.'
    ]);
    exit;
}

// 7. Proses Request POST Verifikasi NIK
$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    $rawInput = @file_get_contents('php://stdin');
}
$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    $payload = $_POST;
}
if (!is_array($payload) || empty($payload)) {
    $payload = $_REQUEST;
}

$inputNik = $payload['nik'] ?? '';
$cleanNik = bersihkanNIK($inputNik);

if (empty($cleanNik)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Parameter NIK wajib diisi. Contoh: NSR-2019-005'
    ]);
    exit;
}

// Validasi Pola Format NIK Resmi NSR
if (!preg_match('/^NSR[-_]?\d{4}[-_]?\d{3}$/i', $cleanNik) && !preg_match('/^NSR-\d{4}-\d{3}$/i', $cleanNik)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Format NIK tidak valid. Format resmi KJPP NSR: NSR-[tahun masuk]-[nomor urut] (Contoh: NSR-2019-005).'
    ]);
    exit;
}

// Normalisasi pemisah tanda strip: NSR2019005 -> NSR-2019-005
if (preg_match('/^NSR(\d{4})(\d{3})$/i', $cleanNik, $m)) {
    $cleanNik = 'NSR-' . $m[1] . '-' . $m[2];
}

$roster = dapatkanRosterMaster(false);
$found = null;

foreach ($roster as $k) {
    $kNik = bersihkanNIK($k['nik'] ?? '');
    if ($kNik === $cleanNik) {
        $found = $k;
        break;
    }
}

if (!$found) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => "NIK [{$cleanNik}] tidak terdaftar dalam database master resmi KJPP NSR."
    ]);
    exit;
}

// Periksa Status Keaktifan Karyawan
$status = strtoupper($found['status'] ?? 'AKTIF');
if ($status === 'NONAKTIF' || $status === 'RESIGN' || $status === 'MUTASI_KELUAR') {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => "NIK [{$cleanNik}] berstatus non-aktif. Silakan hubungi bagian Administrasi SDM."
    ]);
    exit;
}

// Output Aman: Zero-Exposure (Hanya mengembalikan data milik karyawan terkait)
echo json_encode([
    'status' => 'success',
    'success' => true,
    'message' => 'NIK Karyawan terdaftar dan valid.',
    'data' => [
        'nik' => $found['nik'],
        'nama' => $found['nama'],
        'office' => $found['cabang'] ?? $found['office'] ?? 'Pusat Jakarta',
        'cabang' => $found['cabang'] ?? $found['office'] ?? 'Pusat Jakarta',
        'jabatan' => $found['jabatan'] ?? '-',
        'divisi' => $found['divisi'] ?? '-'
    ]
], JSON_UNESCAPED_UNICODE);
exit;
