import fs from 'fs';

console.log('=== MEMULAI PENERAPAN P0 SAFETY LOCK & SESSION SECURITY ===');

// =============================================================================
// 1. AUTH-HANDLER.PHP — SERVER-SIDE SESSION REGISTRY & LOGOUT REVOCATION
// =============================================================================
let auth = fs.readFileSync('auth-handler.php', 'utf8');

// A. Sisipkan fungsi manajemen sesi server
const sessionMgmtCode = `
// -------------------------------------------------------------
// MANAJEMEN SESI SERVER TERLINDUNGI & PENCABUTAN LOGOUT ATOMIK
// -------------------------------------------------------------
$sessionsDir = __DIR__ . '/data/sessions';
if (!is_dir($sessionsDir)) {
    @mkdir($sessionsDir, 0755, true);
    @file_put_contents($sessionsDir . '/.htaccess', "Require all denied\\nDeny from all\\n");
}
$sessionsFile = $sessionsDir . '/active_sessions.json';

function simpanSesiServer($sessionsFile, $sessionToken, $userData, $expiresAt) {
    if (!$sessionToken) return;
    $fp = @fopen($sessionsFile . '.lock', 'c+');
    if ($fp && @flock($fp, LOCK_EX)) {
        $data = file_exists($sessionsFile) ? (json_decode(@file_get_contents($sessionsFile), true) ?: []) : [];
        $now = time();
        foreach ($data as $t => $s) {
            if (($s['expiresAt'] ?? 0) < $now * 1000) {
                unset($data[$t]);
            }
        }
        $data[$sessionToken] = [
            'user'      => $userData,
            'createdAt' => $now,
            'expiresAt' => $expiresAt,
            'ip'        => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ];
        @file_put_contents($sessionsFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }
}

function cabutSesiServer($sessionsFile, $sessionToken = null) {
    $fp = @fopen($sessionsFile . '.lock', 'c+');
    if ($fp && @flock($fp, LOCK_EX)) {
        $data = file_exists($sessionsFile) ? (json_decode(@file_get_contents($sessionsFile), true) ?: []) : [];
        if ($sessionToken && isset($data[$sessionToken])) {
            unset($data[$sessionToken]);
        }
        if (!empty($_SESSION['nsr_session_token']) && isset($data[$_SESSION['nsr_session_token']])) {
            unset($data[$_SESSION['nsr_session_token']]);
        }
        @file_put_contents($sessionsFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
        @flock($fp, LOCK_UN);
        @fclose($fp);
    }
}

function verifikasiSesiServer($sessionsFile, $sessionToken) {
    if (!$sessionToken || !file_exists($sessionsFile)) return null;
    $data = json_decode(@file_get_contents($sessionsFile), true);
    if (!is_array($data) || !isset($data[$sessionToken])) return null;
    $sess = $data[$sessionToken];
    if (($sess['expiresAt'] ?? 0) < time() * 1000) {
        return null;
    }
    return $sess['user'] ?? null;
}
`;

if (!auth.includes('simpanSesiServer(')) {
  const routerIdx = auth.indexOf('// 3. DETEKSI ACTION ROUTING');
  if (routerIdx !== -1) {
    auth = auth.slice(0, routerIdx) + sessionMgmtCode + '\n' + auth.slice(routerIdx);
  }
}

// B. Perbarui action === 'token' agar menyimpan sesi server
const tokenSaveAnchor = `$_SESSION['nsr_session_token'] = $sessionToken;`;
if (auth.includes(tokenSaveAnchor)) {
  auth = auth.replaceAll(tokenSaveAnchor, `$_SESSION['nsr_session_token'] = $sessionToken;\n        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);`);
}

// C. Perbarui action === 'verify' agar mengecek sesi server
const verifyAnchor = `if ($action === 'verify') {
    // 1. Sesi PHP
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        if (time() - $loginTime < 28800) {
            $user = $_SESSION['nsr_user'];`;

const verifyReplacement = `if ($action === 'verify') {
    // 1. Sesi PHP Aktif & Belum Dicabut
    if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
        $loginTime = $_SESSION['nsr_login_time'] ?? 0;
        $sessToken = $_SESSION['nsr_session_token'] ?? null;
        $isValidSess = true;
        if ($sessToken && file_exists($sessionsFile)) {
            $isValidSess = (verifikasiSesiServer($sessionsFile, $sessToken) !== null);
        }
        if ($isValidSess && (time() - $loginTime < 28800)) {
            $user = $_SESSION['nsr_user'];`;

if (auth.includes(verifyAnchor)) {
  auth = auth.replace(verifyAnchor, verifyReplacement);
}

// C2. Dukung verifikasi via header X-NSR-Session-Token pada action === 'verify'
const verifyBearerAnchor = `// 2. Bearer token / X-NSR-Token`;
const verifySessionTokenBlock = `// 2. Cek Session Token Server
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

    // 3. Bearer token / X-NSR-Token`;

if (auth.includes(verifyBearerAnchor)) {
  auth = auth.replace(verifyBearerAnchor, verifySessionTokenBlock);
}

// D. Perbarui action === 'logout' agar mencabut sesi server
const logoutAnchor = `if ($action === 'logout') {
    $_SESSION = [];`;

const logoutReplacement = `if ($action === 'logout') {
    $incomingSessionToken = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? $_SERVER['HTTP_X_NSR_TOKEN'] ?? ($body['sessionToken'] ?? ''));
    cabutSesiServer($sessionsFile, $incomingSessionToken);
    $_SESSION = [];`;

if (auth.includes(logoutAnchor)) {
  auth = auth.replace(logoutAnchor, logoutReplacement);
}

fs.writeFileSync('auth-handler.php', auth, 'utf8');
console.log('✔ auth-handler.php berhasil diperbarui dengan manajemen sesi server terlindungi.');


// =============================================================================
// 2. NOLAP-DATA-HANDLER.PHP — KODE INDUSTRI MASTER 01-12, NPWP DINAMIS,
//    SESSION CHECK & KONTROL DUPLIKASI KOREKSI BOOKING
// =============================================================================
let nolap = fs.readFileSync('nolap-data-handler.php', 'utf8');

// A. Sisipkan fungsi verifikasi sesi server di nolap-data-handler.php
const nolapSessionVerifyFunc = `
$sessionsDir = __DIR__ . '/data/sessions';
$sessionsFile = $sessionsDir . '/active_sessions.json';

function verifikasiSesiServerNoLap($sessionsFile, $sessionToken) {
    if (!$sessionToken || !file_exists($sessionsFile)) return null;
    $data = json_decode(@file_get_contents($sessionsFile), true);
    if (!is_array($data) || !isset($data[$sessionToken])) return null;
    $sess = $data[$sessionToken];
    if (($sess['expiresAt'] ?? 0) < time() * 1000) {
        return null;
    }
    return $sess['user'] ?? null;
}
`;

if (!nolap.includes('verifikasiSesiServerNoLap(')) {
  const anchorSess = `// 2. VERIFIKASI AUTENTIKASI PENGGUNA (FAIL-CLOSED)`;
  nolap = nolap.replace(anchorSess, nolapSessionVerifyFunc + '\n' + anchorSess);
}

// B. Perbarui verifikasi sesi di nolap-data-handler.php
const nolapAuthAnchor = `// A. Dari Sesi PHP (NSR_SESSION)
if (isset($_SESSION['nsr_user']) && is_array($_SESSION['nsr_user'])) {
    $loginTime = $_SESSION['nsr_login_time'] ?? 0;
    if (time() - $loginTime < 28800) {
        $currentUser = $_SESSION['nsr_user'];
    }
}`;

const nolapAuthReplacement = `// A. Dari Sesi PHP (NSR_SESSION) yang belum dicabut
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
}`;

if (nolap.includes(nolapAuthAnchor)) {
  nolap = nolap.replace(nolapAuthAnchor, nolapAuthReplacement);
}

// B2. Dukung autentikasi session token via header
const nolapCustomTokenAnchor = `// C. Dari Header X-NSR-Token
if (!$currentUser) {
    $customToken = $_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? $_GET['token'] ?? '';`;

const nolapCustomTokenReplacement = `// C. Dari Header X-NSR-Session-Token atau X-NSR-Token
if (!$currentUser) {
    $sessionHdr = trim($_SERVER['HTTP_X_NSR_SESSION_TOKEN'] ?? '');
    if ($sessionHdr && ($userFromSess = verifikasiSesiServerNoLap($sessionsFile, $sessionHdr))) {
        $currentUser = $userFromSess;
    }
}
if (!$currentUser) {
    $customToken = $_SERVER['HTTP_X_NSR_TOKEN'] ?? $_SERVER['HTTP_X_INTERNAL_TOKEN'] ?? $_GET['token'] ?? '';
    if ($customToken && ($userFromSess = verifikasiSesiServerNoLap($sessionsFile, trim($customToken)))) {
        $currentUser = $userFromSess;
    }`;

if (nolap.includes(nolapCustomTokenAnchor)) {
  nolap = nolap.replace(nolapCustomTokenAnchor, nolapCustomTokenReplacement);
}

// C. Perbaiki resolveKodeIndustri: HAPUS TOTAL FALLBACK DIAM-DIAM KE '07'
const oldResolveIndustri = `function resolveKodeIndustri($inputKode) {
    $clean = str_pad(preg_replace('/\\D/', '', (string)$inputKode), 2, '0', STR_PAD_LEFT);
    $intVal = (int)$clean;
    if ($intVal >= 1 && $intVal <= 12) {
        return $clean;
    }
    return '07'; // Default Sektor 07 Perbankan KJPP NSR
}`;

const newResolveIndustri = `function resolveKodeIndustri($inputKode) {
    if ($inputKode === null || trim((string)$inputKode) === '' || trim((string)$inputKode) === '--') {
        return null;
    }
    $clean = str_pad(preg_replace('/\\D/', '', (string)$inputKode), 2, '0', STR_PAD_LEFT);
    $intVal = (int)$clean;
    if ($intVal >= 1 && $intVal <= 12) {
        return $clean;
    }
    return null; // DILARANG KERAS FALLBACK DIAM-DIAM KE '07'! Harus null jika di luar rentang master 01-12.
}

function resolveKodeNpwpKlien($npwpRaw, $statusNpwp = '') {
    if ($npwpRaw === '1' || $npwpRaw === 1 || $statusNpwp === 'BER_NPWP' || $statusNpwp === '1') {
        return '1';
    }
    if ($npwpRaw === '0' || $npwpRaw === 0 || $statusNpwp === 'NON_NPWP' || $statusNpwp === '0') {
        return '0';
    }
    if ($npwpRaw !== null && trim((string)$npwpRaw) !== '' && trim((string)$npwpRaw) !== '-') {
        $str = strtolower(trim((string)$npwpRaw));
        if (strpos($str, 'non') !== false || strpos($str, 'tidak') !== false || strpos($str, 'tanpa') !== false) {
            return '0';
        }
        $cleanDigits = preg_replace('/\\D/', '', (string)$npwpRaw);
        if (strlen($cleanDigits) >= 10) {
            return '1';
        }
    }
    return '0';
}`;

if (nolap.includes(oldResolveIndustri)) {
  nolap = nolap.replace(oldResolveIndustri, newResolveIndustri);
}

// D. Perbaiki generator issueDefinitiveNoLap: Hapus hardcoded '/1/' dan fallback industri
const oldDefinitiveGen = `$targetSektor = resolveKodeIndustri($dgRecords[$targetIdx]['penugasan']['kodeIndustri'] ?? '07');
            // P0 COMPLIANCE: Segmen 3 HANYA boleh PI, BS, atau PP (Dilarang keras PS!)
            if ($reportServiceCode === 'PS') { $reportServiceCode = 'PI'; }
            $noDefinitif = "{$seq}/{$signingCode}/{$reportServiceCode}/{$targetSektor}/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');`;

const newDefinitiveGen = `$rawInd = $dgRecords[$targetIdx]['penugasan']['kodeIndustri'] ?? ($dgRecords[$targetIdx]['kodeIndustri'] ?? '');
            $targetSektor = resolveKodeIndustri($rawInd);
            if (!$targetSektor) {
                if (isset($fpLock) && $fpLock) { flock($fpLock, LOCK_UN); fclose($fpLock); }
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'error' => "Validasi Kode Industri Gagal: Kode sektor industri penugasan ('{$rawInd}') tidak valid atau kosong. Wajib dipilih dari master 01-12.",
                    'violation' => 'INVALID_OR_MISSING_INDUSTRY_CODE'
                ]);
                exit;
            }
            // P0 COMPLIANCE: Segmen 3 HANYA boleh PI, BS, atau PP (Dilarang keras PS!)
            if ($reportServiceCode === 'PS') { $reportServiceCode = 'PI'; }
            // P0 KODE NPWP: Segmen 6 wajib bernilai '1' atau '0' dinamis dari status NPWP terverifikasi
            $rawNpwp = $dgRecords[$targetIdx]['klien']['npwp'] ?? ($dgRecords[$targetIdx]['npwp'] ?? ($dgRecords[$targetIdx]['penugasan']['kodeNpwp'] ?? ($dgRecords[$targetIdx]['penugasan']['npwp'] ?? '')));
            $stNpwp = $dgRecords[$targetIdx]['klien']['statusNpwp'] ?? ($dgRecords[$targetIdx]['penugasan']['statusNpwp'] ?? '');
            $targetKodeNpwp = resolveKodeNpwpKlien($rawNpwp, $stNpwp);
            $noDefinitif = "{$seq}/{$signingCode}/{$reportServiceCode}/{$targetSektor}/{$penilaiIzin}/{$targetKodeNpwp}/{$romawiBulan}/" . date('Y');`;

if (nolap.includes(oldDefinitiveGen)) {
  nolap = nolap.replace(oldDefinitiveGen, newDefinitiveGen);
}

// E. Validasi Wajib Kode Industri pada submitRequest
const submitReqAnchor = `// P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)`;
const submitReqIndustriCheck = `// Validasi Wajib Sektor Industri Master 01-12 (Anti-Silent-Fallback)
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

if (nolap.includes(submitReqAnchor) && !nolap.includes('cleanIndReq = resolveKodeIndustri')) {
  nolap = nolap.replace(submitReqAnchor, submitReqIndustriCheck);
}

// F. Validasi Wajib Kode Industri pada submitGerbang1Awal
const g1Anchor = `// P0 HOTFIX: Validasi Mandatory & Snapshot Kontak Pengaju Manual (Anti-Autofill)`;
const g1IndustriCheck = `// Validasi Wajib Sektor Industri Master 01-12 pada Gerbang 1
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

        // P0 HOTFIX: Validasi Mandatory & Snapshot Kontak Pengaju Manual (Anti-Autofill)`;

if (nolap.includes(g1Anchor) && !nolap.includes('cleanIndG1 = resolveKodeIndustri')) {
  nolap = nolap.replace(g1Anchor, g1IndustriCheck);
}

// G. Validasi Segmen 4 (Industri) pada approveRequest
const approveSegCheckAnchor = `// Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1' (Kode NPWP Klien)
        $segsNoLap = explode('/', $noLap);
        if (count($segsNoLap) >= 7) {
            $seg6 = trim($segsNoLap[5] ?? '');`;

const approveSegCheckReplacement = `// Validasi Kepatuhan SE-6/PPPK/2018: Segmen 4 (Industri 01-12) & Segmen 6 (NPWP 0/1)
        $segsNoLap = explode('/', $noLap);
        if (count($segsNoLap) >= 7) {
            $seg4 = trim($segsNoLap[3] ?? '');
            $validIndSeg4 = resolveKodeIndustri($seg4);
            if (!$validIndSeg4) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'error' => "Format nomor laporan '{$noLap}' tidak memenuhi ketentuan: Segmen ke-4 adalah Kode Industri ('{$seg4}') dan wajib bernilai '01' s/d '12' sesuai Master Baku Sektor Industri.",
                    'violation' => 'INVALID_SEGMENT_4_INDUSTRY_CODE'
                ]);
                exit;
            }
            $seg6 = trim($segsNoLap[5] ?? '');`;

if (nolap.includes(approveSegCheckAnchor)) {
  nolap = nolap.replace(approveSegCheckAnchor, approveSegCheckReplacement);
}

// H. Pengendalian Koreksi Periode Booking: Kontrol Duplikasi, Persetujuan, Rekonsiliasi & Audit
const oldBookingRevision = `if (!empty($payload['revisiPeriodeBulanResmi']) && in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
                    // Prosedur koreksi resmi oleh Admin Pusat jika disyaratkan instansi klien
                    $oldNo = $records[$targetIndex]['nomorLaporan'];
                    $segsCurrentNo[6] = $bulanRomawiLaporan;
                    $segsCurrentNo[7] = $tahunLaporan;
                    $newNo = implode('/', $segsCurrentNo);
                    $records[$targetIndex]['nomorLaporan'] = $newNo;
                    if (!isset($records[$targetIndex]['auditTrailKoreksiBulan'])) {
                        $records[$targetIndex]['auditTrailKoreksiBulan'] = [];
                    }
                    $records[$targetIndex]['auditTrailKoreksiBulan'][] = [
                        'waktu' => date('c'),
                        'user' => $currentUser['nama'] ?? $userRole,
                        'nomorSebelumnya' => $oldNo,
                        'nomorBaru' => $newNo,
                        'alasan' => $payload['alasanKoreksi'] ?? 'Penyesuaian resmi segmen bulan pelaporan SE-6/PPPK/2018'
                    ];
                }`;

const newBookingRevision = `if (!empty($payload['revisiPeriodeBulanResmi'])) {
                    // 1. OTORISASI: Wajib Admin Pusat atau SUPER ADMIN (KING)
                    if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
                        http_response_code(403);
                        echo json_encode([
                            'success' => false,
                            'error' => 'Akses Ditolak: Koreksi periode nomor laporan booking hanya dapat dilakukan atas otorisasi resmi Admin Pusat atau SUPER ADMIN.',
                            'violation' => 'UNAUTHORIZED_BOOKING_PERIOD_REVISION'
                        ]);
                        exit;
                    }

                    // 2. JUSTIFIKASI: Alasan koreksi wajib diisi
                    $alasanKoreksi = trim($payload['alasanKoreksi'] ?? '');
                    if (empty($alasanKoreksi) || strlen($alasanKoreksi) < 8) {
                        http_response_code(422);
                        echo json_encode([
                            'success' => false,
                            'error' => 'Koreksi nomor ditolak: Alasan justifikasi koreksi periode nomor booking wajib diisi lengkap (minimal 8 karakter).',
                            'violation' => 'MISSING_REVISION_JUSTIFICATION'
                        ]);
                        exit;
                    }

                    $oldNo = $records[$targetIndex]['nomorLaporan'];
                    $segsCurrentNo[6] = $bulanRomawiLaporan;
                    $segsCurrentNo[7] = $tahunLaporan;
                    $newNo = implode('/', $segsCurrentNo);

                    // 3. KONTROL DUPLIKASI KETAT: Periksa apakah nomor baru sudah digunakan record lain
                    $isDuplicateNewNo = false;
                    $conflictOwner = '';
                    foreach ($records as $checkIdx => $chkRec) {
                        if ($checkIdx !== $targetIndex &&
                            !empty($chkRec['nomorLaporan']) &&
                            strcasecmp(trim($chkRec['nomorLaporan']), $newNo) === 0 &&
                            ($chkRec['status'] ?? '') !== 'VOID' && ($chkRec['status'] ?? '') !== 'DIBATALKAN') {
                            $isDuplicateNewNo = true;
                            $conflictOwner = $chkRec['noPermintaan'] ?? 'Permohonan Lain';
                            break;
                        }
                    }
                    if (!$isDuplicateNewNo && file_exists($dualGateDbFile)) {
                        $dgDataCheck = json_decode(@file_get_contents($dualGateDbFile), true) ?: [];
                        foreach ($dgDataCheck as $dgItem) {
                            $dgDef = trim($dgItem['finalisasi']['nomorLaporanDefinitif'] ?? '');
                            if ($dgDef !== '' && strcasecmp($dgDef, $newNo) === 0 && ($dgItem['idPenugasan'] ?? '') !== ($records[$targetIndex]['idPenugasan'] ?? '')) {
                                $isDuplicateNewNo = true;
                                $conflictOwner = $dgItem['idPenugasan'] ?? 'Dual Gate';
                                break;
                            }
                        }
                    }

                    if ($isDuplicateNewNo) {
                        http_response_code(409);
                        echo json_encode([
                            'success' => false,
                            'error' => "Koreksi periode nomor booking ditolak: Nomor '{$newNo}' sudah terdaftar pada dokumen {$conflictOwner}. Blokir anti-duplikasi aktif.",
                            'violation' => 'DUPLICATE_BOOKING_PERIOD_REVISION'
                        ]);
                        exit;
                    }

                    // 4. REKONSILIASI DUAL GATE DATABASE (jika ada hubungan record)
                    if (file_exists($dualGateDbFile)) {
                        $dgData = json_decode(@file_get_contents($dualGateDbFile), true) ?: [];
                        $dgUpdated = false;
                        foreach ($dgData as &$dgItem) {
                            if (($dgItem['idPenugasan'] ?? '') === ($records[$targetIndex]['idPenugasan'] ?? '') ||
                                ($dgItem['noPermintaan'] ?? '') === ($records[$targetIndex]['noPermintaan'] ?? '')) {
                                $dgItem['finalisasi']['nomorLaporanDefinitif'] = $newNo;
                                $dgItem['finalisasi']['nomorSebelumnya'] = $oldNo;
                                $dgUpdated = true;
                            }
                        }
                        if ($dgUpdated) {
                            @file_put_contents($dualGateDbFile, json_encode($dgData, JSON_PRETTY_PRINT), LOCK_EX);
                        }
                    }

                    // 5. PENETAPAN & AUDIT TRAIL RESMI
                    $records[$targetIndex]['nomorLaporan'] = $newNo;
                    if (!isset($records[$targetIndex]['auditTrailKoreksiBulan'])) {
                        $records[$targetIndex]['auditTrailKoreksiBulan'] = [];
                    }
                    $records[$targetIndex]['auditTrailKoreksiBulan'][] = [
                        'waktu'           => date('c'),
                        'user'            => $currentUser['nama'] ?? $userDisplayName,
                        'role'            => $userRole,
                        'nomorSebelumnya' => $oldNo,
                        'nomorBaru'       => $newNo,
                        'tglLaporanInput' => $tglLaporanInput,
                        'alasan'          => $alasanKoreksi,
                        'approval'        => 'DISETUJUI_ADMIN_PUSAT',
                        'reconciliation'  => 'SYNCHRONIZED_DUAL_GATE'
                    ];
                }`;

if (nolap.includes(oldBookingRevision)) {
  nolap = nolap.replace(oldBookingRevision, newBookingRevision);
}

fs.writeFileSync('nolap-data-handler.php', nolap, 'utf8');
console.log('✔ nolap-data-handler.php berhasil diperbarui dengan validasi industri 01-12, NPWP dinamis, session check, dan audit koreksi booking.');


// =============================================================================
// 3. PORTAL-NOLAP.HTML — SELECT SEKTOR INDUSTRI WAJIB, PREVIEW TANPA 07 FALLBACK,
//    KODE NPWP DINAMIS, DAN SESSION TOKEN HEADER
// =============================================================================
let pNolap = fs.readFileSync('portal-nolap.html', 'utf8');

// A. Update dropdown Sektor Industri agar default kosong mandatory
const oldSelectInd = `<select id="f-industri" onchange="updateLivePreview()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="07" selected>07 — Sektor Keuangan - Perbankan</option>`;

const newSelectInd = `<select id="f-industri" onchange="updateLivePreview()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="" disabled selected>-- Pilih Sektor Industri (01–12) * --</option>
                <option value="07">07 — Sektor Keuangan - Perbankan</option>`;

if (pNolap.includes(oldSelectInd)) {
  pNolap = pNolap.replace(oldSelectInd, newSelectInd);
}

// B. Update updateLivePreview agar tidak fallback diam-diam ke '07'
const oldPreviewInd = `const elIndustri = document.getElementById('f-industri');
      const rawIndustri = elIndustri?.value || "07";
      const cleanInd = String(rawIndustri).replace(/\\D/g, '').padStart(2, '0');
      const numInd = parseInt(cleanInd, 10);
      const kodeIndustri = (numInd >= 1 && numInd <= 12) ? cleanInd : "07";`;

const newPreviewInd = `const elIndustri = document.getElementById('f-industri');
      const rawIndustri = elIndustri?.value ? elIndustri.value.trim() : "";
      let kodeIndustri = "--";
      if (rawIndustri) {
        const cleanInd = String(rawIndustri).replace(/\\D/g, '').padStart(2, '0');
        const numInd = parseInt(cleanInd, 10);
        if (numInd >= 1 && numInd <= 12) {
          kodeIndustri = cleanInd;
        }
      }`;

if (pNolap.includes(oldPreviewInd)) {
  pNolap = pNolap.replace(oldPreviewInd, newPreviewInd);
}

// C. Validasi Wajib Sektor Industri pada saat submit pengajuan
const simpanPengajuanAnchor = `async function simpanPengajuan(isBooking = false) {`;
const simpanPengajuanCheck = `async function simpanPengajuan(isBooking = false) {
      const valIndustri = document.getElementById('f-industri')?.value;
      if (!valIndustri || valIndustri === '' || valIndustri === '--') {
        alert('⚠️ Sektor Industri Wajib Dipilih!\\n\\nSilakan pilih salah satu Sektor Industri resmi Kemenkeu (01–12) sebelum mengajukan permohonan.');
        document.getElementById('f-industri')?.focus();
        return;
      }`;

if (pNolap.includes(simpanPengajuanAnchor) && !pNolap.includes('Sektor Industri Wajib Dipilih!')) {
  pNolap = pNolap.replace(simpanPengajuanAnchor, simpanPengajuanCheck);
}

// D. Hentikan pembacaan token mentah NSR_AUTH_TOKEN di portal-nolap.html
pNolap = pNolap.replaceAll(
  `const tokenVal = (sesiAktif && (sesiAktif.token || sesiAktif.tokenHash)) ? (sesiAktif.token || sesiAktif.tokenHash) : (sessionStorage.getItem('NSR_AUTH_TOKEN') || '');`,
  `const sessionTokenVal = (sesiAktif && sesiAktif.sessionToken) ? sesiAktif.sessionToken : (sessionStorage.getItem('NSR_SESSION_TOKEN') || '');`
);

pNolap = pNolap.replaceAll(`...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})`, `...(sessionTokenVal ? { 'X-NSR-Session-Token': sessionTokenVal } : {})`);
pNolap = pNolap.replaceAll(`'X-NSR-Token': auth?.token || auth?.sessionToken || ''`, `'X-NSR-Session-Token': auth?.sessionToken || ''`);
pNolap = pNolap.replaceAll(`'X-NSR-Token': auth?.token || auth?.sessionToken || reauthKey`, `'X-NSR-Session-Token': auth?.sessionToken || ''`);

fs.writeFileSync('portal-nolap.html', pNolap, 'utf8');
console.log('✔ portal-nolap.html berhasil diperbarui dengan validasi sektor industri dan session token header.');


// =============================================================================
// 4. PORTAL-NOLAP-CABANG.HTML — KODE NPWP DINAMIS (DILARANG HARDCODE '/1/')
// =============================================================================
let pCabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');

const oldCabangGen = `const formatDefinitif = seqDefinitif + '/' + kodeKantor + '/' + jenisJasa + '/' + industri + '/' + izinRekan + '/1/' + romawi + '/' + thn;`;
const newCabangGen = `const inpNpwp = document.getElementById('pemberi_tugas_npwp')?.value.trim() || '';
      let kodeNpwp = '0';
      if (inpNpwp && inpNpwp !== '-' && !inpNpwp.toLowerCase().includes('non') && !inpNpwp.toLowerCase().includes('tidak')) {
        const cleanDigits = inpNpwp.replace(/\\D/g, '');
        kodeNpwp = cleanDigits.length >= 10 ? '1' : '0';
      }
      const formatDefinitif = seqDefinitif + '/' + kodeKantor + '/' + jenisJasa + '/' + industri + '/' + izinRekan + '/' + kodeNpwp + '/' + romawi + '/' + thn;`;

if (pCabang.includes(oldCabangGen)) {
  pCabang = pCabang.replace(oldCabangGen, newCabangGen);
}

fs.writeFileSync('portal-nolap-cabang.html', pCabang, 'utf8');
console.log('✔ portal-nolap-cabang.html berhasil diperbarui dengan penomoran segmen NPWP dinamis.');


// =============================================================================
// 5. LIB/OPINI-NSR-MODAL-ENGINE.JS & PORTALS — PEMBERSIHAN TOKEN MENTAH & LOGOUT SERVER
// =============================================================================
let engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');

// Simpan sessionToken (acak) dan bukan token mentah
const engineSaveAnchor = `sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeProfile));`;
const engineSaveReplacement = `if (auth.sessionToken) {
        sessionStorage.setItem('NSR_SESSION_TOKEN', auth.sessionToken);
      }
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeProfile));`;

if (engine.includes(engineSaveAnchor) && !engine.includes('NSR_SESSION_TOKEN')) {
  engine = engine.replace(engineSaveAnchor, engineSaveReplacement);
}

// Perbarui logout agar menyertakan sessionToken ke /api/auth-logout
const engineLogoutAnchor = `await fetch('/api/auth-logout', {
        method: 'POST',
        credentials: 'include'
      });`;

const engineLogoutReplacement = `const currentSessToken = sessionStorage.getItem('NSR_SESSION_TOKEN') || '';
      await fetch('/api/auth-logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(currentSessToken ? { 'X-NSR-Session-Token': currentSessToken } : {})
        },
        body: JSON.stringify({ sessionToken: currentSessToken })
      });`;

if (engine.includes(engineLogoutAnchor)) {
  engine = engine.replace(engineLogoutAnchor, engineLogoutReplacement);
}

fs.writeFileSync('lib/opini-nsr-modal-engine.js', engine, 'utf8');
console.log('✔ lib/opini-nsr-modal-engine.js berhasil diperbarui dengan pengelolaan session token steril.');

// Perbarui portal-kwitansi.html & portal-penugasan-jo.html untuk membaca NSR_SESSION_TOKEN
let pKwitansi = fs.readFileSync('portal-kwitansi.html', 'utf8');
pKwitansi = pKwitansi.replaceAll(`sessionStorage.getItem('NSR_AUTH_TOKEN')`, `sessionStorage.getItem('NSR_SESSION_TOKEN')`);
fs.writeFileSync('portal-kwitansi.html', pKwitansi, 'utf8');

let pJo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
pJo = pJo.replaceAll(`sessionStorage.getItem('NSR_AUTH_TOKEN')`, `sessionStorage.getItem('NSR_SESSION_TOKEN')`);
fs.writeFileSync('portal-penugasan-jo.html', pJo, 'utf8');

console.log('=== SEMUA PENERAPAN P0 SAFETY LOCK SELESAI DENGAN SUKSES ===');
