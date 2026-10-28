import fs from 'fs';

console.log('--- PATCHING NOLAP-DATA-HANDLER.PHP AND AUTH-HANDLER.PHP ---');

// 1. Patch auth-handler.php
let authContent = fs.readFileSync('auth-handler.php', 'utf8');

// Update Padang: 2.0160-02
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-01'/g, "'kodeKemenkeu'      => '2.0160-02'");
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.19\.0160-01'/g, "'kodeKemenkeu'      => '2.0160-02'");

// Update Makassar: 2.0160-03
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-02'/g, "'kodeKemenkeu'      => '2.0160-03'");
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.19\.0160-02'/g, "'kodeKemenkeu'      => '2.0160-03'");

// Update Palembang: 2.0160-05
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-03'/g, "'kodeKemenkeu'      => '2.0160-05'");
authContent = authContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.19\.0160-03'/g, "'kodeKemenkeu'      => '2.0160-05'");

fs.writeFileSync('auth-handler.php', authContent, 'utf8');
console.log('auth-handler.php successfully updated with official branch codes!');

// 2. Patch kwitansi-data-handler.php
let kwitansiContent = fs.readFileSync('kwitansi-data-handler.php', 'utf8');
kwitansiContent = kwitansiContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-01'/g, "'kodeKemenkeu'      => '2.0160-02'");
kwitansiContent = kwitansiContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-02'/g, "'kodeKemenkeu'      => '2.0160-03'");
kwitansiContent = kwitansiContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-03'/g, "'kodeKemenkeu'      => '2.0160-05'");
fs.writeFileSync('kwitansi-data-handler.php', kwitansiContent, 'utf8');
console.log('kwitansi-data-handler.php updated!');

// 3. Patch nolap-data-handler.php
let nolapContent = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Update Padang token kodeKemenkeu
nolapContent = nolapContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-01'/g, "'kodeKemenkeu'      => '2.0160-02'");
// Update Makassar token kodeKemenkeu
nolapContent = nolapContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-02'/g, "'kodeKemenkeu'      => '2.0160-03'");
// Update Palembang token kodeKemenkeu
nolapContent = nolapContent.replace(/'kodeKemenkeu'\s*=>\s*'2\.0160-03'/g, "'kodeKemenkeu'      => '2.0160-05'");

// Update $OFFICIAL_BRANCH_CODES
const oldBranchCodesBlock = `$OFFICIAL_BRANCH_CODES = [
    'Pusat'     => '2.0160-00',
    'Padang'    => '2.0160-01',
    'Makassar'  => '2.0160-02',
    'Palembang' => '2.0160-03',
    'Bandung'   => '2.0160-04'
];`;

const newBranchCodesBlock = `$OFFICIAL_BRANCH_CODES = [
    'Pusat'     => '2.0160-00',
    'Padang'    => '2.0160-02',
    'Makassar'  => '2.0160-03',
    'Bandung'   => '2.0160-04',
    'Palembang' => '2.0160-05'
];

$registerConfigFile = $dataDir . '/official_register_config.json';
$registerAuditFile  = $dataDir . '/register_audit_logs.json';

function muatRegisterConfig($file) {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    return json_decode($raw, true) ?: [];
}

function simpanRegisterConfig($file, $registers) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $fp = fopen($file, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($registers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
    return false;
}

function catatRegisterAuditLog($auditFile, $entry) {
    $dir = dirname($auditFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $logs = [];
    if (file_exists($auditFile)) {
        $logs = json_decode(@file_get_contents($auditFile), true) ?: [];
    }
    $logs[] = $entry;
    $fp = fopen($auditFile, 'c+');
    if ($fp && flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}`;

if (nolapContent.includes(oldBranchCodesBlock)) {
  nolapContent = nolapContent.replace(oldBranchCodesBlock, newBranchCodesBlock);
} else {
  console.log('Old branch codes block not found exact, doing regex replacement...');
  nolapContent = nolapContent.replace(/\$OFFICIAL_BRANCH_CODES\s*=\s*\[[\s\S]*?\];/, newBranchCodesBlock);
}

// Tambahkan GET action untuk getOfficialRegisters dan suggestNextNumber
const getQueueAdminAnchor = `if ($actionGet === 'getQueueAdminPusat') {`;
const newGetActions = `if ($actionGet === 'getOfficialRegisters') {
        $regList = muatRegisterConfig($registerConfigFile);
        $auditLogs = file_exists($registerAuditFile) ? (json_decode(file_get_contents($registerAuditFile), true) ?: []) : [];

        if (in_array($userRole, ['SUPER_ADMIN', 'ADMIN_PUSAT'], true)) {
            echo json_encode([
                'success' => true,
                'role' => $userRole,
                'canEdit' => true,
                'total' => count($regList),
                'registers' => $regList,
                'auditLogs' => $auditLogs
            ]);
            exit;
        }

        if (in_array($userRole, ['ADMIN_CABANG', 'CABANG'], true)) {
            $filtered = array_values(array_filter($regList, function($r) use ($userBranch) {
                return strcasecmp($r['kantor'] ?? '', $userBranch) === 0;
            }));
            echo json_encode([
                'success' => true,
                'role' => $userRole,
                'branch' => $userBranch,
                'canEdit' => false,
                'readOnly' => true,
                'total' => count($filtered),
                'registers' => $filtered,
                'auditLogs' => []
            ]);
            exit;
        }

        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Akses ditolak melihat data register resmi.']);
        exit;
    }

    if ($actionGet === 'suggestNextNumber') {
        $targetKantor = trim($_GET['kantor'] ?? 'Pusat');
        $targetJenis = trim($_GET['jenisDokumen'] ?? 'NoLap');
        $targetPeriode = trim($_GET['periode'] ?? date('Y'));

        $regList = muatRegisterConfig($registerConfigFile);
        $found = null;
        foreach ($regList as $r) {
            if (strcasecmp($r['kantor'] ?? '', $targetKantor) === 0 &&
                strcasecmp($r['jenisDokumen'] ?? '', $targetJenis) === 0 &&
                strcasecmp($r['periode'] ?? '', $targetPeriode) === 0) {
                $found = $r;
                break;
            }
        }

        if ($found) {
            echo json_encode([
                'success' => true,
                'kantor' => $found['kantor'],
                'kodeKantor' => $found['kodeKantor'] ?? ($OFFICIAL_BRANCH_CODES[$found['kantor']] ?? '2.0160-00'),
                'jenisDokumen' => $found['jenisDokumen'],
                'nomorTerakhir' => (int)($found['nomorTerakhir'] ?? 0),
                'kandidatBerikutnya' => $found['kandidatBerikutnya'] ?? '00001',
                'sumberBukti' => $found['sumberBukti'] ?? '',
                'status' => $found['status'] ?? 'AKTIF',
                'nomorTerpakai' => $found['nomorTerpakai'] ?? []
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'kantor' => $targetKantor,
                'kodeKantor' => $OFFICIAL_BRANCH_CODES[$targetKantor] ?? '2.0160-00',
                'jenisDokumen' => $targetJenis,
                'nomorTerakhir' => 0,
                'kandidatBerikutnya' => '00001',
                'status' => 'DEFAULT_FALLBACK',
                'nomorTerpakai' => []
            ]);
        }
        exit;
    }

    ` + getQueueAdminAnchor;

nolapContent = nolapContent.replace(getQueueAdminAnchor, newGetActions);

// Tambahkan POST action saveOfficialRegister
const submitGerbang1Anchor = `if ($action === 'submitGerbang1Awal') {`;
const newPostActions = `if ($action === 'saveOfficialRegister') {
        if (!in_array($userRole, ['SUPER_ADMIN', 'ADMIN_PUSAT'], true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Akses Ditolak (403 Forbidden): Hanya SUPER ADMIN (KING) atau Admin Pusat yang berwenang mengatur register nomor resmi OPINI NSR.',
                'violation' => 'UNAUTHORIZED_REGISTER_CONFIG_ATTEMPT'
            ]);
            exit;
        }

        $kantor = trim($payload['kantor'] ?? '');
        $jenisDokumen = trim($payload['jenisDokumen'] ?? '');
        $periode = trim($payload['periode'] ?? date('Y'));
        $nomorTerakhir = (int)($payload['nomorTerakhir'] ?? 0);
        $sumberBukti = trim($payload['sumberBukti'] ?? '');
        $alasanPenyesuaian = trim($payload['alasanPenyesuaian'] ?? '');

        if (!$kantor || !$jenisDokumen || empty($sumberBukti) || empty($alasanPenyesuaian)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Kantor, jenis dokumen, nomor terakhir, sumber bukti, dan alasan penyesuaian wajib diisi secara lengkap.'
            ]);
            exit;
        }

        if (!isset($OFFICIAL_BRANCH_CODES[$kantor])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Kantor '{$kantor}' tidak valid dalam master kantor resmi."]);
            exit;
        }

        if (!in_array($jenisDokumen, ['NoLap', 'LP_SPK', 'JO'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Jenis dokumen '{$jenisDokumen}' tidak valid (Gunakan: NoLap, LP_SPK, JO)."]);
            exit;
        }

        $regLock = $dataDir . '/register_config.lock';
        $fpRegLock = fopen($regLock, 'c+');
        if ($fpRegLock && !flock($fpRegLock, LOCK_EX)) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Server sedang sibuk memperbarui register. Silakan coba kembali.']);
            exit;
        }

        $regList = muatRegisterConfig($registerConfigFile);
        $foundIdx = -1;
        foreach ($regList as $idx => $r) {
            if (strcasecmp($r['kantor'] ?? '', $kantor) === 0 &&
                strcasecmp($r['jenisDokumen'] ?? '', $jenisDokumen) === 0 &&
                strcasecmp($r['periode'] ?? '', $periode) === 0) {
                $foundIdx = $idx;
                break;
            }
        }

        $nowWib = date('c');
        $petugasNama = $currentUser['nama'] ?? $userDisplayName;
        $petugasRole = $currentUser['role'] ?? $userRole;
        $nextCandidate = str_pad($nomorTerakhir + 1, 5, '0', STR_PAD_LEFT);
        $saldoLama = ($foundIdx >= 0) ? (int)($regList[$foundIdx]['nomorTerakhir'] ?? 0) : 0;
        $targetRegId = ($foundIdx >= 0) ? $regList[$foundIdx]['id'] : ('reg_' . strtolower($kantor) . '_' . strtolower($jenisDokumen) . '_' . $periode);

        $regEntry = [
            'id' => $targetRegId,
            'kantor' => $kantor,
            'kodeKantor' => $OFFICIAL_BRANCH_CODES[$kantor],
            'jenisDokumen' => $jenisDokumen,
            'labelDokumen' => ($jenisDokumen === 'NoLap') ? 'Nomor Laporan Penilaian Definitif' : (($jenisDokumen === 'LP_SPK') ? 'Nomor Lingkup Penugasan / SPK' : 'Nomor Administrasi Job Order'),
            'periode' => $periode,
            'nomorTerakhir' => $nomorTerakhir,
            'kandidatBerikutnya' => $nextCandidate,
            'nomorTerpakai' => $payload['nomorTerpakai'] ?? (($foundIdx >= 0) ? ($regList[$foundIdx]['nomorTerpakai'] ?? []) : []),
            'nomorDibatalkan' => $payload['nomorDibatalkan'] ?? (($foundIdx >= 0) ? ($regList[$foundIdx]['nomorDibatalkan'] ?? []) : []),
            'nomorDicadangkan' => $payload['nomorDicadangkan'] ?? (($foundIdx >= 0) ? ($regList[$foundIdx]['nomorDicadangkan'] ?? []) : []),
            'tanggalPenetapan' => $nowWib,
            'petugas' => $petugasNama . ' (' . $petugasRole . ')',
            'sumberBukti' => $sumberBukti,
            'alasanPenyesuaian' => $alasanPenyesuaian,
            'status' => 'AKTIF',
            'updatedAt' => $nowWib
        ];

        if ($foundIdx >= 0) {
            $regList[$foundIdx] = $regEntry;
        } else {
            $regList[] = $regEntry;
        }

        simpanRegisterConfig($registerConfigFile, $regList);

        catatRegisterAuditLog($registerAuditFile, [
            'logId' => 'REG-LOG-' . date('YmdHis') . '-' . substr(md5(uniqid()), 0, 6),
            'timestamp' => $nowWib,
            'registerId' => $targetRegId,
            'kantor' => $kantor,
            'jenisDokumen' => $jenisDokumen,
            'periode' => $periode,
            'saldoLama' => $saldoLama,
            'saldoBaru' => $nomorTerakhir,
            'kandidatBerikutnya' => $nextCandidate,
            'petugas' => $petugasNama,
            'petugasRole' => $petugasRole,
            'sumberBukti' => $sumberBukti,
            'alasan' => $alasanPenyesuaian,
            'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);

        if ($fpRegLock) { flock($fpRegLock, LOCK_UN); fclose($fpRegLock); }

        echo json_encode([
            'success' => true,
            'message' => "Register resmi untuk '{$kantor}' - '{$jenisDokumen}' ({$periode}) berhasil disimpan.",
            'register' => $regEntry
        ]);
        exit;
    }

    ` + submitGerbang1Anchor;

nolapContent = nolapContent.replace(submitGerbang1Anchor, newPostActions);

// Update issueDefinitiveNoLap anti-duplicate check & register update
const simpanDgAnchor = `simpanDatabaseDualGate($dualGateDbFile, $dgRecords);`;
const registerUpdateBlock = `// Validasi dan update nomor terhadap Register Resmi
        $signingOffice = ($signingCode === '2.0160-00') ? 'Pusat' : ($dgRecords[$targetIdx]['kantorAsal'] ?? 'Pusat');
        foreach ($OFFICIAL_BRANCH_CODES as $kName => $kCode) {
            if ($kCode === $signingCode) { $signingOffice = $kName; break; }
        }

        preg_match('/^(\\d{5})/', $noDefinitif, $matchesSeq);
        $seqNomor = $matchesSeq[1] ?? '';

        $regList = muatRegisterConfig($registerConfigFile);
        $foundRegIdx = -1;
        foreach ($regList as $idx => $r) {
            if (strcasecmp($r['kantor'] ?? '', $signingOffice) === 0 &&
                strcasecmp($r['jenisDokumen'] ?? '', 'NoLap') === 0 &&
                strcasecmp($r['periode'] ?? '', date('Y')) === 0) {
                $foundRegIdx = $idx;
                break;
            }
        }

        if ($foundRegIdx >= 0 && !empty($seqNomor)) {
            $terpakai = $regList[$foundRegIdx]['nomorTerpakai'] ?? [];
            if (in_array($seqNomor, $terpakai, true)) {
                if (isset($fpLock) && $fpLock) { flock($fpLock, LOCK_UN); fclose($fpLock); }
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'error' => "Nomor urut laporan '{$seqNomor}' sudah tercatat digunakan dalam Register Resmi '{$signingOffice}'!",
                    'violation' => 'DUPLICATE_OFFICIAL_REGISTER_SEQUENCE'
                ]);
                exit;
            }
            $regList[$foundRegIdx]['nomorTerpakai'][] = $seqNomor;
            $intSeq = (int)$seqNomor;
            if ($intSeq > (int)($regList[$foundRegIdx]['nomorTerakhir'] ?? 0)) {
                $regList[$foundRegIdx]['nomorTerakhir'] = $intSeq;
                $regList[$foundRegIdx]['kandidatBerikutnya'] = str_pad($intSeq + 1, 5, '0', STR_PAD_LEFT);
            }
            $regList[$foundRegIdx]['updatedAt'] = date('c');
            simpanRegisterConfig($registerConfigFile, $regList);
        }

        ` + simpanDgAnchor;

nolapContent = nolapContent.replace(simpanDgAnchor, registerUpdateBlock);

fs.writeFileSync('nolap-data-handler.php', nolapContent, 'utf8');
console.log('nolap-data-handler.php successfully patched with official register features!');
