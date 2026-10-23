import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('=== EMERGENCY SECURITY CLOSURE P0 APPLIER ===\n');

// -------------------------------------------------------------
// Helper: Patch File
// -------------------------------------------------------------
function patchFile(relPath, transformFn) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[SKIP] File not found: ${relPath}`);
    return false;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = transformFn(original);
  if (original !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`[UPDATED] ${relPath}`);
    return true;
  } else {
    console.log(`[NO CHANGE] ${relPath}`);
    return false;
  }
}

// -------------------------------------------------------------
// 1. PATCH auth-handler.php
// -------------------------------------------------------------
patchFile('auth-handler.php', (code) => {
  let content = code;

  // A. Add Security Gate right after session_start
  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}`;
  content = content.replace(sessionStartPattern, securityGate);

  // B. Remove STAGING TOKENS block from $OFFICIAL_TOKEN_HASHES
  const stagingBlockRegex = /\/\/\s*={10,}\s*\n\s*\/\/\s*TOKENS DEMO STAGING BARU[\s\S]*?(?=\/\/\s*Dedicated Token Manager Teknik|\/\/\s*KREDENSIAL RESMI KEPALA DIVTEK)/i;
  content = content.replace(stagingBlockRegex, '');

  // C. Sanitize comments revealing tokens
  content = content.replace(/\/\/\s*Dedicated Token Manager Teknik\s*\(NSR-DIVTEK-2026\)/g, '// KREDENSIAL RESMI KEPALA DIVISI TEKNIK');
  content = content.replace(/\/\/\s*NSR-DIVTEK-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Kepala Divisi Teknik');
  content = content.replace(/\/\/\s*NSR-DIVTEK-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Kepala Divisi Teknik');
  content = content.replace(/\/\/\s*Audited Token Rekan Mitra\s*\(NSR-REK-2026\)[^\n]*/g, '// Kredensial Rekan Mitra Umum');
  content = content.replace(/\/\/\s*NSR-REK-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Rekan Mitra');
  content = content.replace(/\/\/\s*NSR-REK-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Rekan Mitra');
  content = content.replace(/\/\/\s*Dedicated Token:\s*Kepala Keuangan & Pemimpin Rekan[^\n]*/g, '// KREDENSIAL RESMI KEPALA KEUANGAN & PEMIMPIN REKAN');
  content = content.replace(/\/\/\s*NSR-KEPKEU-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Kepala Keuangan');
  content = content.replace(/\/\/\s*NSR-KEPKEU-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Kepala Keuangan');
  content = content.replace(/\/\/\s*KREDENSIAL RESMI SUPER ADMIN — KING\s*\([REDACTED_SUPER_ADMIN_TOKEN]\)/g, '// KREDENSIAL RESMI SUPER ADMIN (KING)');
  content = content.replace(/\/\/\s*Token [REDACTED_ADMIN_PUSAT_TOKEN]\s*-\s*Admin Operasional Pusat/g, '// Kredensial Resmi Admin Operasional Pusat');
  content = content.replace(/\/\/\s*KREDENSIAL RESMI PENILAI PUBLIK\s*\(NSR-NARA-2026 & NSR-DUS-2026\)/g, '// KREDENSIAL RESMI PENILAI PUBLIK');
  content = content.replace(/\/\/\s*KREDENSIAL RESMI KEPALA SPM\s*\([REDACTED_SPM_TOKEN]\)/g, '// KREDENSIAL RESMI KEPALA SPM');

  // D. Remove staging accounts from $USER_ACCOUNTS
  const userAccountsRegex = /\$USER_ACCOUNTS\s*=\s*\[[\s\S]*?\];/;
  const sanitizedUserAccounts = `$USER_ACCOUNTS = [
    'admin' => [
        'passHash'    => '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0',
        'role'        => 'ADMIN_PUSAT',
        'branch'      => 'Pusat',
        'displayName' => 'Admin Pusat Jakarta',
        'title'       => 'Admin Operasional Pusat'
    ]
];`;
  content = content.replace(userAccountsRegex, sanitizedUserAccounts);

  // E. Add session_regenerate_id(true) on successful login
  // In action === 'token'
  content = content.replace(
    /(if\s*\(\$action\s*===\s*'token'\)[\s\S]*?if\s*\(\$resolved\)\s*\{\s*clearFail\(\$rateFile\);[\s\S]*?list\(\$user,\s*\$tokenHash\)\s*=\s*\$resolved;)/,
    `$1\n        session_regenerate_id(true);`
  );

  // In action === 'login' token branch
  content = content.replace(
    /(if\s*\(\$action\s*===\s*'login'\)[\s\S]*?if\s*\(\$resolved\)\s*\{\s*clearFail\(\$rateFile\);[\s\S]*?list\(\$user,\s*\$tokenHash\)\s*=\s*\$resolved;)/,
    `$1\n        session_regenerate_id(true);`
  );

  // In action === 'login' user accounts branch
  content = content.replace(
    /(if\s*\(hash_equals\(\$acc\['passHash'\],\s*\$inputPassHash\)\)\s*\{\s*clearFail\(\$rateFile\);)/,
    `$1\n            session_regenerate_id(true);`
  );

  return content;
});

// -------------------------------------------------------------
// 2. PATCH kwitansi-data-handler.php
// -------------------------------------------------------------
patchFile('kwitansi-data-handler.php', (code) => {
  let content = code;

  // A. Add Security Gate right after session_start
  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}`;
  content = content.replace(sessionStartPattern, securityGate);

  // B. Remove STAGING TOKENS block (NSR-STAGE-MASTER-77, NSR-STAGE-KEU-44)
  const stagingBlock1 = /\/\/\s*STAGING DEMO TOKENS \(NSR-STAGE-\*\)[\s\S]*?(?='57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0')/i;
  content = content.replace(stagingBlock1, '');

  // C. Remove STAGING TOKENS block for branches (NSR-STAGE-PLB-55, MKS-33, PDG-66, BDG-22)
  const stagingBlock2 = /'94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce'\s*=>\s*\[\s*\/\/\s*NSR-STAGE-PLB-55[\s\S]*?(?='47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0')/i;
  content = content.replace(stagingBlock2, '');

  // D. Sanitize comments
  content = content.replace(/\/\/\s*NSR-KEU-2026\s*salted/g, '// Keuangan Pusat (Salted)');
  content = content.replace(/\/\/\s*NSR-KEU-2026\s*unsalted/g, '// Keuangan Pusat (Raw)');
  content = content.replace(/\/\/\s*NSR-KAS-2026[^\n]*/g, '// Otorisasi Kasir & Keuangan Cabang');
  content = content.replace(/\/\/\s*NSR-ADM-2026[^\n]*/g, '// Otorisasi Admin Operasional Pusat');

  return content;
});

// -------------------------------------------------------------
// 3. PATCH operasional-data-handler.php
// -------------------------------------------------------------
patchFile('operasional-data-handler.php', (code) => {
  let content = code;

  // A. Add Security Gate right after session_start
  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}`;
  content = content.replace(sessionStartPattern, securityGate);

  // B. Remove STAGING TOKENS block
  const stagingBlock = /\/\/\s*={10,}\s*\n\s*\/\/\s*TOKENS DEMO STAGING BARU[\s\S]*?(?=\/\/\s*={10,}\s*\n\s*\/\/\s*TOKENS PRODUKSI RESMI)/i;
  content = content.replace(stagingBlock, '');

  // C. Sanitize comments
  content = content.replace(/\/\/\s*1\.\s*DEDICATED TOKEN:\s*MANAGER TEKNIK\s*\(Deni Siswandi, S\.T\. - NSR-DIVTEK-2026\)/g, '// 1. KREDENSIAL RESMI MANAGER TEKNIK');
  content = content.replace(/\/\/\s*NSR-DIVTEK-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Manager Teknik');
  content = content.replace(/\/\/\s*NSR-DIVTEK-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Manager Teknik');
  content = content.replace(/\/\/\s*2\.\s*KEPALA KEUANGAN & PEMIMPIN REKAN[^\n]*/g, '// 2. KREDENSIAL RESMI KEPALA KEUANGAN & PEMIMPIN REKAN');
  content = content.replace(/\/\/\s*NSR-KEPKEU-2026:[^\n]*/g, '// Otorisasi Final Tingkat 3');
  content = content.replace(/\/\/\s*NSR-KEPKEU-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Kepala Keuangan');
  content = content.replace(/\/\/\s*NSR-KEPKEU-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Kepala Keuangan');
  content = content.replace(/\/\/\s*AUDIT TOKEN TERESKPOS:\s*[REDACTED_SUPER_ADMIN_TOKEN][^\n]*/g, '// KREDENSIAL SUPER ADMIN (KING)');
  content = content.replace(/\/\/\s*[REDACTED_SUPER_ADMIN_TOKEN]\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Super Admin King');
  content = content.replace(/\/\/\s*[REDACTED_SUPER_ADMIN_TOKEN]\s*\(Salted SHA-256\)/g, '// Hash Salted Super Admin King');
  content = content.replace(/\/\/\s*AUDIT TOKEN TERESKPOS:\s*[REDACTED_ADMIN_PUSAT_TOKEN][^\n]*/g, '// KREDENSIAL ADMIN OPERASIONAL PUSAT');
  content = content.replace(/\/\/\s*[REDACTED_ADMIN_PUSAT_TOKEN]\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Admin Operasional');
  content = content.replace(/\/\/\s*[REDACTED_ADMIN_PUSAT_TOKEN]\s*\(Salted SHA-256\)/g, '// Hash Salted Admin Operasional');
  content = content.replace(/\/\/\s*NSR-ADM-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Admin Pusat');
  content = content.replace(/\/\/\s*NSR-ADM-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Admin Pusat');
  content = content.replace(/\/\/\s*4\.\s*MANAGER KEUANGAN\s*\(Milda Hidayati Dewi, S\.E\. - NSR-KEU-2026\)/g, '// 4. MANAGER KEUANGAN');
  content = content.replace(/\/\/\s*NSR-KEU-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Keuangan');
  content = content.replace(/\/\/\s*NSR-KEU-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Keuangan');
  content = content.replace(/\/\/\s*Penilai Properti\s*\(NSR-VAL-2026\)/g, '// Penilai Properti');
  content = content.replace(/\/\/\s*NSR-VAL-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Penilai');
  content = content.replace(/\/\/\s*NSR-VAL-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Penilai');
  content = content.replace(/\/\/\s*Surveyor Lapangan\s*\(NSR-SRV-2026[^\)]*\)/g, '// Surveyor Lapangan');
  content = content.replace(/\/\/\s*NSR-SRV-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Surveyor');
  content = content.replace(/\/\/\s*NSR-SRV-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Surveyor');
  content = content.replace(/\/\/\s*Marketing\s*\(NSR-MKT-2026\)/g, '// Marketing Penugasan');
  content = content.replace(/\/\/\s*NSR-MKT-2026\s*\(Raw SHA-256\)/g, '// Hash Otorisasi Marketing');
  content = content.replace(/\/\/\s*NSR-MKT-2026\s*\(Salted SHA-256\)/g, '// Hash Salted Marketing');
  content = content.replace(/\/\/\s*NSR-REK-2026[^\n]*/g, '// Rekan Mitra Umum');
  content = content.replace(/\/\/\s*NSR-REV-2026[^\n]*/g, '// Reviewer Mutu Penugasan');
  content = content.replace(/\/\/\s*Admin Cabang Bandung\s*\([REDACTED_CAB_BDG_TOKEN]\)/g, '// Admin Cabang Bandung');
  content = content.replace(/\/\/\s*Admin Cabang Padang\s*\(NSR-PDG-2026\)/g, '// Admin Cabang Padang');
  content = content.replace(/\/\/\s*Admin Cabang Makassar\s*\(NSR-MKS-2026\)/g, '// Admin Cabang Makassar');
  content = content.replace(/\/\/\s*Admin Cabang Palembang\s*\(NSR-PLB-2026\)/g, '// Admin Cabang Palembang');
  content = content.replace(/\/\/\s*Keuangan Cabang\s*\(NSR-KAS-2026\)/g, '// Keuangan Cabang');

  return content;
});

// -------------------------------------------------------------
// 4. PATCH nolap-data-handler.php
// -------------------------------------------------------------
patchFile('nolap-data-handler.php', (code) => {
  let content = code;

  // A. Add Security Gate right after session_start
  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}`;
  content = content.replace(sessionStartPattern, securityGate);

  // B. Eliminate $_GET['token'] and support X-NSR-Service-Key for machine/GAS access
  const tokenHeaderPattern = /\/\/\s*C\.\s*Dari Header X-NSR-Token\s*[\r\n]+\s*if\s*\(!\$currentUser\)\s*\{\s*\$customToken\s*=\s*\$_SERVER\['HTTP_X_NSR_TOKEN'\]\s*\?\?\s*\$_SERVER\['HTTP_X_INTERNAL_TOKEN'\]\s*\?\?\s*\$_GET\['token'\]\s*\?\?\s*'';/;
  const replacementHeader = `// B2. Dari Header Service Integrasi Mesin (X-NSR-Service-Key)
if (!$currentUser) {
    $serviceKey = trim($_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '');
    if ($serviceKey) {
        $serviceHash = hash('sha256', strtoupper($serviceKey));
        $officialServiceHashes = [
            hash('sha256', 'GAS_SYNC_SERVICE_KEY_2026') => [
                'sub'         => 'service_gas_sync',
                'role'        => 'SERVICE_INTEGRATION',
                'displayName' => 'Layanan Sinkronisasi GAS',
                'isService'   => true,
                'permissions' => ['sync.data', 'opr.view']
            ]
        ];
        if (isset($officialServiceHashes[$serviceHash])) {
            $currentUser = $officialServiceHashes[$serviceHash];
        }
    }
}

// C. Dari Header X-NSR-Token (Header Terkontrol, Tanpa Query Parameter)
if (!$currentUser) {
    $customToken = $_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? '';`;
  content = content.replace(tokenHeaderPattern, replacementHeader);

  // C. Sanitize comments in nolap-data-handler.php
  content = content.replace(/\/\/\s*KREDENSIAL RESMI SUPER ADMIN — KING\s*\([REDACTED_SUPER_ADMIN_TOKEN]\)/g, '// KREDENSIAL RESMI SUPER ADMIN (KING)');
  content = content.replace(/\/\/\s*KREDENSIAL RESMI ADMIN PUSAT\s*\(NSR-ADM-2026\)/g, '// KREDENSIAL RESMI ADMIN PUSAT');
  content = content.replace(/\/\/\s*Token Header:\s*NSR-DIVTEK-2026\s*\(Kepala Divisi Teknik - Deni Siswandi\)/g, '// Kepala Divisi Teknik - Deni Siswandi');
  content = content.replace(/\/\/\s*Token Header:\s*[REDACTED_DIVTEK_TOKEN][^\n]*/g, '// Kepala Divisi Teknik (Alias)');
  content = content.replace(/\/\/\s*Token Header:\s*NSR-NARA-2026\s*\(Penilai Publik - Ir\. Nanang Rahayu\)/g, '// Penilai Publik - Ir. Nanang Rahayu');
  content = content.replace(/\/\/\s*Token Header:\s*[REDACTED_PENILAI_NANANG_TOKEN][^\n]*/g, '// Penilai Publik (Alias)');
  content = content.replace(/\/\/\s*Token Header:\s*NSR-DUS-2026\s*\(Penilai Publik - Deni Siswandi, Terpisah dari Divtek!\)/g, '// Penilai Publik - Deni Siswandi (Terpisah dari Divtek)');

  // D. Hash $allowedKeys in emergencyOverrideGate
  const allowedKeysPattern = /\$reauthKey\s*=\s*trim\(\$payload\['reauthKey'\]\s*\?\?\s*\$_SERVER\['HTTP_X_NSR_OVERRIDE_KEY'\]\s*\?\?\s*''\);\s*[\r\n]+\s*\$allowedKeys\s*=\s*\[(process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"),\s*'KING-OVERRIDE-SECURE-2026',\s*'NSR-OVERRIDE-2026'\];\s*[\r\n]+\s*if\s*\(empty\(\$reauthKey\)\s*\|\|\s*!in_array\(\$reauthKey,\s*\$allowedKeys,\s*true\)\)/;
  const hashedAllowedKeys = `$reauthKey = trim($payload['reauthKey'] ?? $_SERVER['HTTP_X_NSR_OVERRIDE_KEY'] ?? '');
        $reauthHash = hash('sha256', strtoupper($reauthKey));
        $allowedKeyHashes = [
            '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0', // Super Admin King
            hash('sha256', 'KING-OVERRIDE-SECURE-2026'),
            hash('sha256', 'NSR-OVERRIDE-2026')
        ];
        if (empty($reauthKey) || !in_array($reauthHash, $allowedKeyHashes, true))`;
  content = content.replace(allowedKeysPattern, hashedAllowedKeys);

  return content;
});

// -------------------------------------------------------------
// 5. PATCH absensi-data-handler.php
// -------------------------------------------------------------
patchFile('absensi-data-handler.php', (code) => {
  let content = code;

  // A. Add Security Gate at the top
  const headerAnchor = /\/\/\s*1\.\s*Strict Security Headers & JSON Response/;
  const securityGate = `// =============================================================
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

// 1. Strict Security Headers & JSON Response`;
  content = content.replace(headerAnchor, securityGate);

  // B. Eliminate $_GET['token'] in getRiwayatPresensi
  const riwayatPattern = /\$sessionToken\s*=\s*\$payload\['sessionToken'\]\s*\?\?\s*\$_SERVER\['HTTP_X_SESSION_TOKEN'\]\s*\?\?\s*\$_GET\['token'\]\s*\?\?\s*'';/;
  const replacementRiwayat = `$sessionToken = $payload['sessionToken'] ?? $_SERVER['HTTP_X_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '';`;
  content = content.replace(riwayatPattern, replacementRiwayat);

  return content;
});

// -------------------------------------------------------------
// 6. PATCH process-mail-queue.php
// -------------------------------------------------------------
patchFile('process-mail-queue.php', (code) => {
  let content = code;

  const mailAuthPattern = /\/\/\s*Mode Web Request: Validasi Token atau Cron Key[\s\S]*?(?=\s*if\s*\(isset\(\$_GET\['dry_run'\]\))/;
  const replacementMailAuth = `// Mode Web Request: Validasi Token atau Cron Key (Strict Header & Hashes)
    header('Content-Type: application/json; charset=UTF-8');

    // Tolak query parameter URL
    if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Otorisasi melalui query parameter URL dilarang demi keamanan.']);
        exit;
    }

    $authHeader = trim($_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '');
    if (!$authHeader) {
        $rawAuth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\\s+(\\S+)/i', $rawAuth, $m)) {
            $authHeader = trim($m[1]);
        }
    }

    $incomingHash = hash('sha256', strtoupper($authHeader));
    $validWorkerHashes = [
        '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0', // Super Admin King
        '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f', // Super Admin King Salted
        '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2', // Admin PST
        '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c', // Admin PST Salted
        '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99', // Admin Pusat
        '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04', // Admin Pusat Salted
        hash('sha256', 'CRON_NSR_SECURE_KEY_2026')                             // Dedicated Service Key
    ];

    if (!$authHeader || !in_array($incomingHash, $validWorkerHashes, true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Token otorisasi worker email tidak sah.']);
        exit;
    }
    `;
  content = content.replace(mailAuthPattern, replacementMailAuth);

  return content;
});

// -------------------------------------------------------------
// 7. PATCH surat-umum-data-handler.php
// -------------------------------------------------------------
patchFile('surat-umum-data-handler.php', (code) => {
  let content = code;

  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PROTEKSI CSRF PADA AKSI MUTASI DATA
// =============================================================
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD', 'OPTIONS'], true)) {
    if (empty($_SERVER['HTTP_X_NSR_SERVICE_KEY'])) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $allowedHosts = ['kjppnanangrahayu.com', 'www.kjppnanangrahayu.com', 'localhost', '127.0.0.1'];
        if ($host && !in_array($host, $allowedHosts, true)) {
            $allowedHosts[] = $host;
        }
        $targetUrl = $origin ?: $referer;
        if ($targetUrl) {
            $parsedHost = parse_url($targetUrl, PHP_URL_HOST);
            if (!$parsedHost || !in_array(strtolower($parsedHost), $allowedHosts, true)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error'   => 'CSRF Validation Failed: Permintaan ditolak karena berasal dari domain luar yang tidak diizinkan.'
                ]);
                exit;
            }
        }
    }
}`;
  content = content.replace(sessionStartPattern, securityGate);

  return content;
});

// -------------------------------------------------------------
// 8. PATCH status-terintegrasi-handler.php
// -------------------------------------------------------------
patchFile('status-terintegrasi-handler.php', (code) => {
  let content = code;

  const sessionStartPattern = /if\s*\(session_status\(\)\s*===\s*PHP_SESSION_NONE\)\s*\{\s*session_start\(\);\s*\}/;
  const securityGate = `if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// =============================================================
// KEAMANAN P0: TOLAK OTORISASI VIA QUERY PARAMETER URL
// =============================================================
if (isset($_GET['token']) || isset($_GET['key']) || isset($_GET['auth'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'Akses Ditolak: Autentikasi melalui parameter URL (query string) dilarang demi keamanan sistem.'
    ]);
    exit;
}

// =============================================================
// KEAMANAN P0: PENCABUTAN SESI KOMPROMI (SESSION REVOCATION BLACKLIST)
// =============================================================
$REVOKED_SESSION_IDS = [
    'process.env.NSR_REVOKED_SESS_1 || "revoked_sess_hash_1"',
    'process.env.NSR_REVOKED_SESS_2 || "revoked_sess_hash_2"',
    'process.env.NSR_REVOKED_SESS_3 || "revoked_sess_hash_3"'
];
$currentSessionId = session_id();
if ($currentSessionId && in_array($currentSessionId, $REVOKED_SESSION_IDS, true)) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi telah dicabut demi keamanan (Revoked Session). Silakan masuk kembali.'
    ]);
    exit;
}`;
  content = content.replace(sessionStartPattern, securityGate);

  return content;
});

// -------------------------------------------------------------
// 9. PATCH alur-kerja-penugasan-nolap-kwitansi.html
// -------------------------------------------------------------
patchFile('alur-kerja-penugasan-nolap-kwitansi.html', (code) => {
  let content = code;
  content = content.replace(/<span class="px-2 py-0\.5 rounded text-\[10px\] font-bold bg-cyan-100 text-cyan-900">Token:\s*NSR-KAS-2026<\/span>/g, '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-900">Otorisasi: Kasir Cabang</span>');
  content = content.replace(/<span class="px-2 py-0\.5 rounded text-\[10px\] font-bold bg-emerald-100 text-emerald-900">Token:\s*NSR-KEU-2026<\/span>/g, '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">Otorisasi: Keuangan Pusat</span>');
  content = content.replace(/<li><strong>Distribusi Token Privat:<\/strong>\s*Buka file <a href="daftar-token-akses-internal\.html"[^>]*>daftar-token-akses-internal\.html<\/a>,\s*potong atau salin slip kredensial individual sesuai perannya masing-masing\.\s*Jangan bagikan token master <code[^>]*>[REDACTED_SUPER_ADMIN_TOKEN]<\/code> kepada staf umum\.<\/li>/g, '<li><strong>Distribusi Kredensial Privat:</strong> Bagikan kredensial individual kepada masing-masing pejabat dan staf berwenang sesuai matriks kewenangan resmi. Jaga kerahasiaan kredensial dan jangan membagikan akses administratif kepada pihak yang tidak berkepentingan.</li>');
  return content;
});

// -------------------------------------------------------------
// 10. PATCH panduan-mitigasi-pengadaan-tanah-pln-makassar.html
// -------------------------------------------------------------
patchFile('panduan-mitigasi-pengadaan-tanah-pln-makassar.html', (code) => {
  let content = code;
  content = content.replace(/<span class="bg-amber-400\/20 text-amber-300 px-2 py-0\.5 rounded border border-amber-400\/40">NSR-MKS-2026<\/span>/g, '<span class="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40">Cabang Makassar</span>');
  return content;
});

// -------------------------------------------------------------
// 11. PURGE REVOKED SESSIONS IN data/sessions/active_sessions.json
// -------------------------------------------------------------
const sessionsPath = path.join(ROOT_DIR, 'data', 'sessions', 'active_sessions.json');
if (fs.existsSync(sessionsPath)) {
  try {
    const raw = fs.readFileSync(sessionsPath, 'utf8');
    const sessions = JSON.parse(raw);
    const REVOKED_HASHES = [
      '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a',
      '7afb5f456e453b47672a2a2fa7c241c5aa45b41b8b3c759a84ec36c944aa30bf',
      '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8',
      '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10',
      'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea',
      'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7',
      '1b6df23d3e909f0f12fe357e58912cafe05580cb7d2b5f7710762bd572d63f8f',
      'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f',
      '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce',
      '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff',
      'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b',
      '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ];
    let purged = 0;
    for (const [key, sess] of Object.entries(sessions)) {
      const uHash = sess?.user?.tokenHash || '';
      const sub = sess?.user?.sub || '';
      if (REVOKED_HASHES.includes(uHash) || sub.includes('stage') || sub === 'admin_master') {
        delete sessions[key];
        purged++;
      }
    }
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 4), 'utf8');
    console.log(`[PURGED] ${purged} compromised/staging sessions from active_sessions.json`);
  } catch (err) {
    console.error('[ERROR] Failed to purge active_sessions.json:', err.message);
  }
}

console.log('\n=== EMERGENCY SECURITY CLOSURE P0 APPLIED SUCCESSFULLY ===');
