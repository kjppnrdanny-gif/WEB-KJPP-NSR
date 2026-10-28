<?php
/**
 * KJPP NSR — Backend Data Handler & Cryptographic Engine untuk e-Operasional
 * Modul: Portal Pengajuan Operasional Terpadu (cPanel Native Edition)
 * Target: Branch dev (KMK No. 2.19.0160)
 *
 * Fitur Utama:
 * 1. Single Source of Truth (SSOT): data/operasional_database.json
 * 2. Concurrency Safe & Atomic Write: flock(LOCK_EX) & flock(LOCK_SH) + temp file atomic rename
 * 3. 5-Tier Sequential Approval Workflow (Tier 1 -> Tier 2 -> Tier 3 -> Tier 4 -> Tier 5)
 * 4. Cryptographic HMAC Verification (SHA-256) binding doc ID, tier, version, content digest, pejabat, timestamp
 * 5. Dynamic Atomic Document Numbering: [JENIS]/[KODE-KANTOR]/[BULAN-ROMAWI]/[TAHUN]/[URUT]
 * 6. Audit Trail & Automated Backup
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Access-Control-Allow-Credentials: true');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];

// Proteksi CSRF: Validasi Host Origin & Referer (Mendukung Staging Preview & Same-Origin)
$hostToCheck = '';
if ($origin) {
    $hostToCheck = parse_url($origin, PHP_URL_HOST);
} elseif ($referer) {
    $hostToCheck = parse_url($referer, PHP_URL_HOST);
}

$selfHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
$isAllowedOrigin = in_array($hostToCheck, $allowedHosts, true) ||
                   ($hostToCheck && $hostToCheck === $selfHost) ||
                   ($hostToCheck && preg_match('/\.(lhr\.life|trycloudflare\.com|loca\.lt)$/i', $hostToCheck));

if ($hostToCheck && !$isAllowedOrigin) {
    http_response_code(403);
    echo json_encode([
        'success'   => false,
        'error'     => 'Akses Ditolak (403 Forbidden): Pelanggaran kebijakan Origin / Referer (CSRF Protection).',
        'violation' => 'CSRF_REJECTED'
    ]);
    exit;
}

if ($origin && $isAllowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
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
// -------------------------------------------------------------
// 1. DATA TOKENS RESMI UNTUK VALIDASI API / BEARER / HEADER
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // =============================================================
    // TOKENS DEMO STAGING BARU (ISOLASI PREVIEW)
    // Catatan: Kredensial staging ditolak otomatis untuk approval di produksi
    // =============================================================
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [ // NSR-STAGE-MASTER-77
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Pemimpin Rekan & Super Admin Master (Staging)',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8' => [ // NSR-STAGE-PR-55
        'sub'               => 'partner_nanang',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Pemimpin Rekan (Penanggung Jawab - Staging)',
        'title'             => 'Pemimpin Rekan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8'
    ],
    '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10' => [ // NSR-STAGE-REK-22
        'sub'               => 'rekan_deni',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1 - Staging)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10'
    ],
    'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea' => [ // NSR-STAGE-ADM-33
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin, Umum & Legal (Tingkat 1 - Staging)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => 'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea'
    ],
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [ // NSR-STAGE-KEU-44
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Verifikasi Anggaran - Tingkat 2 - Staging)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f' => [ // NSR-STAGE-SRV-11 (Holik Kelana - Staf Lapangan)
        'sub'               => 'surveyor_holik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff Staging)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => 'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f'
    ],
    '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce' => [ // NSR-STAGE-PLB-03
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => '03',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-03',
        'isStaging'         => true,
        'tokenHash'         => '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce'
    ],
    '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff' => [ // NSR-STAGE-MKS-02
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => '02',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-02',
        'isStaging'         => true,
        'tokenHash'         => '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff'
    ],
    'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b' => [ // NSR-STAGE-PDG-01
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => '01',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-01',
        'isStaging'         => true,
        'tokenHash'         => 'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b'
    ],
    '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b' => [ // NSR-STAGE-BDG-04
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => '04',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-04',
        'isStaging'         => true,
        'tokenHash'         => '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ],

    // =============================================================
    // TOKENS PRODUKSI RESMI KJPP NANANG RAHAYU & REKAN (RBAC KETAT)
    // =============================================================

    // 1. DEDICATED TOKEN: MANAGER TEKNIK (Deni Siswandi, S.T. - NSR-DIVTEK-2026)
    'dd978492a43a62cdfaf0526c90957ae6443be71f7459a6dbcb4014ed3e4c24fb' => [ // NSR-DIVTEK-2026 (Raw SHA-256)
        'sub'               => 'manager_teknik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9'
    ],
    '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9' => [ // NSR-DIVTEK-2026 (Salted SHA-256)
        'sub'               => 'manager_teknik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9'
    ],

    // 2. KEPALA KEUANGAN & PEMIMPIN REKAN (Ir. Nanang Rahayu, M.Ec.Dev. - NSR-KEPKEU-2026)
    // NSR-KEPKEU-2026: Token resmi baru tidak terekspos untuk otorisasi final Tingkat 3
    '6a19d17c1a36f87a4c8b385d3b1ceda599bf3342f5dd3197bb79e8f63898a6ed' => [ // NSR-KEPKEU-2026 (Raw SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50'
    ],
    '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50' => [ // NSR-KEPKEU-2026 (Salted SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50'
    ],

    // AUDIT TOKEN TERESKPOS: NSR8899 - Hak approval dicabut total, hanya submit & view
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [ // NSR8899 (Raw SHA-256)
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan (Kredensial Non-Approval)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [ // NSR8899 (Salted SHA-256)
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan (Kredensial Non-Approval)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],

    // AUDIT TOKEN TERESKPOS: NSR-PST-2026 - Hak approval dialihkan eksklusif ke NSR-ADM-2026
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [ // NSR-PST-2026 (Raw SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Kredensial Non-Approval)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [ // NSR-PST-2026 (Salted SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Kredensial Non-Approval)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99' => [ // NSR-ADM-2026 (Raw SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Tingkat 1)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04' => [ // NSR-ADM-2026 (Salted SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Tingkat 1)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],

    // 4. MANAGER KEUANGAN (Milda Hidayati Dewi, S.E. - NSR-KEU-2026)
    '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d' => [ // NSR-KEU-2026 (Raw SHA-256)
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Tingkat 2)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0' => [ // NSR-KEU-2026 (Salted SHA-256)
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Tingkat 2)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],

    // 5. TOKENS STAF BIASA (DIBLOKIR TOTAL DARI SELURUH ENDPOINT APPROVAL/REJECT)
    // Penilai Properti (NSR-VAL-2026)
    '5801bb3891c492e6497bd5c0eb4d583606d07eed0058c05f8d4238c114b9f3e1' => [ // NSR-VAL-2026 (Raw SHA-256)
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Tim Penilai Properti',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai (Staff)',
        'title'             => 'Penilai Properti',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],
    'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e' => [ // NSR-VAL-2026 (Salted SHA-256)
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Tim Penilai Properti',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai (Staff)',
        'title'             => 'Penilai Properti',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],

    // Surveyor Lapangan (NSR-SRV-2026 - Holik Kelana)
    '422e642284f66071b52b6cd23e4856ee7e5acf6735f0bc5754173c270c487d4b' => [ // NSR-SRV-2026 (Raw SHA-256)
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],
    'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721' => [ // NSR-SRV-2026 (Salted SHA-256)
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],

    // Marketing (NSR-MKT-2026)
    '336c1d03b83f9a89f3f1fc33cc42192345b435f6e72f8e72ad43aaaaae6310fe' => [ // NSR-MKT-2026 (Raw SHA-256)
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Divisi Marketing & Bisnis',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing (Staff)',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],
    '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59' => [ // NSR-MKT-2026 (Salted SHA-256)
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Divisi Marketing & Bisnis',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing (Staff)',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],

    // 6. AUDIT TOKEN LAMA (HAK APPROVAL TEKNIS DICABUT DARI TOKEN UMUM)
    // NSR-REK-2026 (Rekan Mitra Umum - Hak approval teknis dicabut, hanya submit & view)
    '77d4e819966f67807537cf7e995ab765b911fc6be3d5101bbc0da473e9dbe4f2' => [ // NSR-REK-2026 (Raw SHA-256)
        'sub'               => 'rekan_umum',
        'branch'            => 'PUSAT',
        'displayName'       => 'Rekan Penilai',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mitra Umum)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2'
    ],
    'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2' => [ // NSR-REK-2026 (Salted SHA-256)
        'sub'               => 'rekan_umum',
        'branch'            => 'PUSAT',
        'displayName'       => 'Rekan Penilai',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mitra Umum)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2'
    ],

    // NSR-REV-2026 (Reviewer Mutu - Hak approval dicabut, wajib pakai NSR-DIVTEK-2026 untuk approval teknik)
    'da9ed250de0559c0e8cf6631bbd6e93375eec43c4d114d0f4f1ae17a4f5dd3a9' => [ // NSR-REV-2026 (Raw SHA-256)
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Reviewer Kendali Mutu',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer Mutu Teknis',
        'title'             => 'Reviewer',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],
    'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9' => [ // NSR-REV-2026 (Salted SHA-256)
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Reviewer Kendali Mutu',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer Mutu Teknis',
        'title'             => 'Reviewer',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],

    // 7. TOKENS KANTOR CABANG (DILARANG MENGAKSES e-OPERASIONAL)
    // Admin Cabang Bandung (NSR-BDG-2026)
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => [
        'sub'          => 'cabang_bdg',
        'branch'       => 'Bandung',
        'displayName'  => 'Kantor Cabang Bandung',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Bandung',
        'wilayah'      => 'Bandung',
        'wilayahCode'  => '04',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu' => '2.19.0160-04'
    ],
    '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d' => [
        'sub'          => 'cabang_bdg',
        'branch'       => 'Bandung',
        'displayName'  => 'Kantor Cabang Bandung',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Bandung',
        'wilayah'      => 'Bandung',
        'wilayahCode'  => '04',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu' => '2.19.0160-04'
    ],
    // Admin Cabang Padang (NSR-PDG-2026)
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => [
        'sub'          => 'cabang_pdg',
        'branch'       => 'Padang',
        'displayName'  => 'Kantor Cabang Padang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Padang',
        'wilayah'      => 'Padang',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu' => '2.19.0160-01'
    ],
    'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495' => [
        'sub'          => 'cabang_pdg',
        'branch'       => 'Padang',
        'displayName'  => 'Kantor Cabang Padang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Padang',
        'wilayah'      => 'Padang',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu' => '2.19.0160-01'
    ],
    // Admin Cabang Makassar (NSR-MKS-2026)
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => [
        'sub'          => 'cabang_mks',
        'branch'       => 'Makassar',
        'displayName'  => 'Kantor Cabang Makassar',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Makassar',
        'wilayah'      => 'Makassar',
        'wilayahCode'  => '02',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu' => '2.19.0160-02'
    ],
    'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569' => [
        'sub'          => 'cabang_mks',
        'branch'       => 'Makassar',
        'displayName'  => 'Kantor Cabang Makassar',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Makassar',
        'wilayah'      => 'Makassar',
        'wilayahCode'  => '02',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu' => '2.19.0160-02'
    ],
    // Admin Cabang Palembang (NSR-PLB-2026)
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => [
        'sub'          => 'cabang_plb',
        'branch'       => 'Palembang',
        'displayName'  => 'Kantor Cabang Palembang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Palembang',
        'wilayah'      => 'Palembang',
        'wilayahCode'  => '03',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu' => '2.19.0160-03'
    ],
    'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827' => [
        'sub'          => 'cabang_plb',
        'branch'       => 'Palembang',
        'displayName'  => 'Kantor Cabang Palembang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Palembang',
        'wilayah'      => 'Palembang',
        'wilayahCode'  => '03',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu' => '2.19.0160-03'
    ],
    // Keuangan Cabang (NSR-KAS-2026)
    'a01d6024094ea8618268233f1e73d79e400c76d36abb144b2d087896f2e3a6ca' => [
        'sub'          => 'kasir_cabang',
        'branch'       => 'CABANG',
        'displayName'  => 'Kasir & Keuangan Cabang',
        'role'         => 'KEUANGAN_CABANG',
        'roleLabel'    => 'Kasir Cabang',
        'wilayah'      => 'CABANG',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ],
    'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9' => [
        'sub'          => 'kasir_cabang',
        'branch'       => 'CABANG',
        'displayName'  => 'Kasir & Keuangan Cabang',
        'role'         => 'KEUANGAN_CABANG',
        'roleLabel'    => 'Kasir Cabang',
        'wilayah'      => 'CABANG',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ]
];

// -------------------------------------------------------------
// 2. HELPER DIREKTORI & PENYIMPANAN
// -------------------------------------------------------------
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
}
$dataFile = $dataDir . '/operasional_database.json';
$lockFile = $dataDir . '/.operasional_txn.lock';
$secretFile = $dataDir . '/.operasional_secret';

// Pastikan file secret tersedia dan rahasia
function isStagingEnvironment() {
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if (in_array($host, ['localhost', '127.0.0.1'], true) || strpos($host, 'localhost:') === 0 || strpos($host, '127.0.0.1:') === 0) {
        return true;
    }
    if (preg_match('/\.(lhr\.life|trycloudflare\.com|loca\.lt|netlify\.app)$/i', $host)) {
        return true;
    }
    return false;
}

function getOperasionalSecret($secretFile) {
    if (file_exists($secretFile)) {
        $secret = trim(@file_get_contents($secretFile));
        if (!empty($secret) && strlen($secret) >= 32) {
            return $secret;
        }
    }
    // Generate 64-character random secret key
    $secret = bin2hex(random_bytes(32));
    @file_put_contents($secretFile, $secret, LOCK_EX);
    @chmod($secretFile, 0600);
    return $secret;
}

$SERVER_SECRET = getOperasionalSecret($secretFile);

// -------------------------------------------------------------
// 3. ATOMIC FILE LOCK TRANSACTIONS (LOCK_EX & LOCK_SH)
// -------------------------------------------------------------
function readDatabaseOperasional($dataFile, $lockFile) {
    $fpLock = @fopen($lockFile, 'c+');
    if ($fpLock) {
        @flock($fpLock, LOCK_SH);
    }
    try {
        if (!file_exists($dataFile)) {
            return [];
        }
        $content = @file_get_contents($dataFile);
        if ($content === false || trim($content) === '') {
            return [];
        }
        $data = json_decode($content, true);
        if (!is_array($data)) {
            return [];
        }
        return $data;
    } finally {
        if ($fpLock) {
            @flock($fpLock, LOCK_UN);
            @fclose($fpLock);
        }
    }
}

function mutateDatabaseOperasional($dataFile, $lockFile, callable $callback) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $backupDir = $dir . '/backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }

    $fpLock = @fopen($lockFile, 'c+');
    if (!$fpLock) {
        return [
            'success'   => false,
            'http_code' => 500,
            'error'     => 'Gagal inisialisasi file lock transaksi database operasional'
        ];
    }

    if (!flock($fpLock, LOCK_EX)) {
        fclose($fpLock);
        return [
            'success'   => false,
            'http_code' => 503,
            'error'     => 'Sistem sibuk: Gagal memperoleh antrean lock transaksi atomik operasional'
        ];
    }

    try {
        // 1. Baca data paling mutakhir di dalam exclusive lock
        $records = [];
        if (file_exists($dataFile)) {
            $content = @file_get_contents($dataFile);
            if ($content !== false && trim($content) !== '') {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    $records = $decoded;
                }
            }
        }

        // 2. Eksekusi mutasi transaksional
        $res = $callback($records);

        // 3. Jika mutasi berhasil dan menghasilkan records baru, simpan atomik
        if (is_array($res) && !empty($res['success']) && isset($res['records'])) {
            $newRecords = $res['records'];
            $json = json_encode($newRecords, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $tempFile = @tempnam($dir, 'tmp_opr_');
            if ($tempFile === false) {
                return [
                    'success'   => false,
                    'http_code' => 500,
                    'error'     => 'Gagal membuat temporary file untuk penyimpanan atomik'
                ];
            }

            $wfp = @fopen($tempFile, 'w');
            if (!$wfp) {
                @unlink($tempFile);
                return [
                    'success'   => false,
                    'http_code' => 500,
                    'error'     => 'Gagal membuka temporary file untuk penulisan atomik'
                ];
            }

            fwrite($wfp, $json);
            fflush($wfp);
            fclose($wfp);

            // Snapshot backup berkala
            if (file_exists($dataFile)) {
                $backupFile = $backupDir . '/operasional_backup_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.json';
                @copy($dataFile, $backupFile);

                $allBackups = glob($backupDir . '/operasional_backup_*.json');
                if (is_array($allBackups) && count($allBackups) > 30) {
                    usort($allBackups, function($a, $b) { return filemtime($a) - filemtime($b); });
                    while (count($allBackups) > 30) {
                        @unlink(array_shift($allBackups));
                    }
                }
            }

            // Atomic rename
            $renamed = @rename($tempFile, $dataFile);
            if (!$renamed) {
                @unlink($tempFile);
                return [
                    'success'   => false,
                    'http_code' => 500,
                    'error'     => 'Gagal mengganti file database operasional secara atomik'
                ];
            }

            unset($res['records']);
        }

        return $res;
    } finally {
        @flock($fpLock, LOCK_UN);
        @fclose($fpLock);
    }
}

// -------------------------------------------------------------
// 4. CRYPTOGRAPHIC HMAC CANONICAL GENERATOR & VERIFIER
// -------------------------------------------------------------
function generateContentDigest($doc) {
    $coreStr = ($doc['id'] ?? '') . '|' .
               ($doc['noRegistrasi'] ?? '') . '|' .
               ($doc['jenisOperasional'] ?? '') . '|' .
               ($doc['kodeKantor'] ?? '') . '|' .
               number_format((float)($doc['totalEstimasi'] ?? 0), 2, '.', '') . '|' .
               trim($doc['pemohon']['nama'] ?? '') . '|' .
               trim($doc['maksudTujuan'] ?? $doc['pemohon']['maksudTujuan'] ?? $doc['tujuanKebutuhan'] ?? $doc['meeting']['agenda'] ?? $doc['survey']['lokasiObjek'] ?? $doc['umum']['maksudTujuan'] ?? '');
    return hash('sha256', $coreStr);
}

function generateTierHmac($docId, $tier, $versi, $contentDigest, $pejabatNama, $pejabatJabatan, $approvedAt, $secret) {
    $pejabatStr = trim($pejabatNama) . '|' . trim($pejabatJabatan);
    $canonical = $docId . '#' . (int)$tier . '#' . (int)$versi . '#' . $contentDigest . '#' . $pejabatStr . '#' . trim($approvedAt);
    return hash_hmac('sha256', $canonical, $secret);
}

function generateQrVerificationUrl($noRegistrasi, $tier, $hmac) {
    $host = $_SERVER['HTTP_HOST'] ?? 'kjppnanangrahayu.com';
    $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
               (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
               (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    $scheme = $isHttps ? 'https' : 'http';
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $basePath = ($scriptDir === '/' || $scriptDir === '\\' || $scriptDir === '.') ? '' : '/' . trim(str_replace('\\', '/', $scriptDir), '/');
    return $scheme . '://' . $host . $basePath . '/verifikasi-dokumen.html?doc=' . urlencode($noRegistrasi) . '&tier=' . (int)$tier . '&hash=' . urlencode($hmac);
}

// -------------------------------------------------------------
// 5. REGISTRATION NUMBER GENERATOR (ATOMIC SEQUENTIAL)
// Format: [JENIS]/[KODE-KANTOR]/[BULAN-ROMAWI]/[TAHUN]/[URUT]
// Contoh: OPR-SRV/2.19.0160-00/X/2026/0001
// -------------------------------------------------------------
function toRomanMonth($monthNum) {
    $map = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];
    return $map[(int)$monthNum] ?? 'I';
}

function generateNomorRegistrasi($records, $jenisOperasional, $kodeCabang, $tglPengajuan) {
    $time = strtotime($tglPengajuan ?: date('Y-m-d'));
    $tahun = date('Y', $time);
    $bulanRomawi = toRomanMonth((int)date('n', $time));

    $officeMap = [
        '00' => '2.19.0160-00', // Pusat
        '01' => '2.19.0160-01', // Padang
        '02' => '2.19.0160-02', // Makassar
        '03' => '2.19.0160-03', // Palembang
        '04' => '2.19.0160-04'  // Bandung
    ];
    $kodeKantor = $officeMap[$kodeCabang] ?? '2.19.0160-00';

    // Cari urut tertinggi untuk kombinasi jenis + kantor + tahun
    $maxSeq = 0;
    $prefixPattern = $jenisOperasional . '/' . $kodeKantor . '/';

    foreach ($records as $r) {
        $noReg = $r['noRegistrasi'] ?? '';
        if (strpos($noReg, $prefixPattern) === 0) {
            $parts = explode('/', $noReg);
            // parts: [JENIS, KODE-KANTOR, BULAN-ROMAWI, TAHUN, URUT]
            if (count($parts) >= 5 && $parts[3] === $tahun) {
                $seqVal = (int)$parts[4];
                if ($seqVal > $maxSeq) {
                    $maxSeq = $seqVal;
                }
            }
        }
    }

    $nextSeq = $maxSeq + 1;
    $urutStr = str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

    return [
        'noRegistrasi' => "{$jenisOperasional}/{$kodeKantor}/{$bulanRomawi}/{$tahun}/{$urutStr}",
        'kodeKantor'   => $kodeKantor,
        'urut'         => $nextSeq
    ];
}

// -------------------------------------------------------------
// 6. APPROVAL WORKFLOW GENERATOR (DYNAMIC 3-TIER & LEGACY 5-TIER)
// -------------------------------------------------------------
/**
 * 3-Tingkat Sequential Approval Workflow Dinamis:
 * Tingkat 1 — Persetujuan Manager Divisi:
 *   - Deni Siswandi, S.T. (Manager Teknik)
 *   - Danny Taufik Hidayat, S.H. (Manager Admin & Umum)
 *   - Lintas Divisi: Deni + Danny
 * Tingkat 2 — Verifikasi Manager Keuangan:
 *   - Milda Hidayati Dewi, S.E. (Manager Keuangan)
 * Tingkat 3 — Persetujuan Kepala Keuangan:
 *   - Ir. Nanang Rahayu, M.Ec.Dev. (Kepala Keuangan)
 */
function buildDynamicApprovals($alur = 'TEKNIS', $pemohonNama = 'Pemohon', $pemohonJabatan = 'Staff', $pemohonDivisi = 'Teknik') {
    $alur = strtoupper(trim($alur));
    if ($alur === 'LINTAS_DIVISI' || $alur === 'LINTAS') {
        return [
            1 => [
                'tier'       => 1,
                'tingkat'    => 1,
                'label'      => 'Persetujuan Manager Teknik',
                'pejabat'    => 'Deni Siswandi, S.T.',
                'jabatan'    => 'Manager Teknik',
                'roleKey'    => 'TEKNIK',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            2 => [
                'tier'       => 2,
                'tingkat'    => 1,
                'label'      => 'Persetujuan Manager Admin & Umum',
                'pejabat'    => 'Danny Taufik Hidayat, S.H.',
                'jabatan'    => 'Manager Admin & Umum',
                'roleKey'    => 'ADMIN_UMUM',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            3 => [
                'tier'       => 3,
                'tingkat'    => 2,
                'label'      => 'Verifikasi Manager Keuangan',
                'pejabat'    => 'Milda Hidayati Dewi, S.E.',
                'jabatan'    => 'Manager Keuangan',
                'roleKey'    => 'KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            4 => [
                'tier'       => 4,
                'tingkat'    => 3,
                'label'      => 'Persetujuan Kepala Keuangan',
                'pejabat'    => 'Ir. Nanang Rahayu, M.Ec.Dev.',
                'jabatan'    => 'Kepala Keuangan',
                'roleKey'    => 'KEPALA_KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ]
        ];
    } elseif ($alur === 'ADMIN_UMUM' || $alur === 'ADMIN' || $alur === 'UMUM') {
        return [
            1 => [
                'tier'       => 1,
                'tingkat'    => 1,
                'label'      => 'Persetujuan Manager Admin & Umum',
                'pejabat'    => 'Danny Taufik Hidayat, S.H.',
                'jabatan'    => 'Manager Admin & Umum',
                'roleKey'    => 'ADMIN_UMUM',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            2 => [
                'tier'       => 2,
                'tingkat'    => 2,
                'label'      => 'Verifikasi Manager Keuangan',
                'pejabat'    => 'Milda Hidayati Dewi, S.E.',
                'jabatan'    => 'Manager Keuangan',
                'roleKey'    => 'KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            3 => [
                'tier'       => 3,
                'tingkat'    => 3,
                'label'      => 'Persetujuan Kepala Keuangan',
                'pejabat'    => 'Ir. Nanang Rahayu, M.Ec.Dev.',
                'jabatan'    => 'Kepala Keuangan',
                'roleKey'    => 'KEPALA_KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ]
        ];
    } else {
        // Default: TEKNIS (Deni Siswandi, S.T. -> Milda Hidayati Dewi, S.E. -> Ir. Nanang Rahayu, M.Ec.Dev.)
        return [
            1 => [
                'tier'       => 1,
                'tingkat'    => 1,
                'label'      => 'Persetujuan Manager Teknik',
                'pejabat'    => 'Deni Siswandi, S.T.',
                'jabatan'    => 'Manager Teknik',
                'roleKey'    => 'TEKNIK',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            2 => [
                'tier'       => 2,
                'tingkat'    => 2,
                'label'      => 'Verifikasi Manager Keuangan',
                'pejabat'    => 'Milda Hidayati Dewi, S.E.',
                'jabatan'    => 'Manager Keuangan',
                'roleKey'    => 'KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ],
            3 => [
                'tier'       => 3,
                'tingkat'    => 3,
                'label'      => 'Persetujuan Kepala Keuangan',
                'pejabat'    => 'Ir. Nanang Rahayu, M.Ec.Dev.',
                'jabatan'    => 'Kepala Keuangan',
                'roleKey'    => 'KEPALA_KEUANGAN',
                'approved'   => false,
                'approvedAt' => null,
                'approvedBy' => null,
                'hmacHash'   => null,
                'qrUrl'      => null
            ]
        ];
    }
}

function buildDefaultApprovals($pemohonNama = 'Holik Kelana', $pemohonJabatan = 'Yang Mengajukan') {
    return [
        1 => [
            'tier'       => 1,
            'label'      => 'Yang Mengajukan',
            'pejabat'    => $pemohonNama ?: 'Holik Kelana',
            'jabatan'    => 'Yang Mengajukan',
            'approved'   => false,
            'approvedAt' => null,
            'approvedBy' => null,
            'hmacHash'   => null,
            'qrUrl'      => null
        ],
        2 => [
            'tier'       => 2,
            'label'      => 'Mengetahui',
            'pejabat'    => 'Deni Siswandi, S.T.',
            'jabatan'    => 'Mengetahui',
            'approved'   => false,
            'approvedAt' => null,
            'approvedBy' => null,
            'hmacHash'   => null,
            'qrUrl'      => null
        ],
        3 => [
            'tier'       => 3,
            'label'      => 'Verifikasi Administrasi',
            'pejabat'    => 'Danny Taufik Hidayat, S.H.',
            'jabatan'    => 'Verifikasi Administrasi',
            'approved'   => false,
            'approvedAt' => null,
            'approvedBy' => null,
            'hmacHash'   => null,
            'qrUrl'      => null
        ],
        4 => [
            'tier'       => 4,
            'label'      => 'Menyetujui',
            'pejabat'    => 'Milda Hidayati Dewi, S.E.',
            'jabatan'    => 'Menyetujui',
            'approved'   => false,
            'approvedAt' => null,
            'approvedBy' => null,
            'hmacHash'   => null,
            'qrUrl'      => null
        ],
        5 => [
            'tier'       => 5,
            'label'      => 'Penanggung Jawab',
            'pejabat'    => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'jabatan'    => 'Penanggung Jawab',
            'approved'   => false,
            'approvedAt' => null,
            'approvedBy' => null,
            'hmacHash'   => null,
            'qrUrl'      => null
        ]
    ];
}

// -------------------------------------------------------------
// 7. AUTENTIKASI PENGGUNA
// -------------------------------------------------------------
/**
 * KJPP NSR — Evaluasi Status Persetujuan "Menunggu Tindakan Saya" (Pending On Me)
 * Memetakan dokumen pengajuan terhadap wewenang (RBAC) dan urutan sequential pengguna saat ini.
 *
 * @param array $doc Dokumen pengajuan operasional
 * @param array $user Data pengguna terautentikasi
 * @return array Hasil evaluasi: isPending (bool), pendingTier (int|null), tierInfo (array|null), reason (string)
 */
function evaluatePengajuanPendingStatus($doc, $user) {
    $status = strtoupper(trim($doc['status'] ?? 'DRAFT'));
    $approvals = $doc['approvals'] ?? [];
    $userPermissions = $user['permissions'] ?? [];
    $userRole = strtoupper(trim($user['role'] ?? ''));
    $userDisplayName = trim($user['displayName'] ?? '');
    $userSub = trim($user['sub'] ?? '');

    // 1. Dokumen APPROVED sudah sah sepenuhnya, tidak menunggu tindakan siapapun
    if ($status === 'APPROVED') {
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'SELESAI'
        ];
    }

    // 2. Dokumen REJECTED: Menunggu revisi dari pemohon / pembuat dokumen
    if ($status === 'REJECTED') {
        $pemohonSub = trim($doc['pemohon']['sub'] ?? $doc['createdBy']['sub'] ?? '');
        $pemohonNama = trim($doc['pemohon']['nama'] ?? $doc['createdBy']['userLogin'] ?? $doc['namaPengaju'] ?? '');
        $isMyDoc = ($userSub && $pemohonSub && $userSub === $pemohonSub) ||
                   ($userDisplayName && $pemohonNama && strcasecmp($userDisplayName, $pemohonNama) === 0) ||
                   in_array($userRole, ['SURVEYOR', 'STAFF'], true) ||
                   empty($user['canApprove']);

        if ($isMyDoc) {
            return [
                'isPending'    => true,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'REVISI_PEMOHON'
            ];
        }
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'MENUNGGU_REVISI_PEMOHON'
        ];
    }

    // 3. Dokumen DRAFT: Menunggu kirim resmi dari pemohon
    if ($status === 'DRAFT') {
        $pemohonSub = trim($doc['pemohon']['sub'] ?? $doc['createdBy']['sub'] ?? '');
        $pemohonNama = trim($doc['pemohon']['nama'] ?? $doc['createdBy']['userLogin'] ?? $doc['namaPengaju'] ?? '');
        $isMyDoc = ($userSub && $pemohonSub && $userSub === $pemohonSub) ||
                   ($userDisplayName && $pemohonNama && strcasecmp($userDisplayName, $pemohonNama) === 0) ||
                   empty($user['canApprove']);

        if ($isMyDoc) {
            return [
                'isPending'    => true,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'DRAFT_PEMOHON'
            ];
        }
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'DRAFT_OTHER'
        ];
    }

    // 4. Dokumen SUBMITTED / IN_REVIEW: Evaluasi alur berurutan (Sequential Enforcement)
    if (in_array($status, ['SUBMITTED', 'IN_REVIEW'], true)) {
        if (empty($user['canApprove']) || empty($userPermissions)) {
            // Akun staf/surveyor biasa tidak memiliki wewenang approval
            return [
                'isPending'    => false,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'DALAM_PROSES_REVIEW'
            ];
        }

        $tierKeys = array_map('intval', array_keys($approvals));
        sort($tierKeys);

        $isLegacy5Tier = (($doc['workflowSystem'] ?? '') === '5_TIER') || (count($approvals) === 5 && !isset($approvals[1]['tingkat']));
        $alurDoc = strtoupper(trim($doc['alur'] ?? ''));

        $actionableTiers = [];

        if (!$isLegacy5Tier && ($alurDoc === 'LINTAS_DIVISI' || $alurDoc === 'LINTAS')) {
            // Lintas Divisi: Tingkat 1 (Teknik & Admin) dapat diproses bersamaan
            $tier1Done = !empty($approvals[1]['approved']);
            $tier2Done = !empty($approvals[2]['approved']);
            $tier3Done = !empty($approvals[3]['approved']);
            $tier4Done = !empty($approvals[4]['approved']);

            if (!$tier1Done) $actionableTiers[] = 1;
            if (!$tier2Done) $actionableTiers[] = 2;

            if ($tier1Done && $tier2Done && !$tier3Done) {
                $actionableTiers[] = 3;
            }
            if ($tier1Done && $tier2Done && $tier3Done && !$tier4Done) {
                $actionableTiers[] = 4;
            }
        } else {
            // Alur Linier (3-Tingkat Standar maupun Legacy 5-Tier)
            foreach ($tierKeys as $t) {
                if (empty($approvals[$t]['approved'])) {
                    $prevDone = true;
                    if ($t > 1) {
                        for ($p = 1; $p < $t; $p++) {
                            if (empty($approvals[$p]['approved'])) {
                                $prevDone = false;
                                break;
                            }
                        }
                    }
                    if ($prevDone) {
                        $actionableTiers[] = $t;
                    }
                    break; // Hanya satu tier yang aktif pada alur linier
                }
            }
        }

        foreach ($actionableTiers as $actTier) {
            $step = $approvals[$actTier] ?? [];
            $roleKey = $step['roleKey'] ?? '';

            $requiredPerm = null;
            if ($roleKey === 'TEKNIK') {
                $requiredPerm = 'APPROVE_TEKNIK';
            } elseif ($roleKey === 'ADMIN_UMUM') {
                $requiredPerm = 'APPROVE_ADMIN';
            } elseif ($roleKey === 'KEUANGAN') {
                $requiredPerm = 'APPROVE_KEUANGAN';
            } elseif ($roleKey === 'KEPALA_KEUANGAN') {
                $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
            } elseif ($isLegacy5Tier) {
                if ($actTier === 2) {
                    $requiredPerm = 'APPROVE_TEKNIK';
                } elseif ($actTier === 3) {
                    $requiredPerm = 'APPROVE_ADMIN';
                } elseif ($actTier === 4) {
                    $requiredPerm = 'APPROVE_KEUANGAN';
                } elseif ($actTier === 5) {
                    $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
                }
            }

            if ($requiredPerm && in_array($requiredPerm, $userPermissions, true)) {
                return [
                    'isPending'    => true,
                    'pendingTier'  => $actTier,
                    'tierInfo'     => $step,
                    'requiredPerm' => $requiredPerm,
                    'reason'       => 'WAITING_APPROVAL'
                ];
            }
        }
    }

    return [
        'isPending'    => false,
        'pendingTier'  => null,
        'tierInfo'     => null,
        'reason'       => 'NOT_PENDING_ON_USER'
    ];
}

// -------------------------------------------------------------
// 7. AUTENTIKASI PENGGUNA
// -------------------------------------------------------------
function resolveCurrentUser($officialTokenHashes) {
    // A. Dari Sesi PHP
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            return $_SESSION['nsr_user'];
        }
    }

    // B. Dari Authorization: Bearer <TOKEN> atau X-NSR-Token
    $rawToken = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $rawToken = trim($matches[1]);
    } elseif (isset($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawToken = trim($_SERVER['HTTP_X_NSR_TOKEN']);
    }

    if ($rawToken) {
        $trimmed = trim($rawToken);
        if (isset($officialTokenHashes[$trimmed])) {
            return $officialTokenHashes[$trimmed];
        }
        $tokenHash = hash('sha256', $trimmed);
        if (isset($officialTokenHashes[$tokenHash])) {
            return $officialTokenHashes[$tokenHash];
        }
        $upperHash = hash('sha256', strtoupper($trimmed));
        if (isset($officialTokenHashes[$upperHash])) {
            return $officialTokenHashes[$upperHash];
        }
        $saltedUpperHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
        if (isset($officialTokenHashes[$saltedUpperHash])) {
            return $officialTokenHashes[$saltedUpperHash];
        }
        $saltedRawHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . $trimmed);
        if (isset($officialTokenHashes[$saltedRawHash])) {
            return $officialTokenHashes[$saltedRawHash];
        }
    }

    return null;
}

// -------------------------------------------------------------
// 8. DISPATCH ACTION HANDLER
// -------------------------------------------------------------
$action = $_GET['action'] ?? $_POST['action'] ?? '';
if (!$action && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if ($rawInput) {
        $parsed = json_decode($rawInput, true);
        if (isset($parsed['action'])) {
            $action = $parsed['action'];
        }
    }
}

// A. PUBLIC ACTION: verifyDocument (Does not require login)
if ($action === 'verifyDocument') {
    $docId = trim($_GET['doc'] ?? $_POST['doc'] ?? '');
    $tier = (int)($_GET['tier'] ?? $_POST['tier'] ?? 0);
    $hash = trim($_GET['hash'] ?? $_POST['hash'] ?? '');

    if (!$docId || $tier < 1 || $tier > 5 || !$hash) {
        http_response_code(400);
        echo json_encode([
            'success'   => false,
            'valid'     => false,
            'status'    => 'INVALID',
            'message'   => 'DOKUMEN TIDAK VALID / VERIFIKASI GAGAL',
            'error'     => 'Parameter verifikasi tidak lengkap.'
        ]);
        exit;
    }

    $records = readDatabaseOperasional($dataFile, $lockFile);
    $foundDoc = null;
    foreach ($records as $r) {
        if (($r['id'] ?? '') === $docId || ($r['noRegistrasi'] ?? '') === $docId) {
            $foundDoc = $r;
            break;
        }
    }

    if (!$foundDoc) {
        http_response_code(404);
        echo json_encode([
            'success'   => false,
            'valid'     => false,
            'status'    => 'INVALID',
            'message'   => 'DOKUMEN TIDAK VALID / VERIFIKASI GAGAL',
            'error'     => 'Dokumen pengajuan operasional tidak ditemukan dalam pangkalan data resmi.'
        ]);
        exit;
    }

    // Dokumen tidak valid jika berstatus DRAFT atau REJECTED
    $docStatus = $foundDoc['status'] ?? 'DRAFT';
    if ($docStatus === 'DRAFT' || $docStatus === 'REJECTED') {
        echo json_encode([
            'success'   => false,
            'valid'     => false,
            'status'    => 'INVALID',
            'message'   => 'DOKUMEN TIDAK VALID / VERIFIKASI GAGAL',
            'error'     => 'Dokumen berstatus ' . $docStatus . ' dan belum/tidak memiliki pengesahan sah.'
        ]);
        exit;
    }

    // Periksa apakah tier tersebut disetujui
    $approval = $foundDoc['approvals'][$tier] ?? null;
    if (!$approval || empty($approval['approved']) || empty($approval['hmacHash'])) {
        echo json_encode([
            'success'   => false,
            'valid'     => false,
            'status'    => 'INVALID',
            'message'   => 'DOKUMEN TIDAK VALID / VERIFIKASI GAGAL',
            'error'     => 'Otorisasi Tier ' . $tier . ' belum disahkan atau telah dibatalkan.'
        ]);
        exit;
    }

    // Hitung ulang HMAC Canonical
    $contentDigest = generateContentDigest($foundDoc);
    $expectedHmac = generateTierHmac(
        $foundDoc['id'],
        $tier,
        $foundDoc['versi'] ?? 1,
        $contentDigest,
        $approval['pejabat'] ?? '',
        $approval['jabatan'] ?? '',
        $approval['approvedAt'] ?? '',
        $SERVER_SECRET
    );

    if (!hash_equals($expectedHmac, $hash)) {
        echo json_encode([
            'success'   => false,
            'valid'     => false,
            'status'    => 'INVALID',
            'message'   => 'DOKUMEN TIDAK VALID / VERIFIKASI GAGAL',
            'error'     => 'Tanda tangan digital HMAC tidak cocok. Dokumen telah dimodifikasi atau token palsu.'
        ]);
        exit;
    }

    // Verifikasi SUKSES — Tampilkan data publik yang bersih tanpa rincian biaya internal
    echo json_encode([
        'success'      => true,
        'valid'        => true,
        'status'       => 'VALID',
        'message'      => 'Dokumen Terverifikasi Sah dan Terdaftar Resmi',
        'verification' => [
            'id'               => $foundDoc['id'],
            'noRegistrasi'     => $foundDoc['noRegistrasi'] ?? '-',
            'jenisOperasional' => $foundDoc['jenisOperasional'] ?? '-',
            'jenisLabel'       => $foundDoc['jenisLabel'] ?? '-',
            'kantor'           => $foundDoc['kantor'] ?? 'Pusat',
            'kodeKantor'       => $foundDoc['kodeKantor'] ?? '2.19.0160-00',
            'versi'            => $foundDoc['versi'] ?? 1,
            'tglPengajuan'     => $foundDoc['tglPengajuan'] ?? '-',
            'statusDokumen'    => $foundDoc['status'] ?? '-',
            'tier'             => $tier,
            'tierLabel'        => $approval['label'] ?? '-',
            'pejabat'          => $approval['pejabat'] ?? '-',
            'jabatan'          => $approval['jabatan'] ?? '-',
            'approvedAt'       => $approval['approvedAt'] ?? '-',
            'verifiedAt'       => date('Y-m-d H:i:s')
        ]
    ]);
    exit;
}

// -------------------------------------------------------------
// 9. SEMUA ACTION BERIKUTNYA WAJIB TERAUTENTIKASI (FAIL-CLOSED)
// DAN EKSKLUSIF KANTOR PUSAT JAKARTA (403 FORBIDDEN UNTUK CABANG)
// -------------------------------------------------------------
$currentUser = resolveCurrentUser($OFFICIAL_TOKEN_HASHES);
if (!$currentUser) {
    http_response_code(401);
    echo json_encode([
        'success'   => false,
        'error'     => 'Akses Ditolak (401 Unauthorized): Sesi belum aktif atau token tidak valid.',
        'violation' => 'UNAUTHORIZED_ACCESS'
    ]);
    exit;
}

$userBranch = strtoupper(trim($currentUser['branch'] ?? $currentUser['wilayah'] ?? $currentUser['wilayahCode'] ?? ''));
$userRole   = strtoupper(trim($currentUser['role'] ?? ''));
$isSuperAdmin = !empty($currentUser['isSuperAdmin']);
$isCabang = !empty($currentUser['isCabang']) || in_array($userRole, ['CABANG', 'ADMIN_CABANG', 'KEUANGAN_CABANG'], true);
$isPusat = in_array($userBranch, ['PUSAT', 'PST', '00', 'JAKARTA'], true) ||
           in_array($userRole, ['SUPER ADMIN', 'SUPER_ADMIN', 'ADMIN_PUSAT', 'KEUANGAN', 'PEMIMPIN_REKAN', 'REKAN', 'REVIEWER', 'PENILAI', 'SURVEYOR', 'MARKETING', 'MANAGER_TEKNIK', 'MANAGER_ADMIN', 'MANAGER_KEUANGAN', 'KEPALA_KEUANGAN'], true) ||
           $isSuperAdmin;

// PENEGAKAN KEAMANAN TINGKAT SERVER: CABANG DILARANG MENGAKSES e-OPERASIONAL
if ($isCabang || !$isPusat) {
    http_response_code(403);
    echo json_encode([
        'success'   => false,
        'error'     => 'Akses Ditolak (403 Forbidden): Portal e-Operasional adalah aplikasi internal eksklusif Kantor Pusat (Jakarta). Pengguna Kantor Cabang tidak berwenang mengakses data atau modul ini.',
        'violation' => 'BRANCH_ACCESS_DENIED'
    ]);
    exit;
}

$isMaster = !empty($currentUser['isMaster']) || (!empty($currentUser['isSuperAdmin']) && $userRole === 'SUPER ADMIN');
$isSuperOrPusat = in_array($userRole, ['SUPER ADMIN', 'ADMIN_PUSAT', 'ADMIN'], true) || !empty($currentUser['isSuperAdmin']);
$userDisplayName = $currentUser['displayName'] ?? ($currentUser['sub'] ?? 'Petugas Terverifikasi');

// B. ACTION: lookupNolap (Mencari ID Penugasan dari nolap_database.json atau baseline)
if ($action === 'lookupNolap') {
    $q = trim($_GET['query'] ?? $_GET['q'] ?? '');
    $nolapFile = $dataDir . '/nolap_database.json';
    $nolapData = [];

    if (file_exists($nolapFile)) {
        $c = @file_get_contents($nolapFile);
        if ($c) {
            $dec = json_decode($c, true);
            if (is_array($dec)) $nolapData = $dec;
        }
    }

    // Jika kosong, muat fallback data asli
    if (empty($nolapData)) {
        $nolapData = [
            [
                'noPermintaan'    => 'REQ-000006',
                'nomorLaporan'    => '00523/2.0160-00/PI/07/00581/1/IX/2026',
                'namaKlien'       => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. GEMILANG SAKTI PROPERTINDO',
                'jenisObjek'      => 'Tanah dan Bangunan Rumah Tinggal',
                'lokasiObjek'     => 'Perumahan Green Lavender Sukamekar Blok F4 No. 15, Sukamekar, Sukawangi, Bekasi',
                'cabang'          => 'Pusat',
                'penilai'         => 'Deni Siswandi',
                'status'          => 'NOMOR DITERBITKAN'
            ],
            [
                'noPermintaan'    => 'REQ-000007',
                'nomorLaporan'    => '00525/2.0160-00/PI/07/00581/1/IX/2026',
                'namaKlien'       => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. IVANDER PUTRA SUKSES',
                'jenisObjek'      => 'Tanah dan Bangunan Rumah Tinggal',
                'lokasiObjek'     => 'Perumahan Permata Harapan Sarimukti Blok D11-21, Sarimukti, Cibitung, Bekasi',
                'cabang'          => 'Pusat',
                'penilai'         => 'Deni Siswandi',
                'status'          => 'NOMOR DITERBITKAN'
            ],
            [
                'noPermintaan'    => 'REQ-000012',
                'nomorLaporan'    => '00012/2.19.0160-04/PI/01/00012/1/X/2026',
                'namaKlien'       => 'Institut Teknologi Bandung (ITB)',
                'jenisObjek'      => 'Gedung Pendidikan & Kampus',
                'lokasiObjek'     => 'Jl. Ganesa No. 10, Bandung, Jawa Barat',
                'cabang'          => 'Bandung',
                'penilai'         => 'Deni Siswandi, S.T.',
                'status'          => 'NOMOR DITERBITKAN'
            ]
        ];
    }

    $results = [];
    $qLower = strtolower($q);
    foreach ($nolapData as $item) {
        if ($qLower === '') {
            $results[] = $item;
        } else {
            $searchTarget = strtolower(($item['noPermintaan'] ?? '') . ' ' . ($item['nomorLaporan'] ?? '') . ' ' . ($item['namaKlien'] ?? '') . ' ' . ($item['lokasiObjek'] ?? '') . ' ' . ($item['cabang'] ?? ''));
            if (strpos($searchTarget, $qLower) !== false) {
                $results[] = $item;
            }
        }
        if (count($results) >= 20) break;
    }

    echo json_encode([
        'success' => true,
        'query'   => $q,
        'total'   => count($results),
        'data'    => $results
    ]);
    exit;
}

// C. ACTION: getPengajuanList
if ($action === 'getPengajuanList') {
    $records = readDatabaseOperasional($dataFile, $lockFile);

    $branchFilter  = trim($_GET['branch'] ?? $_GET['cabang'] ?? '');
    $statusFilter  = trim($_GET['status'] ?? '');
    $jenisFilter   = trim($_GET['jenis'] ?? '');
    $pendingFilter = trim($_GET['pendingOnMe'] ?? $_GET['pending_on_me'] ?? '');
    $isPendingOnly = ($pendingFilter === 'true' || $pendingFilter === '1' || $statusFilter === 'PENDING_ON_ME');

    $totalPendingOnMe = 0;
    $filtered = [];

    foreach ($records as $r) {
        // Evaluasi status approval pending pada dokumen
        $pendingEval = evaluatePengajuanPendingStatus($r, $currentUser);
        $r['isPendingOnMe'] = $pendingEval['isPending'];
        $r['pendingTier']   = $pendingEval['pendingTier'];
        $r['pendingReason'] = $pendingEval['reason'];
        $r['pendingInfo']   = $pendingEval['tierInfo'] ?? null;

        if ($pendingEval['isPending']) {
            $totalPendingOnMe++;
        }

        // Filter: Hanya yang Menunggu Tindakan Saya jika parameter pendingOnMe diaktifkan
        if ($isPendingOnly && !$pendingEval['isPending']) {
            continue;
        }

        if ($branchFilter && !empty($r['kantor']) && strcasecmp($r['kantor'], $branchFilter) !== 0) {
            continue;
        }
        if ($statusFilter && $statusFilter !== 'PENDING_ON_ME' && !empty($r['status']) && strcasecmp($r['status'], $statusFilter) !== 0) {
            continue;
        }
        if ($jenisFilter && !empty($r['jenisOperasional']) && strcasecmp($r['jenisOperasional'], $jenisFilter) !== 0) {
            continue;
        }
        $filtered[] = $r;
    }

    // Urutkan dari yang terbaru (LIFO)
    usort($filtered, function($a, $b) {
        return strcmp($b['updatedAt'] ?? $b['createdAt'] ?? '', $a['updatedAt'] ?? $a['createdAt'] ?? '');
    });

    echo json_encode([
        'success'      => true,
        'currentUser'  => [
            'displayName' => $currentUser['displayName'] ?? '',
            'role'        => $userRole,
            'roleLabel'   => $currentUser['roleLabel'] ?? '',
            'title'       => $currentUser['title'] ?? '',
            'branch'      => $userBranch,
            'isMaster'    => $isMaster,
            'isSuperAdmin'=> !empty($currentUser['isSuperAdmin']),
            'permissions' => $currentUser['permissions'] ?? [],
            'canApprove'  => !empty($currentUser['canApprove'])
        ],
        'pendingCount' => $totalPendingOnMe,
        'total'        => count($filtered),
        'data'         => $filtered
    ]);
    exit;
}

// D. ACTION: getPengajuanDetail
if ($action === 'getPengajuanDetail') {
    $id = trim($_GET['id'] ?? $_POST['id'] ?? '');
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id pengajuan tidak diberikan.']);
        exit;
    }

    $records = readDatabaseOperasional($dataFile, $lockFile);
    $found = null;
    foreach ($records as $r) {
        if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
            $found = $r;
            break;
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Dokumen pengajuan operasional tidak ditemukan.']);
        exit;
    }

    $pendingEval = evaluatePengajuanPendingStatus($found, $currentUser);
    $found['isPendingOnMe'] = $pendingEval['isPending'];
    $found['pendingTier']   = $pendingEval['pendingTier'];
    $found['pendingReason'] = $pendingEval['reason'];
    $found['pendingInfo']   = $pendingEval['tierInfo'] ?? null;

    echo json_encode([
        'success' => true,
        'data'    => $found
    ]);
    exit;
}

// E. ACTION: simpanPengajuan (Create / Update Draft / Submit)
if ($action === 'simpanPengajuan') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $isDraft = !empty($payload['isDraft']);
    $jenisOperasional = trim($payload['jenisOperasional'] ?? 'OPR-SRV');
    if (!in_array($jenisOperasional, ['OPR-SRV', 'OPR-MTG', 'OPR-UMM'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Jenis operasional tidak valid. Pilihan: OPR-SRV, OPR-MTG, OPR-UMM.']);
        exit;
    }

    $kodeCabang = trim($payload['kodeCabang'] ?? '00');
    if (!in_array($kodeCabang, ['00', '01', '02', '03', '04'], true)) {
        $kodeCabang = '00';
    }

    $kantorMap = [
        '00' => 'Pusat',
        '01' => 'Padang',
        '02' => 'Makassar',
        '03' => 'Palembang',
        '04' => 'Bandung'
    ];
    $namaKantor = $kantorMap[$kodeCabang] ?? 'Pusat';

    $jenisLabels = [
        'OPR-SRV' => 'Allowance Survey Lapangan',
        'OPR-MTG' => 'Allowance Meeting',
        'OPR-UMM' => 'Operasional Umum'
    ];
    $jenisLabel = $jenisLabels[$jenisOperasional];

    // Eksekusi mutasi transaksional
    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $isDraft, $jenisOperasional, $jenisLabel, $kodeCabang, $namaKantor, $payload, $currentUser, $SERVER_SECRET) {
        $now = date('Y-m-d H:i:s');
        $today = date('Y-m-d');
        $existingIndex = -1;

        if ($id) {
            foreach ($records as $idx => $r) {
                if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                    $existingIndex = $idx;
                    break;
                }
            }
        }

        $existing = ($existingIndex >= 0) ? $records[$existingIndex] : null;

        // Validasi Alokasi Biaya Tidak Boleh Negatif
        $totalEstimasi = 0;
        $surveyData = [];
        $meetingData = [];
        $umumData = [];

        if ($jenisOperasional === 'OPR-SRV') {
            // Master Tarif Resmi Allowance NSR 2026
            $MASTER_TARIF_NSR = [
                'versi' => '2026.1',
                'tanggalBerlaku' => '2026-01-01',
                'zonasi' => [
                    'JABODETABEK' => [
                        'PEMIMPIN_REKAN' => 405000,
                        'USP_EXPERT'     => 270000,
                        'KADIV'          => 180000,
                        'REVIEWER'       => 150000,
                        'SURVEYOR'       => 110000,
                        'DRIVER'         => 70000,
                    ],
                    'JAWA_BARAT' => [
                        'PEMIMPIN_REKAN' => 675000,
                        'USP_EXPERT'     => 450000,
                        'KADIV'          => 360000,
                        'REVIEWER'       => 260000,
                        'SURVEYOR'       => 220000,
                        'DRIVER'         => 160000,
                    ],
                    'WILAYAH_LAIN' => [
                        'PEMIMPIN_REKAN' => 900000,
                        'USP_EXPERT'     => 600000,
                        'KADIV'          => 580000,
                        'REVIEWER'       => 450000,
                        'SURVEYOR'       => 430000,
                        'DRIVER'         => 290000,
                    ]
                ],
                'khusus' => [
                    'TRANSPORTASI_BANDARA' => 570000,
                    'RETAIL_FREELANCE'     => 150000,
                    'RETAIL_TETAP'         => 100000,
                ]
            ];

            $wilayahSurvey = strtoupper(trim($payload['survey']['wilayahSurvey'] ?? 'JABODETABEK'));
            if (!in_array($wilayahSurvey, ['JABODETABEK', 'JAWA_BARAT', 'WILAYAH_LAIN'], true)) {
                $wilayahSurvey = 'JABODETABEK';
            }

            $personal = $payload['survey']['biayaPersonal'] ?? [];
            $kolektif = $payload['survey']['biayaKolektif'] ?? [];
            $subPersonal = 0;
            $subKolektif = 0;
            $catatanAuditTarif = [];

            // Evaluasi & Rekalkulasi Biaya Personal Sesuai Master Tarif NSR
            foreach ($personal as &$pItem) {
                $jabatan = strtoupper(trim($pItem['jabatan'] ?? 'SURVEYOR'));
                $personel = max(1, (int)($pItem['jumlahPersonel'] ?? 1));
                $durasi = max(0, (float)($pItem['durasi'] ?? $pItem['volume'] ?? 1));
                $satuan = trim($pItem['satuan'] ?? 'Hari');
                $isManual = !empty($pItem['isManual']) || $jabatan === 'MANUAL';
                $alasanManual = trim($pItem['alasanManual'] ?? '');

                if ($personel < 0 || $durasi < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Jumlah personel dan durasi allowance tidak boleh bernilai negatif.'];
                }

                // Hitung tarif resmi dari Master Data
                $tarifResmi = 0;
                if (isset($MASTER_TARIF_NSR['khusus'][$jabatan])) {
                    $tarifResmi = $MASTER_TARIF_NSR['khusus'][$jabatan];
                    $satuan = 'Titik';
                } elseif (isset($MASTER_TARIF_NSR['zonasi'][$wilayahSurvey][$jabatan])) {
                    $tarifResmi = $MASTER_TARIF_NSR['zonasi'][$wilayahSurvey][$jabatan];
                    $satuan = 'Hari';
                }

                if (!$isManual && $tarifResmi > 0) {
                    // Penegakan tarif server: jangan percaya kiriman browser
                    $trf = (float)$tarifResmi;
                } else {
                    // Manual rate: validasi otorisasi & alasan
                    $trf = (float)($pItem['tarif'] ?? 0);
                    if ($trf < 0) {
                        return ['success' => false, 'http_code' => 400, 'error' => 'Nomor tarif biaya personal tidak boleh negatif.'];
                    }
                    if ($trf !== (float)$tarifResmi) {
                        $catatanAuditTarif[] = "Pengecualian tarif manual [{$jabatan}]: Rp " . number_format($trf, 0, ',', '.') . " (Alasan: " . ($alasanManual ?: 'Penetapan khusus penugasan') . ")";
                    }
                }

                $tot = $personel * $durasi * $trf;
                $pItem['jumlahPersonel'] = $personel;
                $pItem['durasi']         = $durasi;
                $pItem['volume']         = $personel * $durasi;
                $pItem['satuan']         = $satuan;
                $pItem['tarif']          = $trf;
                $pItem['total']          = $tot;
                $subPersonal += $tot;
            }
            unset($pItem);

            // Evaluasi & Rekalkulasi Biaya Kolektif (Termasuk Transportasi Bandara)
            foreach ($kolektif as &$kItem) {
                $uraian = trim($kItem['uraian'] ?? '');
                $vol = max(0, (float)($kItem['volume'] ?? 1));
                $satuan = trim($kItem['satuan'] ?? 'Paket');
                $isBandara = !empty($kItem['isBandara']) || stripos($uraian, 'bandara') !== false;

                if ($vol < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Volume biaya kolektif tidak boleh bernilai negatif.'];
                }

                if ($isBandara) {
                    // Master tarif baku Rp 570.000
                    $trf = 570000;
                    $uraian = 'Transportasi Bandara';
                } else {
                    $trf = (float)($kItem['tarif'] ?? 0);
                    if ($trf < 0) {
                        return ['success' => false, 'http_code' => 400, 'error' => 'Tarif biaya kolektif tidak boleh bernilai negatif.'];
                    }
                }

                $tot = $vol * $trf;
                $kItem['uraian'] = $uraian;
                $kItem['volume'] = $vol;
                $kItem['satuan'] = $satuan;
                $kItem['tarif']  = $trf;
                $kItem['total']  = $tot;
                $subKolektif += $tot;
            }
            unset($kItem);

            $totalEstimasi = $subPersonal + $subKolektif;
            $surveyData = [
                'wilayahSurvey'     => $wilayahSurvey,
                'wilayahSurveyLabel'=> $wilayahSurvey === 'JABODETABEK' ? 'Jabodetabek' : ($wilayahSurvey === 'JAWA_BARAT' ? 'Jawa Barat' : 'Wilayah Lain'),
                'idPenugasan'       => trim($payload['survey']['idPenugasan'] ?? ''),
                'nomorLaporan'      => trim($payload['survey']['nomorLaporan'] ?? ''),
                'namaKlien'         => trim($payload['survey']['namaKlien'] ?? ''),
                'lokasiObjek'       => trim($payload['survey']['lokasiObjek'] ?? ''),
                'tglMulaiSurvey'    => trim($payload['survey']['tglMulaiSurvey'] ?? $today),
                'tglSelesaiSurvey'  => trim($payload['survey']['tglSelesaiSurvey'] ?? $today),
                'daftarSurveyor'    => $payload['survey']['daftarSurveyor'] ?? [($currentUser['displayName'] ?? 'Holik Kelana')],
                'biayaPersonal'     => $personal,
                'biayaKolektif'     => $kolektif,
                'subtotalPersonal'  => $subPersonal,
                'subtotalKolektif'  => $subKolektif,
                'tarifSnapshot'     => [
                    'versi'           => '2026.1',
                    'tanggalBerlaku'  => '2026-01-01',
                    'wilayahSurvey'   => $wilayahSurvey,
                    'waktuPengajuan'  => $now,
                    'masterTarifZonasi' => $MASTER_TARIF_NSR['zonasi'][$wilayahSurvey] ?? [],
                    'tarifKhusus'     => $MASTER_TARIF_NSR['khusus'] ?? []
                ]
            ];
        } elseif ($jenisOperasional === 'OPR-MTG') {
            $divisi = trim($payload['meeting']['divisi'] ?? 'Teknik');
            $allowedDivisi = ['Teknik', 'Admin & Umum', 'Marketing', 'Manajemen'];
            if (!in_array($divisi, $allowedDivisi, true)) {
                $divisi = 'Teknik';
            }
            $rincian = $payload['meeting']['rincianBiaya'] ?? [];
            $subMeeting = 0;

            foreach ($rincian as &$mItem) {
                $vol = (float)($mItem['volume'] ?? 0);
                $trf = (float)($mItem['tarif'] ?? 0);
                if ($vol < 0 || $trf < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Rincian biaya meeting tidak boleh bernilai negatif.'];
                }
                $tot = $vol * $trf;
                $mItem['total'] = $tot;
                $subMeeting += $tot;
            }
            unset($mItem);

            $totalEstimasi = $subMeeting;
            $meetingData = [
                'divisi'            => $divisi,
                'agenda'            => trim($payload['meeting']['agenda'] ?? ''),
                'waktu'             => trim($payload['meeting']['waktu'] ?? $now),
                'lokasi'            => trim($payload['meeting']['lokasi'] ?? 'Kantor'),
                'estimasiPeserta'   => (int)($payload['meeting']['estimasiPeserta'] ?? 1),
                'rincianBiaya'      => $rincian
            ];
        } else { // OPR-UMM
            $kategori = trim($payload['umum']['kategori'] ?? 'ATK & Perlengkapan Kantor');
            $rincianItem = $payload['umum']['rincianItem'] ?? [];
            $subUmum = 0;

            foreach ($rincianItem as &$uItem) {
                $qty = (float)($uItem['qty'] ?? 0);
                $hrg = (float)($uItem['hargaSatuan'] ?? 0);
                if ($qty < 0 || $hrg < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Kuantitas atau harga satuan operasional umum tidak boleh bernilai negatif.'];
                }
                $tot = $qty * $hrg;
                $uItem['subtotal'] = $tot;
                $subUmum += $tot;
            }
            unset($uItem);

            $totalEstimasi = $subUmum;
            $umumData = [
                'kategori'      => $kategori,
                'maksudTujuan'  => trim($payload['umum']['maksudTujuan'] ?? ''),
                'rincianItem'   => $rincianItem
            ];
        }

        // Tentukan Versi dan Reset Approval jika Revisi
        $versi = 1;
        $isRevision = false;
        if ($existing) {
            $prevStatus = $existing['status'] ?? 'DRAFT';
            // Pencegahan Manipulasi: Dokumen SUBMITTED, IN_REVIEW, atau APPROVED tidak boleh diubah kembali ke DRAFT!
            if ($isDraft && ($prevStatus === 'SUBMITTED' || $prevStatus === 'IN_REVIEW' || $prevStatus === 'APPROVED')) {
                return [
                    'success'   => false,
                    'http_code' => 400,
                    'error'     => 'Dokumen yang telah diajukan atau disetujui tidak dapat diubah kembali menjadi draf tanpa prosedur revisi resmi.'
                ];
            }

            // Jika dokumen sebelumnya sudah disubmit/ditolak, maka pengajuan ulang dianggap revisi (versi naik)
            if ($prevStatus === 'REJECTED' || $prevStatus === 'IN_REVIEW' || $prevStatus === 'APPROVED' || $prevStatus === 'SUBMITTED') {
                $versi = ((int)($existing['versi'] ?? 1)) + 1;
                $isRevision = true;
            } else {
                $versi = (int)($existing['versi'] ?? 1);
            }
        }

        // Penerbitan ID dan Nomor Registrasi
        $docId = $existing ? $existing['id'] : ('OPR-' . date('Ymd-His') . '-' . rand(100, 999));
        $noReg = $existing['noRegistrasi'] ?? '';
        $kodeKantor = $existing['kodeKantor'] ?? '';

        if (!$isDraft && empty($noReg)) {
            $regInfo = generateNomorRegistrasi($records, $jenisOperasional, $kodeCabang, $today);
            $noReg = $regInfo['noRegistrasi'];
            $kodeKantor = $regInfo['kodeKantor'];
        }

        // Susun Blok Otorisasi Dinamis 3-Tingkat (atau 5-Tier untuk Dokumen Historis)
        $namaPengaju = trim($payload['namaPengaju'] ?? $payload['pemohon']['nama'] ?? $currentUser['displayName'] ?? 'Staff Kantor Pusat');
        $jabatanPengaju = trim($payload['jabatanPengaju'] ?? $payload['pemohon']['jabatan'] ?? 'Surveyor Lapangan');
        $divisiPengaju = trim($payload['divisiPengaju'] ?? $payload['pemohon']['divisi'] ?? 'Teknik');
        $maksudTujuan = trim($payload['maksudTujuan'] ?? $payload['pemohon']['maksudTujuan'] ?? $payload['catatanPemohon'] ?? $payload['umum']['maksudTujuan'] ?? $payload['meeting']['agenda'] ?? '');

        // Tentukan Alur Persetujuan Dinamis
        $reqAlur = strtoupper(trim($payload['alur'] ?? ''));
        if (in_array($reqAlur, ['TEKNIS', 'ADMIN_UMUM', 'LINTAS_DIVISI'], true)) {
            $alur = $reqAlur;
        } elseif (stripos($divisiPengaju, 'Lintas') !== false || stripos($maksudTujuan, 'Lintas Divisi') !== false) {
            $alur = 'LINTAS_DIVISI';
        } elseif (stripos($divisiPengaju, 'Admin') !== false || stripos($divisiPengaju, 'Umum') !== false || stripos($divisiPengaju, 'Legal') !== false || $jenisOperasional === 'OPR-UMM') {
            $alur = 'ADMIN_UMUM';
        } else {
            $alur = 'TEKNIS';
        }

        $workflowSystem = $existing ? ($existing['workflowSystem'] ?? (count($existing['approvals'] ?? []) === 5 ? '5_TIER' : '3_TIER_DYNAMIC')) : '3_TIER_DYNAMIC';

        if ($existing) {
            $approvals = $existing['approvals'];
            if ($isRevision) {
                if ($workflowSystem === '5_TIER') {
                    for ($t = 2; $t <= 5; $t++) {
                        if (isset($approvals[$t])) {
                            $approvals[$t]['approved'] = false;
                            $approvals[$t]['approvedAt'] = null;
                            $approvals[$t]['approvedBy'] = null;
                            $approvals[$t]['hmacHash'] = null;
                            $approvals[$t]['qrUrl'] = null;
                        }
                    }
                } else {
                    foreach ($approvals as &$app) {
                        $app['approved'] = false;
                        $app['approvedAt'] = null;
                        $app['approvedBy'] = null;
                        $app['hmacHash'] = null;
                        $app['qrUrl'] = null;
                    }
                    unset($app);
                }
            }
        } else {
            $approvals = buildDynamicApprovals($alur, $namaPengaju, $jabatanPengaju, $divisiPengaju);
        }

        // Status State Machine
        $newStatus = 'DRAFT';
        if (!$isDraft) {
            $newStatus = 'SUBMITTED';
        }

        $auditTrail = $existing['auditTrail'] ?? [];
        if (!empty($catatanAuditTarif)) {
            $auditTrail[] = [
                'timestamp'  => $now,
                'action'     => 'TARIF_EXCEPTION_RECORDED',
                'user'       => $currentUser['displayName'] ?? 'Petugas Pusat',
                'keterangan' => implode(' | ', $catatanAuditTarif)
            ];
        }

        // Buat atau perbarui dokumen
        $doc = [
            'id'               => $docId,
            'noRegistrasi'     => $noReg,
            'jenisOperasional' => $jenisOperasional,
            'jenisLabel'       => $jenisLabel,
            'kantor'           => 'Kantor Pusat Jakarta',
            'kodeCabang'       => '00',
            'kodeKantor'       => $kodeKantor ?: '2.19.0160-00',
            'status'           => $newStatus,
            'versi'            => $versi,
            'workflowSystem'   => $workflowSystem,
            'alur'             => $alur,
            'maksudTujuan'     => $maksudTujuan,
            'tglPengajuan'     => $existing['tglPengajuan'] ?? $today,
            'createdAt'        => $existing['createdAt'] ?? $now,
            'updatedAt'        => $now,
            'totalEstimasi'    => $totalEstimasi,
            'catatanPemohon'   => trim($payload['catatanPemohon'] ?? ''),
            'pemohon'          => [
                'nama'         => $namaPengaju,
                'jabatan'      => $jabatanPengaju,
                'divisi'       => $divisiPengaju,
                'cabang'       => 'Kantor Pusat Jakarta',
                'sub'          => $currentUser['sub'] ?? 'pemohon',
                'userLogin'    => $currentUser['displayName'] ?? 'Petugas Pusat'
            ],
            'survey'           => $surveyData,
            'meeting'          => $meetingData,
            'umum'             => $umumData,
            'penolakan'        => [
                'alasan'       => '',
                'ditolakOleh'  => '',
                'tglDitolak'   => null,
                'tierDitolak'  => null
            ],
            'approvals'        => $approvals,
            'auditTrail'       => $auditTrail
        ];

        if (!$isDraft) {
            if ($workflowSystem === '5_TIER') {
                // Kompatibilitas Dokumen Historis 5-Tier
                $contentDigest = generateContentDigest($doc);
                $tier1Hmac = generateTierHmac(
                    $doc['id'],
                    1,
                    $doc['versi'],
                    $contentDigest,
                    $namaPengaju,
                    'Yang Mengajukan',
                    $now,
                    $SERVER_SECRET
                );
                $tier1Qr = generateQrVerificationUrl($doc['noRegistrasi'] ?: $doc['id'], 1, $tier1Hmac);

                $doc['approvals'][1]['approved'] = true;
                $doc['approvals'][1]['approvedAt'] = $now;
                $doc['approvals'][1]['approvedBy'] = $namaPengaju;
                $doc['approvals'][1]['pejabat'] = $namaPengaju;
                $doc['approvals'][1]['hmacHash'] = $tier1Hmac;
                $doc['approvals'][1]['qrUrl'] = $tier1Qr;
            }

            $actionName = $isRevision ? 'SUBMIT_REVISI_V' . $versi : 'SUBMIT_PENGAJUAN';
            $keteranganAudit = $isRevision
                ? "Pengajuan revisi versi {$versi} dikirimkan dan menunggu Persetujuan Manager Divisi (Tingkat 1)."
                : "Pengajuan operasional resmi dikirimkan dan masuk ke antrean Persetujuan Manager Divisi (Tingkat 1).";

            $doc['auditTrail'][] = [
                'action'     => $actionName,
                'timestamp'  => $now,
                'user'       => $currentUser['displayName'] ?? $namaPengaju,
                'role'       => $currentUser['role'] ?? 'PEMOHON',
                'keterangan' => $keteranganAudit
            ];
        } else {
            $doc['auditTrail'][] = [
                'action'     => $existing ? 'UPDATE_DRAFT' : 'CREATE_DRAFT',
                'timestamp'  => $now,
                'user'       => $currentUser['displayName'] ?? $namaPengaju,
                'role'       => $currentUser['role'] ?? 'PEMOHON',
                'keterangan' => 'Draf pengajuan operasional disimpan.'
            ];
        }

        if ($existingIndex >= 0) {
            $records[$existingIndex] = $doc;
        } else {
            $records[] = $doc;
        }

        return [
            'success'   => true,
            'records'   => $records,
            'data'      => $doc,
            'message'   => $isDraft ? 'Draf pengajuan berhasil disimpan.' : 'Pengajuan operasional berhasil dikirimkan.'
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}

// F. ACTION: approveTier (Otorisasi Bertingkat Dinamis & RBAC Ketat)
if ($action === 'approveTier') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id || $tier < 1 || $tier > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dan tier (1..5) wajib diisi.']);
        exit;
    }

    // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
    if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk melakukan otorisasi pada sistem produksi.'
        ]);
        exit;
    }

    // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
    $userCanApprove = !empty($currentUser['canApprove']);
    $userPermissions = $currentUser['permissions'] ?? [];
    if (!$userCanApprove || empty($userPermissions)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki wewenang approval dokumen operasional."
        ]);
        exit;
    }

    // 3. FAST-FAIL RBAC: Jika user tidak memiliki izin sama sekali untuk tier ini
    if ($tier === 1 && !in_array('APPROVE_TEKNIK', $userPermissions, true) && !in_array('APPROVE_ADMIN', $userPermissions, true)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) tidak memiliki izin APPROVE_TEKNIK atau APPROVE_ADMIN untuk mengesahkan Tingkat 1."
        ]);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $tier, $currentUser, $userRole, $userPermissions, $SERVER_SECRET) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        $doc = $records[$targetIndex];

        // Status dokumen harus SUBMITTED atau IN_REVIEW
        $status = $doc['status'] ?? 'DRAFT';
        if ($status === 'DRAFT') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen masih berstatus DRAFT dan belum disubmit oleh pemohon.'];
        }
        if ($status === 'REJECTED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen berstatus REJECTED. Pemohon harus mengajukan revisi sebelum otorisasi dapat dilanjutkan.'];
        }
        if ($status === 'APPROVED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen sudah disetujui sepenuhnya (Semua Tingkat Selesai).'];
        }

        if (!isset($doc['approvals'][$tier])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tahap otorisasi Tier {$tier} tidak terdapat pada alur dokumen ini."];
        }

        // Periksa apakah Tier ini sudah disetujui sebelumnya
        if (!empty($doc['approvals'][$tier]['approved'])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tier {$tier} sudah disetujui sebelumnya."];
        }

        // PEMETAAN HAK AKSES PER-TIER SECARA KETAT (STRICT SEPARATION OF DUTIES)
        $step = $doc['approvals'][$tier] ?? [];
        $roleKey = $step['roleKey'] ?? '';
        $labelTarget = $step['label'] ?? "Tier {$tier}";
        $isLegacy5Tier = (($doc['workflowSystem'] ?? '') === '5_TIER') || (count($doc['approvals'] ?? []) === 5 && !isset($step['tingkat']));

        $requiredPerm = null;
        $authorizedRoleTitle = '';
        if ($roleKey === 'TEKNIK') {
            $requiredPerm = 'APPROVE_TEKNIK';
            $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
        } elseif ($roleKey === 'ADMIN_UMUM') {
            $requiredPerm = 'APPROVE_ADMIN';
            $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
        } elseif ($roleKey === 'KEUANGAN') {
            $requiredPerm = 'APPROVE_KEUANGAN';
            $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
        } elseif ($roleKey === 'KEPALA_KEUANGAN') {
            $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
            $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
        } elseif ($isLegacy5Tier) {
            if ($tier === 2) {
                $requiredPerm = 'APPROVE_TEKNIK';
                $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
            } elseif ($tier === 3) {
                $requiredPerm = 'APPROVE_ADMIN';
                $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
            } elseif ($tier === 4) {
                $requiredPerm = 'APPROVE_KEUANGAN';
                $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
            } elseif ($tier === 5) {
                $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
                $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
            }
        }

        if (!$requiredPerm || !in_array($requiredPerm, $userPermissions, true)) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) tidak memiliki izin {$requiredPerm} untuk mengesahkan {$labelTarget}. Wewenang ini khusus untuk {$authorizedRoleTitle}."
            ];
        }

        // PENEGAKAN URUTAN PERSATUAN (SEQUENTIAL ENFORCEMENT)
        $alurDoc = strtoupper(trim($doc['alur'] ?? ''));
        $targetTingkat = $step['tingkat'] ?? $tier;

        if ($isLegacy5Tier) {
            if ($tier > 1) {
                $prevTier = $tier - 1;
                $prevApproval = $doc['approvals'][$prevTier] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap {$prevTier} (" . ($prevApproval['label'] ?? '') . ") belum disetujui."
                    ];
                }
            }
        } elseif ($alurDoc === 'LINTAS_DIVISI' || $alurDoc === 'LINTAS') {
            if ($targetTingkat === 2 || $tier === 3) {
                $tier1Approved = !empty($doc['approvals'][1]['approved']);
                $tier2Approved = !empty($doc['approvals'][2]['approved']);
                if (!$tier1Approved || !$tier2Approved) {
                    $belum = [];
                    if (!$tier1Approved) $belum[] = $doc['approvals'][1]['label'] ?? 'Manager Teknik';
                    if (!$tier2Approved) $belum[] = $doc['approvals'][2]['label'] ?? 'Manager Admin & Umum';
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan Lintas Divisi memerlukan persetujuan lengkap Tingkat 1 sebelum lanjut ke Keuangan. Tahap yang belum disetujui: " . implode(' & ', $belum) . "."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 4) {
                $keuApproved = !empty($doc['approvals'][3]['approved']);
                if (!$keuApproved) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan akhir Kepala Keuangan (Tingkat 3) hanya dapat dilakukan setelah Verifikasi Manager Keuangan (Tingkat 2) disetujui."
                    ];
                }
            }
        } else {
            if ($targetTingkat === 2 || $tier === 2) {
                $prevApproval = $doc['approvals'][1] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 1 (" . ($prevApproval['label'] ?? 'Manager Divisi') . ") belum disetujui."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 3) {
                $prevApproval = $doc['approvals'][2] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 2 (" . ($prevApproval['label'] ?? 'Manager Keuangan') . ") belum disetujui."
                    ];
                }
            }
        }

        // TENTUKAN NAMA & JABATAN PEJABAT RESMI
        $pejabatNama = !empty($currentUser['displayName']) ? $currentUser['displayName'] : ($step['pejabat'] ?? 'Pejabat Berwenang');
        $pejabatJabatan = $step['jabatan'] ?? 'Pejabat';

        // HITUNG CRYPTOGRAPHIC HMAC TOKEN
        $contentDigest = generateContentDigest($doc);
        $hmac = generateTierHmac(
            $doc['id'],
            $tier,
            $doc['versi'] ?? 1,
            $contentDigest,
            $pejabatNama,
            $pejabatJabatan,
            $now,
            $SERVER_SECRET
        );

        $qrUrl = generateQrVerificationUrl($doc['noRegistrasi'] ?: $doc['id'], $tier, $hmac);

        // REKAM PERSETUJUAN
        $doc['approvals'][$tier]['approved'] = true;
        $doc['approvals'][$tier]['approvedAt'] = $now;
        $doc['approvals'][$tier]['approvedBy'] = $pejabatNama;
        $doc['approvals'][$tier]['pejabat'] = $pejabatNama;
        $doc['approvals'][$tier]['hmacHash'] = $hmac;
        $doc['approvals'][$tier]['qrUrl'] = $qrUrl;

        // Update status dokumen (Jika semua tier selesai -> APPROVED)
        $allDone = true;
        foreach ($doc['approvals'] as $a) {
            if (empty($a['approved'])) {
                $allDone = false;
                break;
            }
        }
        if ($allDone) {
            $doc['status'] = 'APPROVED';
        } else {
            $doc['status'] = 'IN_REVIEW';
        }
        $doc['updatedAt'] = $now;

        $doc['auditTrail'][] = [
            'action'     => 'APPROVE_TIER_' . $tier,
            'timestamp'  => $now,
            'user'       => $pejabatNama,
            'role'       => $userRole,
            'keterangan' => "Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") disetujui secara sah oleh {$pejabatNama}."
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => "Persetujuan Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") berhasil disahkan oleh {$pejabatNama}."
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}

// G. ACTION: rejectWithNote (Penolakan dengan Alasan Minimal 10 Karakter & RBAC Ketat)
if ($action === 'rejectWithNote') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $alasan = trim($payload['alasan'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dokumen wajib diisi.']);
        exit;
    }

    if (strlen($alasan) < 10) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Alasan penolakan wajib diisi secara jelas dengan minimal 10 karakter.'
        ]);
        exit;
    }

    // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
    if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk menolak dokumen pada sistem produksi.'
        ]);
        exit;
    }

    // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
    $userCanApprove = !empty($currentUser['canApprove']);
    $userPermissions = $currentUser['permissions'] ?? [];
    if (!$userCanApprove || empty($userPermissions)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki hak wewenang otorisasi penolakan dokumen operasional."
        ]);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $alasan, $tier, $currentUser, $userRole, $userPermissions) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        $doc = $records[$targetIndex];

        // 3. VALIDASI WEWENANG PENOLAKAN SESUAI TIER
        if ($tier > 0 && isset($doc['approvals'][$tier])) {
            $step = $doc['approvals'][$tier];
            $roleKey = $step['roleKey'] ?? '';
            $requiredPerm = null;
            if ($roleKey === 'TEKNIK') $requiredPerm = 'APPROVE_TEKNIK';
            elseif ($roleKey === 'ADMIN_UMUM') $requiredPerm = 'APPROVE_ADMIN';
            elseif ($roleKey === 'KEUANGAN') $requiredPerm = 'APPROVE_KEUANGAN';
            elseif ($roleKey === 'KEPALA_KEUANGAN') $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';

            if ($requiredPerm && !in_array($requiredPerm, $userPermissions, true)) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki izin {$requiredPerm} untuk menolak pengajuan pada tahap ini."
                ];
            }
        } else {
            $hasAnyApproval = false;
            foreach (['APPROVE_TEKNIK', 'APPROVE_ADMIN', 'APPROVE_KEUANGAN', 'APPROVE_KEPALA_KEUANGAN'] as $p) {
                if (in_array($p, $userPermissions, true)) {
                    $hasAnyApproval = true;
                    break;
                }
            }
            if (!$hasAnyApproval) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki hak otorisasi penolakan dokumen operasional."
                ];
            }
        }

        $penolakNama = $currentUser['displayName'] ?? 'Pejabat Berwenang';

        // Status dokumen diubah menjadi REJECTED
        $doc['status'] = 'REJECTED';
        $doc['updatedAt'] = $now;
        $doc['penolakan'] = [
            'alasan'      => $alasan,
            'ditolakOleh' => $penolakNama,
            'tglDitolak'  => $now,
            'tierDitolak' => $tier ?: 0
        ];

        $doc['auditTrail'][] = [
            'action'     => 'REJECT_DOCUMENT',
            'timestamp'  => $now,
            'user'       => $penolakNama,
            'role'       => $userRole,
            'keterangan' => "Pengajuan ditolak pada Tier " . ($tier ?: 'Review') . " oleh {$penolakNama}. Alasan: " . $alasan
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => 'Pengajuan berhasil ditolak dan catatan telah disampaikan.'
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}

// Action tidak dikenali
http_response_code(400);
echo json_encode([
    'success' => false,
    'error'   => 'Action tidak dikenali: ' . htmlspecialchars($action)
]);
exit;
