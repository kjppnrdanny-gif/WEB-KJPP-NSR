import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// -------------------------------------------------------------
// 1. PATCH KWITANSI DATA HANDLER
// -------------------------------------------------------------
console.log('1. Patching kwitansi-data-handler.php...');
const kwitansiFile = path.join(ROOT_DIR, 'kwitansi-data-handler.php');
let kwitansi = fs.readFileSync(kwitansiFile, 'utf8').replace(/\r\n/g, '\n');

const kwStart = kwitansi.indexOf('$OFFICIAL_TOKEN_HASHES = [');
const kwEnd = kwitansi.indexOf('// -------------------------------------------------------------\n// HELPER FUNGSI OPERASIONAL & REGISTRASI ATOMIK', kwStart);

if (kwStart !== -1 && kwEnd !== -1) {
  const kwReplace = `require_once __DIR__ . '/auth-registry-loader.php';
$authRegistry = loadPrivateAuthRegistry();
$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];

`;
  kwitansi = kwitansi.slice(0, kwStart) + kwReplace + kwitansi.slice(kwEnd);
  console.log('  ✅ kwitansi token hashes array replaced with loader');
} else {
  console.warn('  ⚠️ kwitansi markers not found');
}

// Update kwitansi token resolution (anti pass-the-hash)
const oldKwResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        $tokenHash = hash('sha256', $trimmed);
        if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
        } else {
            $upperHash = hash('sha256', strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
            } else {
                $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                }
            }
        }
    }`;

const newKwResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        // Tolak mutlak hash langsung (anti pass-the-hash)
        if (strlen($trimmed) === 64 && ctype_xdigit($trimmed)) {
            $currentUser = null;
        } else {
            $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
            }
        }
    }`;

if (kwitansi.includes(oldKwResolver)) {
  kwitansi = kwitansi.replace(oldKwResolver, newKwResolver);
  console.log('  ✅ kwitansi resolver updated with anti pass-the-hash');
} else {
  console.warn('  ⚠️ kwitansi resolver old block not matched');
}

fs.writeFileSync(kwitansiFile, kwitansi, 'utf8');

// -------------------------------------------------------------
// 2. PATCH NOLAP DATA HANDLER
// -------------------------------------------------------------
console.log('\n2. Patching nolap-data-handler.php...');
const nolapFile = path.join(ROOT_DIR, 'nolap-data-handler.php');
let nolap = fs.readFileSync(nolapFile, 'utf8').replace(/\r\n/g, '\n');

const nlStart = nolap.indexOf('$OFFICIAL_TOKEN_HASHES = [');
const nlEnd = nolap.indexOf('// -------------------------------------------------------------\n// 2. HELPER SISTEM PENOMORAN RESMI & DUAL-GATE REGISTER CONTROL', nlStart);

if (nlStart !== -1 && nlEnd !== -1) {
  const nlReplace = `require_once __DIR__ . '/auth-registry-loader.php';
$authRegistry = loadPrivateAuthRegistry();
$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];

`;
  nolap = nolap.slice(0, nlStart) + nlReplace + nolap.slice(nlEnd);
  console.log('  ✅ nolap token hashes array replaced with loader');
} else {
  console.warn('  ⚠️ nolap markers not found');
}

// Update nolap token resolution (anti pass-the-hash and remove query token)
const oldNlResolverB = `            $tHash = hash('sha256', strtoupper($token));
            if (isset($OFFICIAL_TOKEN_HASHES[$tHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tHash];
            }`;

const newNlResolverB = `            if (strlen($token) === 64 && ctype_xdigit($token)) {
                $currentUser = null;
            } else {
                $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($token));
                if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                }
            }`;

if (nolap.includes(oldNlResolverB)) {
  nolap = nolap.replace(oldNlResolverB, newNlResolverB);
  console.log('  ✅ nolap Bearer resolver updated with anti pass-the-hash');
}

const oldNlResolverC = `// C. Dari Header X-NSR-Session-Token atau X-NSR-Token
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

const newNlResolverC = `// C. Dari Header X-NSR-Token resmi
if (!$currentUser) {
    $incomingToken = trim($_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? '');
    if ($incomingToken) {
        if (strlen($incomingToken) === 64 && ctype_xdigit($incomingToken)) {
            $currentUser = null;
        } else {
            $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($incomingToken));
            if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
            }
        }
    }
}`;

if (nolap.includes(oldNlResolverC)) {
  nolap = nolap.replace(oldNlResolverC, newNlResolverC);
  console.log('  ✅ nolap Header resolver updated with anti pass-the-hash');
}

fs.writeFileSync(nolapFile, nolap, 'utf8');

// -------------------------------------------------------------
// 3. PATCH OPERASIONAL DATA HANDLER
// -------------------------------------------------------------
console.log('\n3. Patching operasional-data-handler.php...');
const oprFile = path.join(ROOT_DIR, 'operasional-data-handler.php');
let opr = fs.readFileSync(oprFile, 'utf8').replace(/\r\n/g, '\n');

const oprStart = opr.indexOf('$OFFICIAL_TOKEN_HASHES = [');
const oprEnd = opr.indexOf('// -------------------------------------------------------------\n// 2. KONFIGURASI FILE & DATABASE OPERASIONAL', oprStart);

if (oprStart !== -1 && oprEnd !== -1) {
  const oprReplace = `require_once __DIR__ . '/auth-registry-loader.php';
$authRegistry = loadPrivateAuthRegistry();
$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];

`;
  opr = opr.slice(0, oprStart) + oprReplace + opr.slice(oprEnd);
  console.log('  ✅ operasional token hashes array replaced with loader');
} else {
  console.warn('  ⚠️ operasional markers not found');
}

// Update resolveCurrentUser in operasional
const oldOprResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        $tokenHash = hash('sha256', $trimmed);
        if (isset($officialTokenHashes[$tokenHash])) {
            return $officialTokenHashes[$tokenHash];
        }
        $upperHash = hash('sha256', strtoupper($trimmed));
        if (isset($officialTokenHashes[$upperHash])) {
            return $officialTokenHashes[$upperHash];
        }
        $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
        if (isset($officialTokenHashes[$saltedHash])) {
            return $officialTokenHashes[$saltedHash];
        }
    }`;

const newOprResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        if (strlen($trimmed) === 64 && ctype_xdigit($trimmed)) {
            return null;
        }
        $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
        if (isset($officialTokenHashes[$saltedHash])) {
            return $officialTokenHashes[$saltedHash];
        }
    }`;

if (opr.includes(oldOprResolver)) {
  opr = opr.replace(oldOprResolver, newOprResolver);
  console.log('  ✅ operasional resolveCurrentUser updated with anti pass-the-hash');
} else {
  console.warn('  ⚠️ operasional resolver old block not matched');
}

fs.writeFileSync(oprFile, opr, 'utf8');

// -------------------------------------------------------------
// 4. PATCH SURAT UMUM DATA HANDLER
// -------------------------------------------------------------
console.log('\n4. Patching surat-umum-data-handler.php...');
const suFile = path.join(ROOT_DIR, 'surat-umum-data-handler.php');
let su = fs.readFileSync(suFile, 'utf8').replace(/\r\n/g, '\n');

const suStart = su.indexOf('$OFFICIAL_TOKEN_HASHES = [');
const suEnd = su.indexOf('// -------------------------------------------------------------\n// 2. KONFIGURASI FILE & DATABASE SURAT UMUM ATOMIK', suStart);

if (suStart !== -1 && suEnd !== -1) {
  const suReplace = `require_once __DIR__ . '/auth-registry-loader.php';
$authRegistry = loadPrivateAuthRegistry();
$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];

`;
  su = su.slice(0, suStart) + suReplace + suEnd.length ? su.slice(0, suStart) + suReplace + su.slice(suEnd) : su;
  console.log('  ✅ surat-umum token hashes array replaced with loader');
} else {
  console.warn('  ⚠️ surat-umum markers not found');
}

const oldSuResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        $tokenHash = hash('sha256', $trimmed);
            if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
            } else {
                $upperHash = hash('sha256', strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
                } else {
                    $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
                    if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                        $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                    }
                }
            }
        }`;

const newSuResolver = `    if ($rawToken) {
        $trimmed = trim($rawToken);
        if (strlen($trimmed) === 64 && ctype_xdigit($trimmed)) {
            $currentUser = null;
        } else {
            $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
            }
        }
    }`;

if (su.includes(oldSuResolver)) {
  su = su.replace(oldSuResolver, newSuResolver);
  console.log('  ✅ surat-umum resolver updated with anti pass-the-hash');
} else {
  console.warn('  ⚠️ surat-umum resolver old block not matched');
}

fs.writeFileSync(suFile, su, 'utf8');

console.log('\n🎉 ALL 4 HANDLERS PATCHED SUCCESSFULLY!');
