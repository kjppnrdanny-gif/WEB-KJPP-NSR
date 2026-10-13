<?php
/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * MODUL BACKEND: KEPATUHAN PELINDUNGAN DATA PRIBADI (UU NO. 27 TAHUN 2022)
 * 
 * Melayani:
 * 1. POST /api/pdp-consent   - Perekaman bukti persetujuan (Pasal 24 UU PDP: Pembuktian Persetujuan)
 * 2. POST /api/pdp-request   - Penerimaan permohonan hak subjek data (Pasal 5-14 UU PDP)
 * 3. GET  /api/pdp-verify    - Verifikasi versi kebijakan aktif & informasi pengendali data
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
if ($origin) {
    $parsedOrigin = parse_url($origin, PHP_URL_HOST);
    if (in_array($parsedOrigin, $allowedHosts, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Jakarta');

const PDP_POLICY_VERSION = '2.1-2026.10';
const PDP_CONTROLLER_NAME = 'KJPP Nanang Rahayu Sigit Paryanto dan Rekan';
const PDP_DPO_EMAIL = 'privasi@kjppnanangrahayu.com';
const PDP_OFFICIAL_PHONE = '+62 21 7884-9996';
const PDP_OFFICIAL_WA = '+62 851-1051-3157';

$action = $_GET['action'] ?? '';
if (!$action) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if ($path === 'api/pdp-consent') $action = 'consent';
    elseif ($path === 'api/pdp-request') $action = 'request';
    elseif ($path === 'api/pdp-verify') $action = 'verify';
}

function getClientIpHash() {
    $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    if (strpos($clientIp, ',') !== false) {
        $clientIp = trim(explode(',', $clientIp)[0]);
    }
    // Prinsip minimalisasi data: simpan hash dengan salt bulanan, bukan plain IP
    return hash('sha256', $clientIp . '_NSR_PDP_SALT_' . date('Y-m'));
}

function maskString($str) {
    if (!$str || strlen($str) < 3) return '***';
    $len = strlen($str);
    if ($len <= 5) return substr($str, 0, 1) . str_repeat('*', $len - 1);
    return substr($str, 0, 2) . str_repeat('*', $len - 4) . substr($str, -2);
}

// --------------------------------------------------------------------------
// 1. ACTION: VERIFY (GET INFORMASI KEBIJAKAN & PENGENDALI)
// --------------------------------------------------------------------------
if ($action === 'verify' || ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($action))) {
    echo json_encode([
        'status' => 'success',
        'controller' => PDP_CONTROLLER_NAME,
        'license' => 'KMK RI No. 248/KM.1/2019 (KMK No. 2.19.0160)',
        'policy_version' => PDP_POLICY_VERSION,
        'effective_date' => '2026-10-01',
        'legal_basis' => 'UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi',
        'contact' => [
            'dpo_email' => PDP_DPO_EMAIL,
            'official_wa' => PDP_OFFICIAL_WA,
            'phone' => PDP_OFFICIAL_PHONE,
            'office' => 'Jl. Hankam No. 5 RT 006 RW 001, Ragunan, Pasar Minggu, Jakarta Selatan 12550'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// --------------------------------------------------------------------------
// 2. ACTION: CONSENT (RECORD BUKTI PERSETUJUAN / ACKNOWLEDGEMENT)
// --------------------------------------------------------------------------
if ($action === 'consent' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload || !is_array($payload)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Format payload tidak valid.']);
        exit;
    }

    $formType = substr(trim($payload['form_type'] ?? 'RFP'), 0, 30);
    $consentNotice = !empty($payload['consent_notice']);
    $consentProcessing = !empty($payload['consent_processing']);
    $namaRaw = trim($payload['nama'] ?? '');
    $kontakRaw = trim($payload['kontak'] ?? '');
    $instansiRaw = trim($payload['instansi'] ?? '');
    $purpose = trim($payload['purpose'] ?? 'Permohonan Penawaran Biaya (RFP)');

    // Wajib ada konfirmasi pemahaman pemberitahuan privasi
    if (!$consentNotice) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Konfirmasi pemahaman Kebijakan Privasi wajib disetujui.']);
        exit;
    }

    $consentId = 'CONSENT-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
    $timestamp = date('c');

    $record = [
        'consent_id' => $consentId,
        'timestamp' => $timestamp,
        'form_type' => $formType,
        'policy_version' => PDP_POLICY_VERSION,
        'purpose' => $purpose,
        'consent_notice' => $consentNotice,
        'consent_processing' => $consentProcessing,
        'subject_masked' => [
            'nama' => maskString($namaRaw),
            'kontak' => maskString($kontakRaw),
            'instansi' => substr($instansiRaw, 0, 60)
        ],
        'network_proof' => [
            'ip_hash' => getClientIpHash(),
            'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 150)
        ]
    ];

    // Simpan ke storage terproteksi
    $logFile = __DIR__ . '/pdp-consent-logs.json';
    $existing = [];

    if (file_exists($logFile)) {
        $content = @file_get_contents($logFile);
        if ($content) {
            $decoded = json_decode($content, true);
            if (is_array($decoded)) $existing = $decoded;
        }
    }

    // Batasi log maksimal 1000 entri teranyar (FIFO) untuk kontrol kuota & privasi
    array_unshift($existing, $record);
    if (count($existing) > 1000) {
        $existing = array_slice($existing, 0, 1000);
    }

    @file_put_contents($logFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode([
        'status' => 'success',
        'message' => 'Pencatatan persetujuan pelindungan data berhasil disimpan.',
        'consent_id' => $consentId,
        'timestamp' => $timestamp,
        'policy_version' => PDP_POLICY_VERSION
    ]);
    exit;
}

// --------------------------------------------------------------------------
// 3. ACTION: REQUEST (PENGAJUAN HAK SUBJEK DATA PRIBADI - PASAL 5-14 UU PDP)
// --------------------------------------------------------------------------
if ($action === 'request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload || !is_array($payload)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Payload permintaan tidak valid.']);
        exit;
    }

    $nama = trim($payload['nama'] ?? '');
    $email = trim($payload['email'] ?? '');
    $telepon = trim($payload['telepon'] ?? '');
    $jenisHak = trim($payload['jenis_hak'] ?? ''); // akses | ralat | hapus | tarik_persetujuan | keberatan
    $rincian = trim($payload['rincian'] ?? '');

    if (!$nama || !$email || !$jenisHak || !$rincian) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Harap lengkapi nama, email, jenis hak yang diajukan, dan rincian permohonan.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Format email tidak valid.']);
        exit;
    }

    $validRights = ['akses', 'ralat', 'hapus', 'tarik_persetujuan', 'keberatan'];
    if (!in_array($jenisHak, $validRights, true)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Jenis hak subjek data tidak dikenali. Pilihan: akses, ralat, hapus, tarik_persetujuan, keberatan.']);
        exit;
    }

    $ticketId = 'REQ-PDP-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $timestamp = date('c');

    $requestRecord = [
        'ticket_id' => $ticketId,
        'timestamp' => $timestamp,
        'nama_masked' => maskString($nama),
        'email_masked' => maskString($email),
        'telepon_masked' => maskString($telepon),
        'jenis_hak' => $jenisHak,
        'rincian' => substr($rincian, 0, 1000),
        'status' => 'DITERIMA',
        'deadline_kerja' => date('c', strtotime('+3 business days')),
        'ip_hash' => getClientIpHash()
    ];

    $reqFile = __DIR__ . '/pdp-requests.json';
    $existingReq = [];

    if (file_exists($reqFile)) {
        $content = @file_get_contents($reqFile);
        if ($content) {
            $decoded = json_decode($content, true);
            if (is_array($decoded)) $existingReq = $decoded;
        }
    }

    array_unshift($existingReq, $requestRecord);
    if (count($existingReq) > 500) {
        $existingReq = array_slice($existingReq, 0, 500);
    }

    @file_put_contents($reqFile, json_encode($existingReq, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode([
        'status' => 'success',
        'message' => 'Permohonan pelaksanaan hak subjek data pribadi berhasil diterima.',
        'ticket_id' => $ticketId,
        'timestamp' => $timestamp,
        'catatan' => 'Tim DPO KJPP NSR akan memproses verifikasi identitas dan memberikan tanggapan resmi maksimal dalam 3x24 jam kerja.'
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['status' => 'error', 'message' => 'Endpoint tidak ditemukan.']);
