<?php
/**
 * KJPP NSR — Secure Server-Side Authentication & Access Token Gate
 * Endpoint untuk Portal Layanan Internal, NoLap, dan Kwitansi
 * 
 * Melayani:
 * - POST /api/auth-token   (Validasi token akses kantor cabang / petugas)
 * - POST /api/auth-login   (Autentikasi akun staf & kantor cabang)
 * - GET  /api/auth-verify  (Pemeriksaan status sesi aktif server-side)
 * - POST /api/auth-logout  (Pencabutan sesi dan pembersihan cookie)
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
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ||
           (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

// Sesi 8 Jam Kerja
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
// 1. DATA TOKENS RESMI (DISIMPAN DALAM BENTUK HASH SHA-256)
// Menjamin token rahasia tidak bocor dalam kode sumber publik
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // =============================================================
    // TOKENS DEMO STAGING BARU (ISOLASI PREVIEW)
    // =============================================================
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [ // NSR-STAGE-MASTER-77
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'Pemimpin Rekan & Super Admin Master',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8' => [ // NSR-STAGE-PR-55
        'sub'               => 'partner_nanang',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'PEMIMPIN_REKAN',
        'roleLabel'         => 'Pemimpin Rekan (Penanggung Jawab)',
        'title'             => 'Pemimpin Rekan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8'
    ],
    '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10' => [ // NSR-STAGE-REK-22
        'sub'               => 'rekan_deni',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mengetahui)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10'
    ],
    'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea' => [ // NSR-STAGE-ADM-33
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'ADMIN_PUSAT',
        'roleLabel'         => 'Verifikasi Administrasi & Legal',
        'title'             => 'Verifikasi Administrasi',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea'
    ],
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [ // NSR-STAGE-KEU-44
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Tingkat 2)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f' => [ // NSR-STAGE-SRV-11
        'sub'               => 'surveyor_holik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Yang Mengajukan)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
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
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-03',
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
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-02',
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
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-01',
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
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-04',
        'tokenHash'         => '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ],

    // Dedicated Token Manager Teknik (NSR-DIVTEK-2026)
    'dd978492a43a62cdfaf0526c90957ae6443be71f7459a6dbcb4014ed3e4c24fb' => [ // NSR-DIVTEK-2026 (Raw SHA-256)
        'sub'               => 'manager_teknik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1)',
        'title'             => 'Manager Teknik',
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
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
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
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9'
    ],

    // Audited Token Rekan Mitra (NSR-REK-2026) - Technical approval revoked
    '77d4e819966f67807537cf7e995ab765b911fc6be3d5101bbc0da473e9dbe4f2' => [ // NSR-REK-2026 (Raw SHA-256)
        'sub'               => 'rekan_umum',
        'branch'            => 'PUSAT',
        'displayName'       => 'Rekan Penilai',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mitra Umum)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
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
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => 'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2'
    ],

    // Dedicated Token: Kepala Keuangan & Pemimpin Rekan (Ir. Nanang Rahayu, M.Ec.Dev. - NSR-KEPKEU-2026)
    '6a19d17c1a36f87a4c8b385d3b1ceda599bf3342f5dd3197bb79e8f63898a6ed' => [ // NSR-KEPKEU-2026 (Raw SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
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
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
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
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50'
    ],

    // Audited Token NSR8899 - Hak approval dicabut total
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT (Non-Approval)',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT (Non-Approval)',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],

    // Audited Token NSR-PST-2026 - Hak approval dialihkan eksklusif ke NSR-ADM-2026
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT (Non-Approval)',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT (Non-Approval)',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
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
        'kodeKemenkeu'      => '2.0160-01'
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
        'kodeKemenkeu'      => '2.0160-01'
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
        'kodeKemenkeu'      => '2.0160-01'
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
        'kodeKemenkeu'      => '2.0160-01'
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
        'kodeKemenkeu'      => '2.0160-02'
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
        'kodeKemenkeu'      => '2.0160-02'
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
        'kodeKemenkeu'      => '2.0160-02'
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
        'kodeKemenkeu'      => '2.0160-02'
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
        'kodeKemenkeu'      => '2.0160-03'
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
        'kodeKemenkeu'      => '2.0160-03'
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
        'kodeKemenkeu'      => '2.0160-03'
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
        'kodeKemenkeu'      => '2.0160-03'
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
    'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e' => [
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
    '5801bb3891c492e6497bd5c0eb4d583606d07eed0058c05f8d4238c114b9f3e1' => [
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
    'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721' => [
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
    '422e642284f66071b52b6cd23e4856ee7e5acf6735f0bc5754173c270c487d4b' => [
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
    '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0' => [
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat',
        'title'             => 'Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d' => [
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat',
        'title'             => 'Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9' => [
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
    'a01d6024094ea8618268233f1e73d79e400c76d36abb144b2d087896f2e3a6ca' => [
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
];

// -------------------------------------------------------------
// 2. DATA AKUN RESMI / STAF (USERNAME + PASSWORD)
// Digunakan pada formulir login langsung portal NoLap & Kwitansi
// -------------------------------------------------------------
$USER_ACCOUNTS = [
    'test_admin' => [
        'passHash'    => '747c3e53610214bb5255474dc1bfad91d17d52367d3b954fb6ea805fb3eb3337',
        'role'        => 'ADMIN_PUSAT',
        'branch'      => 'Pusat',
        'displayName' => 'Administrator Staging',
        'title'       => 'Admin Pusat'
    ],
    'admin' => [
        'passHash'    => '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0',
        'role'        => 'ADMIN_PUSAT',
        'branch'      => 'Pusat',
        'displayName' => 'Admin Pusat Jakarta',
        'title'       => 'Admin Operasional Pusat'
    ],
    'test_cabang_bdg' => [
        'passHash'    => '4478ae9789230554c58cf3e244b20a56247c1fbb4ef0fa6963ca287114b097b0',
        'role'        => 'CABANG',
        'branch'      => 'Bandung',
        'displayName' => 'Cabang Bandung',
        'title'       => 'Staf Penilai Bandung'
    ],
    'test_cabang_pdg' => [
        'passHash'    => 'ffc35b6b3e94448722c0211fc5f329976ee6b78db421d0061e89b33a0422d3e4',
        'role'        => 'CABANG',
        'branch'      => 'Padang',
        'displayName' => 'Cabang Padang',
        'title'       => 'Staf Penilai Padang'
    ],
    'test_keuangan' => [
        'passHash'    => 'b1ae67e81881682e850b1d38706bcfe47e7b57b98a0058ec40da42ba15e45a0b',
        'role'        => 'KEUANGAN',
        'branch'      => 'Pusat',
        'displayName' => 'Keuangan Staging',
        'title'       => 'Staf Verifikasi Keuangan'
    ]
];

// -------------------------------------------------------------

// -------------------------------------------------------------
// HELPER RESOLVER TOKEN RESMI DARI SERVER
// -------------------------------------------------------------
function resolveServerToken($rawToken, $hashRegistry) {
    if (!$rawToken || !is_string($rawToken)) return null;
    $clean = trim($rawToken);
    
    // 1. Pencocokan langsung 64 karakter hex
    if (strlen($clean) === 64 && isset($hashRegistry[strtolower($clean)])) {
        return [$hashRegistry[strtolower($clean)], strtolower($clean)];
    }
    
    // 2. Raw SHA-256
    $rawHash = hash('sha256', strtoupper($clean));
    if (isset($hashRegistry[$rawHash])) {
        return [$hashRegistry[$rawHash], $rawHash];
    }
    
    // 3. Salted SHA-256
    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($clean));
    if (isset($hashRegistry[$saltedHash])) {
        return [$hashRegistry[$saltedHash], $saltedHash];
    }
    
    return null;
}

// 3. DETEKSI ACTION ROUTING
// -------------------------------------------------------------
$action = $_GET['action'] ?? $_POST['action'] ?? null;
if (!$action) {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (strpos($path, 'auth-token') !== false) {
        $action = 'token';
    } elseif (strpos($path, 'auth-login') !== false) {
        $action = 'login';
    } elseif (strpos($path, 'auth-verify') !== false) {
        $action = 'verify';
    } elseif (strpos($path, 'auth-logout') !== false) {
        $action = 'logout';
    } elseif (strpos($path, 'auth.php') !== false || strpos($path, 'api/auth') !== false) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = 'login';
        } else {
            $action = 'verify';
        }
    }
}

// -------------------------------------------------------------
// 4. RATE LIMITING RINGAN (ANTI BRUTE-FORCE)
// -------------------------------------------------------------
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

$rateFile = sys_get_temp_dir() . '/nsr_rate_limit_' . md5($clientIp) . '.json';
$rateData = ['fails' => 0, 'last' => time()];
if (file_exists($rateFile)) {
    $raw = @file_get_contents($rateFile);
    $parsed = json_decode($raw, true);
    if ($parsed && is_array($parsed)) {
        if (time() - ($parsed['last'] ?? 0) < 300) { // Jendela 5 menit
            $rateData = $parsed;
        }
    }
}

function recordFail($rateFile, &$rateData) {
    $rateData['fails']++;
    $rateData['last'] = time();
    @file_put_contents($rateFile, json_encode($rateData), LOCK_EX);
}

function clearFail($rateFile) {
    if (file_exists($rateFile)) {
        @unlink($rateFile);
    }
}

if ($rateData['fails'] >= 10 && (time() - $rateData['last']) < 300) {
    http_response_code(429);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Terlalu banyak percobaan gagal. Silakan tunggu 5 menit sebelum mencoba kembali.'
    ]);
    exit;
}

// -------------------------------------------------------------
// 5. PARSE INPUT BODY (JSON ATAU POST DATA)
// -------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$body = [];
if ($rawInput) {
    $body = json_decode($rawInput, true) ?: [];
}
if (empty($body)) {
    $body = $_POST;
}

// -------------------------------------------------------------
// 6. EKSEKUSI SESUAI ACTION
// -------------------------------------------------------------

// ==========================================
// A. ACTION: TOKEN (POST /api/auth-token)
// ==========================================
if ($action === 'token') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed (POST required)']);
        exit;
    }

    $rawToken = trim($body['token'] ?? '');
    if ($rawToken === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token otorisasi wajib diisi.']);
        exit;
    }

    $resolved = resolveServerToken($rawToken, $OFFICIAL_TOKEN_HASHES);

    if ($resolved) {
        clearFail($rateFile);
        list($user, $tokenHash) = $resolved;
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();

        $sessionToken = bin2hex(random_bytes(16));
        $_SESSION['nsr_session_token'] = $sessionToken;

        $expiresAt = (time() + 28800) * 1000;
        $checksumPayload = implode('::', [
            'NSR_SESSION_INTEGRITY_2026_x7k9::',
            $user['tokenHash'] ?? $tokenHash,
            $user['role'],
            $user['wilayah'],
            $expiresAt,
            !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
            'NSR_ZERO_TRUST_SIG_2026_9x4m'
        ]);
        $sessionChecksum = hash('sha256', $checksumPayload);

        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'branch'          => $user['displayName'],
            'user'            => $user,
            'tokenHash'       => $user['tokenHash'] ?? $tokenHash,
            'sessionToken'    => $sessionToken,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);
        exit;
    } else {
        recordFail($rateFile, $rateData);
        http_response_code(401);
        echo json_encode([
            'success'       => false,
            'authenticated' => false,
            'error'         => 'Token akses tidak valid atau belum terdaftar. Pastikan memasukkan token resmi KJPP NSR.'
        ]);
        exit;
    }
}

// ==========================================
// B. ACTION: LOGIN (POST /api/auth-login)
// ==========================================
if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed (POST required)']);
        exit;
    }

    $token = trim($body['token'] ?? '');
    $identifier = trim(strtolower($body['identifier'] ?? $body['username'] ?? ''));
    $password = $body['password'] ?? '';

    // Cek 1: Token otorisasi langsung
    $tokenCandidate = $token ?: ($identifier ?: $password);
    $resolved = resolveServerToken($tokenCandidate, $OFFICIAL_TOKEN_HASHES);

    if ($resolved) {
        clearFail($rateFile);
        list($user, $tokenHash) = $resolved;
        $_SESSION['nsr_user'] = $user;
        $_SESSION['nsr_login_time'] = time();

        $sessionToken = bin2hex(random_bytes(16));
        $_SESSION['nsr_session_token'] = $sessionToken;

        $expiresAt = (time() + 28800) * 1000;
        $checksumPayload = implode('::', [
            'NSR_SESSION_INTEGRITY_2026_x7k9::',
            $user['tokenHash'] ?? $tokenHash,
            $user['role'],
            $user['wilayah'],
            $expiresAt,
            !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
            'NSR_ZERO_TRUST_SIG_2026_9x4m'
        ]);
        $sessionChecksum = hash('sha256', $checksumPayload);

        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $user,
            'tokenHash'       => $user['tokenHash'] ?? $tokenHash,
            'sessionToken'    => $sessionToken,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);
        exit;
    }

    // Cek 2: User Account Login (Khusus Staf Keuangan / NoLap Staging)
    if (isset($USER_ACCOUNTS[$identifier])) {
        $acc = $USER_ACCOUNTS[$identifier];
        $inputPassHash = hash('sha256', $password);
        if (hash_equals($acc['passHash'], $inputPassHash)) {
            clearFail($rateFile);
            $user = [
                'sub'               => $identifier,
                'branch'            => $acc['branch'],
                'displayName'       => $acc['displayName'],
                'role'              => $acc['role'],
                'roleLabel'         => $acc['displayName'],
                'title'             => $acc['title'],
                'wilayah'           => $acc['branch'],
                'wilayahLabel'      => 'Kantor Pusat Jakarta',
                'wilayahCode'       => 'PST',
                'isSuperAdmin'      => ($acc['role'] === 'ADMIN_PUSAT'),
                'isCabang'          => ($acc['role'] === 'CABANG'),
                'canAccessKwitansi' => true,
                'canApprove'        => ($acc['role'] === 'ADMIN_PUSAT'),
                'canSubmit'         => true,
                'seeFee'            => true,
                'mode'              => ($acc['role'] === 'CABANG') ? 'CABANG' : 'PUSAT'
            ];
            $_SESSION['nsr_user'] = $user;
            $_SESSION['nsr_login_time'] = time();

            $sessionToken = bin2hex(random_bytes(16));
            $_SESSION['nsr_session_token'] = $sessionToken;

            $expiresAt = (time() + 28800) * 1000;
            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                hash('sha256', $identifier),
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);

            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'sessionToken'    => $sessionToken,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    recordFail($rateFile, $rateData);
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Akses Ditolak: Token atau kredensial pengguna tidak valid.'
    ]);
    exit;
}

// ==========================================
// C. ACTION: VERIFY (GET/POST /api/auth-verify)
// ==========================================
if ($action === 'verify') {
    // 1. Sesi PHP
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            $user = $_SESSION['nsr_user'];
            $expiresAt = ($loginTime + 28800) * 1000;
            $tokenHash = $user['tokenHash'] ?? '';
            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                $tokenHash,
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);
            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'tokenHash'       => $tokenHash,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    // 2. Bearer token / X-NSR-Token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $rawBearer = '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
        $rawBearer = $m[1];
    } elseif (!empty($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawBearer = $_SERVER['HTTP_X_NSR_TOKEN'];
    }
    if ($rawBearer) {
        $resolved = resolveServerToken($rawBearer, $OFFICIAL_TOKEN_HASHES);
        if ($resolved) {
            list($user, $tokenHash) = $resolved;
            $expiresAt = (time() + 28800) * 1000;
            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                $user['tokenHash'] ?? $tokenHash,
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                !empty($user['isSuperAdmin']) ? 'TRUE' : 'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);
            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'tokenHash'       => $user['tokenHash'] ?? $tokenHash,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi tidak aktif atau telah kedaluwarsa. Silakan masukkan token akses.'
    ]);
    exit;
}

// ==========================================
// D. ACTION: LOGOUT (POST /api/auth-logout)
// ==========================================
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode([
        'success'       => true,
        'authenticated' => false
    ]);
    exit;
}

// Default Fallback jika route tidak dikenali
http_response_code(404);
echo json_encode([
    'success' => false,
    'error'   => 'Endpoint tidak ditemukan.'
]);
