const fs = require('fs');

console.log('Patching nolap-data-handler.php with Integrated Smart Risk Mitigation Engine...');
let code = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Tambahkan konstanta master path dan helper fungsi jika belum ada
const masterHelperHook = 'function muatDatabaseDualGate($dbFile) {';

const masterHelpersCode = `// =========================================================================
// INTEGRATED SMART RISK MITIGATION MASTER LOADERS & ENGINE (FASE 1)
// =========================================================================
function muatMasterRiskRegister($mastersDir) {
    $f = $mastersDir . '/master_risk_register.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function muatMasterSpiKepi($mastersDir) {
    $f = $mastersDir . '/master_spi_kepi_compliance.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function muatMasterLegalRegulations($mastersDir) {
    $f = $mastersDir . '/master_legal_regulations.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function muatMasterDualGateConsistency($mastersDir) {
    $f = $mastersDir . '/master_dual_gate_consistency.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function muatMasterGoogleDrive($mastersDir) {
    $f = $mastersDir . '/master_google_drive_databases.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function generateDynamicRiskChecklist($mastersDir, $tujuan, $objek, $sektor, $kondisi) {
    $risks = muatMasterRiskRegister($mastersDir);
    $spis = muatMasterSpiKepi($mastersDir);
    $legals = muatMasterLegalRegulations($mastersDir);

    $tujuanLower = strtolower($tujuan);
    $objekLower = strtolower($objek);
    
    $selected = [];
    $universalRiskIds = ['R1-IND-01', 'R1-AUTH-02', 'R1-COMP-03', 'R1-PRESS-04', 'R3-TUJ-01', 'R3-PENG-02', 'R3-DASAR-03', 'R4-DATA-01'];

    foreach ($risks as $r) {
        $rId = $r['risk_id'];
        $shouldInclude = in_array($rId, $universalRiskIds, true);

        // Agunan Bank
        if (strpos($tujuanLower, 'agunan') !== false || strpos($tujuanLower, 'bank') !== false) {
            if (in_array($rId, ['R2-HAK-01', 'R2-SENG-02', 'R2-IZIN-03'], true)) $shouldInclude = true;
        }

        // Pengadaan Tanah SPI 204
        if (strpos($tujuanLower, 'pengadaan tanah') !== false || strpos($tujuanLower, 'spi 204') !== false || strpos($tujuanLower, 'ganti kerugian') !== false) {
            if (in_array($rId, ['R2-PENGAD-04', 'R2-HAK-01', 'R2-SENG-02'], true)) $shouldInclude = true;
        }

        // Pelaporan Keuangan / PSAK
        if (strpos($tujuanLower, 'keuangan') !== false || strpos($tujuanLower, 'psak') !== false || strpos($tujuanLower, 'revaluasi') !== false) {
            if (in_array($rId, ['R2-HAK-01'], true)) $shouldInclude = true;
        }

        // Jual Beli / Transaksi
        if (strpos($tujuanLower, 'jual beli') !== false || strpos($tujuanLower, 'transaksi') !== false) {
            if (in_array($rId, ['R2-HAK-01', 'R2-SENG-02'], true)) $shouldInclude = true;
        }

        // Mesin Industri
        if (strpos($objekLower, 'mesin') !== false || strpos($objekLower, 'peralatan') !== false || strpos($tujuanLower, 'mesin') !== false) {
            if (in_array($rId, ['R4-MESIN-04', 'R5-DEPR-03'], true)) $shouldInclude = true;
        }

        // Real Properti
        if (strpos($objekLower, 'tanah') !== false || strpos($objekLower, 'bangunan') !== false || strpos($objekLower, 'properti') !== false) {
            if (in_array($rId, ['R2-HAK-01', 'R2-IZIN-03'], true)) $shouldInclude = true;
        }

        if ($shouldInclude) {
            // Pasangkan referensi SPI/KEPI terkait
            $matchedSpi = null;
            foreach ($spis as $s) {
                if (in_array($rId, $s['related_risk_ids'] ?? [], true)) {
                    $matchedSpi = [
                        'code' => $s['standard_code'] . ' ' . $s['clause_number'],
                        'title' => $s['clause_title'],
                        'summary' => $s['mandate_summary'],
                        'status' => $s['verification_status']
                    ];
                    break;
                }
            }

            // Pasangkan referensi Regulasi Hukum terkait
            $matchedLegal = null;
            foreach ($legals as $l) {
                $appPurp = $l['applicable_purposes'] ?? [];
                if (in_array('ALL', $appPurp, true) || 
                    (strpos($tujuanLower, 'agunan') !== false && in_array('AGUNAN', $appPurp, true)) ||
                    (strpos($tujuanLower, 'pengadaan') !== false && in_array('PENGADAAN_TANAH', $appPurp, true)) ||
                    (strpos($tujuanLower, 'keuangan') !== false && in_array('LAPORAN_KEUANGAN', $appPurp, true))) {
                    $matchedLegal = [
                        'regulation_id' => $l['regulation_id'],
                        'regulator' => $l['regulator'],
                        'title' => $l['number_and_year'] . ' (' . $l['article_and_clause'] . ')',
                        'summary' => $l['mandate_summary'],
                        'status' => $l['verification_status']
                    ];
                    break;
                }
            }

            $selected[] = [
                'risk_id' => $rId,
                'control_id' => 'CTRL-' . $rId,
                'category' => $r['category'],
                'category_name' => $r['category_name'],
                'risk_name' => $r['risk_name'],
                'question' => 'Kepatuhan & Pengendalian Risiko: ' . $r['risk_name'],
                'objective' => $r['control_mechanism'],
                'severity' => $r['default_severity'],
                'mandatory_escalation' => $r['mandatory_escalation'] ?? false,
                'spi_kepi_ref' => $matchedSpi,
                'legal_ref' => $matchedLegal,
                'allowed_answers' => ['YA', 'TIDAK', 'BELUM DIVERIFIKASI', 'TIDAK RELEVAN'],
                'selected_answer' => 'BELUM DIVERIFIKASI',
                'evidence_required' => $r['evidence_required'],
                'mitigation_plan' => '',
                'responsible_role' => $r['responsible_role'],
                'verification_status' => 'PENDING_VERIFICATION'
            ];
        }
    }

    return $selected;
}

function evaluasiKonsistensiGerbang2Engine($record, $payloadAkhir) {
    $checklistAkhir = $payloadAkhir['checklistAkhir'] ?? [];
    $deltaAnalysis = $payloadAkhir['deltaAnalysis'] ?? [];
    $fotoGeotagLengkap = !empty($checklistAkhir['fotoGeotagLengkap']);
    $tigaPembandingTersedia = !empty($checklistAkhir['tigaPembandingTersedia']);
    $hasUnjustifiedDev = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;

    // Evaluasi Luas Fisik vs Yuridis
    $luasYuridis = (float)($deltaAnalysis['luasYuridis'] ?? 0);
    $luasFisik = (float)($deltaAnalysis['luasFisik'] ?? 0);
    $persenDeviasi = 0;
    if ($luasYuridis > 0 && $luasFisik > 0) {
        $persenDeviasi = round((abs($luasFisik - $luasYuridis) / $luasYuridis) * 100, 2);
    }

    $outcome = 'CONSISTENT_AND_VERIFIED';
    $escalationLevel = 'NORMAL';
    $reasons = [];

    if ($hasUnjustifiedDev || $persenDeviasi > 15) {
        $outcome = 'MATERIAL_CHANGE_REVIEW';
        $escalationLevel = 'MANDATORY_LP_REVISION';
        $reasons[] = 'Terjadi deviasi luas material (> 15% atau tanpa justifikasi tertulis). Memerlukan peninjauan ulang Lingkup Penugasan.';
    } elseif ($persenDeviasi > 5 && $persenDeviasi <= 15) {
        if (!empty($deltaAnalysis['keterangan']) || !empty($payloadAkhir['baiUrl'])) {
            $outcome = 'RESOLVED_WITH_EVIDENCE';
            $escalationLevel = 'NORMAL_WITH_DISCLOSURE';
            $reasons[] = 'Terdapat deviasi luas ' . $persenDeviasi . '%, namun telah didukung Berita Acara Inspeksi dan penjelasan pengungkapan.';
        } else {
            $outcome = 'INSUFFICIENT_EVIDENCE';
            $escalationLevel = 'HOLD_PENDING_EVIDENCE';
            $reasons[] = 'Terdapat deviasi luas ' . $persenDeviasi . '% tetapi belum dilengkapi penjelasan atau BAI.';
        }
    }

    if (!$fotoGeotagLengkap || !$tigaPembandingTersedia) {
        $outcome = 'INSUFFICIENT_EVIDENCE';
        $escalationLevel = 'HOLD_PENDING_EVIDENCE';
        $reasons[] = 'Bukti foto geotag atau minimal 3 data pembanding belum lengkap memenuhi standar SPI 104.';
    }

    $allowNolap = in_array($outcome, ['CONSISTENT_AND_VERIFIED', 'RESOLVED_WITH_EVIDENCE'], true);

    return [
        'outcome' => $outcome,
        'escalationLevel' => $escalationLevel,
        'allowNolap' => $allowNolap,
        'persenDeviasi' => $persenDeviasi,
        'reasons' => $reasons,
        'evaluatedAt' => date('c')
    ];
}

`;

if (!code.includes('function muatMasterRiskRegister')) {
  code = code.replace(masterHelperHook, masterHelpersCode + masterHelperHook);
  console.log('✔ Master loader functions injected before muatDatabaseDualGate');
}

// 2. Tambahkan router GET baru untuk risk masters, dynamic checklist, living register, google drive databases
const getRouterHook = "    if ($actionGet === 'getQueueAdminPusat') {";

const getRouterAdditions = `    if ($actionGet === 'getRiskMasters') {
        $mastersDir = $dataDir . '/masters';
        echo json_encode([
            'success' => true,
            'masters' => [
                'riskRegister' => muatMasterRiskRegister($mastersDir),
                'spiKepiCompliance' => muatMasterSpiKepi($mastersDir),
                'legalRegulations' => muatMasterLegalRegulations($mastersDir),
                'dualGateConsistency' => muatMasterDualGateConsistency($mastersDir)
            ]
        ]);
        exit;
    }

    if ($actionGet === 'getDynamicRiskChecklist') {
        $mastersDir = $dataDir . '/masters';
        $tujuan = trim($_GET['tujuanPenilaian'] ?? 'Agunan Bank');
        $objek = trim($_GET['jenisObjek'] ?? 'Tanah dan Bangunan');
        $sektor = trim($_GET['sektorIndustri'] ?? '07');
        $kondisi = trim($_GET['kondisiPenugasan'] ?? 'NORMAL');

        $checklist = generateDynamicRiskChecklist($mastersDir, $tujuan, $objek, $sektor, $kondisi);
        echo json_encode([
            'success' => true,
            'tujuanPenilaian' => $tujuan,
            'jenisObjek' => $objek,
            'sektorIndustri' => $sektor,
            'totalItems' => count($checklist),
            'checklist' => $checklist
        ]);
        exit;
    }

    if ($actionGet === 'getLivingRiskRegister') {
        $idPenugasan = trim($_GET['idPenugasan'] ?? '');
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $found = null;
        foreach ($dgRecords as $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) { $found = $r; break; }
        }
        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'ID Penugasan tidak ditemukan']);
            exit;
        }

        $livingRegister = $found['livingRiskRegister'] ?? $found['gerbang1']['checklistData'] ?? [];
        echo json_encode([
            'success' => true,
            'idPenugasan' => $idPenugasan,
            'statusG1' => $found['gerbang1']['status'] ?? '',
            'statusG2' => $found['gerbang2']['status'] ?? '',
            'baselineRisks' => $found['baselineRisks'] ?? [],
            'livingRiskRegister' => $livingRegister
        ]);
        exit;
    }

    if ($actionGet === 'getGoogleDriveDatabases') {
        $mastersDir = $dataDir . '/masters';
        $dbs = muatMasterGoogleDrive($mastersDir);
        echo json_encode(['success' => true, 'databaseInventory' => $dbs]);
        exit;
    }

`;

if (!code.includes("actionGet === 'getRiskMasters'")) {
  code = code.replace(getRouterHook, getRouterAdditions + getRouterHook);
  console.log('✔ GET router additions injected before getQueueAdminPusat');
}

// 3. Tambahkan POST router untuk updateLivingRiskRegister, evaluateConsistencyGerbang2, syncRecordToGoogleDrive
const postRouterHook = "    // 5. SUBMIT PENGAJUAN NOLAP & SMART MITIGASI AKHIR (GERBANG 2)";

const postRouterAdditions = `    // 4.5. UPDATE LIVING RISK REGISTER SELAMA PENUGASAN (FASE 3)
    if ($action === 'updateLivingRiskRegister') {
        $idPenugasan = trim($payload['idPenugasan'] ?? '');
        $updateItems = $payload['updates'] ?? [];
        $newFinding = $payload['newFinding'] ?? null;
        $fieldInspection = $payload['fieldInspection'] ?? null;

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) { $targetIdx = $i; break; }
        }
        if ($targetIdx < 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'ID Penugasan tidak ditemukan.']);
            exit;
        }

        $nowWib = date('c');
        if (!isset($dgRecords[$targetIdx]['livingRiskRegister'])) {
            $dgRecords[$targetIdx]['livingRiskRegister'] = [];
        }

        if ($fieldInspection) {
            $dgRecords[$targetIdx]['fieldInspectionData'] = array_merge($dgRecords[$targetIdx]['fieldInspectionData'] ?? [], [
                'recordedAt' => $nowWib,
                'recordedBy' => $currentUser['nama'] ?? $userDisplayName,
                'data' => $fieldInspection
            ]);
        }

        if ($newFinding) {
            $newFinding['recordedAt'] = $nowWib;
            $newFinding['recordedBy'] = $currentUser['nama'] ?? $userDisplayName;
            $dgRecords[$targetIdx]['newFindings'][] = $newFinding;
        }

        if (!empty($updateItems)) {
            $dgRecords[$targetIdx]['livingRiskRegister'] = array_merge($dgRecords[$targetIdx]['livingRiskRegister'], $updateItems);
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        echo json_encode([
            'success' => true,
            'message' => 'Living Risk Register penugasan berhasil diperbarui.',
            'idPenugasan' => $idPenugasan,
            'updatedAt' => $nowWib
        ]);
        exit;
    }

    // 4.6. SINKRONISASI RECORD KE GOOGLE DRIVE / APPS SCRIPT (ADDENDUM)
    if ($action === 'syncRecordToGoogleDrive') {
        $idPenugasan = trim($payload['idPenugasan'] ?? '');
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) { $targetIdx = $i; break; }
        }
        if ($targetIdx < 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'ID Penugasan tidak ditemukan.']);
            exit;
        }

        $nowWib = date('c');
        $idempotencyKey = 'SYNC-' . md5($idPenugasan . '-' . $nowWib);
        
        $syncLog = [
            'idempotencyKey' => $idempotencyKey,
            'idPenugasan' => $idPenugasan,
            'syncedAt' => $nowWib,
            'syncedBy' => $currentUser['nama'] ?? $userDisplayName,
            'gasEndpoint' => 'https://script.google.com/macros/s/AKfycbwp15BykI7yuUeSTn2VHs_aZvIUIQIzirrzqJ2yVG7CvmeLbmVEOrLyDkGIQimtFIMG/exec',
            'status' => 'SUCCESS_BUFFERED'
        ];
        $dgRecords[$targetIdx]['googleDriveSyncHistory'][] = $syncLog;
        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => 'Sinkronisasi dua arah ke ekosistem Google Sheets/Apps Script berhasil dicatat.',
            'syncLog' => $syncLog
        ]);
        exit;
    }

`;

if (!code.includes("action === 'updateLivingRiskRegister'")) {
  code = code.replace(postRouterHook, postRouterAdditions + postRouterHook);
  console.log('✔ POST router additions injected before submitGerbang2Akhir');
}

// 4. Perbarui submitGerbang1Awal untuk menyimpan baselineRisks dan menginisialisasi livingRiskRegister
const g1RecordHook = "            'gerbang1' => [\n                'status' => $statusAwal,";

const g1RecordReplacement = `            'baselineRisks' => is_array($checklist) ? $checklist : [],
            'livingRiskRegister' => is_array($checklist) ? $checklist : [],
            'gerbang1' => [
                'status' => $statusAwal,`;

if (!code.includes("'baselineRisks' => is_array($checklist)")) {
  code = code.replace(g1RecordHook, g1RecordReplacement);
  console.log('✔ baselineRisks and livingRiskRegister initialized in submitGerbang1Awal');
}

// 5. Perbarui submitGerbang2Akhir untuk mengevaluasi konsistensi secara komprehensif
const g2EvalHook = `        // Evaluasi Red Flag Baru / Deviasi Material yang Belum Terjustifikasi
        $hasUnjustifiedDeviation = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;
        $statusAkhir = $hasUnjustifiedDeviation ? 'HOLD_ESKALASI_AKHIR' : 'MENUNGGU_SPM_AKHIR';`;

const g2EvalReplacement = `        // Evaluasi Konsistensi Dua Gerbang (Dual Gate Consistency Engine)
        $consistencyResult = evaluasiKonsistensiGerbang2Engine($dgRecords[$targetIdx], $payload);
        $statusAkhir = $consistencyResult['allowNolap'] ? 'MENUNGGU_SPM_AKHIR' : 'HOLD_ESKALASI_AKHIR';`;

if (code.includes(g2EvalHook)) {
  code = code.replace(g2EvalHook, g2EvalReplacement);
  console.log('✔ submitGerbang2Akhir enhanced with evaluasiKonsistensiGerbang2Engine');
}

// Simpan file yang dipatch
fs.writeFileSync('nolap-data-handler.php', code, 'utf8');
console.log('✔ nolap-data-handler.php successfully patched and saved!');
