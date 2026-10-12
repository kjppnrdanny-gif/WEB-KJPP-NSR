<?php
/**
 * KJPP NSR — Server-Side Protected Data Proxy untuk Portal NoLap (cPanel Native Edition)
 * 
 * Keamanan & RBAC di sisi server (Apache + PHP 8.x):
 * 1. 401 Unauthorized jika tidak memiliki sesi sah atau token akses valid.
 * 2. 403 Forbidden jika Staf Cabang mencoba mengakses/mengubah data permohonan cabang lain.
 * 3. 403 Forbidden jika non-Admin Pusat mengklaim status persetujuan (APPROVED).
 * 4. Audit trail server-side: server timestamp (ISO 8601), user displayName, role, dan SHA-256 integrity hash.
 * 5. Penyimpanan persisten terpusat (Single Source of Truth / SSOT) di server produksi.
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
// 1. DATA TOKENS RESMI UNTUK VALIDASI BEARER API / TOKEN HEADER
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // Pusat: JKT#00 / NSR-PST-2026
    '3d5d2d69641b1e88d2b96d64119430b1716a24f00937acfe79f22a713d3a9be7' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    // Bandung: BDG#010 / NSR-BDG-2026
    'a52e824efe550c1e89aa3026587e4aa54620e597fcc977b2c88876870c88a4cb' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    // Padang: PDG#020 / NSR-PDG-2026
    '6b838f77d520840a9bd8adb2e01d75ad511ea2f2d371b1ac16809e8fe1ac11bd' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    // Makassar: MKS#030 / NSR-MKS-2026
    '3c56bf3fbad429421e401e6ca9b335734a90b9986d9af890c12e2cf69f6129d4' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    // Palembang: PLB#040 / NSR-PLB-2026 / NSR-PLM-2026
    '8eec45b74d429d76724acd10312485fee4f180cddf0fd7210eb0da736c878ab3' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    'c20c16d688a686f8cd5ac12f4949b8dac6b4937d513f92a00514ee6122368ed2' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    // Master Ops: NSR8899 / NSR2026
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => ['sub' => 'admin_master', 'branch' => 'Pusat', 'displayName' => 'Master Operasional Pusat', 'role' => 'ADMIN_PUSAT'],
    'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91' => ['sub' => 'admin_master', 'branch' => 'Pusat', 'displayName' => 'Master Operasional Pusat', 'role' => 'ADMIN_PUSAT']
];

// -------------------------------------------------------------
// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)
// -------------------------------------------------------------
$currentUser = null;

// A. Periksa dari Sesi PHP (Login Cookie HttpOnly NSR_SESSION)
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    if (time() - $loginTime < 28800) {
        $currentUser = $_SESSION['nsr_user'];
    }
}

// B. Periksa dari Authorization Header (Bearer Token)
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

// C. Periksa dari custom header X-NSR-Token
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
// 3. PERSISTENT STORAGE MANAGEMENT (SSOT)
// -------------------------------------------------------------
$dataFile = __DIR__ . '/nolap-data.json';

function muatDatabaseNoLap($dataFile) {
    if (file_exists($dataFile)) {
        $raw = @file_get_contents($dataFile);
        $data = json_decode($raw, true);
        if (is_array($data) && count($data) > 0) {
            return $data;
        }
    }
    // Baseline dataset resmi jika data file belum diinisialisasi
    return [
        [
            'noPermintaan' => 'REQ-000006',
            'timestamp' => '2026-09-23 16:47:33',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Zahra',
            'jabatanPemohon' => 'Admin',
            'emailPemohon' => 'kjppnsr.adm2@gmail.com',
            'waPemohon' => '0895391057740',
            'namaKlien' => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. IVANDER PUTRA SUKSES',
            'statusKlien' => 'Bank',
            'alamatKlien' => 'Kp. Bojong RT.01 RW.15, Sarimukti, Cibitung, Bekasi, Jawa Barat',
            'kontakKlien' => '081314489587',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'tujuanPenilaian' => 'Penjaminan Utang',
            'jenisObjek' => 'Tanah dan Bangunan Rumah Tinggal',
            'lokasiObjek' => 'Perumahan Permata Harapan Sarimukti Blok D8-6, Sarimukti, Cibitung, Bekasi',
            'deadline' => '2026-09-23',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'npwp' => '42.258.163.7-435.000',
            'kodeNpwp' => '1',
            'penggunaLaporan' => 'PT Bank Tabungan Negara (Persero) Tbk',
            'status' => 'NOMOR DITERBITKAN',
            'nomorLaporan' => '00524/2.0160-00/PI/07/00581/1/IX/2026',
            'tglTerbit' => '2026-09-24',
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
        ]
    ];
}

function simpanDatabaseNoLap($dataFile, $records) {
    $tempFile = $dataFile . '.tmp.' . uniqid();
    $json = json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents($tempFile, $json, LOCK_EX) !== false) {
        return rename($tempFile, $dataFile);
    }
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
// 5. METODE POST: SUBMIT PENGAJUAN, MITIGASI & APPROVAL
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

    // A. TINDAKAN SIMPAN / SINKRONISASI DATA MITIGASI RISIKO (KJPP-RM-CA-01, 02, 03)
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

        // ISOLASI CABANG (Server-side RBAC):
        // Staf Cabang DILARANG KERAS menyimpan atau memodifikasi mitigasi milik cabang lain!
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

        // VALIDASI APPROVAL:
        // Status 'APPROVED' TIDAK BOLEH ditetapkan oleh Cabang atau peran non-Pusat!
        $isApprovalClaimed = (
            ($mitigasiData['statusDokumen'] ?? '') === 'APPROVED' ||
            ($mitigasiData['statusApproval'] ?? '') === 'APPROVED' ||
            ($mitigasiData['isApproved'] ?? false) === true ||
            ($mitigasiData['rekomendasiKeputusan'] ?? '') === 'DISETUJUI' ||
            (($mitigasiData['secF_qc']['f05'] ?? '') === 'APPROVED') ||
            (($mitigasiData['secF_acceptance']['keputusan'] ?? '') === 'APPROVED') ||
            (($mitigasiData['sec_acceptance']['keputusan'] ?? '') === 'APPROVED')
        );

        if ($isApprovalClaimed && $userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Keputusan formal APPROVAL mitigasi risiko hanya dapat disahkan oleh Reviewer Kantor Pusat / Pemimpin Rekan berwenang.',
                'violation' => 'UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        // Metadata Server Audit Trail
        $serverTimestamp = date('c');
        $contentHash = hash('sha256', json_encode($mitigasiData));

        $auditMeta = [
            'serverRecordedAt'   => $serverTimestamp,
            'serverRecordedBy'   => $userDisplayName,
            'serverRecordedRole' => $userRole,
            'serverBranch'       => $userBranch,
            'contentHash'        => $contentHash,
            'isApprovedFormal'   => false
        ];

        if ($isApprovalClaimed && $userRole === 'ADMIN_PUSAT') {
            $auditMeta['isApprovedFormal']   = true;
            $auditMeta['serverApprovedAt']   = $serverTimestamp;
            $auditMeta['serverApprovedBy']   = $userDisplayName;
            $auditMeta['serverApprovalRole'] = $userRole;
        }

        if (!isset($targetItem['mitigasi']) || !is_array($targetItem['mitigasi'])) {
            $targetItem['mitigasi'] = [];
        }

        $targetItem['mitigasi'][$tipe] = array_merge($mitigasiData, [
            '_serverAudit' => $auditMeta,
            'lastUpdated'  => $serverTimestamp
        ]);

        simpanDatabaseNoLap($dataFile, $records);

        echo json_encode([
            'success'      => true,
            'message'      => "Data mitigasi risiko ({$tipe}) untuk permohonan {$noReq} berhasil disinkronkan ke server terpusat cPanel.",
            'noPermintaan' => $noReq,
            'tipeMitigasi' => $tipe,
            'serverAudit'  => $auditMeta,
            'record'       => $targetItem
        ]);
        exit;
    }

    // B. TINDAKAN SUBMIT PENGAJUAN BARU
    if ($action === 'submitRequest') {
        if (!isset($payload['namaKlien']) || empty(trim($payload['namaKlien']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap']);
            exit;
        }

        $cabangPengaju = ($userRole === 'ADMIN_PUSAT') ? ($payload['cabang'] ?? 'Pusat') : $userBranch;
        $idReq = 'REQ-' . str_pad((string)(count($records) + 1), 6, '0', STR_PAD_LEFT);

        $newRecord = array_merge($payload, [
            'noPermintaan' => $idReq,
            'cabang' => $cabangPengaju,
            'namaPemohon' => $userDisplayName,
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'DIAJUKAN',
            'nomorLaporan' => '',
            'tglTerbit' => '',
            'statusElsa' => 'BELUM INPUT'
        ]);

        array_unshift($records, $newRecord);
        simpanDatabaseNoLap($dataFile, $records);

        echo json_encode([
            'success' => true,
            'message' => 'Permohonan nomor laporan berhasil direkam di server terpusat cPanel.',
            'record'  => $newRecord
        ]);
        exit;
    }

    // C. TINDAKAN APPROVAL / PENETAPAN NOMOR RESMI
    if ($action === 'approveRequest') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error'   => 'Akses Ditolak (403 Forbidden): Wewenang approval resmi mutlak milik Admin Kantor Pusat.',
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

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Tindakan '{$action}' tidak dikenali"]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
