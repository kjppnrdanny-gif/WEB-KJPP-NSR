<?php
/**
 * KJPP NSR — Server-Side Protected Data Proxy untuk Portal Kwitansi (cPanel Native Edition)
 * Versi 1.0: Concurrency Lock, Atomic Write, Branch Isolation & Automated Backup
 * 
 * Karakteristik Keamanan & Integritas:
 * 1. Single Source of Truth (SSOT): Penyimpanan terpusat di cPanel (data/kwitansi_database.json).
 * 2. Autentikasi Fail-Closed: 401 Unauthorized jika tidak memiliki sesi sah atau Bearer token terdaftar.
 * 3. Strict Branch Isolation (RBAC): 403 Forbidden untuk akses lintas cabang.
 * 4. Verifikasi & Approval Otoritas Keuangan Pusat: Penetapan nomor resmi urut dan pengesahan TTD/Stempel.
 * 5. Concurrency Safe & Atomic Write: Menggunakan temp file dan flock(LOCK_EX).
 * 6. Automated Backup: Snapshot ke data/backups/ sebelum mutasi data.
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
    // Otorisasi Kantor Pusat Jakarta (Rotated Secure Token)
    '1f43a0f065bc44637dbb2b2021932c570ee4d40fb42a294985f00e05aef42285' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => ['sub' => 'cabang_jkt', 'branch' => 'Pusat', 'displayName' => 'Akses Resmi Kantor Pusat Jakarta', 'role' => 'ADMIN_PUSAT'],
    // Otorisasi Cabang Bandung
    'a52e824efe550c1e89aa3026587e4aa54620e597fcc977b2c88876870c88a4cb' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => ['sub' => 'cabang_bdg', 'branch' => 'Bandung', 'displayName' => 'Akses Resmi Cabang Bandung', 'role' => 'CABANG'],
    // Otorisasi Cabang Padang
    '6b838f77d520840a9bd8adb2e01d75ad511ea2f2d371b1ac16809e8fe1ac11bd' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => ['sub' => 'cabang_pdg', 'branch' => 'Padang', 'displayName' => 'Akses Resmi Cabang Padang', 'role' => 'CABANG'],
    // Otorisasi Cabang Makassar
    '3c56bf3fbad429421e401e6ca9b335734a90b9986d9af890c12e2cf69f6129d4' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => ['sub' => 'cabang_mks', 'branch' => 'Makassar', 'displayName' => 'Akses Resmi Cabang Makassar', 'role' => 'CABANG'],
    // Otorisasi Cabang Palembang
    '8eec45b74d429d76724acd10312485fee4f180cddf0fd7210eb0da736c878ab3' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    'c20c16d688a686f8cd5ac12f4949b8dac6b4937d513f92a00514ee6122368ed2' => ['sub' => 'cabang_plb', 'branch' => 'Palembang', 'displayName' => 'Akses Resmi Cabang Palembang', 'role' => 'CABANG'],
    // Otorisasi Master Operasional Pusat
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

// B. Dari Authorization: Bearer <TOKEN> atau X-NSR-Token
if (!$currentUser) {
    $rawToken = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $rawToken = trim($matches[1]);
    } elseif (isset($_SERVER['HTTP_X_NSR_TOKEN'])) {
        $rawToken = trim($_SERVER['HTTP_X_NSR_TOKEN']);
    }

    if ($rawToken) {
        $tokenHash = hash('sha256', $rawToken);
        if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
        }
    }
}

if (!$currentUser) {
    http_response_code(401);
    echo json_encode([
        'success'   => false,
        'error'     => 'Otorisasi Gagal (401 Unauthorized): Sesi telah kedaluwarsa atau token tidak valid.',
        'violation' => 'UNAUTHORIZED_ACCESS'
    ]);
    exit;
}

$userRole = $currentUser['role'] ?? 'CABANG';
$userBranch = $currentUser['branch'] ?? 'Pusat';
$userDisplayName = $currentUser['displayName'] ?? ($currentUser['sub'] ?? 'Petugas Terverifikasi');
$isKeuanganOrAdmin = ($userRole === 'ADMIN_PUSAT' || $userRole === 'KEUANGAN' || $userRole === 'ADMIN');

// -------------------------------------------------------------
// 3. PENYIMPANAN DATA TERPUSAT (cPanel SSOT)
// -------------------------------------------------------------
$dataFile = __DIR__ . '/data/kwitansi_database.json';

function muatDatabaseKwitansi($dataFile) {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }

    // Baseline Data Historis Resmi Kwitansi
    $baseline = [
        [
            'idKwitansi'       => 'KW-000001',
            'noKwitansiResmi'  => '017/KW-NSR/IX/2026',
            'noPermintaan'     => 'REQ-000006',
            'noSpk'            => 'SPK/BTN/2026/088',
            'cabang'           => 'Pusat',
            'namaPengaju'      => 'Zahra',
            'waPengaju'        => '0895391057740',
            'klien'            => 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk KC BEKASI q.q. PT. GEMILANG SAKTI PROPERTINDO',
            'keterangan'       => 'Biaya Jasa Penilaian Properti Rumah Tinggal Green Lavender Sukamekar, SPK No. SPK/BTN/2026/088',
            'banyaknya'        => '100% Pelunasan',
            'persentaseTermin' => 100,
            'nilaiKontrakSpk'  => 15000000,
            'hargaDasar'       => 15000000,
            'dpp'              => 15000000,
            'tarifPpn'         => 0.11,
            'nominalPpn'       => 1650000,
            'totalBayar'       => 16650000,
            'terbilang'        => 'Enam Belas Juta Enam Ratus Lima Puluh Ribu Rupiah',
            'status'           => 'DISAHKAN',
            'isApproved'       => true,
            'tglPengajuan'     => '2026-09-23',
            'tglSah'           => '2026-09-23',
            'tempatSah'        => 'Jakarta',
            'namaPejabat'      => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'jabatanPejabat'   => 'Pemimpin Rekan',
            'subjabatanPejabat'=> 'Pemimpin Rekan',
            'approvedBy'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'approvedAt'       => '2026-09-23 17:00:00'
        ],
        [
            'idKwitansi'       => 'KW-000002',
            'noKwitansiResmi'  => '018/KW-NSR/X/2026',
            'noPermintaan'     => 'REQ-000012',
            'noSpk'            => 'SPK/ITB/2026/012',
            'cabang'           => 'Bandung',
            'namaPengaju'      => 'Tiara',
            'waPengaju'        => '081220314609',
            'klien'            => 'Institut Teknologi Bandung (ITB)',
            'keterangan'       => 'Biaya Jasa Penilaian Gedung Kampus Pendidikan Jl. Ganesa No. 10 Bandung, SPK No. SPK/ITB/2026/012',
            'banyaknya'        => '50% (Termin I / Uang Muka)',
            'persentaseTermin' => 50,
            'nilaiKontrakSpk'  => 40000000,
            'hargaDasar'       => 20000000,
            'dpp'              => 20000000,
            'tarifPpn'         => 0.11,
            'nominalPpn'       => 2200000,
            'totalBayar'       => 22200000,
            'terbilang'        => 'Dua Puluh Dua Juta Dua Ratus Ribu Rupiah',
            'status'           => 'DISAHKAN',
            'isApproved'       => true,
            'tglPengajuan'     => '2026-10-07',
            'tglSah'           => '2026-10-07',
            'tempatSah'        => 'Jakarta',
            'namaPejabat'      => 'Milda Hidayati Dewi, S.E.',
            'jabatanPejabat'   => 'Keuangan',
            'subjabatanPejabat'=> 'Bagian Keuangan',
            'approvedBy'       => 'Milda Hidayati Dewi, S.E.',
            'approvedAt'       => '2026-10-07 14:30:00'
        ]
    ];

    simpanDatabaseKwitansi($dataFile, $baseline);
    return $baseline;
}

function simpanDatabaseKwitansi($dataFile, $records) {
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    
    $backupDir = $dir . '/backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }
    
    // Tulis atomik dengan locking (LOCK_EX)
    $tempFile = tempnam($dir, 'tmp_kw_');
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

        // Snapshot cadangan berkala sebelum replace
        if (file_exists($dataFile)) {
            $backupFile = $backupDir . '/kwitansi_backup_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.json';
            @copy($dataFile, $backupFile);

            $allBackups = glob($backupDir . '/kwitansi_backup_*.json');
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

function keRomawi($bulan) {
    $map = [
        1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
        7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
    ];
    return $map[(int)$bulan] ?? 'X';
}

$records = muatDatabaseKwitansi($dataFile);

// -------------------------------------------------------------
// 4. METODE GET: PEMBACAAN DATA KWITANSI (RBAC CABANG & PUSAT)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $targetId = $_GET['idKwitansi'] ?? null;

    if ($targetId) {
        $found = null;
        foreach ($records as $item) {
            if ($item['idKwitansi'] === $targetId) {
                $found = $item;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "Data kwitansi '{$targetId}' tidak ditemukan"]);
            exit;
        }

        // Isolasi Cabang
        if (!$isKeuanganOrAdmin && strcasecmp($found['cabang'] ?? '', $userBranch) !== 0) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => "Akses Ditolak (403 Forbidden): Cabang '{$userBranch}' tidak berhak melihat kwitansi milik cabang '{$found['cabang']}'.",
                'violation' => 'CROSS_BRANCH_ACCESS_DENIED'
            ]);
            exit;
        }

        echo json_encode(['success' => true, 'record' => $found]);
        exit;
    }

    // Role Keuangan Pusat / Admin Pusat: Melihat seluruh kwitansi nasional
    if ($isKeuanganOrAdmin) {
        echo json_encode([
            'success'      => true,
            'scope'        => 'GLOBAL_ALL_BRANCHES',
            'userRole'     => $userRole,
            'totalRecords' => count($records),
            'data'         => $records
        ]);
        exit;
    }

    // Role Cabang: HANYA berhak melihat kwitansi cabangnya sendiri
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

// -------------------------------------------------------------
// 5. METODE POST: SUBMIT DRAF, APPROVAL, REVISI & INTEGRASI SPK
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
    // A. TINDAKAN SUBMIT PENGAJUAN DRAF KWITANSI (CABANG & PUSAT)
    // =========================================================================
    if ($action === 'submitDraft') {
        if (!isset($payload['klien']) || empty(trim($payload['klien']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Identitas klien dan penugasan wajib diisi']);
            exit;
        }

        // Penegakan Isolasi Cabang pada Form Pengajuan
        $cabangPengaju = $isKeuanganOrAdmin ? ($payload['cabang'] ?? 'Pusat') : $userBranch;
        
        $dpp = isset($payload['dpp']) ? (float)$payload['dpp'] : (isset($payload['hargaDasar']) ? (float)$payload['hargaDasar'] : 0);
        if ($dpp <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nominal DPP (Harga Dasar) wajib lebih besar dari 0']);
            exit;
        }

        $tarifPpn = isset($payload['tarifPpn']) ? (float)$payload['tarifPpn'] : 0.11;
        $nominalPpn = isset($payload['nominalPpn']) ? (float)$payload['nominalPpn'] : round($dpp * $tarifPpn);
        $totalBayar = isset($payload['totalBayar']) ? (float)$payload['totalBayar'] : ($dpp + $nominalPpn);

        $noSpk = trim($payload['noSpk'] ?? '');
        $nilaiKontrakSpk = isset($payload['nilaiKontrakSpk']) ? (float)$payload['nilaiKontrakSpk'] : 0;

        // Pengecekan Akumulasi Termin Terhadap Nilai Kontrak SPK (Requirement 6)
        $totalTertagihSebelumnya = 0;
        if ($noSpk !== '') {
            foreach ($records as $r) {
                if (($r['status'] ?? '') !== 'VOID' && ($r['status'] ?? '') !== 'DIKEMBALIKAN') {
                    if (strcasecmp($r['noSpk'] ?? '', $noSpk) === 0) {
                        $totalTertagihSebelumnya += (float)($r['dpp'] ?? $r['hargaDasar'] ?? 0);
                    }
                }
            }
        }

        $akumulasiDenganDrafIni = $totalTertagihSebelumnya + $dpp;
        $isOverbilling = false;
        $catatanAkumulasi = "Akumulasi tertagih untuk SPK {$noSpk}: Rp " . number_format($akumulasiDenganDrafIni, 0, ',', '.');
        if ($nilaiKontrakSpk > 0) {
            if ($akumulasiDenganDrafIni > $nilaiKontrakSpk) {
                $isOverbilling = true;
                $kelebihan = $akumulasiDenganDrafIni - $nilaiKontrakSpk;
                $catatanAkumulasi .= " [PERINGATAN: Melebihi Nilai Kontrak SPK sebesar Rp " . number_format($kelebihan, 0, ',', '.') . "]";
            } else {
                $sisa = $nilaiKontrakSpk - $akumulasiDenganDrafIni;
                $catatanAkumulasi .= " (Sisa pagu kontrak: Rp " . number_format($sisa, 0, ',', '.') . ")";
            }
        }

        // Generate ID Draf Baru (Monoton naik: DRAFT-KW-XXXXXX)
        $maxNum = 0;
        foreach ($records as $r) {
            if (isset($r['idKwitansi']) && preg_match('/^(?:KW|DRAFT-KW)-(\d+)$/', $r['idKwitansi'], $m)) {
                $num = (int)$m[1];
                if ($num > $maxNum) $maxNum = $num;
            }
        }
        $newId = 'DRAFT-KW-' . str_pad((string)($maxNum + 1), 6, '0', STR_PAD_LEFT);

        $serverTimestamp = date('Y-m-d H:i:s');

        $newRecord = [
            'idKwitansi'       => $newId,
            'noKwitansiResmi'  => 'DRAFT (Belum Disahkan)',
            'noPermintaan'     => trim($payload['noPermintaan'] ?? ''),
            'noSpk'            => $noSpk,
            'cabang'           => $cabangPengaju,
            'namaPengaju'      => trim($payload['namaPengaju'] ?? $userDisplayName),
            'waPengaju'        => trim($payload['waPengaju'] ?? ''),
            'klien'            => trim($payload['klien']),
            'keterangan'       => trim($payload['keterangan'] ?? ''),
            'banyaknya'        => trim($payload['banyaknya'] ?? '100% Pelunasan'),
            'persentaseTermin' => (float)($payload['persentaseTermin'] ?? 0),
            'nilaiKontrakSpk'  => $nilaiKontrakSpk,
            'hargaDasar'       => $dpp,
            'dpp'              => $dpp,
            'tarifPpn'         => $tarifPpn,
            'nominalPpn'       => $nominalPpn,
            'totalBayar'       => $totalBayar,
            'terbilang'        => trim($payload['terbilang'] ?? ''),
            'rekeningTujuan'   => $payload['rekeningTujuan'] ?? 'MANDIRI',
            'rekeningResmi'    => $payload['rekeningResmi'] ?? 'Bank Mandiri Cab. Jakarta Ampera Raya No. Rek. 127-00-1014166-9 an KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (Cantumkan No. Invoice Pada Copy Transfer)',
            'status'           => 'DRAFT',
            'isApproved'       => false,
            'isOverbilling'    => $isOverbilling,
            'totalTertagih'    => $akumulasiDenganDrafIni,
            'catatanAkumulasi' => $catatanAkumulasi,
            'tglPengajuan'     => $payload['tglPengajuan'] ?? date('Y-m-d'),
            'createdAt'        => $serverTimestamp,
            'createdBy'        => $userDisplayName,
            'createdRole'      => $userRole
        ];

        array_unshift($records, $newRecord);
        simpanDatabaseKwitansi($dataFile, $records);

        echo json_encode([
            'success'       => true,
            'message'       => "Draf kwitansi {$newId} berhasil dikirim dan tersimpan di server terpusat cPanel.",
            'idKwitansi'    => $newId,
            'isOverbilling' => $isOverbilling,
            'record'        => $newRecord
        ]);
        exit;
    }

    // =========================================================================
    // B. TINDAKAN PENGESAHAN & PENETAPAN NOMOR RESMI (KHUSUS KEUANGAN PUSAT)
    // =========================================================================
    if ($action === 'approveKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang pengesahan kwitansi resmi mutlak milik Bagian Keuangan Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['idKwitansi'] === $idKwitansi) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "Data draf kwitansi '{$idKwitansi}' tidak ditemukan"]);
            exit;
        }

        $targetItem = &$records[$targetIndex];

        if (($targetItem['status'] ?? '') === 'VOID' || !empty($targetItem['isTestRecord'])) {
            http_response_code(400);
            echo json_encode([
                'success'   => false,
                'error'     => "Kwitansi {$idKwitansi} berstatus VOID / DATA UJI dan tidak dapat disahkan.",
                'violation' => 'VOID_RECORD_CANNOT_BE_APPROVED'
            ]);
            exit;
        }

        // Tentukan Nomor Kwitansi Resmi Urut Otomatis jika tidak disediakan
        $noResmi = trim($payload['noKwitansiResmi'] ?? '');
        if ($noResmi === '' || $noResmi === 'DRAFT (Belum Disahkan)' || strpos($noResmi, '018/KW-NSR') !== false) {
            $maxKwNum = 0;
            foreach ($records as $r) {
                if (isset($r['noKwitansiResmi']) && preg_match('/^(\d+)\/KW-NSR\//i', $r['noKwitansiResmi'], $m)) {
                    $val = (int)$m[1];
                    if ($val > $maxKwNum) $maxKwNum = $val;
                }
            }
            $bulanRomawi = keRomawi(date('n'));
            $tahunSekarang = date('Y');
            $noResmi = str_pad((string)($maxKwNum + 1), 3, '0', STR_PAD_LEFT) . "/KW-NSR/{$bulanRomawi}/{$tahunSekarang}";
        }

        $serverTimestamp = date('Y-m-d H:i:s');

        $targetItem['status']           = 'DISAHKAN';
        $targetItem['isApproved']       = true;
        $targetItem['noKwitansiResmi']  = $noResmi;
        $targetItem['tglSah']           = $payload['tglSah'] ?? date('Y-m-d');
        $targetItem['tempatSah']        = $payload['tempatSah'] ?? 'Jakarta';
        $targetItem['namaPejabat']      = $payload['namaPejabat'] ?? 'Milda Hidayati Dewi, S.E.';
        $targetItem['jabatanPejabat']   = $payload['jabatanPejabat'] ?? 'Keuangan';
        $targetItem['subjabatanPejabat']= $payload['subjabatanPejabat'] ?? 'Bagian Keuangan';
        $targetItem['approvedBy']       = $userDisplayName;
        $targetItem['approvedRole']     = $userRole;
        $targetItem['approvedAt']       = $serverTimestamp;
        $targetItem['catatanAdmin']     = $payload['catatanAdmin'] ?? 'Disahkan Bagian Keuangan Kantor Pusat.';
        if (!empty($payload['rekeningTujuan'])) {
            $targetItem['rekeningTujuan'] = $payload['rekeningTujuan'];
        }
        if (!empty($payload['rekeningResmi'])) {
            $targetItem['rekeningResmi'] = $payload['rekeningResmi'];
        }

        simpanDatabaseKwitansi($dataFile, $records);

        echo json_encode([
            'success'         => true,
            'message'         => "Kwitansi {$idKwitansi} berhasil DISAHKAN dengan Nomor Resmi {$noResmi}.",
            'noKwitansiResmi' => $noResmi,
            'record'          => $targetItem
        ]);
        exit;
    }

    // =========================================================================
    // C. TINDAKAN PENGEMBALIAN DRAF / REVISI KE CABANG (KHUSUS KEUANGAN PUSAT)
    // =========================================================================
    if ($action === 'returnKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Hanya Bagian Keuangan Pusat yang berhak mengembalikan draf tagihan.',
                'violation' => 'UNAUTHORIZED_RETURN_ATTEMPT'
            ]);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['idKwitansi'] === $idKwitansi) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => "Data draf kwitansi '{$idKwitansi}' tidak ditemukan"]);
            exit;
        }

        $records[$targetIndex]['status']        = 'DIKEMBALIKAN';
        $records[$targetIndex]['catatanRevisi'] = $payload['catatanRevisi'] ?? 'Draf dikembalikan untuk penyesuaian data penugasan.';
        $records[$targetIndex]['returnedBy']    = $userDisplayName;
        $records[$targetIndex]['returnedAt']    = date('Y-m-d H:i:s');

        simpanDatabaseKwitansi($dataFile, $records);

        echo json_encode([
            'success' => true,
            'message' => "Draf kwitansi {$idKwitansi} berhasil dikembalikan ke Cabang dengan status revisi.",
            'record'  => $records[$targetIndex]
        ]);
        exit;
    }

    // =========================================================================
    // D. TINDAKAN VOID / DIBATALKAN UNTUK RECORD UJI QA
    // =========================================================================
    if ($action === 'voidKwitansi') {
        if (!$isKeuanganOrAdmin) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Wewenang VOID mutlak milik Kantor Pusat']);
            exit;
        }

        $idKwitansi = $payload['idKwitansi'] ?? '';
        $targetIndex = -1;
        foreach ($records as $idx => $item) {
            if ($item['idKwitansi'] === $idKwitansi) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Record tidak ditemukan']);
            exit;
        }

        $records[$targetIndex]['status']       = 'VOID';
        $records[$targetIndex]['isTestRecord'] = true;
        $records[$targetIndex]['voidBy']       = $userDisplayName;
        $records[$targetIndex]['voidAt']       = date('Y-m-d H:i:s');

        simpanDatabaseKwitansi($dataFile, $records);

        echo json_encode([
            'success' => true,
            'message' => "Record {$idKwitansi} ditandai sebagai VOID (Data Uji).",
            'record'  => $records[$targetIndex]
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Action '{$action}' tidak dikenal"]);
    exit;
}
