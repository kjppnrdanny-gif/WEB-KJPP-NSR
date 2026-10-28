import fs from 'fs';

// 1. operasional-data-handler.php
let opr = fs.readFileSync('operasional-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const oprAnchor = `function resolveCurrentUser($officialTokenHashes) {
    // A. Dari Sesi PHP
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            return $_SESSION['nsr_user'];
        }
    }`;

const oprReplacement = `function resolveCurrentUser($officialTokenHashes) {
    $sessionsFile = __DIR__ . '/data/sessions/active_sessions.json';

    // A. Dari Sesi PHP (jika belum dicabut)
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isSessValid = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $sessData = json_decode(@file_get_contents($sessionsFile), true);
            if (!isset($sessData[$sessToken]) || (($sessData[$sessToken]['expiresAt'] ?? 0) < time() * 1000)) {
                $isSessValid = false;
            }
        }
        if ($isSessValid && (time() - $loginTime < 28800)) {
            return $_SESSION['nsr_user'];
        }
    }

    // A2. Dari Header X-NSR-Session-Token
    $sessHdr = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? '');
    if ($sessHdr && file_exists($sessionsFile)) {
        $sessData = json_decode(@file_get_contents($sessionsFile), true);
        if (isset($sessData[$sessHdr]) && (($sessData[$sessHdr]['expiresAt'] ?? 0) >= time() * 1000)) {
            return $sessData[$sessHdr]['user'] ?? null;
        }
    }`;

if (opr.includes(oprAnchor)) {
  opr = opr.replace(oprAnchor, oprReplacement);
  fs.writeFileSync('operasional-data-handler.php', opr, 'utf8');
  console.log('✔ operasional-data-handler.php session check patched');
} else {
  console.log('❌ operasional anchor not matched');
}

// 2. kwitansi-data-handler.php
let kw = fs.readFileSync('kwitansi-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const kwAnchor = `// A. Dari Sesi PHP (NSR_SESSION)
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    if (time() - $loginTime < 28800) {
        $currentUser = $_SESSION['nsr_user'];
    }
}`;

const kwReplacement = `// A. Dari Sesi PHP (NSR_SESSION) yang belum dicabut
$sessionsFile = __DIR__ . '/data/sessions/active_sessions.json';
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    $sessToken = $_SESSION['nsr_session_token'] ?? null;
    $isSessValid = true;
    if ($sessToken && file_exists($sessionsFile)) {
        $sessData = json_decode(@file_get_contents($sessionsFile), true);
        if (!isset($sessData[$sessToken]) || (($sessData[$sessToken]['expiresAt'] ?? 0) < time() * 1000)) {
            $isSessValid = false;
        }
    }
    if ($isSessValid && (time() - $loginTime < 28800)) {
        $currentUser = $_SESSION['nsr_user'];
    }
}

// A2. Dari Header X-NSR-Session-Token
if (!$currentUser) {
    $sessHdr = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? '');
    if ($sessHdr && file_exists($sessionsFile)) {
        $sessData = json_decode(@file_get_contents($sessionsFile), true);
        if (isset($sessData[$sessHdr]) && (($sessData[$sessHdr]['expiresAt'] ?? 0) >= time() * 1000)) {
            $currentUser = $sessData[$sessHdr]['user'] ?? null;
        }
    }
}`;

if (kw.includes(kwAnchor)) {
  kw = kw.replace(kwAnchor, kwReplacement);
  fs.writeFileSync('kwitansi-data-handler.php', kw, 'utf8');
  console.log('✔ kwitansi-data-handler.php session check patched');
} else {
  console.log('❌ kwitansi anchor not matched');
}
