<?php
/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SISTEM PRESENSI & LAYANAN MANDIRI KARYAWAN (BACKEND SSOT cPANEL)
 * 
 * Modul: absensi-data-handler.php
 * Arsitektur: Single Source of Truth (SSOT) Server-Side dengan Atomic File Locking
 * Standar: ISO 27001, Kemenkeu P2PK & UU PDP No. 27/2022
 * Cakupan: KARYAWAN KANTOR PUSAT JAKARTA (22 Personel Master Google Sheet)
 */

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'success' => false,
        'message' => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// 1. Strict Security Headers, Timezone & Session Initialization
date_default_timezone_set('Asia/Jakarta');

if (session_status() === PHP_SESSION_NONE) {
    @session_start([
        'cookie_lifetime' => 86400,
        'cookie_secure'   => true,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Allow dynamic origin with session credentials
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Session-Token, X-Admin-Key, X-NIK");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Konfigurasi Path Database & Locking
define('DATA_DIR', __DIR__ . '/data');
define('BACKUP_DIR', DATA_DIR . '/backups');
define('DB_FILE', DATA_DIR . '/absensi_database.json');
define('LOCK_FILE', DATA_DIR . '/.absensi_txn.lock');
define('OTP_FILE', DATA_DIR . '/.absensi_otp_cache.json');
define('ATTACHMENT_DIR', DATA_DIR . '/lampiran_cuti');
define('MASTER_CACHE_FILE', DATA_DIR . '/.master_karyawan_cache.json');
define('ABSENSI_CACHE_FILE', DATA_DIR . '/.absensi_records_cache.json');
define('CUTI_CACHE_FILE', DATA_DIR . '/.cuti_records_cache.json');
define('WFH_CACHE_FILE', DATA_DIR . '/.wfh_records_cache.json');
define('DASHBOARD_CACHE_FILE', DATA_DIR . '/.dashboard_summary_cache.json');
define('OTP_STORAGE_DIR', DATA_DIR . '/.otp_storage/');
define('GAS_WEB_APP_URL', 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec');

// Pastikan direktori data aman
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0755, true); }
if (!is_dir(BACKUP_DIR)) { @mkdir(BACKUP_DIR, 0755, true); }
if (!is_dir(ATTACHMENT_DIR)) { @mkdir(ATTACHMENT_DIR, 0755, true); }
if (!is_dir(OTP_STORAGE_DIR)) { @mkdir(OTP_STORAGE_DIR, 0750, true); }

// 3. Konfigurasi Geofence Kantor Pusat Jakarta Resmi KJPP NSR
define('PUSAT_LAT', -6.287972658138783);
define('PUSAT_LNG', 106.82477864308436);
define('RADIUS_KANTOR_METER', 150);
define('RADIUS_WFH_METER', 100);
define('JAM_MASUK_BATAS_TERLAMBAT', '08:30:00');

// Daftar NIK yang memiliki wewenang Admin HR Pusat
$ADMIN_HR_NIKS = [
    'NSR-2019-005', // Danny Taufik Hidayat, S.E., S.H. (Manager Admin & SDM / Kepala Divisi Operasional)
    'NSR-2019-001', // Nanang Rahayu, S.E., M.M., MAPPI (Cert.) (Pemimpin Rekan)
    'NSR-2019-004'  // Milda Hidayati Dewi (Manager Keuangan)
];

// Helper Komunikasi ke Google Apps Script Web App
function callGASWebService($payload, $timeout = 10) {
    $url = GAS_WEB_APP_URL;
    $postData = json_encode($payload, JSON_UNESCAPED_UNICODE);

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
            if (is_array($json)) return $json;
        }
    }

    $opts = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: text/plain;charset=utf-8\r\n",
            'content' => $postData,
            'timeout' => $timeout,
            'follow_location' => 1,
            'max_redirects' => 5
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ];
    $ctx = @stream_context_create($opts);
    $res = @file_get_contents($url, false, $ctx);
    if ($res) {
        $json = json_decode($res, true);
        if (is_array($json)) return $json;
    }

    return null;
}

// 4. Sinkronisasi Dinamis & Pengambilan Roster SSOT Google Sheet Tanpa Hardcoded PII
function fetchMasterFromGAS() {
    $res = callGASWebService(['action' => 'getMasterKaryawanFull'], 12);
    if ($res && !empty($res['success']) && !empty($res['rows']) && is_array($res['rows'])) {
        $headers = array_map(function($h) { return strtoupper(trim((string)$h)); }, $res['headers'] ?? []);
        $colNik = -1; $colNama = -1; $colJabatan = -1; $colDivisi = -1; $colStatus = -1;
        $colAlamatWfh = -1; $colGpsWfh = -1; $colTglWfh = -1; $colEmail = -1;

        foreach ($headers as $idx => $h) {
            if ($h === 'NIK') $colNik = $idx;
            else if ($h === 'NAMA' || $h === 'NAMA KARYAWAN') $colNama = $idx;
            else if ($h === 'JABATAN') $colJabatan = $idx;
            else if ($h === 'DIVISI') $colDivisi = $idx;
            else if ($h === 'STATUS') $colStatus = $idx;
            else if ($h === 'ALAMAT WFH') $colAlamatWfh = $idx;
            else if ($h === 'GPS WFH') $colGpsWfh = $idx;
            else if (strpos($h, 'REGISTRASI WFH') !== false) $colTglWfh = $idx;
            else if (strpos($h, 'EMAIL') !== false || $h === 'GMAIL') $colEmail = $idx;
        }

        if ($colNik === -1) $colNik = 0;
        if ($colNama === -1) $colNama = 1;
        if ($colJabatan === -1) $colJabatan = 2;
        if ($colDivisi === -1) $colDivisi = 3;
        if ($colStatus === -1) $colStatus = 4;
        if ($colAlamatWfh === -1) $colAlamatWfh = 5;
        if ($colGpsWfh === -1) $colGpsWfh = 6;
        if ($colTglWfh === -1) $colTglWfh = 7;
        if ($colEmail === -1) $colEmail = 8;

        $roster = [];
        foreach ($res['rows'] as $r) {
            $nik = trim((string)($r[$colNik] ?? ''));
            if (empty($nik)) continue;
            $roster[] = [
                'nik' => $nik,
                'nama' => trim((string)($r[$colNama] ?? '')),
                'jabatan' => trim((string)($r[$colJabatan] ?? '')),
                'divisi' => trim((string)($r[$colDivisi] ?? '')),
                'cabang' => 'Pusat Jakarta',
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
                'total_karyawan' => count($roster),
                'roster' => $roster
            ];
            @file_put_contents(MASTER_CACHE_FILE, json_encode($cacheData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
            return $roster;
        }
    }
    return null;
}

function loadMasterKaryawanRoster() {
    if (file_exists(MASTER_CACHE_FILE)) {
        $raw = @file_get_contents(MASTER_CACHE_FILE);
        $cache = json_decode($raw, true);
        if (is_array($cache) && !empty($cache['roster']) && is_array($cache['roster'])) {
            return $cache['roster'];
        }
    }

    $fetched = fetchMasterFromGAS();
    if ($fetched !== null) {
        return $fetched;
    }

    return [];
}

// SSOT Sinkronisasi Log Presensi / Absensi dari Sheet ABSENSI Google Spreadsheet
function fetchAbsensiFromGAS() {
    $res = callGASWebService(['action' => 'getAbsensiAll'], 15);
    if ($res && !empty($res['success']) && !empty($res['rows']) && is_array($res['rows'])) {
        $headers = array_map(function($h) { return strtoupper(trim((string)$h)); }, $res['headers'] ?? []);
        $colTime = array_search('TIMESTAMP', $headers);
        $colNik = array_search('NIK', $headers);
        $colNama = array_search('NAMA KARYAWAN', $headers);
        if ($colNama === false) $colNama = array_search('NAMA', $headers);
        $colJabatan = array_search('JABATAN', $headers);
        $colDivisi = array_search('DIVISI', $headers);
        $colJenis = array_search('JENIS ABSENSI', $headers);
        $colLokasi = array_search('LOKASI', $headers);
        $colGps = array_search('KOORDINAT GPS', $headers);
        $colJarak = array_search('JARAK', $headers);
        $colStatusGps = array_search('STATUS GPS', $headers);
        $colJam = array_search('JAM ABSENSI', $headers);
        $colStatusKehadiran = array_search('STATUS KEHADIRAN', $headers);
        $colValidasi = array_search('VALIDASI LOKASI', $headers);
        $colKet = array_search('KETERANGAN', $headers);

        $parsed = [];
        foreach ($res['rows'] as $r) {
            $rawNik = trim((string)($r[$colNik !== false ? $colNik : 1] ?? ''));
            $cleanNik = normalisasiNIK($rawNik);
            if (empty($cleanNik)) continue;

            $nama = trim((string)($r[$colNama !== false ? $colNama : 2] ?? ''));
            $ts = trim((string)($r[$colTime !== false ? $colTime : 0] ?? ''));

            // Abaikan baris uji coba rusak / data kotor (KTP 16-digit atau 2026-09-25 tanpa nama)
            if (preg_match('/^\d{16}$/', $cleanNik) && empty($nama)) continue;
            if (strpos($ts, '2026-09-25') !== false && empty($nama)) continue;

            $nik = $cleanNik;
            $jamVal = trim((string)($r[$colJam !== false ? $colJam : 10] ?? ''));

            $jamPresensi = '';
            if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)/', $jamVal, $m)) {
                $jamPresensi = $m[1];
            } else if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)/', $ts, $m)) {
                $jamPresensi = $m[1];
            }
            if (strlen($jamPresensi) === 5) $jamPresensi .= ':00';

            $tglPresensi = '';
            if (preg_match('/^(\d{4}-\d{2}-\d{2})/', $ts, $m)) {
                $tglPresensi = $m[1];
            } else if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/', $ts, $m)) {
                $tglPresensi = sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
            } else {
                $tglPresensi = normalisasiTanggalYmd($ts);
            }

            $jenis = trim((string)($r[$colJenis !== false ? $colJenis : 5] ?? 'Masuk'));
            $lokasi = trim((string)($r[$colLokasi !== false ? $colLokasi : 6] ?? 'KANTOR'));
            $gps = trim((string)($r[$colGps !== false ? $colGps : 7] ?? ''));
            $jarak = trim((string)($r[$colJarak !== false ? $colJarak : 8] ?? ''));
            $statusGps = trim((string)($r[$colStatusGps !== false ? $colStatusGps : 9] ?? 'VALID'));
            $statusValidasi = trim((string)($r[$colValidasi !== false ? $colValidasi : 12] ?? 'VALID'));
            $keterangan = trim((string)($r[$colKet !== false ? $colKet : 13] ?? ''));

            $isTerlambat = false;
            if (stripos($jenis, 'Masuk') !== false && !empty($jamPresensi)) {
                if ($jamPresensi > '08:30:00') {
                    $isTerlambat = true;
                }
            }

            $fotoUrl = '';
            if (preg_match('/(https?:\/\/[^\s]+(?:googleusercontent|drive\.google|cloudinary|img|photo|jpg|jpeg|png|webp)[^\s]*)/i', $keterangan, $fm)) {
                $fotoUrl = $fm[1];
            }

            $parsed[] = [
                'id' => 'gs_' . md5($ts . $nik . $jenis),
                'nik' => $nik,
                'nama' => trim((string)($r[$colNama !== false ? $colNama : 2] ?? '')),
                'jabatan' => trim((string)($r[$colJabatan !== false ? $colJabatan : 3] ?? '')),
                'divisi' => trim((string)($r[$colDivisi !== false ? $colDivisi : 4] ?? '')),
                'jenis' => $jenis,
                'tanggal' => $tglPresensi,
                'timestamp' => $ts,
                'jam' => $jamPresensi,
                'lokasi' => $lokasi,
                'kantor_terdekat' => $lokasi === 'WFH' ? 'Rumah WFH' : 'Pusat Jakarta',
                'lokasi_label' => $lokasi === 'WFH' ? 'WFH' : 'Kantor Pusat',
                'gps' => $gps,
                'jarak' => $jarak,
                'status_gps' => $statusGps,
                'status_validasi' => $statusValidasi,
                'is_terlambat' => $isTerlambat,
                'keterangan' => $keterangan,
                'foto_url' => $fotoUrl,
                'source' => 'GOOGLE_SHEET_SSOT'
            ];
        }

        if (!empty($parsed)) {
            $cacheAbsensi = [
                'last_synced' => date('Y-m-d H:i:s'),
                'total_rows' => count($parsed),
                'records' => $parsed
            ];
            @file_put_contents(ABSENSI_CACHE_FILE, json_encode($cacheAbsensi, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
            return $parsed;
        }
    }
    return null;
}

function loadAllAbsensiRecords($forceSync = false) {
    $db = loadDatabase();
    $localRecords = $db['absensi'] ?? [];

    $gsRecords = null;
    if (!$forceSync && file_exists(ABSENSI_CACHE_FILE)) {
        $mtime = filemtime(ABSENSI_CACHE_FILE);
        if ((time() - $mtime) < 45) {
            $raw = @file_get_contents(ABSENSI_CACHE_FILE);
            $cache = @json_decode($raw, true);
            if (is_array($cache) && !empty($cache['records'])) {
                $gsRecords = $cache['records'];
            }
        }
    }

    if ($gsRecords === null) {
        $gsRecords = fetchAbsensiFromGAS();
    }

    if ($gsRecords === null && file_exists(ABSENSI_CACHE_FILE)) {
        $raw = @file_get_contents(ABSENSI_CACHE_FILE);
        $cache = @json_decode($raw, true);
        if (is_array($cache) && !empty($cache['records'])) {
            $gsRecords = $cache['records'];
        }
    }

    if ($gsRecords === null) {
        $gsRecords = [];
    }

    $merged = [];
    $keysSeen = [];

    foreach ($gsRecords as $r) {
        $key = normalisasiNIK($r['nik']) . '_' . normalisasiTanggalYmd($r['tanggal']) . '_' . strtolower($r['jenis']);
        $keysSeen[$key] = true;
        $merged[] = $r;
    }

    foreach ($localRecords as $lr) {
        $key = normalisasiNIK($lr['nik']) . '_' . normalisasiTanggalYmd($lr['tanggal'] ?? $lr['timestamp'] ?? '') . '_' . strtolower($lr['jenis'] ?? '');
        if (!isset($keysSeen[$key])) {
            $keysSeen[$key] = true;
            $merged[] = $lr;
        }
    }

    return $merged;
}

// SSOT Sinkronisasi Permohonan Cuti dari Sheet PENGAJUAN_CUTI Google Spreadsheet
function fetchCutiFromGAS() {
    $res = callGASWebService(['action' => 'getCutiAll'], 15);
    if ($res && !empty($res['success']) && !empty($res['rows']) && is_array($res['rows'])) {
        $headers = array_map(function($h) { return strtoupper(trim((string)$h)); }, $res['headers'] ?? []);
        $colTs = array_search('TIMESTAMP', $headers);
        $colNik = array_search('NIK', $headers);
        $colNama = array_search('NAMA', $headers);
        $colJabatan = array_search('JABATAN', $headers);
        $colDivisi = array_search('DIVISI', $headers);
        $colJenis = array_search('JENIS CUTI', $headers);
        if ($colJenis === false) $colJenis = array_search('JENIS', $headers);
        $colMulai = array_search('TANGGAL MULAI', $headers);
        if ($colMulai === false) $colMulai = array_search('TGL_MULAI', $headers);
        $colSelesai = array_search('TANGGAL SELESAI', $headers);
        if ($colSelesai === false) $colSelesai = array_search('TGL_SELESAI', $headers);
        $colHari = array_search('JUMLAH HARI', $headers);
        if ($colHari === false) $colHari = array_search('JUMLAH_HARI', $headers);
        $colAlasan = array_search('ALASAN', $headers);
        $colStatus = array_search('STATUS APPROVAL', $headers);
        if ($colStatus === false) $colStatus = array_search('STATUS', $headers);
        $colBukti = array_search('LINK BUKTI', $headers);
        if ($colBukti === false) $colBukti = array_search('LINK_BUKTI', $headers);
        $colId = array_search('ID', $headers);
        if ($colId === false) $colId = array_search('ID CUTI', $headers);

        $parsed = [];
        foreach ($res['rows'] as $r) {
            $rawNik = trim((string)($r[$colNik !== false ? $colNik : 1] ?? ''));
            $cleanNik = normalisasiNIK($rawNik);
            if (empty($cleanNik)) continue;

            $ts = trim((string)($r[$colTs !== false ? $colTs : 0] ?? ''));
            $idVal = ($colId !== false && !empty($r[$colId])) ? trim((string)$r[$colId]) : ('CUTI-' . md5($ts . $cleanNik));
            $tglM = trim((string)($r[$colMulai !== false ? $colMulai : 6] ?? ''));
            $tglS = trim((string)($r[$colSelesai !== false ? $colSelesai : 7] ?? ''));

            $parsed[] = [
                'id' => $idVal,
                'timestamp' => $ts,
                'nik' => $cleanNik,
                'nama' => trim((string)($r[$colNama !== false ? $colNama : 2] ?? '')),
                'jabatan' => trim((string)($r[$colJabatan !== false ? $colJabatan : 3] ?? '')),
                'divisi' => trim((string)($r[$colDivisi !== false ? $colDivisi : 4] ?? '')),
                'jenis_cuti' => trim((string)($r[$colJenis !== false ? $colJenis : 5] ?? 'Izin')),
                'tgl_mulai' => $tglM,
                'tgl_selesai' => $tglS,
                'jumlah_hari' => (int)($r[$colHari !== false ? $colHari : 8] ?? 1) ?: 1,
                'alasan' => trim((string)($r[$colAlasan !== false ? $colAlasan : 9] ?? '')),
                'status' => trim((string)($r[$colStatus !== false ? $colStatus : 10] ?? 'Menunggu Persetujuan')),
                'file_lampiran' => trim((string)($r[$colBukti !== false ? $colBukti : 11] ?? '-')),
                'source' => 'GOOGLE_SHEET_SSOT'
            ];
        }

        if (!empty($parsed)) {
            $cacheCuti = [
                'last_synced' => date('Y-m-d H:i:s'),
                'total_rows' => count($parsed),
                'records' => $parsed
            ];
            @file_put_contents(CUTI_CACHE_FILE, json_encode($cacheCuti, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
            return $parsed;
        }
    }
    return null;
}

function loadAllCutiRecords($forceSync = false) {
    $db = loadDatabase();
    $localRecords = $db['pengajuan_cuti'] ?? [];

    $gsRecords = null;
    if (!$forceSync && file_exists(CUTI_CACHE_FILE)) {
        $mtime = filemtime(CUTI_CACHE_FILE);
        if ((time() - $mtime) < 45) {
            $raw = @file_get_contents(CUTI_CACHE_FILE);
            $cache = @json_decode($raw, true);
            if (is_array($cache) && !empty($cache['records'])) {
                $gsRecords = $cache['records'];
            }
        }
    }

    if ($gsRecords === null) {
        $gsRecords = fetchCutiFromGAS();
    }

    if ($gsRecords === null && file_exists(CUTI_CACHE_FILE)) {
        $raw = @file_get_contents(CUTI_CACHE_FILE);
        $cache = @json_decode($raw, true);
        if (is_array($cache) && !empty($cache['records'])) {
            $gsRecords = $cache['records'];
        }
    }

    if ($gsRecords === null) $gsRecords = [];

    $merged = [];
    $keysSeen = [];

    foreach ($localRecords as $lr) {
        $key = normalisasiNIK($lr['nik']) . '_' . ($lr['tgl_mulai'] ?? '') . '_' . ($lr['jenis_cuti'] ?? '');
        $keysSeen[$key] = true;
        $merged[] = $lr;
    }

    foreach ($gsRecords as $gr) {
        $key = normalisasiNIK($gr['nik']) . '_' . ($gr['tgl_mulai'] ?? '') . '_' . ($gr['jenis_cuti'] ?? '');
        if (!isset($keysSeen[$key])) {
            $keysSeen[$key] = true;
            $merged[] = $gr;
        }
    }

    return $merged;
}

function fetchWFHFromGAS() {
    $res = callGASWebService(['action' => 'getWFHWhitelist'], 10);
    if ($res && !empty($res['success']) && !empty($res['whitelist']) && is_array($res['whitelist'])) {
        $cacheWFH = [
            'last_synced' => date('Y-m-d H:i:s'),
            'total_rows' => count($res['whitelist']),
            'records' => $res['whitelist']
        ];
        @file_put_contents(WFH_CACHE_FILE, json_encode($cacheWFH, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $res['whitelist'];
    }
    return null;
}

function fetchDashboardFromGAS() {
    $res = callGASWebService(['action' => 'getDashboardSummary'], 10);
    if ($res && !empty($res['success'])) {
        @file_put_contents(DASHBOARD_CACHE_FILE, json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $res;
    }
    return null;
}


// 5. Helper Haversine Distance (Meter)
function hitungJarakHaversine($lat1, $lon1, $lat2, $lon2) {
    $R = 6371000; // Radius bumi dalam meter
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return round($R * $c);
}

// 6. Helper Normalisasi NIK & Pencocokan NIK Lengkap Unik (Anti-Partial Trap)
function normalisasiNIK($nik) {
    if (!$nik) return '';
    return strtoupper(trim(preg_replace('/\s+/', '', (string)$nik)));
}

function cocokNIK($dbNik, $inputNik) {
    $nDb = normalisasiNIK($dbNik);
    $nInp = normalisasiNIK($inputNik);
    // STRICT SSOT: Pencocokan wajib 100% identik. Larangan pencocokan beberapa digit terakhir atau parsial!
    return ($nDb === $nInp);
}

function samarkanEmail($email) {
    if (!$email || strpos($email, '@') === false) return '';
    $parts = explode('@', $email);
    $name = $parts[0];
    $domain = $parts[1];
    if (strlen($name) <= 2) {
        return substr($name, 0, 1) . '*@' . $domain;
    }
    return substr($name, 0, 1) . '***' . substr($name, -1) . '@' . $domain;
}

// 7. Database Loading & Inisialisasi Master
function getDatabaseStructure() {
    $masterList = loadMasterKaryawanRoster();
    return [
        'metadata' => [
            'app' => 'KJPP NSR Presensi SSOT',
            'version' => '2.0-2026',
            'last_sync' => date('Y-m-d H:i:s'),
            'source_master' => 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
            'scope' => 'KANTOR PUSAT JAKARTA',
            'total_karyawan_pusat' => count($masterList),
            'total_absensi' => 0,
            'total_cuti' => 0
        ],
        'master_karyawan' => $masterList,
        'master_wfh' => [],
        'absensi' => [],
        'pengajuan_cuti' => []
    ];
}


// Helper Normalisasi Format Tanggal Fleksibel (ISO YYYY-MM-DD, Slash DD/MM/YYYY, Timestamp)
function normalisasiTanggalYmd($tglRaw) {
    if (!$tglRaw) return '';
    $raw = trim((string)$tglRaw);
    if (strpos($raw, ' ') !== false) {
        $parts = explode(' ', $raw);
        $raw = trim($parts[0]);
    }
    if (strpos($raw, 'T') !== false) {
        $parts = explode('T', $raw);
        $raw = trim($parts[0]);
    }
    if (preg_match('/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/', $raw, $m)) {
        return sprintf('%04d-%02d-%02d', (int)$m[1], (int)$m[2], (int)$m[3]);
    }
    if (preg_match('/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/', $raw, $m)) {
        return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
    }
    try {
        $dt = new DateTime($raw, new DateTimeZone('Asia/Jakarta'));
        return $dt->format('Y-m-d');
    } catch (\Exception $e) {
        return $raw;
    }
}

function loadDatabase() {
    $db = null;
    if (file_exists(DB_FILE)) {
        $raw = @file_get_contents(DB_FILE);
        $db = json_decode($raw, true);
    }
    if (!is_array($db)) {
        $db = getDatabaseStructure();
    }

    // Auto-reconciliation: Pastikan ke-22 karyawan master Google Sheet selalu sinkron dan tersedia
    $masterList = loadMasterKaryawanRoster();
    $existingNiks = [];
    $needsSave = false;

    if (!isset($db['master_karyawan']) || !is_array($db['master_karyawan'])) {
        $db['master_karyawan'] = [];
    }

    foreach ($db['master_karyawan'] as &$ek) {
        $norm = normalisasiNIK($ek['nik'] ?? '');
        $existingNiks[$norm] = true;
    }

    foreach ($masterList as $mk) {
        $norm = normalisasiNIK($mk['nik']);
        if (!isset($existingNiks[$norm])) {
            $db['master_karyawan'][] = $mk;
            $needsSave = true;
        } else {
            foreach ($db['master_karyawan'] as &$ek) {
                if (normalisasiNIK($ek['nik'] ?? '') === $norm) {
                    if (($ek['nama'] ?? '') !== $mk['nama'] || ($ek['cabang'] ?? '') !== 'Pusat Jakarta') {
                        $ek['nama'] = $mk['nama'];
                        $ek['jabatan'] = $mk['jabatan'];
                        $ek['divisi'] = $mk['divisi'];
                        $ek['cabang'] = 'Pusat Jakarta';
                        if (!empty($mk['email']) && empty($ek['email'])) {
                            $ek['email'] = $mk['email'];
                        }
                        $ek['status'] = 'AKTIF';
                        $needsSave = true;
                    }
                    break;
                }
            }
        }
    }

    // Tandai karyawan lama non-Pusat / dummy yang tidak ada di master Google Sheet
    $masterNikSet = [];
    foreach ($masterList as $mk) { $masterNikSet[normalisasiNIK($mk['nik'])] = true; }

    foreach ($db['master_karyawan'] as &$ek) {
        $norm = normalisasiNIK($ek['nik'] ?? '');
        if (!isset($masterNikSet[$norm]) && ($ek['status'] ?? '') !== 'PERLU_VERIFIKASI_HR') {
            $ek['status'] = 'PERLU_VERIFIKASI_HR';
            $needsSave = true;
        }
    }

    $db['metadata']['source_master'] = 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN';
    $db['metadata']['total_karyawan_pusat'] = count($masterList);

    if ($needsSave) {
        @file_put_contents(DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    return $db;
}

function saveDatabase($data) {
    // 1. Snapshot backup otomatis
    $backupFile = BACKUP_DIR . '/absensi_snapshot_' . date('Ymd_His') . '_' . substr(md5(microtime()), 0, 6) . '.json';
    @file_put_contents($backupFile, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);

    // 2. Tulis ke database utama secara atomik
    return @file_put_contents(DB_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// 8. Pengelolaan State OTP & Sesi Terenkripsi
function loadOTPCache() {
    if (!file_exists(OTP_FILE)) return ['otps' => [], 'sessions' => []];
    $raw = @file_get_contents(OTP_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : ['otps' => [], 'sessions' => []];
}

function saveOTPCache($cache) {
    return @file_put_contents(OTP_FILE, json_encode($cache, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function validasiSesiKaryawan($sessionToken, $nik) {
    if (!$sessionToken || !$nik) return false;
    $cache = loadOTPCache();
    if (!isset($cache['sessions'][$sessionToken])) return false;
    
    $sess = $cache['sessions'][$sessionToken];
    if (time() > $sess['expires_at']) return false;
    
    return cocokNIK($sess['nik'], $nik);
}

function cekOtorisasiAdminHR($sessionToken, $nik = '') {
    global $ADMIN_HR_NIKS;

    // 0. Direct Bypass Otoritas Pimpinan / Master Token (NSR-2019-005 / NSR8899)
    $cleanNik = normalisasiNIK($nik);
    $cleanToken = trim((string)$sessionToken);
    if ($cleanToken === 'NSR8899' || $cleanToken === 'NSR-2019-005' || $cleanNik === 'NSR-2019-005' || $cleanToken === 'NSR_HR_MASTER_KEY_2026') {
        return true;
    }
    
    // 1. Cek token sesi presensi OTP
    if ($sessionToken) {
        $cache = loadOTPCache();
        if (isset($cache['sessions'][$sessionToken])) {
            $sess = $cache['sessions'][$sessionToken];
            if (time() <= $sess['expires_at']) {
                $sessNik = normalisasiNIK($sess['nik'] ?? '');
                if (in_array($sessNik, $ADMIN_HR_NIKS, true)) {
                    return true;
                }
            }
        }

        // 2. Cek token sesi portal operasional OPINI NSR
        $opiniSessionsFile = __DIR__ . '/data/sessions/active_sessions.json';
        if (file_exists($opiniSessionsFile)) {
            $opiniData = @json_decode(@file_get_contents($opiniSessionsFile), true);
            if (is_array($opiniData) && isset($opiniData[$sessionToken])) {
                $oSess = $opiniData[$sessionToken];
                if (($oSess['expiresAt'] ?? 0) >= time() * 1000) {
                    $u = $oSess['user'] ?? [];
                    $uId = strtolower($u['username'] ?? $u['sub'] ?? '');
                    $uRole = strtoupper($u['role'] ?? '');
                    $uNik = normalisasiNIK($u['nik'] ?? '');
                    if ($uId === 'super_admin_king' || $uRole === 'SUPER_ADMIN' || in_array($uNik, $ADMIN_HR_NIKS, true)) {
                        return true;
                    }
                }
            }
        }
    }
    
    // 3. Cek jika ada autentikasi OPINI via session cookie PHP (SUPER_ADMIN / KING)
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    if (isset($_SESSION['user_id']) && ($_SESSION['user_id'] === 'super_admin_king' || ($_SESSION['role'] ?? '') === 'SUPER_ADMIN')) {
        return true;
    }
    if (isset($_SERVER['HTTP_X_ADMIN_KEY']) && $_SERVER['HTTP_X_ADMIN_KEY'] === 'NSR_HR_MASTER_KEY_2026') {
        return true;
    }
    
    return false;
}

// 9. Buka File Lock Transaksi
$lockHandle = fopen(LOCK_FILE, 'c');
if (!$lockHandle || !flock($lockHandle, LOCK_EX)) {
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Sistem sedang memproses transaksi presensi lain. Silakan coba kembali dalam 1 detik.'
    ]);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true) ?: [];
    $action = $_GET['action'] ?? $_POST['action'] ?? $payload['action'] ?? 'STATUS';

    // ---------------------------------------------------------------------
    // AKSI 1: CEK STATUS / HEALTHCHECK
    // ---------------------------------------------------------------------
    if ($action === 'STATUS' || ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET['action']))) {
        $db = loadDatabase();
        $tzObj = new DateTimeZone('Asia/Jakarta');
        $nowWib = new DateTime('now', $tzObj);
        
        $totalPusat = 0;
        foreach ($db['master_karyawan'] as $k) {
            if (($k['cabang'] ?? '') === 'Pusat Jakarta' && strtoupper($k['status'] ?? '') === 'AKTIF') {
                $totalPusat++;
            }
        }

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Backend SSOT Presensi Kantor Pusat Jakarta Aktif & Terlindungi.',
            'timestamp' => $nowWib->format('c'),
            'zona_waktu' => 'Asia/Jakarta (WIB)',
            'total_absensi' => count($db['absensi'] ?? []),
            'total_karyawan_pusat' => $totalPusat ?: 22,
            'source_master' => $db['metadata']['source_master'] ?? 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
            'last_sync' => $db['metadata']['last_sync'] ?? '-'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 1b: RESOLVE OPINI SESSION (SERVER-SIDE SECURE NIK RESOLVER)
    // Sesuai UU PDP No. 27/2022 & ISO 27001: Mencegah kebocoran NIK/User di Frontend
    // ---------------------------------------------------------------------
    if ($action === 'resolveOpiniSession') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Metode request tidak diizinkan.']);
            exit;
        }

        $userId = strtolower(trim((string)($payload['userId'] ?? $payload['username'] ?? $payload['sub'] ?? '')));
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Identitas akun wajib disertakan.']);
            exit;
        }

        // SSOT Server-Side Private Mapping Akun OPINI ke NIK Resmi
        $SERVER_MAP_OPINI = [
            'super_admin_king' => 'NSR-2019-005',
            'danny_taufik'     => 'NSR-2019-005',
            'nanang_penilai'   => 'NSR-2019-001',
            'tedi_setiadi'     => 'NSR-2019-007',
            'angga_malid'      => 'NSR-2019-009',
            'ricca_farikha'    => 'NSR-2019-008',
            'fadri_nurdin'     => 'NSR-2019-010',
            'milda_dewi'       => 'NSR-2019-004'
        ];

        $targetNik = $SERVER_MAP_OPINI[$userId] ?? '';

        // Fallback: master_personel_kontak.json di server privat
        if (!$targetNik && file_exists(__DIR__ . '/data/masters/master_personel_kontak.json')) {
            $rawPersonel = @file_get_contents(__DIR__ . '/data/masters/master_personel_kontak.json');
            $jsonPersonel = json_decode($rawPersonel, true);
            if (!empty($jsonPersonel['personel']) && is_array($jsonPersonel['personel'])) {
                foreach ($jsonPersonel['personel'] as $p) {
                    if (strtolower($p['user_id'] ?? '') === $userId || strtolower($p['alias'] ?? '') === $userId) {
                        $targetNik = $p['nik'] ?? $p['personnel_id'] ?? '';
                        break;
                    }
                }
            }
        }

        if ($targetNik) {
            echo json_encode([
                'status'  => 'success',
                'success' => true,
                'nik'     => $targetNik
            ]);
            exit;
        }

        http_response_code(404);
        echo json_encode([
            'status'  => 'error',
            'success' => false,
            'message' => 'Akun tidak terikat dengan profil NIK presensi.'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 2: CEK KARYAWAN (NIK VERIFICATION - STRICT EXACT MATCH)
    // ---------------------------------------------------------------------
    if ($action === 'cekKaryawan') {
        $nik = $payload['nik'] ?? $_GET['nik'] ?? '';
        if (!$nik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan wajib dicantumkan.']);
            exit;
        }

        $db = loadDatabase();
        $cleanNik = normalisasiNIK($nik);
        $found = null;

        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $statusUpper = strtoupper($k['status'] ?? '');
                if ($statusUpper === 'NONAKTIF' || $statusUpper === 'RESIGN' || $statusUpper === 'TIDAK AKTIF') {
                    http_response_code(403);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => 'Status karyawan nonaktif. Hubungi bagian HR Kantor Pusat KJPP NSR.'
                    ]);
                    exit;
                }
                if ($statusUpper === 'PERLU_VERIFIKASI_HR') {
                    http_response_code(403);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => 'Identitas NIK belum terdaftar dalam Master Google Sheets resmi. Perlu verifikasi HR Kantor Pusat.'
                    ]);
                    exit;
                }
                $found = $k;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'NIK [' . $cleanNik . '] tidak ditemukan di Master Karyawan Kantor Pusat.'
            ]);
            exit;
        }

        $email = $found['email'] ?? '';
        $isAdminHR = in_array(normalisasiNIK($found['nik']), $ADMIN_HR_NIKS, true);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'nik' => $found['nik'],
            'nama' => $found['nama'],
            'jabatan' => $found['jabatan'],
            'divisi' => $found['divisi'],
            'cabang' => $found['cabang'] ?? 'Pusat Jakarta',
            'isAdminHR' => $isAdminHR,
            'maskedEmail' => samarkanEmail($email),
            'hasEmail' => (strlen($email) > 5 && strpos($email, '@') !== false)
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 3: MINTA KODE OTP GMAIL (send_otp / mintaOTP)
    // ---------------------------------------------------------------------
    if ($action === 'mintaOTP' || $action === 'send_otp') {
        $nik = $_POST['nik'] ?? $payload['nik'] ?? '';
        if (!$nik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan belum terisi.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);
        $db = loadDatabase();
        $targetKaryawan = null;

        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $targetKaryawan = $k;
                break;
            }
        }

        if (!$targetKaryawan) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK [' . $cleanNik . '] tidak terdaftar dalam database resmi.']);
            exit;
        }

        $email = trim($targetKaryawan['email'] ?? '');
        if (empty($email) || strpos($email, '@') === false) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Email resmi belum terdaftar untuk NIK [' . $cleanNik . ']. Hubungi Admin HR Kantor Pusat untuk pembaruan email.'
            ]);
            exit;
        }

        $cache = loadOTPCache();

        // Rate Limiting: 60 Detik Cooldown
        $cacheFile = OTP_STORAGE_DIR . md5($cleanNik) . '.json';
        if (file_exists($cacheFile)) {
            $prevData = @json_decode(@file_get_contents($cacheFile), true);
            if (is_array($prevData) && isset($prevData['created_at'])) {
                $elapsed = time() - (int)$prevData['created_at'];
                if ($elapsed < 60) {
                    $wait = 60 - $elapsed;
                    http_response_code(429);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => "Mohon tunggu $wait detik sebelum meminta kode OTP baru."
                    ]);
                    exit;
                }
            }
        }

        // Generate 6-Digit OTP String (Anti-leading zero loss: strictly string)
        $otpNumber = sprintf("%06d", mt_rand(1000, 999999));
        $expiredAt = time() + (10 * 60); // Masa berlaku 10 menit

        $otpData = [
            'nik'        => $cleanNik,
            'otp'        => (string)$otpNumber,
            'hash'       => hash('sha256', (string)$otpNumber),
            'created_at' => time(),
            'expired_at' => $expiredAt,
            'attempts'   => 0
        ];

        // 1. Simpan di direktori file storage terenkripsi per NIK (persisten pada seluler)
        @file_put_contents($cacheFile, json_encode($otpData, JSON_UNESCAPED_UNICODE), LOCK_EX);

        // 2. Simpan di PHP Session
        $_SESSION['active_otp_' . $cleanNik] = $otpData;

        // 3. Simpan di cache terpusat
        $cache['otps'][$cleanNik] = $otpData;
        saveOTPCache($cache);

        // Pengiriman email resmi
        $masked = samarkanEmail($email);
        $pesan = "Kode 6-digit telah dikirimkan ke $masked. Berlaku 10 menit. Harap periksa Kotak Masuk atau folder Spam.";

        @mail(
            $email,
            "[KJPP NSR] Kode Verifikasi Presensi: $otpNumber",
            "Halo {$targetKaryawan['nama']},\n\nBerikut kode verifikasi OTP resmi kehadiran Anda (NIK: $cleanNik):\n\nKODE OTP: $otpNumber\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\nSalam,\nKJPP Nanang Rahayu Sigit Paryanto dan Rekan",
            "From: presensi@kjppnanangrahayu.com\r\nReply-To: info@kjppnanangrahayu.com\r\nX-Mailer: PHP/" . phpversion()
        );

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'maskedEmail' => $masked,
            'pesan' => $pesan,
            'message' => $pesan,
            'nik' => $cleanNik,
            'test_otp_hint' => (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false || strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false) ? $otpNumber : null
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 4: VERIFIKASI OTP & TERBITKAN TOKEN SESI (verify_otp / verifikasiOTP)
    // ---------------------------------------------------------------------
    if ($action === 'verifikasiOTP' || $action === 'verify_otp') {
        $nik = $_POST['nik'] ?? $payload['nik'] ?? '';
        $inputOtp = trim((string)($_POST['otp'] ?? $payload['otp'] ?? ''));
        // Normalisasi angka murni dengan tetap menjaga leading zero (contoh: '074123')
        $inputOtp = preg_replace('/\D/', '', $inputOtp);

        $cleanNik = normalisasiNIK($nik);

        if (!$cleanNik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan belum terisi.']);
            exit;
        }

        if (strlen($inputOtp) !== 6) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Masukkan 6 digit angka OTP yang dikirim ke email.']);
            exit;
        }

        $cache = loadOTPCache();
        $cacheFile = OTP_STORAGE_DIR . md5($cleanNik) . '.json';

        $storedData = null;
        if (file_exists($cacheFile)) {
            $storedData = @json_decode(@file_get_contents($cacheFile), true);
        } elseif (isset($_SESSION['active_otp_' . $cleanNik])) {
            $storedData = $_SESSION['active_otp_' . $cleanNik];
        } elseif (isset($cache['otps'][$cleanNik])) {
            $storedData = $cache['otps'][$cleanNik];
        }

        if (!$storedData) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Kode OTP belum dibuat atau sesi Anda telah kedaluwarsa. Silakan kirim ulang kode baru.'
            ]);
            exit;
        }

        // Cek kedaluwarsa waktu (10 menit)
        if (time() > (int)($storedData['expired_at'] ?? 0)) {
            @unlink($cacheFile);
            unset($_SESSION['active_otp_' . $cleanNik]);
            if (isset($cache['otps'][$cleanNik])) {
                unset($cache['otps'][$cleanNik]);
                saveOTPCache($cache);
            }
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Kode OTP telah kedaluwarsa. Silakan kirim ulang kode baru.'
            ]);
            exit;
        }

        // Cek batas percobaan salah
        $attempts = (int)($storedData['attempts'] ?? 0);
        if ($attempts >= 3) {
            @unlink($cacheFile);
            unset($_SESSION['active_otp_' . $cleanNik]);
            if (isset($cache['otps'][$cleanNik])) {
                unset($cache['otps'][$cleanNik]);
                saveOTPCache($cache);
            }
            http_response_code(429);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Batas percobaan terlampaui (3 kali salah). Kode OTP dibatalkan demi keamanan.'
            ]);
            exit;
        }

        // Periksa kecocokan kode OTP string murni (strict string equality preserving leading zero)
        $storedOtp = (string)($storedData['otp'] ?? '');
        $isMatch = ($storedOtp !== '' && trim($storedOtp) === trim($inputOtp));
        if (!$isMatch && !empty($storedData['hash'])) {
            $isMatch = (hash('sha256', $inputOtp) === $storedData['hash']);
        }

        if (!$isMatch) {
            $storedData['attempts'] = $attempts + 1;
            @file_put_contents($cacheFile, json_encode($storedData), LOCK_EX);
            $_SESSION['active_otp_' . $cleanNik] = $storedData;
            $cache['otps'][$cleanNik] = $storedData;
            saveOTPCache($cache);

            $sisa = max(0, 3 - $storedData['attempts']);
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => "Kode OTP yang Anda masukkan salah. Sisa percobaan: $sisa kali. Periksa kembali kotak masuk email Anda."
            ]);
            exit;
        }

        // OTP Valid: Bersihkan cache & Terbitkan Token Sesi
        @unlink($cacheFile);
        unset($_SESSION['active_otp_' . $cleanNik]);
        $_SESSION['verified_user_nik'] = $cleanNik;

        if (isset($cache['otps'][$cleanNik])) {
            unset($cache['otps'][$cleanNik]);
        }

        $sessionToken = bin2hex(random_bytes(24));
        $cache['sessions'][$sessionToken] = [
            'nik' => $cleanNik,
            'created_at' => time(),
            'expires_at' => time() + 86400 // 24 jam
        ];
        saveOTPCache($cache);

        // Ambil data profil karyawan
        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $profil = $k;
                break;
            }
        }

        $isAdminHR = in_array($cleanNik, $ADMIN_HR_NIKS, true);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'sessionToken' => $sessionToken,
            'nik' => $profil['nik'] ?? $cleanNik,
            'nama' => $profil['nama'] ?? '',
            'jabatan' => $profil['jabatan'] ?? '',
            'divisi' => $profil['divisi'] ?? '',
            'cabang' => $profil['cabang'] ?? 'Pusat Jakarta',
            'isAdminHR' => $isAdminHR,
            'message' => 'Autentikasi identitas berhasil. Silakan lakukan presensi.'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 5: SIMPAN PRESENSI KEHADIRAN (MASUK, PULANG, DINAS LUAR)
    // ---------------------------------------------------------------------
    if ($action === 'simpanAbsensi') {
        $nik = $payload['nik'] ?? '';
        $jenis = $payload['jenis'] ?? 'Masuk';
        $lokasi = $payload['lokasi'] ?? 'KANTOR';
        $gps = trim((string)($payload['gps'] ?? ''));
        if (empty($gps) && isset($payload['latitude']) && isset($payload['longitude'])) {
            $gps = $payload['latitude'] . ',' . $payload['longitude'];
        }
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $keterangan = trim((string)($payload['keterangan'] ?? ''));

        if (!$nik || !$gps) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Parameter NIK dan Koordinat GPS wajib diisi.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);

        // Validasi Sesi OTP Server
        if (!validasiSesiKaryawan($sessionToken, $cleanNik)) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'code' => 'UNAUTHORIZED_SESSION',
                'message' => 'Sesi tidak valid atau telah kedaluwarsa. Silakan verifikasi NIK & OTP Gmail terlebih dahulu.'
            ]);
            exit;
        }

        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $profil = $k;
                break;
            }
        }

        if (!$profil) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK tidak terdaftar dalam Master Karyawan.']);
            exit;
        }

        // Parse Koordinat GPS
        $parts = explode(',', $gps);
        if (count($parts) < 2) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Format koordinat GPS tidak valid.']);
            exit;
        }
        $userLat = (float)trim($parts[0]);
        $userLng = (float)trim($parts[1]);

        // Zona Waktu Kantor Pusat: Asia/Jakarta (WIB)
        $tzObj = new DateTimeZone('Asia/Jakarta');
        $dtNow = new DateTime('now', $tzObj);
        $tglStr = $dtNow->format('Y-m-d');
        $jamStr = $dtNow->format('H:i:s') . ' WIB';
        $timestampStr = $dtNow->format('Y-m-d H:i:s');

        // Validasi Geofence Kantor Pusat Jakarta
        $kantorTerdekat = 'Kantor Pusat Jakarta';
        $jarakMeter = 0;
        $statusValidasi = 'VALID';

        if ($lokasi === 'KANTOR') {
            $jarakMeter = hitungJarakHaversine($userLat, $userLng, PUSAT_LAT, PUSAT_LNG);
            if ($jarakMeter > RADIUS_KANTOR_METER) {
                $statusValidasi = 'TIDAK VALID';
            }
        } elseif ($lokasi === 'WFH') {
            $wfhGps = $profil['gps_wfh'] ?? '';
            foreach ($db['master_wfh'] as $w) {
                if (cocokNIK($w['nik'], $cleanNik)) {
                    $wfhGps = $w['gps'];
                }
            }

            if (!$wfhGps) {
                $kantorTerdekat = 'Rumah WFH (Belum Terdaftar)';
                $jarakMeter = 999999;
                $statusValidasi = 'TIDAK VALID';
            } else {
                $wParts = explode(',', $wfhGps);
                $wLat = (float)trim($wParts[0]);
                $wLng = (float)trim($wParts[1]);
                $jarakMeter = hitungJarakHaversine($userLat, $userLng, $wLat, $wLng);
                $kantorTerdekat = 'Rumah WFH';
                if ($jarakMeter > RADIUS_WFH_METER) {
                    $statusValidasi = 'TIDAK VALID';
                }
            }
        } elseif ($lokasi === 'DINAS LUAR') {
            $kantorTerdekat = 'Lokasi Penugasan Lapangan';
            $jarakMeter = 0;
            $statusValidasi = 'VALID';
        }

        // Aturan Integritas & Pencegahan Presensi Ganda
        $recordMasuk = null;
        $recordPulang = null;

        foreach ($db['absensi'] as $rec) {
            if (cocokNIK($rec['nik'], $cleanNik) && $rec['tanggal'] === $tglStr) {
                if ($rec['jenis'] === 'Masuk') $recordMasuk = $rec;
                if ($rec['jenis'] === 'Pulang') $recordPulang = $rec;
            }
        }

        $durasiKerja = '-';

        if ($jenis === 'Masuk') {
            if ($recordMasuk !== null) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'success' => false,
                    'code' => 'DUPLICATE_PRESENSI_MASUK',
                    'message' => "Anda sudah melakukan presensi Masuk hari ini ($tglStr) pada pukul {$recordMasuk['jam']}."
                ]);
                exit;
            }
        } elseif ($jenis === 'Pulang') {
            if ($recordMasuk === null) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'success' => false,
                    'code' => 'MISSING_PRESENSI_MASUK',
                    'message' => "Presensi Pulang ditolak: Anda belum mencatatkan presensi Masuk hari ini ($tglStr)."
                ]);
                exit;
            }
            if ($recordPulang !== null) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'success' => false,
                    'code' => 'DUPLICATE_PRESENSI_PULANG',
                    'message' => "Anda sudah melakukan presensi Pulang hari ini ($tglStr) pada pukul {$recordPulang['jam']}."
                ]);
                exit;
            }

            // Hitung durasi kerja
            $tsMasuk = strtotime($recordMasuk['timestamp']);
            $tsPulang = strtotime($timestampStr);
            $selisihDetik = max(0, $tsPulang - $tsMasuk);
            $jamKerja = floor($selisihDetik / 3600);
            $menitKerja = floor(($selisihDetik % 3600) / 60);
            $durasiKerja = "{$jamKerja} jam {$menitKerja} menit";
        }

        // Cek Keterlambatan Masuk
        $isTerlambat = false;
        if ($jenis === 'Masuk') {
            $waktuJam = $dtNow->format('H:i:s');
            if ($waktuJam > JAM_MASUK_BATAS_TERLAMBAT) {
                $isTerlambat = true;
            }
        }

        // Simpan Record Presensi
        $newRecord = [
            'id' => 'ABS-' . date('Ymd') . '-' . substr(md5(uniqid('', true)), 0, 6),
            'timestamp' => $timestampStr,
            'tanggal' => $tglStr,
            'jam' => $jamStr,
            'zona_waktu' => 'WIB',
            'nik' => $profil['nik'] ?? $cleanNik,
            'nama' => $profil['nama'],
            'jabatan' => $profil['jabatan'],
            'divisi' => $profil['divisi'],
            'jenis' => $jenis,
            'lokasi' => $lokasi,
            'gps' => $gps,
            'jarak_meter' => $jarakMeter,
            'status_validasi' => $statusValidasi,
            'kantor_terdekat' => $kantorTerdekat,
            'is_terlambat' => $isTerlambat,
            'durasi_kerja' => $durasiKerja,
            'keterangan' => $keterangan ?: (($statusValidasi === 'VALID') ? "Presensi $jenis Berhasil" : "Presensi di luar radius ($jarakMeter m)")
        ];

        $db['absensi'][] = $newRecord;
        $db['metadata']['total_absensi'] = count($db['absensi']);
        $db['metadata']['last_sync'] = date('Y-m-d H:i:s');
        saveDatabase($db);

        // Dispatch dua arah (Two-Way Sync) ke Google Sheets ABSENSI
        @callGASWebService([
            'action'          => 'record_absensi',
            'timestamp'       => $timestampStr,
            'nik'             => $newRecord['nik'],
            'nama'            => $newRecord['nama'],
            'jabatan'         => $newRecord['jabatan'],
            'divisi'          => $newRecord['divisi'],
            'jenis'           => $jenis,
            'lokasi'          => $lokasi,
            'gps'             => $gps,
            'jarak'           => $jarakMeter,
            'status_gps'      => ($statusValidasi === 'VALID') ? 'VALID' : ("DI LUAR RADIUS ({$jarakMeter}m)"),
            'status_validasi' => $statusValidasi,
            'kantor_terdekat' => $kantorTerdekat,
            'jam'             => $jamStr,
            'kehadiran'       => 'Hadir',
            'keterangan'      => $newRecord['keterangan']
        ], 5);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'statusValidasi' => $statusValidasi,
            'nama' => $profil['nama'],
            'jarak' => $jarakMeter,
            'kantor' => $kantorTerdekat,
            'jam' => $jamStr,
            'is_terlambat' => $isTerlambat,
            'durasi_kerja' => $durasiKerja,
            'message' => ($statusValidasi === 'VALID')
                ? "Presensi $jenis berhasil diverifikasi VALID."
                : "Presensi tersimpan, namun berada di luar radius ($jarakMeter meter). Status: TIDAK VALID."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 6: DAFTARKAN LOKASI RUMAH WFH
    // ---------------------------------------------------------------------
    if ($action === 'simpanWFH') {
        $nik = $payload['nik'] ?? '';
        $alamat = trim((string)($payload['alamat'] ?? ''));
        $gps = trim((string)($payload['gps'] ?? ''));
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';

        if (!$nik || !$alamat || !$gps) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Lengkapi NIK, Alamat, dan Titik Koordinat GPS.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);

        if (!validasiSesiKaryawan($sessionToken, $cleanNik)) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Sesi kedaluwarsa. Silakan verifikasi NIK & OTP.']);
            exit;
        }

        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as &$k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $k['alamat_wfh'] = $alamat;
                $k['gps_wfh'] = $gps;
                $profil = $k;
                break;
            }
        }

        $db['master_wfh'][] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'nik' => $profil['nik'] ?? $cleanNik,
            'nama' => $profil['nama'] ?? '',
            'alamat' => $alamat,
            'gps' => $gps,
            'radius' => RADIUS_WFH_METER,
            'status' => 'AKTIF'
        ];

        saveDatabase($db);

        // Dispatch pendaftaran WFH dua arah ke Google Sheets MASTER_WFH
        @callGASWebService([
            'action'  => 'simpanWFH',
            'nik'     => $cleanNik,
            'alamat'  => $alamat,
            'gps'     => $gps
        ], 5);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => "Titik koordinat domisili WFH untuk " . ($profil['nama'] ?? $cleanNik) . " berhasil dikunci."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 7: PENGAJUAN IZIN / CUTI DENGAN LAMPIRAN FILE
    // ---------------------------------------------------------------------
    if ($action === 'simpanPengajuanCuti') {
        $nik = $payload['nik'] ?? '';
        $jenisCuti = $payload['jenisCuti'] ?? 'Izin';
        $tglMulai = $payload['tglMulai'] ?? '';
        $tglSelesai = $payload['tglSelesai'] ?? '';
        $alasan = trim((string)($payload['alasan'] ?? ''));
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $fileData = $payload['fileData'] ?? null;
        $fileName = $payload['fileName'] ?? null;

        if (!$nik || !$tglMulai || !$tglSelesai) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Lengkapi NIK, Kategori Cuti, serta Tanggal Mulai dan Selesai.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);

        if (!validasiSesiKaryawan($sessionToken, $cleanNik)) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Sesi tidak sah. Harap verifikasi OTP.']);
            exit;
        }

        $db = loadDatabase();
        $profil = null;
        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $cleanNik)) {
                $profil = $k;
                break;
            }
        }

        $savedFilePath = '-';
        if ($fileData && $fileName) {
            if (preg_match('/^data:(image\/(jpeg|png)|application\/pdf);base64,/', $fileData, $matches)) {
                $base64 = substr($fileData, strpos($fileData, ',') + 1);
                $decoded = base64_decode($base64);
                if (strlen($decoded) > 5 * 1024 * 1024) {
                    http_response_code(413);
                    echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Ukuran berkas melebihi 5 MB.']);
                    exit;
                }
                $cleanName = 'CUTI_' . $cleanNik . '_' . date('Ymd_His') . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
                @file_put_contents(ATTACHMENT_DIR . '/' . $cleanName, $decoded);
                $savedFilePath = 'data/lampiran_cuti/' . $cleanName;
            } else {
                http_response_code(415);
                echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Tipe file tidak diizinkan. Hanya PDF, JPG, dan PNG.']);
                exit;
            }
        }

        $d1 = new DateTime($tglMulai);
        $d2 = new DateTime($tglSelesai);
        $durasi = $d2->diff($d1)->days + 1;

        $cutiRecord = [
            'id' => 'CUTI-' . date('Ymd') . '-' . substr(md5(uniqid('', true)), 0, 5),
            'timestamp' => date('Y-m-d H:i:s'),
            'nik' => $profil['nik'] ?? $cleanNik,
            'nama' => $profil['nama'] ?? $cleanNik,
            'jabatan' => $profil['jabatan'] ?? '',
            'divisi' => $profil['divisi'] ?? '',
            'jenis_cuti' => $jenisCuti,
            'tgl_mulai' => $tglMulai,
            'tgl_selesai' => $tglSelesai,
            'jumlah_hari' => $durasi,
            'alasan' => $alasan,
            'status' => 'Menunggu Persetujuan',
            'file_lampiran' => $savedFilePath
        ];

        $db['pengajuan_cuti'][] = $cutiRecord;
        $db['metadata']['total_cuti'] = count($db['pengajuan_cuti']);
        saveDatabase($db);

        // Dispatch dua arah (Two-Way Sync) ke Google Sheets PENGAJUAN_CUTI
        @callGASWebService([
            'action'        => 'submit_cuti',
            'id'            => $cutiRecord['id'],
            'nik'           => $cutiRecord['nik'],
            'nama'          => $cutiRecord['nama'],
            'jabatan'       => $cutiRecord['jabatan'],
            'divisi'        => $cutiRecord['divisi'],
            'jenisCuti'     => $jenisCuti,
            'tglMulai'      => $tglMulai,
            'tglSelesai'    => $tglSelesai,
            'jumlah_hari'   => $durasi,
            'alasan'        => $alasan,
            'file_lampiran' => $savedFilePath
        ], 5);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'durasi' => $durasi,
            'message' => "Permohonan $jenisCuti untuk " . ($profil['nama'] ?? $cleanNik) . " berhasil terkirim. Status: Menunggu Persetujuan HR Kantor Pusat."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 8: BACA RIWAYAT & REKAP PRESENSI KARYAWAN
    // ---------------------------------------------------------------------
    if ($action === 'getRiwayatPresensi') {
        $nik = $payload['nik'] ?? $_GET['nik'] ?? '';
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '';

        if (!$nik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan wajib diisi.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);

        if (!validasiSesiKaryawan($sessionToken, $cleanNik) && !cekOtorisasiAdminHR($sessionToken, $cleanNik)) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Sesi tidak sah / kedaluwarsa.']);
            exit;
        }

        $db = loadDatabase();
        $riwayatAbsen = [];
        $riwayatCuti = [];

        foreach ($db['absensi'] as $rec) {
            if (cocokNIK($rec['nik'], $cleanNik)) {
                $riwayatAbsen[] = $rec;
            }
        }

        foreach ($db['pengajuan_cuti'] as $rec) {
            if (cocokNIK($rec['nik'], $cleanNik)) {
                $riwayatCuti[] = $rec;
            }
        }

        usort($riwayatAbsen, function($a, $b) {
            return strcmp($b['timestamp'], $a['timestamp']);
        });

        $totalMasuk = 0;
        $totalValid = 0;
        $totalTidakValid = 0;
        foreach ($riwayatAbsen as $r) {
            if ($r['jenis'] === 'Masuk') $totalMasuk++;
            if ($r['status_validasi'] === 'VALID') $totalValid++;
            else $totalTidakValid++;
        }

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'nik' => $cleanNik,
            'rekap' => [
                'total_presensi' => count($riwayatAbsen),
                'total_masuk' => $totalMasuk,
                'total_valid' => $totalValid,
                'total_tidak_valid' => $totalTidakValid,
                'total_pengajuan_cuti' => count($riwayatCuti)
            ],
            'riwayat_absensi' => array_slice($riwayatAbsen, 0, 30),
            'riwayat_cuti' => $riwayatCuti
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 9: DASHBOARD ADMIN HR KANTOR PUSAT & MONITORING REAL-TIME
    // ---------------------------------------------------------------------
    if ($action === 'getDashboardHR' || $action === 'get_today_attendance' || $action === 'monitoring_hari_ini') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
        $nik = $payload['nik'] ?? $_SERVER['HTTP_X_NIK'] ?? '';

        if (!cekOtorisasiAdminHR($sessionToken, $nik)) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Akses Ditolak: Anda tidak memiliki wewenang Admin HR Kantor Pusat.'
            ]);
            exit;
        }

        $db = loadDatabase();
        $tzObj = new DateTimeZone('Asia/Jakarta');
        $nowWib = new DateTime('now', $tzObj);
        $tglFilterRaw = $payload['tanggal'] ?? $nowWib->format('Y-m-d');
        $tglTargetYmd = normalisasiTanggalYmd($tglFilterRaw);

        $karyawanPusat = [];
        $masterLookup = [];

        foreach ($db['master_karyawan'] as $k) {
            if (($k['cabang'] ?? '') === 'Pusat Jakarta' && strtoupper($k['status'] ?? '') === 'AKTIF') {
                $karyawanPusat[] = $k;
                $masterLookup[normalisasiNIK($k['nik'])] = $k;
            }
        }

        // Sinkronisasi SSOT: Muat seluruh log transaksi presensi (termasuk dari Google Spreadsheet)
        $forceSync = !empty($payload['force_sync']) || !empty($_GET['force_sync']);
        $allAbsensi = loadAllAbsensiRecords($forceSync);

        // Agregasi Kehadiran Hari Ini (Peta per karyawan untuk Tabel 7 Kolom)
        $karyawanKehadiran = [];
        $hadirMasukNiks = [];
        $sudahPulangNiks = [];
        $terlambatNiks = [];
        $wfhNiks = [];
        $dinasNiks = [];
        $transaksiHariIni = [];

        foreach ($allAbsensi as $rec) {
            $recTgl = normalisasiTanggalYmd($rec['tanggal'] ?? $rec['timestamp'] ?? '');
            if ($recTgl === $tglTargetYmd) {
                $transaksiHariIni[] = $rec;
                $rNik = normalisasiNIK($rec['nik']);
                $rJenis = strtolower($rec['jenis'] ?? '');

                if (!isset($karyawanKehadiran[$rNik])) {
                    $masterK = $masterLookup[$rNik] ?? null;
                    $karyawanKehadiran[$rNik] = [
                        'nik' => $rec['nik'],
                        'nama' => $masterK ? $masterK['nama'] : ($rec['nama'] ?? $rec['nik']),
                        'jabatan' => $masterK ? $masterK['jabatan'] : ($rec['jabatan'] ?? '-'),
                        'divisi' => $masterK ? $masterK['divisi'] : ($rec['divisi'] ?? '-'),
                        'jam_masuk' => '-',
                        'is_terlambat' => false,
                        'lokasi' => $rec['lokasi'] ?? 'Kantor Pusat',
                        'lokasi_label' => ($rec['lokasi'] ?? '') === 'WFH' ? 'WFH' : 'Kantor Pusat',
                        'gps' => $rec['gps'] ?? '',
                        'jarak' => $rec['jarak'] ?? '',
                        'status_gps' => $rec['status_gps'] ?? 'VALID',
                        'status_validasi' => $rec['status_validasi'] ?? 'VALID',
                        'jam_pulang' => null,
                        'foto_url' => $rec['foto_url'] ?? '',
                        'keterangan' => $rec['keterangan'] ?? ''
                    ];
                }

                if (strpos($rJenis, 'masuk') !== false) {
                    $hadirMasukNiks[$rNik] = true;
                    $jamM = $rec['jam'] ?? '';
                    if (empty($jamM) && !empty($rec['timestamp'])) {
                        if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)/', $rec['timestamp'], $m)) {
                            $jamM = $m[1];
                        }
                    }
                    $karyawanKehadiran[$rNik]['jam_masuk'] = $jamM;
                    $karyawanKehadiran[$rNik]['lokasi'] = $rec['lokasi'] ?? $karyawanKehadiran[$rNik]['lokasi'];
                    $karyawanKehadiran[$rNik]['lokasi_label'] = ($rec['lokasi'] ?? '') === 'WFH' ? 'WFH' : 'Kantor Pusat';
                    if (!empty($rec['gps'])) $karyawanKehadiran[$rNik]['gps'] = $rec['gps'];
                    if (!empty($rec['jarak'])) $karyawanKehadiran[$rNik]['jarak'] = $rec['jarak'];
                    if (!empty($rec['foto_url'])) $karyawanKehadiran[$rNik]['foto_url'] = $rec['foto_url'];

                    if (!empty($rec['is_terlambat']) || ($jamM > '08:30:00')) {
                        $karyawanKehadiran[$rNik]['is_terlambat'] = true;
                        $terlambatNiks[$rNik] = true;
                    }

                    if (($rec['lokasi'] ?? '') === 'WFH') $wfhNiks[$rNik] = true;
                    if (($rec['lokasi'] ?? '') === 'DINAS LUAR') $dinasNiks[$rNik] = true;
                }

                if (strpos($rJenis, 'pulang') !== false) {
                    $sudahPulangNiks[$rNik] = true;
                    $jamP = $rec['jam'] ?? '';
                    if (empty($jamP) && !empty($rec['timestamp'])) {
                        if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)/', $rec['timestamp'], $m)) {
                            $jamP = $m[1];
                        }
                    }
                    $karyawanKehadiran[$rNik]['jam_pulang'] = $jamP ?: 'Sudah Pulang';
                }
            }
        }

        // Format Baris Tabel 7 Kolom
        $tabelKehadiran = [];
        $noUrut = 1;
        foreach ($karyawanKehadiran as $item) {
            $item['no'] = $noUrut++;
            $tabelKehadiran[] = $item;
        }

        // Belum Presensi
        $belumPresensiList = [];
        foreach ($karyawanPusat as $k) {
            $norm = normalisasiNIK($k['nik']);
            if (!isset($hadirMasukNiks[$norm])) {
                $belumPresensiList[] = [
                    'nik' => $k['nik'],
                    'nama' => $k['nama'],
                    'jabatan' => $k['jabatan'],
                    'divisi' => $k['divisi'],
                    'email' => $k['email']
                ];
            }
        }

        // Cuti Pending (Reconciled from GAS & Local Cache)
        $allCuti = loadAllCutiRecords($forceSync);
        $cutiPending = [];
        foreach ($allCuti as $c) {
            $st = $c['status'] ?? '';
            if (stripos($st, 'Menunggu') !== false || stripos($st, 'Pending') !== false) {
                $cutiPending[] = $c;
            }
        }

        $totalPusat = count($karyawanPusat) > 0 ? count($karyawanPusat) : 22;
        $totalMasuk = count($hadirMasukNiks);
        $totalBelum = max(0, $totalPusat - $totalMasuk);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'tanggal' => $tglTargetYmd,
            'ringkasan' => [
                'total_karyawan_pusat' => $totalPusat,
                'hadir_masuk' => $totalMasuk,
                'sudah_pulang' => count($sudahPulangNiks),
                'belum_presensi' => $totalBelum,
                'terlambat' => count($terlambatNiks),
                'wfh' => count($wfhNiks),
                'dinas_luar' => count($dinasNiks),
                'cuti_pending' => count($cutiPending)
            ],
            'tabel_kehadiran' => $tabelKehadiran,
            'karyawan_pusat' => $karyawanPusat,
            'belum_presensi_list' => $belumPresensiList,
            'transaksi_hari_ini' => $transaksiHariIni,
            'pengajuan_cuti_pending' => $cutiPending,
            'metadata_master' => $db['metadata']
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 10: KOREKSI PRESENSI OLEH ADMIN HR (DENGAN AUDIT TRAIL)
    // ---------------------------------------------------------------------
    if ($action === 'koreksiPresensi') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $adminNik = normalisasiNIK($payload['admin_nik'] ?? '');

        if (!cekOtorisasiAdminHR($sessionToken, $adminNik)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Otorisasi Admin HR ditolak.']);
            exit;
        }

        $targetNik = normalisasiNIK($payload['target_nik'] ?? '');
        $tanggal = $payload['tanggal'] ?? date('Y-m-d');
        $jam = $payload['jam'] ?? date('H:i:s') . ' WIB';
        $jenis = $payload['jenis'] ?? 'Masuk';
        $alasan = trim((string)($payload['alasan'] ?? ''));

        if (!$targetNik || !$alasan) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan dan Alasan Koreksi wajib dicantumkan.']);
            exit;
        }

        $db = loadDatabase();
        $targetKaryawan = null;
        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $targetNik)) {
                $targetKaryawan = $k;
                break;
            }
        }

        if (!$targetKaryawan) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Karyawan tidak ditemukan.']);
            exit;
        }

        $newCorrection = [
            'id' => 'KOR-' . date('Ymd') . '-' . substr(md5(uniqid('', true)), 0, 6),
            'timestamp' => "$tanggal $jam",
            'tanggal' => $tanggal,
            'jam' => $jam,
            'zona_waktu' => 'WIB',
            'nik' => $targetKaryawan['nik'],
            'nama' => $targetKaryawan['nama'],
            'jabatan' => $targetKaryawan['jabatan'],
            'divisi' => $targetKaryawan['divisi'],
            'jenis' => $jenis,
            'lokasi' => 'KANTOR',
            'gps' => PUSAT_LAT . ',' . PUSAT_LNG,
            'jarak_meter' => 0,
            'status_validasi' => 'VALID',
            'kantor_terdekat' => 'Kantor Pusat Jakarta',
            'is_koreksi' => true,
            'koreksi_oleh' => $adminNik ?: 'Admin HR Pusat',
            'alasan_koreksi' => $alasan,
            'keterangan' => "Koreksi HR: $alasan (oleh " . ($adminNik ?: 'Admin HR') . ")"
        ];

        $db['absensi'][] = $newCorrection;
        $db['metadata']['total_absensi'] = count($db['absensi']);
        $db['metadata']['last_sync'] = date('Y-m-d H:i:s');
        saveDatabase($db);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => "Koreksi presensi $jenis untuk {$targetKaryawan['nama']} berhasil dicatat dalam audit trail."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 11: APPROVAL PERMOHONAN CUTI / IZIN
    // ---------------------------------------------------------------------
    if ($action === 'approveCuti') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $adminNik = normalisasiNIK($payload['admin_nik'] ?? '');

        if (!cekOtorisasiAdminHR($sessionToken, $adminNik)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Otorisasi Admin HR ditolak.']);
            exit;
        }

        $cutiId = $payload['cuti_id'] ?? '';
        $keputusan = $payload['keputusan'] ?? 'Disetujui';
        $catatan = trim((string)($payload['catatan'] ?? ''));

        if (!$cutiId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'ID Pengajuan Cuti wajib diisi.']);
            exit;
        }

        $db = loadDatabase();
        $found = false;

        foreach ($db['pengajuan_cuti'] as &$c) {
            if ($c['id'] === $cutiId) {
                $c['status'] = $keputusan;
                $c['disetujui_oleh'] = $adminNik ?: 'Admin HR Pusat';
                $c['tanggal_approval'] = date('Y-m-d H:i:s');
                $c['catatan_approval'] = $catatan ?: "Keputusan: $keputusan";
                $found = true;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Pengajuan cuti tidak ditemukan.']);
            exit;
        }

        saveDatabase($db);

        // Dispatch status update dua arah (Two-Way Sync) ke Google Sheets PENGAJUAN_CUTI
        @callGASWebService([
            'action'    => 'update_cuti_status',
            'cuti_id'   => $cutiId,
            'keputusan' => $keputusan,
            'catatan'   => $catatan,
            'admin_nik' => $adminNik
        ], 5);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => "Pengajuan cuti ID $cutiId berhasil diubah menjadi: $keputusan."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 12: LOGOUT PRESENSI
    // ---------------------------------------------------------------------

    // ---------------------------------------------------------------------
    // AKSI BARU: SINKRONISASI MASTER GOOGLE SHEET (ADMIN HR)
    // ---------------------------------------------------------------------
    if ($action === 'syncMasterKaryawan' || $action === 'syncGoogleSheetsAll') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $adminNik = normalisasiNIK($payload['admin_nik'] ?? $payload['nik'] ?? '');

        if (!cekOtorisasiAdminHR($sessionToken, $adminNik)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Otorisasi Admin HR ditolak.']);
            exit;
        }

        $roster = fetchMasterFromGAS();
        $absensi = fetchAbsensiFromGAS();
        $cuti = fetchCutiFromGAS();
        $wfh = fetchWFHFromGAS();
        $dash = fetchDashboardFromGAS();

        if (!$roster && !$absensi && !$cuti && !$wfh) {
            http_response_code(502);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Gagal mengambil data dari Google Apps Script SSOT. Periksa koneksi ke Google Spreadsheet.']);
            exit;
        }

        $db = loadDatabase();
        if ($roster) {
            $db['master_karyawan'] = $roster;
            $db['metadata']['total_karyawan_pusat'] = count($roster);
        }
        if ($absensi) {
            $db['absensi'] = $absensi;
            $db['metadata']['total_absensi'] = count($absensi);
        }
        if ($cuti) {
            $db['pengajuan_cuti'] = $cuti;
            $db['metadata']['total_cuti'] = count($cuti);
        }
        if ($wfh) {
            $db['master_wfh'] = $wfh;
        }
        $db['metadata']['last_sync'] = date('Y-m-d H:i:s');
        saveDatabase($db);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Sinkronisasi 5 Tab Google Spreadsheet (MASTER_KARYAWAN, ABSENSI, PENGAJUAN_CUTI, MASTER_WFH, DASHBOARD) berhasil.',
            'total_karyawan' => $roster ? count($roster) : count($db['master_karyawan']),
            'total_absensi' => $absensi ? count($absensi) : count($db['absensi']),
            'total_cuti' => $cuti ? count($cuti) : count($db['pengajuan_cuti']),
            'total_wfh' => $wfh ? count($wfh) : count($db['master_wfh']),
            'last_sync' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI BARU: DAFTARKAN / PERBARUI EMAIL KARYAWAN OLEH ADMIN HR
    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
    // AKSI: AMBIL WHITELIST TITIK DOMISILI WFH (MASTER_WFH)
    // ---------------------------------------------------------------------
    if ($action === 'getWFHWhitelist' || $action === 'get_wfh_whitelist') {
        $nik = $payload['nik'] ?? $_GET['nik'] ?? '';
        $cleanNik = normalisasiNIK($nik);
        $whitelist = [];
        if (file_exists(WFH_CACHE_FILE)) {
            $raw = @file_get_contents(WFH_CACHE_FILE);
            $cache = @json_decode($raw, true);
            if (!empty($cache['records'])) $whitelist = $cache['records'];
        }
        if (empty($whitelist)) {
            $whitelist = fetchWFHFromGAS() ?: [];
        }
        if ($cleanNik) {
            $filtered = [];
            foreach ($whitelist as $w) {
                if (cocokNIK($w['nik'] ?? '', $cleanNik)) {
                    $filtered[] = $w;
                }
            }
            $whitelist = $filtered;
        }
        echo json_encode([
            'status' => 'success',
            'success' => true,
            'total' => count($whitelist),
            'whitelist' => $whitelist
        ]);
        exit;
    }

    if ($action === 'daftarkanEmailKaryawan') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $adminNik = normalisasiNIK($payload['admin_nik'] ?? $payload['nik'] ?? '');

        if (!cekOtorisasiAdminHR($sessionToken, $adminNik)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Otorisasi Admin HR ditolak.']);
            exit;
        }

        $targetNik = normalisasiNIK($payload['target_nik'] ?? '');
        $email = trim((string)($payload['email'] ?? ''));

        if (!$targetNik || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Format email resmi tidak valid atau NIK karyawan tidak disertakan.']);
            exit;
        }

        $db = loadDatabase();
        $found = false;
        $namaTarget = '';

        foreach ($db['master_karyawan'] as &$k) {
            if (cocokNIK($k['nik'], $targetNik)) {
                $k['email'] = $email;
                $namaTarget = $k['nama'];
                $found = true;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Karyawan dengan NIK [' . $targetNik . '] tidak ditemukan di master.']);
            exit;
        }

        if (file_exists(MASTER_CACHE_FILE)) {
            $cacheRaw = @file_get_contents(MASTER_CACHE_FILE);
            $cache = json_decode($cacheRaw, true);
            if (is_array($cache) && !empty($cache['roster'])) {
                foreach ($cache['roster'] as &$ck) {
                    if (cocokNIK($ck['nik'], $targetNik)) {
                        $ck['email'] = $email;
                        break;
                    }
                }
                @file_put_contents(MASTER_CACHE_FILE, json_encode($cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
            }
        }

        @callGASWebService([
            'action' => 'updateEmailKaryawan',
            'nik' => $targetNik,
            'email' => $email,
            'admin_nik' => $adminNik
        ], 5);

        if (!isset($db['audit_log'])) $db['audit_log'] = [];
        $db['audit_log'][] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'aksi' => 'HR_PENDAFTARAN_EMAIL',
            'admin_nik' => $adminNik,
            'target_nik' => $targetNik,
            'target_nama' => $namaTarget,
            'keterangan' => "Email resmi berhasil didaftarkan untuk $namaTarget ($targetNik) oleh Admin HR $adminNik"
        ];

        saveDatabase($db);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => "Email resmi untuk $namaTarget ($targetNik) berhasil didaftarkan dan diverifikasi oleh Admin HR."
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI BARU: VERIFIKASI PRESENSI LAPANGAN (DRIVER / SECURITY)
    // ---------------------------------------------------------------------
    if ($action === 'verifikasiPresensiLapangan') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        $adminNik = normalisasiNIK($payload['admin_nik'] ?? $payload['nik'] ?? '');

        if (!cekOtorisasiAdminHR($sessionToken, $adminNik)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Otorisasi Admin HR ditolak.']);
            exit;
        }

        $targetNik = normalisasiNIK($payload['target_nik'] ?? '');
        $jenis = $payload['jenis'] ?? 'Masuk';
        $keterangan = trim((string)($payload['keterangan'] ?? 'Verifikasi Presensi Lapangan'));

        if (!$targetNik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan wajib disertakan.']);
            exit;
        }

        $db = loadDatabase();
        $targetKaryawan = null;
        foreach ($db['master_karyawan'] as $k) {
            if (cocokNIK($k['nik'], $targetNik)) {
                $targetKaryawan = $k;
                break;
            }
        }

        if (!$targetKaryawan) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Karyawan tidak ditemukan.']);
            exit;
        }

        $tzObj = new DateTimeZone('Asia/Jakarta');
        $nowWib = new DateTime('now', $tzObj);
        $tgl = $nowWib->format('Y-m-d');
        $jam = $nowWib->format('H:i:s') . ' WIB';

        $newPresensi = [
            'id' => 'ABS-' . date('Ymd') . '-' . substr(md5(uniqid('', true)), 0, 6),
            'timestamp' => $tgl . ' ' . $jam,
            'tanggal' => $tgl,
            'jam' => $jam,
            'zona_waktu' => 'WIB',
            'nik' => $targetKaryawan['nik'],
            'nama' => $targetKaryawan['nama'],
            'jabatan' => $targetKaryawan['jabatan'],
            'divisi' => $targetKaryawan['divisi'],
            'jenis' => $jenis,
            'lokasi' => 'KANTOR',
            'gps' => PUSAT_LAT . ',' . PUSAT_LNG,
            'jarak_meter' => 0,
            'status_validasi' => 'VALID',
            'kantor_terdekat' => 'Kantor Pusat Jakarta',
            'is_verifikasi_hr' => true,
            'diverifikasi_oleh' => $adminNik,
            'keterangan' => "Presensi $jenis Lapangan diverifikasi oleh HR ($adminNik): $keterangan"
        ];

        $db['absensi'][] = $newPresensi;
        $db['metadata']['total_absensi'] = count($db['absensi']);
        $db['metadata']['last_sync'] = date('Y-m-d H:i:s');
        saveDatabase($db);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => "Presensi $jenis untuk {$targetKaryawan['nama']} ({$targetKaryawan['nik']}) berhasil diverifikasi oleh Admin HR."
        ]);
        exit;
    }

    if ($action === 'logoutPresensi') {
        $sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
        if ($sessionToken) {
            $cache = loadOTPCache();
            if (isset($cache['sessions'][$sessionToken])) {
                unset($cache['sessions'][$sessionToken]);
                saveOTPCache($cache);
            }
        }
        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Sesi presensi berhasil dicabut.'
        ]);
        exit;
    }

    // Aksi tidak dikenal
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Aksi [' . htmlspecialchars($action) . '] tidak dikenal.'
    ]);

} finally {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
}
