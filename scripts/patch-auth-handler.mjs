import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const authFile = path.join(ROOT_DIR, 'auth-handler.php');

const lines = fs.readFileSync(authFile, 'utf8').split(/\r?\n/);

// Find bounds for the registry + resolveServerToken
const startIdx = lines.findIndex(l => l.includes('1. DATA TOKENS RESMI'));
const resolverIdx = lines.findIndex(l => l.includes('function resolveServerToken'));
let endResolverIdx = -1;
for (let i = resolverIdx; i < lines.length; i++) {
  if (lines[i].trim() === 'return null;' && lines[i + 1]?.trim() === '}') {
    endResolverIdx = i + 1;
    break;
  }
}

console.log('startIdx (1. DATA TOKENS RESMI):', startIdx);
console.log('resolverIdx:', resolverIdx);
console.log('endResolverIdx:', endResolverIdx);

if (startIdx === -1 || resolverIdx === -1 || endResolverIdx === -1) {
  console.error('Failed to find line bounds!');
  process.exit(1);
}

// Find preceding comment // -----
let commentStartIdx = startIdx;
while (commentStartIdx > 0 && lines[commentStartIdx - 1].includes('// ---')) {
  commentStartIdx--;
}

const replacement = [
  '// -------------------------------------------------------------',
  '// 1. DATA TOKENS RESMI & KREDENSIAL PRIVAT SERVER',
  '// Dimuat secara eksklusif dari file konfigurasi privat server',
  '// DILARANG KERAS menyimpan rahasia/hash dalam source code publik',
  '// -------------------------------------------------------------',
  "require_once __DIR__ . '/auth-registry-loader.php';",
  "$authRegistry = loadPrivateAuthRegistry();",
  "$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];",
  "$USER_ACCOUNTS = $authRegistry['user_accounts'] ?? [];",
  "$officialServiceHashes = $authRegistry['service_hashes'] ?? [];",
  '',
  '// -------------------------------------------------------------',
  '// HELPER RESOLVER TOKEN RESMI DARI SERVER',
  '// -------------------------------------------------------------',
  'function resolveServerToken($rawToken, $hashRegistry) {',
  '    if (!$rawToken || !is_string($rawToken)) return null;',
  '    $clean = trim($rawToken);',
  '    ',
  '    // 1. TOLAK MUTLAK HASH LANGSUNG (ANTI PASS-THE-HASH)',
  '    // Jika input berformat hex 64 karakter, tolak langsung demi keamanan backend',
  '    if (strlen($clean) === 64 && ctype_xdigit($clean)) {',
  '        return null;',
  '    }',
  '    ',
  '    // 2. Evaluasi HANYA melalui salted SHA-256 yang dihitung di backend',
  "    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($clean));",
  '    if (isset($hashRegistry[$saltedHash])) {',
  '        return [$hashRegistry[$saltedHash], $saltedHash];',
  '    }',
  '    ',
  '    return null;',
  '}'
];

lines.splice(commentStartIdx, endResolverIdx - commentStartIdx + 1, ...replacement);
console.log('✅ Registry & resolver replaced. New line count:', lines.length);

let content = lines.join('\n');

// 3. Update Action: token (POST /api/auth-token) to not return sessionToken or tokenHash
content = content.replace(
  `        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'branch'          => $user['displayName'],
            'user'            => $user,
            'tokenHash'       => $user['tokenHash'] ?? $tokenHash,
            'sessionToken'    => $sessionToken,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);`,
  `        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'branch'          => $user['displayName'],
            'user'            => $user,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);`
);

// 4. Update Action: login (POST /api/auth-login) - Token branch
content = content.replace(
  `        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $user,
            'tokenHash'       => $user['tokenHash'] ?? $tokenHash,
            'sessionToken'    => $sessionToken,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);`,
  `        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $user,
            'sessionChecksum' => $sessionChecksum,
            'expiresAt'       => $expiresAt
        ]);`
);

// 5. Update Action: login - User Account branch
const oldUserAccBlock = `    // Cek 2: User Account Login (Khusus Staf Keuangan / NoLap Staging)
    if (isset($USER_ACCOUNTS[$identifier])) {
        $acc = $USER_ACCOUNTS[$identifier];
        $inputPassHash = hash('sha256', $password);
        if (hash_equals($acc['passHash'], $inputPassHash)) {
            clearFail($rateFile);
            session_regenerate_id(true);
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
        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);

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
    }`;

const newUserAccBlock = `    // Cek 2: User Account Login (Khusus Staf Keuangan / NoLap Staging)
    if (isset($USER_ACCOUNTS[$identifier])) {
        $acc = $USER_ACCOUNTS[$identifier];
        $inputPassHash = hash('sha256', 'KJPP_NSR_2026_CORE_PASS::' . $password);
        if (hash_equals($acc['passHash'], $inputPassHash)) {
            clearFail($rateFile);
            session_regenerate_id(true);
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
                'isSuperAdmin'      => false,
                'isKing'            => false,
                'isCabang'          => ($acc['role'] === 'CABANG'),
                'canAccessKwitansi' => true,
                'canApprove'        => ($acc['role'] === 'ADMIN_PUSAT'),
                'canSubmit'         => true,
                'seeFee'            => true,
                'mode'              => ($acc['role'] === 'CABANG') ? 'CABANG' : 'PUSAT'
            ];
            $_SESSION['nsr_user'] = $user;
            $_SESSION['nsr_login_time'] = time();

            // FIX: Urutan inisialisasi waktu kedaluwarsa sesi (sebelum simpanSesiServer)
            $expiresAt = (time() + 28800) * 1000;
            $sessionToken = bin2hex(random_bytes(16));
            $_SESSION['nsr_session_token'] = $sessionToken;
            simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);

            $checksumPayload = implode('::', [
                'NSR_SESSION_INTEGRITY_2026_x7k9::',
                hash('sha256', $identifier),
                $user['role'],
                $user['wilayah'],
                $expiresAt,
                'FALSE',
                'NSR_ZERO_TRUST_SIG_2026_9x4m'
            ]);
            $sessionChecksum = hash('sha256', $checksumPayload);

            // FIX: Tidak mengembalikan sessionToken sebagai kredensial tambahan
            echo json_encode([
                'success'         => true,
                'authenticated'   => true,
                'user'            => $user,
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }`;

if (content.includes(oldUserAccBlock)) {
  content = content.replace(oldUserAccBlock, newUserAccBlock);
  console.log('✅ User account block replaced successfully');
} else {
  console.warn('⚠️ User account block not matched exactly');
}

// 6. Update Action: verify
const oldVerifyBlock = `if ($action === 'verify' || $action === 'check') {
    // 1. Sesi PHP (jika belum dicabut)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isSessValid = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $isSessValid = (verifikasiSesiServer($sessionsFile, $sessToken) !== null);
        }
        if ($isSessValid && (time() - $loginTime < 28800)) {
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

    // 2. Cek Session Token Server
    $incomingSessionToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? ($body['sessionToken'] ?? ''));
    if ($incomingSessionToken && ($userFromSess = verifikasiSesiServer($sessionsFile, $incomingSessionToken))) {
        echo json_encode([
            'success'         => true,
            'authenticated'   => true,
            'user'            => $userFromSess,
            'sessionToken'    => $incomingSessionToken,
            'expiresAt'       => (time() + 28800) * 1000
        ]);
        exit;
    }

    // 3. Bearer token / X-NSR-Token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $rawBearer = '';
    if (preg_match('/Bearer\\s+(\\S+)/i', $authHeader, $m)) {
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

    http_response_code(401);
    echo json_encode([
        'success'       => false,
        'authenticated' => false,
        'error'         => 'Sesi tidak aktif atau telah kedaluwarsa. Silakan masukkan token akses.'
    ]);
    exit;
}`;

const newVerifyBlock = `if ($action === 'verify' || $action === 'check') {
    // 1. Sesi PHP (NSR_SESSION) yang valid
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isSessValid = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $isSessValid = (verifikasiSesiServer($sessionsFile, $sessToken) !== null);
        }
        if ($isSessValid && (time() - $loginTime < 28800)) {
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
                'sessionChecksum' => $sessionChecksum,
                'expiresAt'       => $expiresAt
            ]);
            exit;
        }
    }

    // 2. Akses Mesin Layanan via Header Resmi (X-NSR-Service-Key atau Authorization Bearer Service Key)
    $serviceKey = $_SERVER['HTTP_X_NSR_SERVICE_KEY'] ?? '';
    if (!$serviceKey) {
        $authH = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\\s+(\\S+)/i', $authH, $m)) {
            $candidate = $m[1];
            $candHash = hash('sha256', $candidate);
            if (isset($officialServiceHashes[$candHash])) {
                $serviceKey = $candidate;
            }
        }
    }
    if ($serviceKey) {
        $srvHash = hash('sha256', $serviceKey);
        if (isset($officialServiceHashes[$srvHash])) {
            echo json_encode([
                'success'       => true,
                'authenticated' => true,
                'service'       => $officialServiceHashes[$srvHash],
                'mode'          => 'SERVICE_INTEGRATION'
            ]);
            exit;
        }
    }

    // 3. Bearer token resmi via Header (hanya diproses melalui resolver salted hash backend)
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $rawBearer = '';
    if (preg_match('/Bearer\\s+(\\S+)/i', $authHeader, $m)) {
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
}`;

if (content.includes(oldVerifyBlock)) {
  content = content.replace(oldVerifyBlock, newVerifyBlock);
  console.log('✅ Verify block replaced successfully');
} else {
  console.warn('⚠️ Verify block not matched directly');
}

fs.writeFileSync(authFile, content, 'utf8');
console.log('✅ auth-handler.php fully patched and written!');
