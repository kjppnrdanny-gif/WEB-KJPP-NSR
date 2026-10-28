<?php
/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SISTEM PRESENSI & LAYANAN MANDIRI KARYAWAN (BACKEND SSOT cPANEL)
 * 
 * Modul: absensi-data-handler.php
 * Arsitektur: Single Source of Truth (SSOT) Server-Side dengan Atomic File Locking
 * Standar: ISO 27001, Kemenkeu P2PK & UU PDP No. 27/2022
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

// 1. Strict Security Headers & JSON Response
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Allow local staging or designated origins
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Session-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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

// Pastikan direktori data aman
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}
if (!is_dir(BACKUP_DIR)) {
    @mkdir(BACKUP_DIR, 0755, true);
}
if (!is_dir(ATTACHMENT_DIR)) {
    @mkdir(ATTACHMENT_DIR, 0755, true);
}

// 3. Konfigurasi Koordinat 5 Kantor Cabang Resmi KJPP NSR
$KANTOR_CABANG = [
    [
        'nama' => 'Pusat Jakarta',
        'lat' => -6.287972658138783,
        'lng' => 106.82477864308436,
        'timezone' => 'Asia/Jakarta',
        'tz_label' => 'WIB'
    ],
    [
        'nama' => 'Cabang Bandung',
        'lat' => -6.8597817,
        'lng' => 107.5604289,
        'timezone' => 'Asia/Jakarta',
        'tz_label' => 'WIB'
    ],
    [
        'nama' => 'Cabang Padang',
        'lat' => -0.94932,
        'lng' => 100.376055,
        'timezone' => 'Asia/Jakarta',
        'tz_label' => 'WIB'
    ],
    [
        'nama' => 'Cabang Makassar',
        'lat' => -5.1582,
        'lng' => 119.4095,
        'timezone' => 'Asia/Makassar',
        'tz_label' => 'WITA'
    ],
    [
        'nama' => 'Cabang Palembang',
        'lat' => -2.929044,
        'lng' => 104.695981,
        'timezone' => 'Asia/Jakarta',
        'tz_label' => 'WIB'
    ]
];

define('RADIUS_KANTOR_METER', 150);
define('RADIUS_WFH_METER', 100);

// 4. Helper Haversine Distance (Meter)
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

// 5. Helper Normalisasi NIK
function normalisasiNIK($nik) {
    if (!$nik) return '';
    return strtoupper(trim(preg_replace('/\s+/', '', (string)$nik)));
}

function cocokNIK($dbNik, $inputNik) {
    $nDb = normalisasiNIK($dbNik);
    $nInp = normalisasiNIK($inputNik);
    if ($nDb === $nInp) return true;
    if (str_replace('-2019-', '-', $nDb) === $nInp) return true;
    if (str_replace('-2019-', '-', $nInp) === $nDb) return true;
    if (substr($nDb, -strlen($nInp)) === $nInp) return true;
    return false;
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

// 6. Database Loading & Inisialisasi Master
function getDatabaseStructure() {
    return [
        'metadata' => [
            'app' => 'KJPP NSR Presensi SSOT',
            'version' => '1.0-2026',
            'last_sync' => date('Y-m-d H:i:s'),
            'total_absensi' => 0,
            'total_cuti' => 0
        ],
        'master_karyawan' => [
            [
                'nik' => 'NSR-2019-005',
                'nama' => 'Danny Taufik Hidayat, S.E.',
                'jabatan' => 'Kepala Divisi Operasional',
                'divisi' => 'Manajemen & SDM',
                'cabang' => 'Pusat Jakarta',
                'status' => 'AKTIF',
                'email' => 'kjppnr.danny@gmail.com',
                'alamat_wfh' => 'Jakarta Selatan',
                'gps_wfh' => '-6.2879726,106.8247786'
            ],
            [
                'nik' => 'NSR-2020-012',
                'nama' => 'Ahmad Fauzi, S.T.',
                'jabatan' => 'Penilai Properti',
                'divisi' => 'Penilaian Properti Komersial',
                'cabang' => 'Cabang Bandung',
                'status' => 'AKTIF',
                'email' => 'ahmad.fauzi.nsr@gmail.com',
                'alamat_wfh' => 'Bandung',
                'gps_wfh' => '-6.8597817,107.5604289'
            ],
            [
                'nik' => 'NSR-2021-024',
                'nama' => 'Siti Rahmawati, S.E.',
                'jabatan' => 'Admin Cabang',
                'divisi' => 'Administrasi Cabang Padang',
                'cabang' => 'Cabang Padang',
                'status' => 'AKTIF',
                'email' => 'siti.padang.nsr@gmail.com',
                'alamat_wfh' => 'Padang',
                'gps_wfh' => '-0.94932,100.376055'
            ],
            [
                'nik' => 'NSR-2021-030',
                'nama' => 'M. Amin Sade, S.E., MAPPI (Cert.)',
                'jabatan' => 'Pimpinan Cabang',
                'divisi' => 'Operasional Cabang Makassar',
                'cabang' => 'Cabang Makassar',
                'status' => 'AKTIF',
                'email' => 'amin.sade.nsr@gmail.com',
                'alamat_wfh' => 'Makassar',
                'gps_wfh' => '-5.1582,119.4095'
            ],
            [
                'nik' => 'NSR-2022-045',
                'nama' => 'Dharma Priyanto, S.T., MAPPI (Cert.)',
                'jabatan' => 'Pimpinan Cabang',
                'divisi' => 'Operasional Cabang Palembang',
                'cabang' => 'Cabang Palembang',
                'status' => 'AKTIF',
                'email' => 'dharma.plb.nsr@gmail.com',
                'alamat_wfh' => 'Palembang',
                'gps_wfh' => '-2.929044,104.695981'
            ]
        ],
        'master_wfh' => [],
        'absensi' => [],
        'pengajuan_cuti' => []
    ];
}

function loadDatabase() {
    if (!file_exists(DB_FILE)) {
        $initial = getDatabaseStructure();
        file_put_contents(DB_FILE, json_encode($initial, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $initial;
    }
    $raw = @file_get_contents(DB_FILE);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return getDatabaseStructure();
    }
    return $data;
}

function saveDatabase($data) {
    // 1. Snapshot backup otomatis
    $backupFile = BACKUP_DIR . '/absensi_snapshot_' . date('Ymd_His') . '_' . substr(md5(microtime()), 0, 6) . '.json';
    @file_put_contents($backupFile, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);

    // 2. Tulis ke database utama
    return @file_put_contents(DB_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// 7. Pengelolaan State OTP & Sesi Terenkripsi
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
    $cleanNik = normalisasiNIK($nik);

    if (isset($cache['sessions'][$sessionToken])) {
        $sess = $cache['sessions'][$sessionToken];
        // Cek kedaluwarsa sesi (12 jam)
        if (time() > $sess['expires_at']) {
            unset($cache['sessions'][$sessionToken]);
            saveOTPCache($cache);
            return false;
        }
        if (cocokNIK($sess['nik'], $cleanNik)) {
            return true;
        }
    }
    return false;
}

// =========================================================================
// ATOMIC TRANSACTION WRAPPER VIA LOCK_EX
// =========================================================================
$lockHandle = fopen(LOCK_FILE, 'c+');
if (!$lockHandle || !flock($lockHandle, LOCK_EX)) {
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Layanan Presensi sedang sibuk (konkurensi transaksi). Silakan coba 1 detik lagi.'
    ]);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $action = $_GET['action'] ?? $payload['action'] ?? 'STATUS';

    // ---------------------------------------------------------------------
    // AKSI 1: CEK STATUS / HEALTHCHECK
    // ---------------------------------------------------------------------
    if ($action === 'STATUS' || $_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET['action'])) {
        $db = loadDatabase();
        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Backend SSOT Presensi KJPP NSR Aktif & Terlindungi.',
            'timestamp' => date('c'),
            'total_absensi' => count($db['absensi'] ?? []),
            'total_karyawan' => count($db['master_karyawan'] ?? [])
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 2: CEK KARYAWAN (NIK VERIFICATION)
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
                if (strtoupper($k['status'] ?? '') === 'NONAKTIF' || strtoupper($k['status'] ?? '') === 'RESIGN') {
                    http_response_code(403);
                    echo json_encode([
                        'status' => 'error',
                        'success' => false,
                        'message' => 'Status karyawan tidak aktif. Hubungi bagian HR/Manajemen KJPP NSR.'
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
                'message' => 'NIK [' . $cleanNik . '] tidak ditemukan di database Master Karyawan.'
            ]);
            exit;
        }

        $email = $found['email'] ?? '';
        echo json_encode([
            'status' => 'success',
            'success' => true,
            'nik' => $found['nik'],
            'nama' => $found['nama'],
            'jabatan' => $found['jabatan'],
            'divisi' => $found['divisi'],
            'cabang' => $found['cabang'] ?? 'Pusat Jakarta',
            'maskedEmail' => samarkanEmail($email),
            'hasEmail' => (strlen($email) > 5 && strpos($email, '@') !== false)
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 3: MINTA KODE OTP GMAIL
    // ---------------------------------------------------------------------
    if ($action === 'mintaOTP') {
        $nik = $payload['nik'] ?? '';
        if (!$nik) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'NIK Karyawan wajib diisi.']);
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

        if (!$targetKaryawan || empty($targetKaryawan['email'])) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Email Gmail belum terdaftar untuk NIK [' . $cleanNik . ']. Hubungi Admin/HR.'
            ]);
            exit;
        }

        $email = $targetKaryawan['email'];
        $cache = loadOTPCache();

        // Rate Limiting: 60 Detik Cooldown
        if (isset($cache['otps'][$cleanNik])) {
            $prev = $cache['otps'][$cleanNik];
            $elapsed = time() - $prev['created_at'];
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

        // Generate 6-Digit OTP Kriptografis
        $otpNumber = (string)random_int(100000, 999999);
        $otpHash = hash('sha256', $otpNumber);

        // Simpan Hash OTP (berlaku 5 menit / 300 detik)
        $cache['otps'][$cleanNik] = [
            'hash' => $otpHash,
            'created_at' => time(),
            'expires_at' => time() + 300,
            'attempts' => 0
        ];
        saveOTPCache($cache);

        // Simulasi pengiriman email / integrasi mail
        $masked = samarkanEmail($email);
        $pesan = "Kode OTP 6-digit berhasil dikirimkan ke $masked. Berlaku 5 menit.";

        // Jika di lingkungan server dengan mail(), kirim email asli
        @mail(
            $email,
            "[KJPP NSR] Kode Verifikasi Kehadiran: $otpNumber",
            "Halo Rekan KJPP NSR,\n\nKode verifikasi OTP kehadiran Anda adalah: $otpNumber\nBerlaku 5 menit.\n\nKJPP NSR",
            "From: presensi@kjppnanangrahayu.com\r\nReply-To: info@kjppnanangrahayu.com"
        );

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'maskedEmail' => $masked,
            'pesan' => $pesan,
            // Header pengujian dummy jika di localhost/test
            'test_otp_hint' => (strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false || strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') !== false) ? $otpNumber : null
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 4: VERIFIKASI OTP & TERBITKAN TOKEN SESI
    // ---------------------------------------------------------------------
    if ($action === 'verifikasiOTP') {
        $nik = $payload['nik'] ?? '';
        $otpInput = trim((string)($payload['otp'] ?? ''));

        if (!$nik || strlen($otpInput) !== 6) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'success' => false, 'message' => 'Lengkapi NIK dan 6-digit kode OTP.']);
            exit;
        }

        $cleanNik = normalisasiNIK($nik);
        $cache = loadOTPCache();

        if (!isset($cache['otps'][$cleanNik])) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Kode OTP belum diminta atau telah kedaluwarsa. Silakan minta kode OTP baru.'
            ]);
            exit;
        }

        $otpData = &$cache['otps'][$cleanNik];

        // Cek kedaluwarsa waktu
        if (time() > $otpData['expires_at']) {
            unset($cache['otps'][$cleanNik]);
            saveOTPCache($cache);
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan minta kode baru.'
            ]);
            exit;
        }

        // Cek percobaan salah
        if ($otpData['attempts'] >= 3) {
            unset($cache['otps'][$cleanNik]);
            saveOTPCache($cache);
            http_response_code(429);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => 'Batas percobaan terlampaui (3 kali salah). Kode OTP dibatalkan demi keamanan.'
            ]);
            exit;
        }

        $inputHash = hash('sha256', $otpInput);
        if ($inputHash !== $otpData['hash']) {
            $otpData['attempts'] += 1;
            if ($otpData['attempts'] >= 3) {
                unset($cache['otps'][$cleanNik]);
                saveOTPCache($cache);
                http_response_code(429);
                echo json_encode([
                    'status' => 'error',
                    'success' => false,
                    'message' => 'Batas percobaan terlampaui (3 kali salah). Kode OTP dibatalkan demi keamanan.'
                ]);
                exit;
            }
            $sisa = 3 - $otpData['attempts'];
            saveOTPCache($cache);
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'success' => false,
                'message' => "Kode OTP salah. Sisa percobaan: $sisa kali."
            ]);
            exit;
        }

        // OTP Valid: Bersihkan cache OTP & Terbitkan Token Sesi
        unset($cache['otps'][$cleanNik]);
        $sessionToken = bin2hex(random_bytes(24));
        $cache['sessions'][$sessionToken] = [
            'nik' => $cleanNik,
            'created_at' => time(),
            'expires_at' => time() + 43200 // 12 jam
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

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'sessionToken' => $sessionToken,
            'nik' => $profil['nik'] ?? $cleanNik,
            'nama' => $profil['nama'] ?? '',
            'jabatan' => $profil['jabatan'] ?? '',
            'divisi' => $profil['divisi'] ?? '',
            'cabang' => $profil['cabang'] ?? 'Pusat Jakarta',
            'message' => 'Autentikasi identitas berhasil. Sesi aktif (12 jam).'
        ]);
        exit;
    }

    // ---------------------------------------------------------------------
    // AKSI 5: SIMPAN PRESENSI KEHADIRAN (MULTI-CABANG, ZONA WAKTU, GEOFENCE)
    // ---------------------------------------------------------------------
    if ($action === 'simpanAbsensi') {
        $nik = $payload['nik'] ?? '';
        $jenis = $payload['jenis'] ?? 'Masuk'; // Masuk, Pulang, Dinas Luar
        $lokasi = $payload['lokasi'] ?? 'KANTOR'; // KANTOR, WFH, DINAS LUAR
        $gps = trim((string)($payload['gps'] ?? ''));
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

        // Cek Kantor Terdekat & Jarak Geofence
        $kantorTerdekat = '-';
        $jarakMeter = 0;
        $statusValidasi = 'VALID';
        $nearestTz = 'Asia/Jakarta';
        $nearestTzLabel = 'WIB';

        if ($lokasi === 'KANTOR') {
            $minJarak = PHP_INT_MAX;
            foreach ($KANTOR_CABANG as $cab) {
                $d = hitungJarakHaversine($userLat, $userLng, $cab['lat'], $cab['lng']);
                if ($d < $minJarak) {
                    $minJarak = $d;
                    $kantorTerdekat = $cab['nama'];
                    $nearestTz = $cab['timezone'];
                    $nearestTzLabel = $cab['tz_label'];
                }
            }
            $jarakMeter = $minJarak;
            if ($minJarak > RADIUS_KANTOR_METER) {
                $statusValidasi = 'TIDAK VALID';
            }
        } elseif ($lokasi === 'WFH') {
            // Cek titik WFH terdaftar di master_wfh atau profil karyawan
            $wfhGps = $profil['gps_wfh'] ?? '';
            foreach ($db['master_wfh'] as $w) {
                if (cocokNIK($w['nik'], $cleanNik)) {
                    $wfhGps = $w['gps'];
                }
            }

            if (!$wfhGps) {
                $kantorTerdekat = 'Rumah (Belum Terdaftar)';
                $jarakMeter = 999999;
                $statusValidasi = 'TIDAK VALID';
            } else {
                $wParts = explode(',', $wfhGps);
                $wLat = (float)trim($wParts[0]);
                $wLng = (float)trim($wParts[1]);
                $d = hitungJarakHaversine($userLat, $userLng, $wLat, $wLng);
                $kantorTerdekat = 'Rumah WFH';
                $jarakMeter = $d;
                if ($d > RADIUS_WFH_METER) {
                    $statusValidasi = 'TIDAK VALID';
                }
            }
        } elseif ($lokasi === 'DINAS LUAR') {
            $kantorTerdekat = 'Lokasi Penugasan / Lapangan';
            $jarakMeter = 0;
            $statusValidasi = 'VALID';
        }

        // Zona Waktu Sesuai Wilayah Penugasan (e.g. WITA untuk Makassar)
        $tzObj = new DateTimeZone($nearestTz);
        $dtNow = new DateTime('now', $tzObj);
        $tglStr = $dtNow->format('Y-m-d');
        $jamStr = $dtNow->format('H:i:s') . ' ' . $nearestTzLabel;
        $timestampStr = $dtNow->format('Y-m-d H:i:s');

        // Pencegahan Double Submission pada Hari yang Sama
        foreach ($db['absensi'] as $rec) {
            if (cocokNIK($rec['nik'], $cleanNik) && $rec['tanggal'] === $tglStr && $rec['jenis'] === $jenis) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'success' => false,
                    'code' => 'DUPLICATE_PRESENSI',
                    'message' => "Anda sudah melakukan presensi $jenis untuk hari ini ($tglStr)."
                ]);
                exit;
            }
        }

        // Simpan Record Presensi
        $newRecord = [
            'id' => 'ABS-' . date('Ymd') . '-' . substr(md5(uniqid('', true)), 0, 6),
            'timestamp' => $timestampStr,
            'tanggal' => $tglStr,
            'jam' => $jamStr,
            'zona_waktu' => $nearestTzLabel,
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
            'keterangan' => $keterangan ?: (($statusValidasi === 'VALID') ? "Presensi $jenis Berhasil" : "Presensi di luar radius ($jarakMeter m)")
        ];

        $db['absensi'][] = $newRecord;
        $db['metadata']['total_absensi'] = count($db['absensi']);
        $db['metadata']['last_sync'] = date('Y-m-d H:i:s');
        saveDatabase($db);

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'statusValidasi' => $statusValidasi,
            'nama' => $profil['nama'],
            'jarak' => $jarakMeter,
            'kantor' => $kantorTerdekat,
            'jam' => $jamStr,
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
            // Whitelist MIME & Max 5 MB
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

        // Durasi Hari
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

        echo json_encode([
            'status' => 'success',
            'success' => true,
            'durasi' => $durasi,
            'message' => "Permohonan $jenisCuti untuk " . ($profil['nama'] ?? $cleanNik) . " berhasil terkirim. Status: Menunggu Persetujuan HR/Manajemen."
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

        if (!validasiSesiKaryawan($sessionToken, $cleanNik)) {
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

        // Urutkan descending (terbaru di atas)
        usort($riwayatAbsen, function($a, $b) {
            return strcmp($b['timestamp'], $a['timestamp']);
        });

        // Rekapitulasi ringkas
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
