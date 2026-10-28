import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');

console.log('--- Applying Addendum: Konsistensi Penunjukan Penilai Publik SSOT ---');

// =========================================================================
// 1. UPDATE nolap-data-handler.php
// =========================================================================
const handlerPath = path.join(projectRoot, 'nolap-data-handler.php');
let handlerCode = fs.readFileSync(handlerPath, 'utf8');

// A. Insert 3 Tokens for Hernita, Amin, Dharma in $USER_ROLES_STATIC
const tokenAnchor = `'8b5420d9942829d62967b099a1049a1f36e05d173eac6cd6217fbfe403004c96' => [`;
const penilaiTokensBlock = `    // Token Header: NSR-PENILAI-HERNITA-2026 (Penilai Publik - Hernita Cabang Padang)
    '502ff145897ce4c1914314d46ce3b16a048b893e434d07c9b79b4398aa4857d3' => [
        'sub'               => 'hernita_penilai',
        'branch'            => 'Padang',
        'displayName'       => 'Hernita, S.Si., MAPPI (Cert.)',
        'nama'              => 'Hernita, S.Si., MAPPI (Cert.)',
        'email'             => 'hernita@kjppnanangrahayu.com',
        'izinMenkeu'        => 'PS-1.15.00046',
        'mappi'             => '09-S-02262',
        'role'              => 'PENILAI_PUBLIK',
        'roleLabel'         => 'Rekan / Pimpinan Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'permissions'       => ['report.sign', 'opr.view']
    ],
    // Token Header: NSR-PENILAI-AMIN-2026 (Penilai Publik - Muhammad Amin Sade Cabang Makassar)
    '3842087eaf02e72c7508189b4175be5f73e239bdb7a16dbd79e3e54c7e0e02b3' => [
        'sub'               => 'amin_penilai',
        'branch'            => 'Makassar',
        'displayName'       => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
        'nama'              => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
        'email'             => 'amin.sade@kjppnanangrahayu.com',
        'izinMenkeu'        => 'PS-1.16.00126',
        'mappi'             => '09-S-02425',
        'role'              => 'PENILAI_PUBLIK',
        'roleLabel'         => 'Rekan / Pimpinan Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'permissions'       => ['report.sign', 'opr.view']
    ],
    // Token Header: NSR-PENILAI-DHARMA-2026 (Penilai Publik - Dharma Priyanto Cabang Palembang)
    '7b1f205166447b1b859c91a7ec60b458d98adf5e5dd2448df7f23fdd93b2f3ab' => [
        'sub'               => 'dharma_penilai',
        'branch'            => 'Palembang',
        'displayName'       => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)',
        'nama'              => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)',
        'email'             => 'dharma.priyanto@kjppnanangrahayu.com',
        'izinMenkeu'        => 'PS-1.19.00249',
        'mappi'             => '16-S-06984',
        'role'              => 'PENILAI_PUBLIK',
        'roleLabel'         => 'Rekan / Pimpinan Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'permissions'       => ['report.sign', 'opr.view']
    ],
`;

if (!handlerCode.includes('hernita_penilai') && handlerCode.includes(tokenAnchor)) {
  handlerCode = handlerCode.replace(tokenAnchor, penilaiTokensBlock + '    ' + tokenAnchor);
  console.log('✔ Penilai tokens added to nolap-data-handler.php');
}

// B. Add Master Penilai Publik Loaders
const masterLoaderAnchor = `function muatMasterGoogleDrive($mastersDir) {`;
const masterPenilaiFunctions = `function muatMasterPenilaiPublik($mastersDir) {
    $f = $mastersDir . '/master_penilai_publik.json';
    return file_exists($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
}

function cariMasterPenilaiPublik($mastersDir, $identifier) {
    $penilais = muatMasterPenilaiPublik($mastersDir);
    if (empty($penilais)) {
        $penilais = [
            ['id' => 'nanang_penilai', 'nama' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)', 'izin_segmen' => '0218', 'klasifikasi' => 'P', 'email' => 'nanang.rahayu@kjppnanangrahayu.com'],
            ['id' => 'deni_penilai', 'nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)', 'izin_segmen' => '00581', 'klasifikasi' => 'P', 'email' => 'deni.siswandi@kjppnanangrahayu.com'],
            ['id' => 'hernita_penilai', 'nama' => 'Hernita, S.Si., MAPPI (Cert.)', 'izin_segmen' => '00046', 'klasifikasi' => 'PS', 'email' => 'hernita@kjppnanangrahayu.com'],
            ['id' => 'amin_penilai', 'nama' => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)', 'izin_segmen' => '00126', 'klasifikasi' => 'PS', 'email' => 'amin.sade@kjppnanangrahayu.com'],
            ['id' => 'dharma_penilai', 'nama' => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)', 'izin_segmen' => '00249', 'klasifikasi' => 'PS', 'email' => 'dharma.priyanto@kjppnanangrahayu.com']
        ];
    }
    $cleanId = strtolower(trim((string)$identifier));
    if (empty($cleanId)) return $penilais[1]; // default deni_penilai

    foreach ($penilais as $p) {
        $pid = strtolower($p['id'] ?? '');
        $pnm = strtolower($p['nama'] ?? '');
        $palt = strtolower($p['nama_alt'] ?? '');
        $psng = strtolower($p['nama_singkat'] ?? '');
        $piz = strtolower($p['izin_segmen'] ?? '');

        if ($pid === $cleanId || $pnm === $cleanId || $palt === $cleanId || $psng === $cleanId || $piz === $cleanId) {
            return $p;
        }
        if (strpos($cleanId, 'nanang') !== false && strpos($pid, 'nanang') !== false) return $p;
        if (strpos($cleanId, 'deni') !== false && strpos($pid, 'deni') !== false) return $p;
        if (strpos($cleanId, 'hernita') !== false && strpos($pid, 'hernita') !== false) return $p;
        if (strpos($cleanId, 'amin') !== false && strpos($pid, 'amin') !== false) return $p;
        if (strpos($cleanId, 'dharma') !== false && strpos($pid, 'dharma') !== false) return $p;
    }
    return $penilais[1];
}

`;

if (!handlerCode.includes('muatMasterPenilaiPublik') && handlerCode.includes(masterLoaderAnchor)) {
  handlerCode = handlerCode.replace(masterLoaderAnchor, masterPenilaiFunctions + masterLoaderAnchor);
  console.log('✔ Master Penilai helper functions added to nolap-data-handler.php');
}

// C. Expose in getMasterMitigasiRisiko and add getMasterPenilaiPublik action
const masterExposureAnchor = `'dualGateConsistency' => muatMasterDualGateConsistency($mastersDir)`;
if (handlerCode.includes(masterExposureAnchor) && !handlerCode.includes(`'penilaiPublik' => muatMasterPenilaiPublik`)) {
  handlerCode = handlerCode.replace(
    masterExposureAnchor,
    `'dualGateConsistency' => muatMasterDualGateConsistency($mastersDir),\n                'penilaiPublik' => muatMasterPenilaiPublik($mastersDir)`
  );
  console.log('✔ Master Penilai exposed in getMasterMitigasiRisiko');
}

const getMasterActionAnchor = `    if ($actionGet === 'getMasterMitigasiRisiko') {`;
const getMasterPenilaiAction = `    if ($actionGet === 'getMasterPenilaiPublik') {
        $mastersDir = $dataDir . '/masters';
        echo json_encode(['success' => true, 'penilaiPublik' => muatMasterPenilaiPublik($mastersDir)]);
        exit;
    }\n\n`;

if (!handlerCode.includes(`actionGet === 'getMasterPenilaiPublik'`) && handlerCode.includes(getMasterActionAnchor)) {
  handlerCode = handlerCode.replace(getMasterActionAnchor, getMasterPenilaiAction + getMasterActionAnchor);
  console.log('✔ Action getMasterPenilaiPublik added');
}

// D. Update submitGerbang1Awal to use cariMasterPenilaiPublik
const g1PenilaiResolveTarget = `$penilaiDitunjuk = $payload['penilaiPublikDitunjuk'] ?? 'Deni Siswandi, S.T., MAPPI (Cert.)';
        $penilaiId = $payload['penilaiPublikId'] ?? 'deni_penilai';`;
const g1PenilaiResolveRepl = `$rawPenilaiDitunjuk = $payload['penilaiPublikDitunjuk'] ?? '';
        $rawPenilaiId = $payload['penilaiPublikId'] ?? '';
        $pObj = cariMasterPenilaiPublik($mastersDir, $rawPenilaiId ?: $rawPenilaiDitunjuk);
        $penilaiId = $pObj['id'] ?? 'deni_penilai';
        $penilaiDitunjuk = $pObj['nama'] ?? 'Deni Siswandi, S.T., MAPPI (Cert.)';`;

if (handlerCode.includes(g1PenilaiResolveTarget)) {
  handlerCode = handlerCode.replace(g1PenilaiResolveTarget, g1PenilaiResolveRepl);
  console.log('✔ Gerbang 1 intake now resolves 5 Penilai SSOT');
}

// E. Update submitGerbang2Akhir: Verify Penilai Consistency with Gerbang 1, require justification if changed
const g2SubmitChecklistAnchor = `$checklistAkhir = $payload['checklistAkhir'] ?? [];`;
const g2PenilaiCheckBlock = `// Audit & Verifikasi Kesesuaian Penilai Publik Gerbang 1 vs Gerbang 2
        $penilaiBaruId = trim($payload['penilaiPublikId'] ?? '');
        $assignedG1PenilaiId = $dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '';
        $isPenilaiChanged = (!empty($penilaiBaruId) && $penilaiBaruId !== $assignedG1PenilaiId);

        if ($isPenilaiChanged) {
            $alasanPerubahan = trim($payload['alasanPerubahanPJ'] ?? $payload['justifikasiPerubahanPJ'] ?? '');
            if (empty($alasanPerubahan)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Perubahan Penilai Publik Penanggung Jawab wajib menyertakan alasan justifikasi profesional dan dicatat ke audit trail.',
                    'violation' => 'UNJUSTIFIED_APPRAISER_CHANGE'
                ]);
                exit;
            }

            $pBaruObj = cariMasterPenilaiPublik($mastersDir, $penilaiBaruId);
            $objekPenilaian = $dgRecords[$targetIdx]['jenisObjek'] ?? '';
            $isObjekSederhana = (stripos($objekPenilaian, 'sederhana') !== false || stripos($objekPenilaian, 'rumah tinggal') !== false);
            if (($pBaruObj['klasifikasi'] ?? '') === 'PS' && !$isObjekSederhana && (stripos($objekPenilaian, 'komersial') !== false || stripos($objekPenilaian, 'industri') !== false)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => "Ketidaksesuaian Klasifikasi Izin: Penilai Publik {$pBaruObj['nama']} memiliki izin PS (Properti Sederhana) yang tidak berwenang untuk objek {$objekPenilaian}.",
                    'violation' => 'INVALID_APPRAISER_CLASSIFICATION'
                ]);
                exit;
            }

            $dgRecords[$targetIdx]['perubahanPenanggungJawabHistory'][] = [
                'waktu' => $nowWib,
                'actor' => $currentUser['nama'] ?? $userDisplayName,
                'penilaiLamaId' => $assignedG1PenilaiId,
                'penilaiLamaNama' => $dgRecords[$targetIdx]['penugasan']['penilaiPublikDitunjuk'] ?? '',
                'penilaiBaruId' => $pBaruObj['id'],
                'penilaiBaruNama' => $pBaruObj['nama'],
                'alasan' => $alasanPerubahan
            ];

            $dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] = $pBaruObj['id'];
            $dgRecords[$targetIdx]['penugasan']['penilaiPublikDitunjuk'] = $pBaruObj['nama'];
            $dgRecords[$targetIdx]['penugasan']['appraiserLicenseCode'] = $pBaruObj['izin_segmen'];
            $dgRecords[$targetIdx]['penugasan']['penilaiKlasifikasi'] = $pBaruObj['klasifikasi'];
        }

        `;

if (!handlerCode.includes('isPenilaiChanged') && handlerCode.includes(g2SubmitChecklistAnchor)) {
  handlerCode = handlerCode.replace(g2SubmitChecklistAnchor, g2PenilaiCheckBlock + g2SubmitChecklistAnchor);
  console.log('✔ Gerbang 2 penilai consistency verification & audit trail added');
}

// F. Update issueDefinitiveNoLap: License segment for NoLap
const issueNoLapPenilaiAnchor = `$penilaiIzin = $dgRecords[$targetIdx]['penugasan']['appraiserLicenseCode'] ?? ((($dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '') === 'nanang_penilai') ? '0218' : '00581');`;
const issueNoLapPenilaiRepl = `$targetPenilaiId = $dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '';
            $pObjResolved = cariMasterPenilaiPublik($mastersDir, $targetPenilaiId);
            $penilaiIzin = $dgRecords[$targetIdx]['penugasan']['appraiserLicenseCode'] ?? ($pObjResolved['izin_segmen'] ?? '00581');`;

if (handlerCode.includes(issueNoLapPenilaiAnchor)) {
  handlerCode = handlerCode.replace(issueNoLapPenilaiAnchor, issueNoLapPenilaiRepl);
  console.log('✔ issueDefinitiveNoLap dynamically resolves license code for all 5 Penilai');
}

// G. Update Notification Email for all 5 Penilai
const emailTargetAnchor = `$emailPenilai = ($penilaiSub === 'nanang_penilai') ? 'nanang.rahayu@kjppnanangrahayu.com' : 'deni.siswandi@kjppnanangrahayu.com';`;
const emailTargetRepl = `$pObjSub = cariMasterPenilaiPublik($mastersDir, $penilaiSub);
        $emailPenilai = $pObjSub['email'] ?? (($penilaiSub === 'nanang_penilai') ? 'nanang.rahayu@kjppnanangrahayu.com' : 'deni.siswandi@kjppnanangrahayu.com');`;

if (handlerCode.includes(emailTargetAnchor)) {
  handlerCode = handlerCode.replace(emailTargetAnchor, emailTargetRepl);
  console.log('✔ Penilai notification email routes to all 5 Penilai');
}

fs.writeFileSync(handlerPath, handlerCode, 'utf8');
console.log('✔ Saved nolap-data-handler.php successfully');
