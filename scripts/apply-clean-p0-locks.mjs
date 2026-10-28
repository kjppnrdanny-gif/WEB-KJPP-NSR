import fs from 'fs';

console.log('=== APPLYING CLEAN P0 SAFETY LOCKS WITH LINE NORMALIZATION ===');

// 1. AUTH-HANDLER.PHP
let auth = fs.readFileSync('auth-handler.php', 'utf8').replace(/\r\n/g, '\n');

// Pastikan logout mencabut sesi
const oldLogout = `if ($action === 'logout') {
    $_SESSION = [];`;
const newLogout = `if ($action === 'logout') {
    $incomingSessionToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? ($body['sessionToken'] ?? ''));
    cabutSesiServer($sessionsFile, $incomingSessionToken);
    $_SESSION = [];`;

if (auth.includes(oldLogout)) {
  auth = auth.replace(oldLogout, newLogout);
  console.log('✔ auth-handler.php logout revocation hooked');
}

// Pastikan verifikasi sesi di verify
const oldVerifyCheck = `if ($action === 'verify') {
    // 1. Sesi PHP
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            $user = $_SESSION['nsr_user'];`;

const newVerifyCheck = `if ($action === 'verify') {
    // 1. Sesi PHP (jika belum dicabut)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isSessValid = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $isSessValid = (verifikasiSesiServer($sessionsFile, $sessToken) !== null);
        }
        if ($isSessValid && (time() - $loginTime < 28800)) {
            $user = $_SESSION['nsr_user'];`;

if (auth.includes(oldVerifyCheck)) {
  auth = auth.replace(oldVerifyCheck, newVerifyCheck);
  console.log('✔ auth-handler.php verify check hooked');
}

fs.writeFileSync('auth-handler.php', auth, 'utf8');


// 2. NOLAP-DATA-HANDLER.PHP
let nolap = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');

// A. Auth section di nolap-data-handler.php
const oldNolapAuth = `// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)
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
    if (preg_match('/Bearer\\s+(\\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        $tHash = hash('sha256', strtoupper($token));
        if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
        }
    }
}

// C. Dari Header X-NSR-Token
if (!$currentUser) {
    $customToken = $_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? $_GET['token'] ?? '';
    if ($customToken) {
        $trimmed = trim($customToken);
        // AUDIT KEAMANAN GAP ANALYSIS 2026: Hanya menerima secret token mentah, lalu di-hash di server.
        // DILARANG menerima string hash SHA-256 langsung sebagai kredensial autentikasi!
        $tHash = hash('sha256', strtoupper($trimmed));
        if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
        }
    }
}`;

const newNolapAuth = `// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)
// -------------------------------------------------------------
$currentUser = null;

// A. Dari Sesi PHP (NSR_SESSION) yang belum dicabut
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    $sessToken = $_SESSION['nsr_session_token'] ?? null;
    $isSessValid = true;
    if ($sessToken && file_exists($sessionsFile)) {
        $isSessValid = (verifikasiSesiServerNoLap($sessionsFile, $sessToken) !== null);
    }
    if ($isSessValid && (time() - $loginTime < 28800)) {
        $currentUser = $_SESSION['nsr_user'];
    }
}

// B. Dari Authorization Header (Bearer Token / Session Token)
if (!$currentUser) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\\s+(\\S+)/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        $sessUser = verifikasiSesiServerNoLap($sessionsFile, $token);
        if ($sessUser) {
            $currentUser = $sessUser;
        } else {
            $tHash = hash('sha256', strtoupper($token));
            if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
            }
        }
    }
}

// C. Dari Header X-NSR-Session-Token atau X-NSR-Token
if (!$currentUser) {
    $incomingToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? $_GET['session_token'] ?? $_GET['token'] ?? '');
    if ($incomingToken) {
        $sessUser = verifikasiSesiServerNoLap($sessionsFile, $incomingToken);
        if ($sessUser) {
            $currentUser = $sessUser;
        } else {
            $tHash = hash('sha256', strtoupper($incomingToken));
            if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
            }
        }
    }
}`;

if (nolap.includes(oldNolapAuth)) {
  nolap = nolap.replace(oldNolapAuth, newNolapAuth);
  console.log('✔ nolap-data-handler.php authentication block hooked');
}

// B. Hook submitRequest validasi industri
const oldSubmitReq = `if ($action === 'submitRequest') {
        $namaKlien = trim($payload['namaKlien'] ?? ($payload['nama_klien'] ?? ''));
        if (empty($namaKlien)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap: Nama Klien wajib diisi']);
            exit;
        }
        $payload['namaKlien'] = $namaKlien;

        // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)`;

const newSubmitReq = `if ($action === 'submitRequest') {
        $namaKlien = trim($payload['namaKlien'] ?? ($payload['nama_klien'] ?? ''));
        if (empty($namaKlien)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap: Nama Klien wajib diisi']);
            exit;
        }
        $payload['namaKlien'] = $namaKlien;

        // Validasi Wajib Sektor Industri Master 01-12 (Anti-Silent-Fallback)
        $rawIndReq = $payload['kodeIndustri'] ?? ($payload['kode_industri'] ?? ($payload['sektorIndustri'] ?? ''));
        $cleanIndReq = resolveKodeIndustri($rawIndReq);
        if (!$cleanIndReq) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'error' => "Validasi Sektor Industri Gagal: Kode Industri ('{$rawIndReq}') tidak valid atau belum dipilih. Wajib memilih salah satu kode resmi dari Master Sektor Industri Kemenkeu/KJPP NSR (01-12). Fallback otomatis dinonaktifkan.",
                'violation' => 'INVALID_OR_MISSING_INDUSTRY_CODE'
            ]);
            exit;
        }
        $payload['kodeIndustri'] = $cleanIndReq;
        
        // Simpan status NPWP klien terverifikasi
        $rawNpwpReq = $payload['npwp'] ?? ($payload['npwpKlien'] ?? '');
        $statusNpwpReq = $payload['statusNpwp'] ?? '';
        $payload['kodeNpwp'] = resolveKodeNpwpKlien($rawNpwpReq, $statusNpwpReq);

        // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)`;

if (nolap.includes(oldSubmitReq)) {
  nolap = nolap.replace(oldSubmitReq, newSubmitReq);
  console.log('✔ nolap-data-handler.php submitRequest hooked with industry & npwp validation');
}

// C. Hook submitGerbang1Awal validasi industri
const oldG1Req = `if ($action === 'submitGerbang1Awal') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ('NSR-' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6))));`;

const newG1Req = `if ($action === 'submitGerbang1Awal') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ('NSR-' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6))));
        
        // Validasi Wajib Sektor Industri Master 01-12 pada Gerbang 1
        $rawIndG1 = $payload['kodeIndustri'] ?? ($payload['kode_industri'] ?? ($payload['sektorIndustri'] ?? ''));
        $cleanIndG1 = resolveKodeIndustri($rawIndG1);
        if (!$cleanIndG1) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'error' => "Validasi Sektor Industri Gagal: Kode Industri ('{$rawIndG1}') tidak valid atau belum dipilih. Wajib memilih salah satu kode resmi dari Master Sektor Industri Kemenkeu/KJPP NSR (01-12). Fallback otomatis dinonaktifkan.",
                'violation' => 'INVALID_OR_MISSING_INDUSTRY_CODE'
            ]);
            exit;
        }
        $payload['kodeIndustri'] = $cleanIndG1;
        $rawNpwpG1 = $payload['npwp'] ?? ($payload['npwpKlien'] ?? '');
        $statusNpwpG1 = $payload['statusNpwp'] ?? '';
        $payload['kodeNpwp'] = resolveKodeNpwpKlien($rawNpwpG1, $statusNpwpG1);`;

if (nolap.includes(oldG1Req)) {
  nolap = nolap.replace(oldG1Req, newG1Req);
  console.log('✔ nolap-data-handler.php submitGerbang1Awal hooked with industry & npwp validation');
}

fs.writeFileSync('nolap-data-handler.php', nolap, 'utf8');

console.log('=== NORMALIZATION AND CLEAN PATCHING COMPLETED ===');
