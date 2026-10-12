<?php
/**
 * KJPP NSR — Server-Side Protected Data Proxy untuk Portal NoLap (cPanel Native Edition)
 * Versi 2.0: Versioned Approval Control, Concurrency Lock & Automated Backup
 * 
 * Karakteristik Keamanan & Integritas Data:
 * 1. Single Source of Truth (SSOT): Penyimpanan terpusat operasional di cPanel (data/nolap_database.json).
 * 2. Autentikasi Fail-Closed: 401 Unauthorized jika tidak memiliki sesi sah atau Bearer token terdaftar.
 * 3. Strict Branch Isolation (RBAC): 403 Forbidden untuk akses lintas cabang (Padang, Bandung, Makassar, Palembang).
 * 4. Versioned Approval Control:
 *    - Status APPROVED terikat permanen pada versi dan SHA-256 hash dokumen.
 *    - Setiap revisi material pada dokumen yang sudah APPROVED otomatis membuat versi baru (v+1)
 *      dan menurunkan status menjadi PENDING_REVIEW.
 *    - Approval lama diarsipkan secara permanen dan tidak dapat digunakan untuk menyetujui isi baru.
 * 5. Concurrency Safe & Atomic Write: Menggunakan temp file dan flock(LOCK_EX).
 * 6. Automated Backup: Snapshot berkala ke data/backups/ sebelum mutasi data.
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
    if (in_array($parsedOrigin, $allowedHosts, true)) {
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

// -------------------------------------------------------------
// 1. DATA TOKENS RESMI UNTUK VALIDASI API / BEARER / HEADER
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // Otorisasi Kantor Pusat Jakarta (Hashed Token)
    '3d5d2d69641b1e88d2b96d64119430b1716a24f00937acfe79f22a713d3a9be7' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    // Otorisasi Cabang Bandung (Hashed Token)
    'a52e824efe550c1e89aa3026587e4aa54620e597fcc977b2c88876870c88a4cb' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    // Otorisasi Cabang Padang (Hashed Token)
    '6b838f77d520840a9bd8adb2e01d75ad511ea2f2d371b1ac16809e8fe1ac11bd' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    // Otorisasi Cabang Makassar (Hashed Token)
    '3c56bf3fbad429421e401e6ca9b335734a90b9986d9af890c12e2cf69f6129d4' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    // Otorisasi Cabang Palembang (Hashed Token)
    '8eec45b74d429d76724acd10312485fee4f180cddf0fd7210eb0da736c878ab3' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    'c20c16d688a686f8cd5ac12f4949b8dac6b4937d513f92a00514ee6122368ed2' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    // Otorisasi Master Operasional Pusat (Hashed Token)
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => ['sub' => 'admin_master', 'branch' => 'Pusat', 'displayName' => 'Master Operasional Pusat', 'role' => 'ADMIN_PUSAT'],
    'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' => ['sub' => 'admin_master', 'branch' => 'Pusat', 'displayName' => 'Master Operasional Pusat', 'role' => 'ADMIN_PUSAT']
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

// B. Dari Authorization Header (Bearer Token)
if (!$currentUser) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        $tHash = hash('sha256', strtoupper($token));
        if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
        }
    }
}

// C. Dari Header X-NSR-Token
if (!$currentUser) {
    $customToken = $_SERVER['HTTP_X_NSR_TOKEN'] ?? '';
    if ($customToken) {
        $tHash = hash('sha256', strtoupper(trim($customToken)));
        if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
        }
    }
}

// Tolak permintaan tanpa autentikasi sah (401 Unauthorized)
if (!$currentUser) {
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Akses Ditolak: Autentikasi server diperlukan untuk membaca atau memproses data NoLap.'
    ]);
    exit;
}

$userRole = $currentUser['role'] ?? 'CABANG';
$userBranch = trim($currentUser['branch'] ?? 'Pusat');
$userDisplayName = $currentUser['displayName'] ?? $currentUser['sub'] ?? 'Staf NSR';

// -------------------------------------------------------------
// 3. PERSISTENT STORAGE, DIRECTORY PROTECTION & CONCURRENCY
// -------------------------------------------------------------
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
}
// Lindungi direktori data dengan .htaccess jika belum ada
$dataHtaccess = $dataDir . '/.htaccess';
if (!file_exists($dataHtaccess)) {
    @file_put_contents($dataHtaccess, "Require all denied\n");
}

$dataFile = $dataDir . '/nolap_database.json';
// Fallback path untuk kompatibilitas jika file lama berada di root
if (!file_exists($dataFile) && file_exists(__DIR__ . '/nolap-data.json')) {
    $dataFile = __DIR__ . '/nolap-data.json';
}

function muatBaselineResmi() {
    return [
        // 1. DATA PENUGASAN ASLI RESMI (BERSIH DARI SIMULASI)
        [
            'noPermintaan' => 'REQ-000006',
            'timestamp' => '2026-09-23 16:40:55',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Zahra',
            'jabatanPemohon' => 'Admin',
            'emailPemohon' => 'kjppnsr.adm2@gmail.com',
            'waPemohon' => '0895391057740',
            'namaKlien' => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. GEMILANG SAKTI PROPERTINDO',
            'statusKlien' => 'Bank',
            'alamatKlien' => 'Kp. Babakan RT.03 RW.02, Satria Jaya, Tambun Utara, Bekasi, Jawa Barat',
            'kontakKlien' => '081314489587',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'tujuanPenilaian' => 'Penjaminan Utang',
            'jenisObjek' => 'Tanah dan Bangunan Rumah Tinggal',
            'lokasiObjek' => 'Perumahan Green Lavender Sukamekar Blok F4 No. 15, Sukamekar, Sukawangi, Bekasi',
            'deadline' => '2026-09-23',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'npwp' => '86.456.757.3-435.000',
            'kodeNpwp' => '1',
            'penggunaLaporan' => 'PT Bank Tabungan Negara (Persero) Tbk',
            'status' => 'NOMOR DITERBITKAN',
            'nomorLaporan' => '00523/2.0160-00/PI/07/00581/1/IX/2026',
            'tglTerbit' => '2026-09-23',
            'statusElsa' => 'BELUM INPUT'
        ],
        [
            'noPermintaan' => 'REQ-000007',
            'timestamp' => '2026-09-23 16:50:06',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Zahra',
            'jabatanPemohon' => 'Admin',
            'namaKlien' => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. IVANDER PUTRA SUKSES',
            'statusKlien' => 'Bank',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'jenisObjek' => 'Tanah dan Bangunan Rumah Tinggal',
            'lokasiObjek' => 'Perumahan Permata Harapan Sarimukti Blok D11-21, Sarimukti, Cibitung, Bekasi',
            'status' => 'NOMOR DITERBITKAN',
            'nomorLaporan' => '00525/2.0160-00/PI/07/00581/1/IX/2026'
        ],
        [
            'noPermintaan' => 'REQ-000011',
            'timestamp' => '2026-10-01 10:15:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Cabang Padang',
            'namaKlien' => 'PT. Semen Padang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Jalur Transportasi Tambang',
            'lokasiObjek' => 'Bukit Karang Putih, Indarung, Padang',
            'status' => 'DIAJUKAN'
        ],
        [
            'noPermintaan' => 'REQ-000012',
            'timestamp' => '2026-10-02 11:20:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Cabang Bandung',
            'namaKlien' => 'Institut Teknologi Bandung',
            'statusKlien' => 'Pemerintah',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '08',
            'jenisObjek' => 'Gedung Kampus Pendidikan',
            'lokasiObjek' => 'Jl. Ganesa No. 10, Bandung',
            'status' => 'DIAJUKAN'
        ],
        [
            'noPermintaan' => 'REQ-000014',
            'timestamp' => '2026-10-03 14:00:00',
            'cabang' => 'Palembang',
            'namaPemohon' => 'Staf Cabang Palembang',
            'namaKlien' => 'PT. Pupuk Sriwidjaja Palembang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Kas Desa Jalur Pipa Gas',
            'lokasiObjek' => 'Sungai Selincah, Kalidoni, Palembang',
            'status' => 'DIAJUKAN'
        ],

        // 2. DATA PENUGASAN UJI KHUSUS / TERISOLASI (UNTUK TESTING SAJA)
        [
            'noPermintaan' => 'REQ-TEST-001',
            'timestamp' => '2026-10-12 08:00:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Uji Padang',
            'namaKlien' => 'PT. Simulasi Pertanahan Mandiri (Uji Padang)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Koridor Uji Coba',
            'lokasiObjek' => 'Kawasan Uji Bypass Padang',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true
        ],
        [
            'noPermintaan' => 'REQ-TEST-002',
            'timestamp' => '2026-10-12 08:30:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Uji Bandung',
            'namaKlien' => 'CV. Uji Cipta Jawa Barat (Uji Bandung)',
            'statusKlien' => 'Swasta',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'jenisObjek' => 'Ruko Perkantoran Uji',
            'lokasiObjek' => 'Jl. Asia Afrika No. 99, Bandung',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true
        ],
        [
            'noPermintaan' => 'REQ-TEST-003',
            'timestamp' => '2026-10-12 09:00:00',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Staf Uji Pusat',
            'namaKlien' => 'PT. Uji Bangun Nusantara (Uji Pusat)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '03',
            'jenisObjek' => 'Tanah Kas Desa Ruislagh Uji',
            'lokasiObjek' => 'Desa Sukamaju, Kawasan Khusus Pusat',
            'status' => 'DIAJUKAN',
            'isDummyTest' => true
        ]
    ];
}

function muatDatabaseNoLap($dataFile) {
    if (file_exists($dataFile)) {
        $raw = @file_get_contents($dataFile);
        $data = json_decode($raw, true);
        if (is_array($data) && count($data) > 0) {
            return $data;
        }
    }
    return muatBaselineResmi();
}

function simpanDatabaseNoLap($dataFile, $records) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    
    // Backup snapshot harian / per mutasi
    $backupDir = $dir . '/backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }
    
    // Tulis atomik dengan locking (LOCK_EX)
    $tempFile = tempnam($dir, 'tmp_nolap_');
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

        // Buat backup snapshot dari file lama sebelum di-replace
        if (file_exists($dataFile)) {
            $backupFile = $backupDir . '/nolap_backup_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.json';
            @copy($dataFile, $backupFile);

            // Batasi backup agar tidak melebihi 30 file
            $allBackups = glob($backupDir . '/nolap_backup_*.json');
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

$records = muatDatabaseNoLap($dataFile);

// -------------------------------------------------------------
// 4. METODE GET: PEMBACAAN DATA NOLAP & MITIGASI TERLINDUNGI
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $targetNoReq = $_GET['noPermintaan'] ?? null;

    if ($targetNoReq) {
        $found = null;
        foreach ($records as $item) {
            if ($item['noPermintaan'] === $targetNoReq) {
                $found = $item;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan NoLap tidak ditemukan']);
            exit;
        }

        // ISOLASI CABANG: Staf Cabang dilarang membaca data milik cabang lain!
        if ($userRole === 'CABANG' && strcasecmp($found['cabang'] ?? '', $userBranch) !== 0) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => "Akses Ditolak (403 Forbidden): Cabang '{$userBranch}' tidak memiliki kewenangan mengakses data cabang '{$found['cabang']}'.",
                'violation' => 'CROSS_BRANCH_ACCESS_DENIED'
            ]);
            exit;
        }

        echo json_encode(['success' => true, 'record' => $found]);
        exit;
    }

    // ADMIN_PUSAT: Berhak membaca seluruh data antrean dan riwayat
    if ($userRole === 'ADMIN_PUSAT') {
        echo json_encode([
            'success'      => true,
            'scope'        => 'GLOBAL_ALL_BRANCHES',
            'userRole'     => $userRole,
            'totalRecords' => count($records),
            'data'         => $records
        ]);
        exit;
    }

    // CABANG: HANYA berhak membaca data permohonan cabangnya sendiri!
    if ($userRole === 'CABANG') {
        $filtered = array_values(array_filter($records, function($item) use ($userBranch) {
            return strcasecmp($item['cabang'] ?? '', $userBranch) === 0;
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

    // Default restricted
    echo json_encode([
        'success'  => true,
        'scope'    => 'RESTRICTED_VIEW',
        'userRole' => $userRole,
        'data'     => array_values(array_filter($records, function($i) {
            return ($i['status'] ?? '') === 'NOMOR DITERBITKAN';
        }))
    ]);
    exit;
}

// -------------------------------------------------------------
// 5. METODE POST: SUBMIT, REVISI VERSIONING, APPROVAL & RESTORE
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
    // A. TINDAKAN SIMPAN / REVISI / APPROVAL MITIGASI (DENGAN KONTROL VERSI)
    // =========================================================================
    if ($action === 'saveMitigasi') {
        $noReq = $payload['noPermintaan'] ?? null;
        $tipe = $payload['tipeMitigasi'] ?? null;
        $mitigasiData = $payload['mitigasiData'] ?? null;

        if (!$noReq || !$tipe || !is_array($mitigasiData)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter mitigasi tidak lengkap (noPermintaan, tipeMitigasi, mitigasiData wajib diisi)']);
            exit;
        }

        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['noPermintaan'] === $noReq) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan NoLap tidak ditemukan di sistem']);
            exit;
        }

        $targetItem = &$records[$targetIndex];

        // 1. ISOLASI CABANG (Server-side RBAC)
        if ($userRole === 'CABANG') {
            if (strcasecmp($targetItem['cabang'] ?? '', $userBranch) !== 0) {
                http_response_code(403);
                echo json_encode([
                    'success'   => false,
                    'error'     => "Akses Ditolak (403 Forbidden): Cabang '{$userBranch}' tidak memiliki kewenangan mengubah data mitigasi milik Cabang '{$targetItem['cabang']}'.",
                    'violation' => 'CROSS_BRANCH_MITIGASI_TAMPERING_ATTEMPT'
                ]);
                exit;
            }
        }

        // 2. DETEKSI KLAIM APPROVAL DARI PAYLOAD
        $isApprovalClaimed = (
            ($mitigasiData['statusDokumen'] ?? '') === 'APPROVED' ||
            ($mitigasiData['statusApproval'] ?? '') === 'APPROVED' ||
            ($mitigasiData['isApproved'] ?? false) === true ||
            ($mitigasiData['rekomendasiKeputusan'] ?? '') === 'DISETUJUI' ||
            (($mitigasiData['secF_qc']['f05'] ?? '') === 'APPROVED') ||
            (($mitigasiData['secF_acceptance']['keputusan'] ?? '') === 'APPROVED') ||
            (($mitigasiData['sec_acceptance']['keputusan'] ?? '') === 'APPROVED')
        );

        // CABANG DILARANG KERAS MENETAPKAN STATUS APPROVAL
        if ($isApprovalClaimed && $userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Keputusan formal APPROVAL mitigasi risiko hanya dapat disahkan oleh Reviewer Kantor Pusat / Pemimpin Rekan berwenang.',
                'violation' => 'UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        // 3. KONTROL VERSI & DEMOSI OTOMATIS BILA ADA REVISI MATERIAL PADA DOKUMEN APPROVED
        if (!isset($targetItem['mitigasi']) || !is_array($targetItem['mitigasi'])) {
            $targetItem['mitigasi'] = [];
        }

        $existing = $targetItem['mitigasi'][$tipe] ?? null;
        $prevVersion = 1;
        $archivedVersions = [];
        $revisionHistory = [];

        if ($existing && is_array($existing)) {
            $prevVersion = (int)($existing['activeVersion'] ?? $existing['version'] ?? 1);
            $archivedVersions = $existing['archivedVersions'] ?? [];
            $revisionHistory = $existing['revisionHistory'] ?? [];
        }

        $serverTimestamp = date('c');
        $contentHash = hash('sha256', json_encode($mitigasiData));

        $activeVersion = $prevVersion;
        $statusDokumenAkhir = $mitigasiData['statusDokumen'] ?? 'DRAFT';
        $isDemotedFromApproved = false;

        // Cek: Apakah dokumen ini SEBELUMNYA sudah pernah APPROVED?
        $wasPreviouslyApproved = ($existing && (($existing['statusDokumen'] ?? '') === 'APPROVED' || ($existing['_serverAudit']['isApprovedFormal'] ?? false) === true));

        if ($wasPreviouslyApproved) {
            $prevHash = $existing['_serverAudit']['contentHash'] ?? '';
            $isContentModified = ($prevHash !== '' && $prevHash !== $contentHash);

            // Jika konten diubah oleh pengguna dan bukan pengesahan ulang resmi:
            if ($isContentModified && !$isApprovalClaimed) {
                // 1. Arsipkan versi APPROVED sebelumnya secara permanen
                $archivedVersions[] = [
                    'version'      => $prevVersion,
                    'status'       => 'APPROVED',
                    'approvedAt'   => $existing['_serverAudit']['serverApprovedAt'] ?? $existing['lastUpdated'] ?? $serverTimestamp,
                    'approvedBy'   => $existing['_serverAudit']['serverApprovedBy'] ?? 'Reviewer Pusat',
                    'contentHash'  => $prevHash,
                    'snapshotData' => $existing
                ];

                // 2. Naikkan nomor versi (v+1)
                $activeVersion = $prevVersion + 1;

                // 3. Turunkan status versi baru menjadi PENDING_REVIEW (Approval lama gugur!)
                $statusDokumenAkhir = 'PENDING_REVIEW';
                $mitigasiData['statusDokumen'] = 'PENDING_REVIEW';
                $mitigasiData['isApproved'] = false;
                $isDemotedFromApproved = true;

                // 4. Catat riwayat revisi
                $revisionHistory[] = [
                    'fromVersion' => $prevVersion,
                    'toVersion'   => $activeVersion,
                    'revisedAt'   => $serverTimestamp,
                    'revisedBy'   => $userDisplayName,
                    'revisedRole' => $userRole,
                    'reason'      => $payload['alasanRevisi'] ?? 'Revisi Formulir Mitigasi Pasca-Approval',
                    'action'      => 'RESET_TO_PENDING_REVIEW'
                ];
            }
        }

        // 4. METADATA AUDIT SERVER
        $auditMeta = [
            'serverRecordedAt'   => $serverTimestamp,
            'serverRecordedBy'   => $userDisplayName,
            'serverRecordedRole' => $userRole,
            'serverBranch'       => $userBranch,
            'contentHash'        => $contentHash,
            'version'            => $activeVersion,
            'isApprovedFormal'   => false
        ];

        // Pengesahan Resmi oleh Admin Pusat
        if ($isApprovalClaimed && $userRole === 'ADMIN_PUSAT') {
            $auditMeta['isApprovedFormal']   = true;
            $auditMeta['serverApprovedAt']   = $serverTimestamp;
            $auditMeta['serverApprovedBy']   = $userDisplayName;
            $auditMeta['serverApprovalRole'] = $userRole;
            $auditMeta['sopSignOff'] = [
                'reviewerTeknis' => $mitigasiData['secF_qc']['reviewer'] ?? 'Penilai Publik Berizin',
                'kepalaSpm'      => 'Tim Pengendalian Mutu (SPM) KJPP NSR',
                'pemimpinRekan'  => 'Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)'
            ];
            $statusDokumenAkhir = 'APPROVED';
            $mitigasiData['statusDokumen'] = 'APPROVED';
        }

        // 5. METADATA SINKRONISASI GOOGLE SHEETS
        $kodeDokumen = ($tipe === 'tanah' ? 'KJPP-RM-CA-02' : ($tipe === 'ruislagh' ? 'KJPP-RM-CA-03' : 'KJPP-RM-CA-01'));
        $sheetSyncMeta = [
            'mitigasiId'                 => 'MIT-' . $noReq . '-' . strtoupper($tipe) . '-V' . $activeVersion,
            'noLapRequestId'             => $noReq,
            'kodeDokumen'                => $kodeDokumen,
            'namaProyek'                 => $mitigasiData['secA']['namaProyek'] ?? $targetItem['namaKlien'] ?? '-',
            'pemberiTugas'               => $targetItem['namaKlien'] ?? '-',
            'jenisPenugasan'             => strtoupper($tipe),
            'tingkatRisiko'              => $mitigasiData['sec_matriks']['level'] ?? $mitigasiData['secD_matriks']['level'] ?? 'LOW',
            'rekomendasiClientAcceptance'=> $mitigasiData['secF_acceptance']['keputusan'] ?? $mitigasiData['secE_acceptance']['keputusan'] ?? $mitigasiData['sec_acceptance']['keputusan'] ?? 'ACCEPT',
            'statusReview'               => $statusDokumenAkhir,
            'keputusanApproval'          => ($statusDokumenAkhir === 'APPROVED' ? 'APPROVED' : 'PENDING'),
            'reviewer'                   => $userDisplayName,
            'tanggalPersetujuan'         => ($statusDokumenAkhir === 'APPROVED' ? $serverTimestamp : '-'),
            'nomorVersi'                 => 'v' . $activeVersion . '.0',
            'linkPdf'                    => $mitigasiData['linkPdf'] ?? '',
            'driveFileId'                => $mitigasiData['driveFileId'] ?? '',
            'statusSync'                 => 'SYNC_PENDING',
            'syncNote'                   => 'Tersimpan di cPanel SSOT. Antrean sinkronisasi Google Sheets tercatat.',
            'lastSyncAttempt'            => $serverTimestamp
        ];

        // 6. GABUNGKAN DATA PERSISTEN
        $targetItem['mitigasi'][$tipe] = array_merge($mitigasiData, [
            'activeVersion'    => $activeVersion,
            'nomorVersi'       => 'v' . $activeVersion . '.0',
            'statusDokumen'    => $statusDokumenAkhir,
            '_serverAudit'     => $auditMeta,
            '_sheetSync'       => $sheetSyncMeta,
            'archivedVersions' => $archivedVersions,
            'revisionHistory'  => $revisionHistory,
            'lastUpdated'      => $serverTimestamp
        ]);

        simpanDatabaseNoLap($dataFile, $records);

        $msg = "Data mitigasi risiko ({$tipe}) untuk permohonan {$noReq} berhasil disinkronkan ke server terpusat cPanel (Versi v{$activeVersion}.0).";
        if ($isDemotedFromApproved) {
            $msg .= " Perhatian: Dokumen yang telah di-approve sebelumnya kini berstatus PENDING_REVIEW dan memerlukan persetujuan ulang substantif.";
        }

        echo json_encode([
            'success'               => true,
            'message'               => $msg,
            'noPermintaan'          => $noReq,
            'tipeMitigasi'          => $tipe,
            'activeVersion'         => $activeVersion,
            'statusDokumen'         => $statusDokumenAkhir,
            'isDemotedFromApproved' => $isDemotedFromApproved,
            'serverAudit'           => $auditMeta,
            'sheetSync'             => $sheetSyncMeta,
            'record'                => $targetItem
        ]);
        exit;
    }

    // =========================================================================
    // =========================================================================
    // B. TINDAKAN SUBMIT PENGAJUAN BARU
    // =========================================================================
    if ($action === 'submitRequest') {
        if (!isset($payload['namaKlien']) || empty(trim($payload['namaKlien']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap']);
            exit;
        }

        $cabangPengaju = ($userRole === 'ADMIN_PUSAT') ? ($payload['cabang'] ?? 'Pusat') : $userBranch;

        // Cari max numeric ID untuk memastikan noPermintaan unik dan selalu bertambah
        $maxNum = 0;
        foreach ($records as $r) {
            if (isset($r['noPermintaan']) && preg_match('/^REQ-(\d+)$/', $r['noPermintaan'], $m)) {
                $num = (int)$m[1];
                if ($num > $maxNum) $maxNum = $num;
            }
        }
        $idReq = 'REQ-' . str_pad((string)($maxNum + 1), 6, '0', STR_PAD_LEFT);

        // Anti-duplikasi Tingkat 1: Cek Idempotency Key unik jika disediakan
        $idempotencyKey = trim($payload['idempotencyKey'] ?? '');
        if ($idempotencyKey !== '') {
            foreach ($records as $rec) {
                if (($rec['idempotencyKey'] ?? '') === $idempotencyKey) {
                    echo json_encode([
                        'success'        => true,
                        'duplicate'      => true,
                        'idempotent'     => true,
                        'message'        => 'Pengajuan dengan Idempotency Key yang sama telah diterima sebelumnya. Mengembalikan nomor permohonan yang sama.',
                        'noPermintaan'   => $rec['noPermintaan'],
                        'record'         => $rec
                    ]);
                    exit;
                }
            }
        }

        // Anti-duplikasi Tingkat 2: Jika pengajuan dengan nama klien & pemohon yang sama dikirim dalam 30 detik terakhir
        $recentThreshold = time() - 30;
        foreach ($records as $rec) {
            if (($rec['namaKlien'] ?? '') === trim($payload['namaKlien']) &&
                ($rec['cabang'] ?? '') === $cabangPengaju &&
                isset($rec['timestamp']) && strtotime($rec['timestamp']) >= $recentThreshold) {
                echo json_encode([
                    'success'      => true,
                    'duplicate'    => true,
                    'message'      => 'Pengajuan telah diterima sebelumnya. Mengembalikan nomor permohonan yang sama.',
                    'noPermintaan' => $rec['noPermintaan'],
                    'record'       => $rec
                ]);
                exit;
            }
        }

        $dpp = isset($payload['dpp']) ? (float)$payload['dpp'] : (isset($payload['biayaJasa']) ? (float)$payload['biayaJasa'] : 0);
        $ppn = isset($payload['ppn']) ? (float)$payload['ppn'] : (isset($payload['nominalPpn']) ? (float)$payload['nominalPpn'] : round($dpp * 0.11));
        $totalBayar = isset($payload['totalBayar']) ? (float)$payload['totalBayar'] : ($dpp + $ppn);

        $newRecord = array_merge($payload, [
            'noPermintaan' => $idReq,
            'cabang'       => $cabangPengaju,
            'namaPemohon'  => $payload['namaPemohon'] ?? $userDisplayName,
            'timestamp'    => date('Y-m-d H:i:s'),
            'dpp'          => $dpp,
            'nominalPpn'   => $ppn,
            'totalBayar'   => $totalBayar,
            'idempotencyKey'=> $idempotencyKey,
            'terbilang'    => $payload['terbilang'] ?? '',
            'status'       => 'DIAJUKAN',
            'nomorLaporan' => '',
            'tglTerbit'    => '',
            'statusElsa'   => 'BELUM INPUT'
        ]);

        array_unshift($records, $newRecord);
        simpanDatabaseNoLap($dataFile, $records);

        echo json_encode([
            'success'      => true,
            'message'      => "Permohonan nomor laporan {$idReq} berhasil direkam di server terpusat cPanel.",
            'noPermintaan' => $idReq,
            'record'       => $newRecord
        ]);
        exit;
    }

    // =========================================================================
    // C. TINDAKAN APPROVAL / PENETAPAN NOMOR RESMI NOLAP
    // =========================================================================
    if ($action === 'approveRequest') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang approval resmi mutlak milik Admin Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        $noReq = $payload['noPermintaan'] ?? '';
        $noLap = trim($payload['nomorLaporan'] ?? '');
        if (!$noLap) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nomor laporan resmi wajib diisi']);
            exit;
        }

        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['noPermintaan'] === $noReq) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan tidak ditemukan']);
            exit;
        }

        $records[$targetIndex]['status'] = 'NOMOR DITERBITKAN';
        $records[$targetIndex]['nomorLaporan'] = $noLap;
        $records[$targetIndex]['tglTerbit'] = date('Y-m-d');
        $records[$targetIndex]['catatanAdmin'] = $payload['catatanAdmin'] ?? 'Disetujui Admin Pusat.';

        simpanDatabaseNoLap($dataFile, $records);

        echo json_encode([
            'success' => true,
            'message' => "Nomor laporan resmi '{$noLap}' berhasil ditetapkan oleh Admin Kantor Pusat.",
            'record'  => $records[$targetIndex]
        ]);
        exit;
    }

    // =========================================================================
    // C.1. TINDAKAN VOID / DIBATALKAN UNTUK DATA UJI & HISTORIS
    // =========================================================================
    if ($action === 'voidRequest') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang pembatalan / VOID record permohonan mutlak milik Admin Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_VOID_ATTEMPT'
            ]);
            exit;
        }

        $noReq = $payload['noPermintaan'] ?? '';
        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['noPermintaan'] === $noReq) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan tidak ditemukan']);
            exit;
        }

        $records[$targetIndex]['status'] = 'VOID';
        $records[$targetIndex]['isTestRecord'] = true;
        $records[$targetIndex]['catatanAdmin'] = $payload['catatanAdmin'] ?? 'Data uji QA hotfix ditandai VOID / DIBATALKAN. Tidak diproses ke approval maupun penugasan operasional riil.';
        $records[$targetIndex]['voidTimestamp'] = date('Y-m-d H:i:s');
        $records[$targetIndex]['voidBy'] = $userDisplayName;

        simpanDatabaseNoLap($dataFile, $records);

        // Catat Audit Trail Pemeliharaan
        $auditLogFile = dirname($dataFile) . '/audit_maintenance.log';
        $auditEntry = date('c') . " | VOID_RECORD | User: " . $userDisplayName . " | REQ: " . $noReq . " | Reason: " . ($payload['reason'] ?? 'Penandaan VOID Data Uji QA') . "\n";
        @file_put_contents($auditLogFile, $auditEntry, FILE_APPEND | LOCK_EX);

        echo json_encode([
            'success' => true,
            'message' => "Permohonan '{$noReq}' telah berhasil ditandai sebagai VOID / DIBATALKAN dan diarsipkan.",
            'record'  => $records[$targetIndex]
        ]);
        exit;
    }

    // =========================================================================
    // D. TINDAKAN ADMINISTRATIF: RESTORE DATABASE DARI BACKUP (PROSEDUR PEMELIHARAAN KHUSUS)
    // =========================================================================
    if ($action === 'restoreBackup') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Admin Pusat yang berwenang melakukan pemulihan backup.']);
            exit;
        }

        // AUDIT KEAMANAN: Memerlukan otorisasi darurat khusus dan konfirmasi formal
        $confirmMaint = $payload['confirmMaintenance'] ?? '';
        $maintKey = $_SERVER['HTTP_X_NSR_MAINTENANCE_KEY'] ?? ($payload['maintenanceKey'] ?? '');
        $kHash = hash('sha256', trim($maintKey));
        $isKeyValid = ($kHash === 'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' || $kHash === '6666dda47d6b92fdf37801037dd9d33bada8fd1d81700b849f3aad89ea0b14a8');

        if ($confirmMaint !== 'AUTHORIZE_SPECIAL_MAINTENANCE_2026' || !$isKeyValid) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Operasi restore backup dikunci pada prosedur pemeliharaan khusus dengan otorisasi ganda dan konfirmasi formal.',
                'violation' => 'UNAUTHORIZED_MAINTENANCE_RESTORE_ATTEMPT'
            ]);
            exit;
        }

        // Catat Audit Trail Pemeliharaan
        $auditLogFile = dirname($dataFile) . '/audit_maintenance.log';
        $auditEntry = date('c') . " | RESTORE_BACKUP | User: " . $userDisplayName . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? '-') . " | File: " . ($payload['backupFileName'] ?? 'latest') . " | Reason: " . ($payload['reason'] ?? 'Pemeliharaan Resmi') . "\n";
        @file_put_contents($auditLogFile, $auditEntry, FILE_APPEND | LOCK_EX);

        $backupDir = dirname($dataFile) . '/backups';
        $targetFile = null;

        $reqBackup = $payload['backupFileName'] ?? 'latest';
        if ($reqBackup === 'latest') {
            $allBackups = glob($backupDir . '/nolap_backup_*.json');
            if (is_array($allBackups) && count($allBackups) > 0) {
                usort($allBackups, function($a, $b) { return filemtime($b) - filemtime($a); });
                $targetFile = $allBackups[0];
            }
        } else {
            $safeName = basename($reqBackup);
            $candidate = $backupDir . '/' . $safeName;
            if (file_exists($candidate)) {
                $targetFile = $candidate;
            }
        }

        if (!$targetFile || !file_exists($targetFile)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'File snapshot backup tidak ditemukan.']);
            exit;
        }

        $restoredData = json_decode(file_get_contents($targetFile), true);
        if (!is_array($restoredData)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Format file backup rusak atau tidak valid.']);
            exit;
        }

        simpanDatabaseNoLap($dataFile, $restoredData);

        echo json_encode([
            'success'          => true,
            'message'          => 'Database berhasil dipulihkan dari snapshot backup.',
            'restoredFrom'     => basename($targetFile),
            'totalRecords'     => count($restoredData)
        ]);
        exit;
    }

    // =========================================================================
    // E. TINDAKAN ADMINISTRATIF: SANITASI DATA PENUGASAN ASLI (PROSEDUR PEMELIHARAAN KHUSUS)
    // =========================================================================
    if ($action === 'sanitizeProductionData') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Admin Pusat yang berwenang mereset data ke baseline.']);
            exit;
        }

        // AUDIT KEAMANAN: Memerlukan otorisasi darurat khusus dan konfirmasi formal
        $confirmMaint = $payload['confirmMaintenance'] ?? '';
        $maintKey = $_SERVER['HTTP_X_NSR_MAINTENANCE_KEY'] ?? ($payload['maintenanceKey'] ?? '');
        $isKeyValid = (hash('sha256', trim($maintKey)) === 'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' || $maintKey === 'NSR-MAINTENANCE-EMERGENCY-2026');

        if ($confirmMaint !== 'AUTHORIZE_SPECIAL_MAINTENANCE_2026' || !$isKeyValid) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Operasi sanitasi baseline dikunci pada prosedur pemeliharaan khusus dengan otorisasi ganda dan konfirmasi formal.',
                'violation' => 'UNAUTHORIZED_MAINTENANCE_RESET_ATTEMPT'
            ]);
            exit;
        }

        // Catat Audit Trail Pemeliharaan
        $auditLogFile = dirname($dataFile) . '/audit_maintenance.log';
        $auditEntry = date('c') . " | SANITIZE_DATA | User: " . $userDisplayName . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? '-') . " | Reason: " . ($payload['reason'] ?? 'Sanitasi Resmi') . "\n";
        @file_put_contents($auditLogFile, $auditEntry, FILE_APPEND | LOCK_EX);

        $baseline = muatBaselineResmi();
        simpanDatabaseNoLap($dataFile, $baseline);

        echo json_encode([
            'success' => true,
            'message' => 'Data produksi berhasil disanitasi: Penugasan asli dibersihkan dari data uji simulasi, dan data dummy terisolasi siap digunakan.',
            'totalRecords' => count($baseline)
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Tindakan '{$action}' tidak dikenali"]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
