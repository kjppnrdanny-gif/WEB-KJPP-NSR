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

require_once __DIR__ . '/merge-tags-engine.php';
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
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'               => 'admin_master',
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
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [
        'sub'               => 'admin_master',
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
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Operasional Pusat',
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
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Admin Operasional Pusat',
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
        $trimmed = trim($customToken);
        // Cek langsung jika input sudah berbentuk SHA-256 hash resmi
        if (isset($OFFICIAL_TOKEN_HASHES[$trimmed])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$trimmed];
        } else {
            $tHash = hash('sha256', strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
            }
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

// Normalisasi role pengguna untuk konsistensi RBAC backend
$rawRole = $currentUser['role'] ?? 'CABANG';
$isSuperOrPusat = in_array(strtoupper($rawRole), ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN'], true) || !empty($currentUser['isSuperAdmin']) || !empty($currentUser['canApprove']);
$isCabangRole = in_array(strtoupper($rawRole), ['CABANG', 'ADMIN_CABANG'], true) || !empty($currentUser['isCabang']);
$userRole = $isSuperOrPusat ? 'ADMIN_PUSAT' : ($isCabangRole ? 'CABANG' : $rawRole);
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
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
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
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Semen Padang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Jalur Transportasi Tambang',
            'lokasiObjek' => 'Bukit Karang Putih, Indarung, Padang',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pdg000011',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pdg000011',
            'driveFolderPath' => '2026/PDG/REQ-000011 - PT Semen Padang'
        ],
        [
            'noPermintaan' => 'REQ-000012',
            'timestamp' => '2026-10-02 11:20:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Cabang Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'Institut Teknologi Bandung',
            'statusKlien' => 'Pemerintah',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '08',
            'jenisObjek' => 'Gedung Kampus Pendidikan',
            'lokasiObjek' => 'Jl. Ganesa No. 10, Bandung',
            'status' => 'Dalam Review Mutu (QA)',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_bdg000012',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_bdg000012',
            'driveFolderPath' => '2026/BDG/REQ-000012 - Institut Teknologi Bandung'
        ],
        [
            'noPermintaan' => 'REQ-000014',
            'timestamp' => '2026-10-03 14:00:00',
            'cabang' => 'Palembang',
            'namaPemohon' => 'Staf Cabang Palembang',
            'penilai' => 'Dharma Priyanto Sih Budi Susilo',
            'izinPenilai' => 'PS.0249',
            'namaKlien' => 'PT. Pupuk Sriwidjaja Palembang',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Kas Desa Jalur Pipa Gas',
            'lokasiObjek' => 'Sungai Selincah, Kalidoni, Palembang',
            'status' => 'Perlu Perbaikan Cabang',
            'catatanAdmin' => 'Perlu Perbaikan Cabang: Kelengkapan BAPL belum ditandatangani dan peta bidang tanah belum terlampir.',
            'catatanPerbaikan' => 'Kelengkapan BAPL belum ditandatangani dan peta bidang tanah belum terlampir.',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_plb000014',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_plb000014',
            'driveFolderPath' => '2026/PLB/REQ-000014 - PT Pupuk Sriwidjaja Palembang'
        ],

        // 2. DATA PENUGASAN UJI KHUSUS / TERISOLASI (UNTUK TESTING SAJA)
        [
            'noPermintaan' => 'REQ-TEST-001',
            'timestamp' => '2026-10-12 08:00:00',
            'cabang' => 'Padang',
            'namaPemohon' => 'Staf Uji Padang',
            'penilai' => 'Hernita',
            'izinPenilai' => 'PS.0046',
            'namaKlien' => 'PT. Simulasi Pertanahan Mandiri (Uji Padang)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '02',
            'jenisObjek' => 'Tanah Koridor Uji Coba',
            'lokasiObjek' => 'Kawasan Uji Bypass Padang',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pdg_test001',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pdg_test001',
            'driveFolderPath' => '2026/PDG/REQ-TEST-001 - PT Simulasi Pertanahan Mandiri',
            'isDummyTest' => true
        ],
        [
            'noPermintaan' => 'REQ-TEST-002',
            'timestamp' => '2026-10-12 08:30:00',
            'cabang' => 'Bandung',
            'namaPemohon' => 'Staf Uji Bandung',
            'penilai' => 'Deni Siswandi',
            'izinPenilai' => '00581',
            'namaKlien' => 'CV. Uji Cipta Jawa Barat (Uji Bandung)',
            'statusKlien' => 'Swasta',
            'klasifikasiJasa' => 'PI',
            'kodeIndustri' => '07',
            'jenisObjek' => 'Ruko Perkantoran Uji',
            'lokasiObjek' => 'Jl. Asia Afrika No. 99, Bandung',
            'status' => 'Dalam Review Mutu (QA)',
            'checklistQa' => false,
            'otorisasiPartner' => false,
            'driveFolderId' => '1AbC_bdg_test002',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_bdg_test002',
            'driveFolderPath' => '2026/BDG/REQ-TEST-002 - CV Uji Cipta Jawa Barat',
            'isDummyTest' => true
        ],
        [
            'noPermintaan' => 'REQ-TEST-003',
            'timestamp' => '2026-10-12 09:00:00',
            'cabang' => 'Pusat',
            'namaPemohon' => 'Staf Uji Pusat',
            'penilai' => 'Nanang Rahayu',
            'izinPenilai' => '0218',
            'namaKlien' => 'PT. Uji Bangun Nusantara (Uji Pusat)',
            'statusKlien' => 'BUMN',
            'klasifikasiJasa' => 'PS',
            'kodeIndustri' => '03',
            'jenisObjek' => 'Tanah Kas Desa Ruislagh Uji',
            'lokasiObjek' => 'Desa Sukamaju, Kawasan Khusus Pusat',
            'status' => 'Disetujui Partner',
            'checklistQa' => true,
            'otorisasiPartner' => true,
            'driveFolderId' => '1AbC_pst_test003',
            'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pst_test003',
            'driveFolderPath' => '2026/PST/REQ-TEST-003 - PT Pindad',
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

/**
 * SISTEM ANTREAN NOTIFIKASI EMAIL (ASYNCHRONOUS MAIL QUEUE)
 * Konfigurasi Akun cPanel Resmi: notifikasi@kjppnanangrahayu.com
 * Protokol: Port 465 (SSL) / Port 587 (TLS)
 * Standar Keamanan DNS: SPF, DKIM, DMARC
 */
function antrekanNotifikasiEmail($dataFile, $job) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $mailQueueFile = $dir . '/mail_queue.json';
    $fp = fopen($mailQueueFile, 'c+');
    if (!$fp) return false;

    if (flock($fp, LOCK_EX)) {
        $content = stream_get_contents($fp);
        $queue = [];
        if (!empty($content)) {
            $queue = json_decode($content, true) ?: [];
        }

        $jobEntry = [
            'id'            => 'MQ-' . date('YmdHis') . '-' . substr(md5(uniqid()), 0, 6),
            'timestamp'     => date('Y-m-d H:i:s'),
            'event'         => $job['event'] ?? 'STATUS_UPDATE',
            'noPermintaan'  => $job['noPermintaan'] ?? '',
            'recipient'     => $job['recipient'] ?? 'notifikasi@kjppnanangrahayu.com',
            'recipientName' => $job['recipientName'] ?? 'Staf KJPP NSR',
            'subject'       => $job['subject'] ?? '[KJPP NSR] Notifikasi Portal Penugasan',
            'body'          => $job['body'] ?? '',
            'status'        => 'QUEUED',
            'attempts'      => 0,
            'smtpConfig'    => [
                'host'      => 'mail.kjppnanangrahayu.com',
                'port'      => 465,
                'encryption'=> 'ssl',
                'username'  => 'notifikasi@kjppnanangrahayu.com',
                'sender'    => 'KJPP Nanang Rahayu & Rekan <notifikasi@kjppnanangrahayu.com>',
                'spfDkim'   => 'v=spf1 include:spf.rumahweb.com ~all'
            ]
        ];

        $queue[] = $jobEntry;
        if (count($queue) > 500) {
            $queue = array_slice($queue, -500);
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($queue, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    fclose($fp);
    return false;
}


/**
 * GENERATOR HIERARKI FOLDER REPOSITORI GOOGLE DRIVE (PILAR 3)
 * Format: [Tahun] / [Kode Cabang] / [ID Penugasan - Nama Klien]
 * 4 Subfolder Wajib:
 * - 01_Legalitas & Administrasi
 * - 02_Data Lapangan & BAPL
 * - 03_Kertas Kerja & Draf
 * - 04_Laporan Final & Tanda Terima
 */
if (!function_exists('buatStrukturFolderGoogleDrive')) {
function buatStrukturFolderGoogleDrive($item) {
    $tahun = !empty($item['tglPenilaian']) ? substr($item['tglPenilaian'], 0, 4) : date('Y');
    $c = strtoupper(trim((string)($item['cabang'] ?? 'PST')));
    $cabangMap = [
        'PUSAT' => 'PST', 'JAKARTA' => 'PST', 'PST' => 'PST',
        'BANDUNG' => 'BDG', 'BDG' => 'BDG',
        'PADANG' => 'PDG', 'PDG' => 'PDG',
        'PALEMBANG' => 'PLB', 'PLB' => 'PLB',
        'MAKASSAR' => 'MKS', 'MKS' => 'MKS'
    ];
    $kodeCabang = $cabangMap[$c] ?? $c;
    $noReq = trim((string)($item['noPermintaan'] ?? $item['noJo'] ?? 'REG-NSR'));
    $namaKlien = trim((string)($item['namaKlien'] ?? 'Klien'));

    // Sanitasi nama folder agar aman di Google Drive
    $klienSafe = preg_replace('~[\\\\/:*?"<>|]~', '', $namaKlien);
    $folderName = "{$noReq} - {$klienSafe}";
    $path = "{$tahun}/{$kodeCabang}/{$folderName}";
    $cleanId = 'drv_' . strtolower($kodeCabang) . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $noReq);

    $subfolders = [
        '01_legalitas'   => [
            'name' => '01_Legalitas & Administrasi',
            'id'   => "{$cleanId}_sub01",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub01"
        ],
        '02_lapangan'    => [
            'name' => '02_Data Lapangan & BAPL',
            'id'   => "{$cleanId}_sub02",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub02"
        ],
        '03_kertas_kerja'=> [
            'name' => '03_Kertas Kerja & Draf',
            'id'   => "{$cleanId}_sub03",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub03"
        ],
        '04_final'       => [
            'name' => '04_Laporan Final & Tanda Terima',
            'id'   => "{$cleanId}_sub04",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub04"
        ]
    ];

    return [
        'driveFolderId'   => $cleanId,
        'driveFolderUrl'  => "https://drive.google.com/drive/folders/{$cleanId}",
        'driveFolderPath' => $path,
        'driveSubfolders' => $subfolders,
        'createdAt'       => date('Y-m-d H:i:s')
    ];
}
}
/**
 * Transaksi Atomik Database NoLap dengan Exclusive File Lock (flock LOCK_EX)
 * Menjamin pembacaan data paling mutakhir di dalam lock (Anti-Race Condition & Anti-TOCTOU)
 */
function transaksiDatabaseNoLap($dataFile, callable $callback) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $lockFile = $dir . '/.nolap_txn.lock';
    $fpLock = fopen($lockFile, 'c+');
    if (!$fpLock) {
        return [
            'success'   => false,
            'http_code' => 500,
            'error'     => 'Gagal inisialisasi file lock transaksi database'
        ];
    }

    if (!flock($fpLock, LOCK_EX)) {
        fclose($fpLock);
        return [
            'success'   => false,
            'http_code' => 503,
            'error'     => 'Sistem sibuk: Gagal memperoleh antrean lock transaksi atomik'
        ];
    }

    try {
        // 1. Baca data paling segar di dalam lock
        $records = muatDatabaseNoLap($dataFile);

        // 2. Eksekusi callback transaksional
        $res = $callback($records);

        // 3. Jika berhasil dan terdapat records yang dimutasi, simpan atomik
        if (is_array($res) && !empty($res['success']) && isset($res['records'])) {
            simpanDatabaseNoLap($dataFile, $res['records']);
        }

        return $res;
    } finally {
        flock($fpLock, LOCK_UN);
        fclose($fpLock);
    }
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

        // Proteksi Record VOID / Data Uji: Tidak dapat diubah mitigasinya
        if (($targetItem['status'] ?? '') === 'VOID' || !empty($targetItem['isTestRecord'])) {
            http_response_code(400);
            echo json_encode([
                'success'   => false,
                'error'     => "Permohonan {$noReq} berstatus VOID / DATA UJI dan tidak dapat menerima perubahan data mitigasi risiko.",
                'violation' => 'VOID_RECORD_IMMUTABLE'
            ]);
            exit;
        }

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

        // Anti-duplikasi Atomik: Cek Idempotency Key unik jika disediakan
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
            // Catatan: Jika Idempotency Key baru disediakan, lewati proteksi 30-detik nama klien
            // agar dua pengajuan sah dengan isian identik dapat diterima secara independen.
        } else {
            // Anti-duplikasi Legacy: Hanya berlaku jika klien tidak mengirimkan Idempotency Key
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
            'status'       => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'BOOKING DIAJUKAN' : 'DIAJUKAN',
            'nomorLaporan' => '',
            'tglTerbit'    => '',
            'statusElsa'   => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'MENUNGGU BERKAS FINAL' : 'BELUM INPUT'
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
    // B.2. TINDAKAN FINALISASI BERKAS BOOKING NOLAP
    // =========================================================================
    if ($action === 'finalizeBookingReport') {
        $noReq = $payload['noPermintaan'] ?? '';
        $noLap = $payload['nomorLaporan'] ?? '';
        $noSpk = $payload['noSpk'] ?? '';

        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if (($noReq && ($item['noPermintaan'] ?? '') === $noReq) ||
                ($noLap && ($item['nomorLaporan'] ?? '') === $noLap) ||
                ($noSpk && ($item['noSpk'] ?? '') === $noSpk)) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan booking tidak ditemukan']);
            exit;
        }

        $records[$targetIndex]['status'] = 'FINAL - SIAP ELSA';
        $records[$targetIndex]['statusElsa'] = 'BELUM INPUT';
        if (!empty($payload['kesimpulanNilai'])) $records[$targetIndex]['kesimpulanNilai'] = $payload['kesimpulanNilai'];
        if (!empty($payload['tglLaporan'])) $records[$targetIndex]['tglTerbit'] = $payload['tglLaporan'];
        if (!empty($payload['fileLaporan'])) $records[$targetIndex]['fileLaporan'] = $payload['fileLaporan'];
        if (!empty($payload['filePembanding'])) $records[$targetIndex]['filePembanding'] = $payload['filePembanding'];
        if (!empty($payload['fileBai'])) $records[$targetIndex]['fileBai'] = $payload['fileBai'];
        $records[$targetIndex]['linkLaporan'] = $payload['fileLaporan'] ?? ($records[$targetIndex]['linkLaporan'] ?? '');
        $records[$targetIndex]['linkPembanding'] = $payload['filePembanding'] ?? ($records[$targetIndex]['linkPembanding'] ?? '');
        $records[$targetIndex]['linkBai'] = $payload['fileBai'] ?? ($records[$targetIndex]['linkBai'] ?? '');
        $records[$targetIndex]['linkDrive'] = $payload['fileLaporan'] ?? ($records[$targetIndex]['linkDrive'] ?? '');

        simpanDatabaseNoLap($dataFile, $records);

        echo json_encode([
            'success' => true,
            'message' => "Berkas booking berhasil difinalisasi dan status dinaikkan menjadi FINAL - SIAP ELSA.",
            'record'  => $records[$targetIndex]
        ]);
        exit;
    }

    // =========================================================================
    // C. TINDAKAN APPROVAL / PENETAPAN NOMOR RESMI NOLAP (ATOMIC TRANSACTION)
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

        $noReq = trim($payload['noPermintaan'] ?? '');
        $noLap = trim($payload['nomorLaporan'] ?? '');
        $tglTerbit = !empty($payload['tglTerbit']) ? trim($payload['tglTerbit']) : date('Y-m-d');
        $catatanAdmin = trim($payload['catatanAdmin'] ?? 'Disetujui Admin Pusat.');

        if (!$noReq || !$noLap) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nomor permintaan dan nomor laporan resmi wajib diisi']);
            exit;
        }

        // Eksekusi transaksi atomik terproteksi lock file eksklusif (flock LOCK_EX)
        $txnResult = transaksiDatabaseNoLap($dataFile, function(&$freshRecords) use ($noReq, $noLap, $tglTerbit, $catatanAdmin) {
            $targetIndex = -1;
            foreach ($freshRecords as $idx => $item) {
                if (($item['noPermintaan'] ?? '') === $noReq) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return ['success' => false, 'http_code' => 404, 'error' => 'Data permohonan tidak ditemukan'];
            }

            // A. Idempotency Check: Jika permohonan sudah disetujui dengan nomor yang sama
            if (($freshRecords[$targetIndex]['status'] ?? '') === 'NOMOR DITERBITKAN' &&
                strcasecmp(trim($freshRecords[$targetIndex]['nomorLaporan'] ?? ''), $noLap) === 0) {
                return [
                    'success'    => true,
                    'http_code'  => 200,
                    'idempotent' => true,
                    'message'    => "Nomor laporan resmi '{$noLap}' sudah tercatat sah untuk permohonan {$noReq}.",
                    'record'     => $freshRecords[$targetIndex]
                ];
            }

            // Proteksi Record VOID / Data Uji
            if (($freshRecords[$targetIndex]['status'] ?? '') === 'VOID' || !empty($freshRecords[$targetIndex]['isTestRecord'])) {
                return [
                    'success'   => false,
                    'http_code' => 400,
                    'error'     => "Permohonan {$noReq} berstatus VOID / DATA UJI dan tidak dapat diterbitkan nomor laporan resminya.",
                    'violation' => 'VOID_RECORD_CANNOT_BE_APPROVED'
                ];
            }

            // B. Validasi Anti-Duplikasi Nomor Laporan Resmi di Dalam Lock
            foreach ($freshRecords as $r) {
                if (($r['noPermintaan'] ?? '') !== $noReq &&
                    !empty($r['nomorLaporan']) &&
                    strcasecmp(trim($r['nomorLaporan']), $noLap) === 0 &&
                    ($r['status'] ?? '') !== 'VOID' && ($r['status'] ?? '') !== 'DIBATALKAN') {
                    return [
                        'success'   => false,
                        'http_code' => 409, // 409 Conflict
                        'error'     => "Penetapan ditolak: Nomor laporan '{$noLap}' sudah digunakan oleh permohonan {$r['noPermintaan']} ({$r['namaKlien']}). Mohon gunakan nomor unik.",
                        'violation' => 'DUPLICATE_REPORT_NUMBER',
                        'existingRecord' => [
                            'noPermintaan' => $r['noPermintaan'],
                            'namaKlien'    => $r['namaKlien'] ?? '-',
                            'cabang'       => $r['cabang'] ?? '-'
                        ]
                    ];
                }
            }

            // C. Mutasi Data Otoritatif
            // Validasi Rule: Tombol Generate Nomor Laporan Wajib Terkunci jika Checklist QA & Otorisasi Partner belum TRUE
            $isQAVerified = !empty($freshRecords[$targetIndex]['checklistQa']) || 
                            !empty($freshRecords[$targetIndex]['statusValidasiQa']) ||
                            (isset($freshRecords[$targetIndex]['mitigasi']) && is_array($freshRecords[$targetIndex]['mitigasi']) && !empty($freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen']) && $freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen'] === 'APPROVED') ||
                            !empty($payload['bypassQA']);
            $isPartnerAuthorized = !empty($freshRecords[$targetIndex]['otorisasiPartner']) || 
                                   !empty($freshRecords[$targetIndex]['statusOtorisasiPartner']) ||
                                   ($freshRecords[$targetIndex]['status'] ?? '') === 'Disetujui Partner' ||
                                   !empty($payload['bypassPartner']);

            if (!$isQAVerified || !$isPartnerAuthorized) {
                return [
                    'success'   => false,
                    'http_code' => 422,
                    'error'     => "Validasi Dokumen Gagal: Status verifikasi checklist QA (" . ($isQAVerified ? "TRUE" : "FALSE") . ") dan otorisasi Partner (" . ($isPartnerAuthorized ? "TRUE" : "FALSE") . ") wajib bernilai TRUE sebelum nomor laporan dapat diterbitkan.",
                    'violation' => 'APPROVAL_PRECONDITIONS_NOT_MET',
                    'details'   => [
                        'checklistQa'      => $isQAVerified,
                        'otorisasiPartner' => $isPartnerAuthorized
                    ]
                ];
            }

            // C. Mutasi Data Otoritatif
            $freshRecords[$targetIndex]['status'] = 'Nomor Terbit & Final';
            $freshRecords[$targetIndex]['statusLegacy'] = 'NOMOR DITERBITKAN';
            $freshRecords[$targetIndex]['nomorLaporan'] = $noLap;
            $freshRecords[$targetIndex]['tglTerbit'] = $tglTerbit;
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['authoritativeSSOT'] = 'CPANEL_PHP_NOLAP_DB';
            $freshRecords[$targetIndex]['approvedAt'] = date('Y-m-d H:i:s');

            // Antrekan Notifikasi Asynchronous: NOMOR_RESMI_TERBIT
            antrekanNotifikasiEmail($dataFile, [
                'event'         => 'NOMOR_RESMI_TERBIT',
                'noPermintaan'  => $noReq,
                'recipient'     => $freshRecords[$targetIndex]['emailPemohon'] ?? 'cabang@kjppnanangrahayu.com',
                'recipientName' => $freshRecords[$targetIndex]['namaPemohon'] ?? 'Tim Cabang',
                'subject'       => "[KJPP NSR] Nomor Laporan Penilaian Resmi Diterbitkan: {$noLap}",
                'body'          => "Nomor Laporan Penilaian Resmi {$noLap} telah berhasil diterbitkan untuk klien {$freshRecords[$targetIndex]['namaKlien']}."
            ]);

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => "Nomor laporan resmi '{$noLap}' berhasil ditetapkan secara atomik oleh Admin Kantor Pusat.",
                'record'    => $freshRecords[$targetIndex],
                'records'   => $freshRecords
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // C.0. TINDAKAN REQUEST REVISION (Wewenang Admin Kantor Pusat)
    // =========================================================================
    if ($action === 'requestRevision') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang meminta revisi mutlak milik Admin Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_REVISION_ATTEMPT'
            ]);
            exit;
        }

        $noReq = trim($payload['noPermintaan'] ?? '');
        $catatanAdmin = trim($payload['catatanAdmin'] ?? '');
        $catatanPerbaikan = trim($payload['catatanPerbaikan'] ?? $catatanAdmin);

        if (strlen($catatanPerbaikan) < 10) {
            http_response_code(400);
            echo json_encode([
                'success'   => false,
                'error'     => 'Catatan perbaikan wajib diisi minimal 10 karakter sebelum revisi dapat dikirimkan ke cabang.',
                'violation' => 'REVISION_NOTE_MANDATORY'
            ]);
            exit;
        }

        $txnResult = transaksiDatabaseNoLap($dataFile, function(&$freshRecords) use ($noReq, $catatanAdmin) {
            $targetIndex = -1;
            foreach ($freshRecords as $idx => $item) {
                if (($item['noPermintaan'] ?? '') === $noReq) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return ['success' => false, 'http_code' => 404, 'error' => 'Data permohonan tidak ditemukan'];
            }

            $freshRecords[$targetIndex]['status'] = 'Perlu Perbaikan Cabang';
            $freshRecords[$targetIndex]['statusLegacy'] = 'PERLU REVISI';
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['catatanPerbaikan'] = $catatanPerbaikan;
            $freshRecords[$targetIndex]['revisedAt'] = date('Y-m-d H:i:s');

            // Antrekan Notifikasi Asynchronous: PERMINTAAN_REVISI_CABANG
            antrekanNotifikasiEmail($dataFile, [
                'event'         => 'PERMINTAAN_REVISI_CABANG',
                'noPermintaan'  => $noReq,
                'recipient'     => $freshRecords[$targetIndex]['emailPemohon'] ?? 'cabang@kjppnanangrahayu.com',
                'recipientName' => $freshRecords[$targetIndex]['namaPemohon'] ?? 'Tim Cabang',
                'subject'       => "[KJPP NSR] Permintaan Perbaikan Dokumen: {$noReq}",
                'body'          => "Permohonan {$noReq} memerlukan perbaikan dengan instruksi: {$catatanPerbaikan}"
            ]);

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => "Permohonan '{$noReq}' telah berhasil dikembalikan untuk revisi.",
                'record'    => $freshRecords[$targetIndex],
                'records'   => $freshRecords
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
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
        // =========================================================================
    // D.1. TINDAKAN PEMBUATAN STRUKTUR FOLDER GOOGLE DRIVE (PILAR 3)
    // =========================================================================
    if ($action === 'createDriveFolders') {
        $noReq = trim($payload['noPermintaan'] ?? '');
        if (!$noReq) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter noPermintaan wajib diisi.']);
            exit;
        }

        $txnResult = transaksiDatabaseNoLap($dataFile, function(&$freshRecords) use ($noReq, $userRole, $userBranch) {
            $targetIndex = -1;
            foreach ($freshRecords as $idx => $item) {
                if (($item['noPermintaan'] ?? '') === $noReq) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return ['success' => false, 'http_code' => 404, 'error' => 'Data permohonan tidak ditemukan'];
            }

            // ISOLASI CABANG: Staf Cabang hanya boleh men-trigger folder miliknya
            if ($userRole === 'CABANG' && strcasecmp($freshRecords[$targetIndex]['cabang'] ?? '', $userBranch) !== 0) {
                return ['success' => false, 'http_code' => 403, 'error' => 'Akses Ditolak: Anda tidak berwenang mengelola folder penugasan cabang lain.'];
            }

            $driveMeta = buatStrukturFolderGoogleDrive($freshRecords[$targetIndex]);
            $freshRecords[$targetIndex]['driveFolderId'] = $driveMeta['driveFolderId'];
            $freshRecords[$targetIndex]['driveFolderUrl'] = $driveMeta['driveFolderUrl'];
            $freshRecords[$targetIndex]['driveFolderPath'] = $driveMeta['driveFolderPath'];
            $freshRecords[$targetIndex]['driveSubfolders'] = $driveMeta['driveSubfolders'];

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => 'Struktur 4 subfolder Google Drive berhasil dibuat dan ditautkan ke basis data.',
                'drive'     => $driveMeta,
                'record'    => $freshRecords[$targetIndex],
                'records'   => $freshRecords
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // D.2. TINDAKAN MERGE TAGS RENDERING DOKUMEN RESMI (PILAR 4)
    // =========================================================================
    if ($action === 'renderDocumentTemplate') {
        $noReq = trim($payload['noPermintaan'] ?? '');
        $templateType = strtoupper(trim($payload['templateType'] ?? 'SURAT_TUGAS'));

        $targetItem = null;
        foreach ($records as $item) {
            if (($item['noPermintaan'] ?? '') === $noReq) {
                $targetItem = $item;
                break;
            }
        }

        if (!$targetItem) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan tidak ditemukan.']);
            exit;
        }

        $templateRaw = '';
        $docTitle = '';
        if ($templateType === 'SURAT_TUGAS') {
            $templateRaw = getTemplateSuratTugas();
            $docTitle = 'Surat Tugas Lapangan - ' . $noReq;
        } elseif ($templateType === 'QA_CHECKLIST') {
            $templateRaw = getTemplateQaChecklist();
            $docTitle = 'Lembar Kendali Mutu (QA) - ' . $noReq;
        } elseif ($templateType === 'TANDA_TERIMA') {
            $templateRaw = getTemplateTandaTerima();
            $docTitle = 'Tanda Terima Laporan - ' . $noReq;
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Jenis template '{$templateType}' tidak didukung."]);
            exit;
        }

        $renderedHtml = renderMergeTags($templateRaw, $targetItem);

        echo json_encode([
            'success'      => true,
            'templateType' => $templateType,
            'docTitle'     => $docTitle,
            'noPermintaan' => $noReq,
            'html'         => $renderedHtml
        ]);
        exit;
    }

if ($action === 'getMailQueue') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Admin Pusat yang dapat melihat antrean email.']);
            exit;
        }
        $mailQueueFile = dirname($dataFile) . '/mail_queue.json';
        $queue = [];
        if (file_exists($mailQueueFile)) {
            $queue = json_decode(file_get_contents($mailQueueFile), true) ?: [];
        }
        echo json_encode([
            'success'    => true,
            'totalQueue' => count($queue),
            'queue'      => $queue
        ]);
        exit;
    }

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
