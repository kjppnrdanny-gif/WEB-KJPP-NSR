import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const authFile = path.join(ROOT_DIR, 'auth-handler.php');

let c = fs.readFileSync(authFile, 'utf8').replace(/\r\n/g, '\n');

const target = "if ($action === 'verify' || $action === 'check') {";
const tIdx = c.indexOf(target);
const nextAction = "if ($action === 'logout') {";
const nIdx = c.indexOf(nextAction);

if (tIdx === -1 || nIdx === -1) {
  console.error('Indices not found:', tIdx, nIdx);
  process.exit(1);
}

const newVerify = `if ($action === 'verify' || $action === 'check') {
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
}

`;

c = c.slice(0, tIdx) + newVerify + c.slice(nIdx);
fs.writeFileSync(authFile, c, 'utf8');
console.log('✅ Action verify replaced successfully!');
