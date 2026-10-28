/**
 * Script untuk memasang router actions Dual Smart Mitigation Gate ke nolap-data-handler.php
 */
import fs from 'node:fs';

const targetPath = 'nolap-data-handler.php';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Inserting Dual Gate GET actions...');

const getActionsCode = `
    // =========================================================================
    // DUAL SMART MITIGATION GATE: GET ACTIONS & ANTRIAN PERAN
    // =========================================================================
    $actionGet = $_GET['action'] ?? null;
    if ($actionGet === 'listAllDualGate' || $actionGet === 'listAll') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        echo json_encode([
            'success'     => true,
            'currentUser' => [
                'nama'      => $currentUser['nama'] ?? $userDisplayName,
                'role'      => $currentUser['role'],
                'roleLabel' => $currentUser['roleLabel'] ?? $currentUser['role']
            ],
            'total'       => count($dgRecords),
            'records'     => $dgRecords
        ]);
        exit;
    }

    if ($actionGet === 'getQueueDanny') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $queue = array_filter($dgRecords, function($r) {
            $st1 = $r['gerbang1']['status'] ?? '';
            $st2 = $r['gerbang2']['status'] ?? '';
            return in_array($st1, ['MENUNGGU_SPM_AWAL', 'HOLD_ESKALASI_AWAL']) || 
                   in_array($st2, ['MENUNGGU_SPM_AKHIR', 'HOLD_ESKALASI_AKHIR']);
        });
        echo json_encode(['success' => true, 'role' => 'KEPALA_SPM', 'total' => count($queue), 'queue' => array_values($queue)]);
        exit;
    }

    if ($actionGet === 'getQueueDeni') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $queue = array_filter($dgRecords, function($r) {
            $st1 = $r['gerbang1']['status'] ?? '';
            $st2 = $r['gerbang2']['status'] ?? '';
            return $st1 === 'MENUNGGU_DIVTEK_AWAL' || $st2 === 'MENUNGGU_DIVTEK_AKHIR';
        });
        echo json_encode(['success' => true, 'role' => 'KEPALA_DIVTEK', 'total' => count($queue), 'queue' => array_values($queue)]);
        exit;
    }

    if ($actionGet === 'getQueueAdminPusat') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $queue = array_filter($dgRecords, function($r) {
            return ($r['gerbang2']['status'] ?? '') === 'SIAP_TERBIT_NOLAP' && 
                   empty($r['finalisasi']['nomorLaporanDefinitif']);
        });
        echo json_encode(['success' => true, 'role' => 'ADMIN_PUSAT', 'total' => count($queue), 'queue' => array_values($queue)]);
        exit;
    }

    if ($actionGet === 'getQueuePenilaiPublik') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $penilaiSub = $currentUser['sub'] ?? '';
        $queue = array_filter($dgRecords, function($r) use ($penilaiSub) {
            $isDitugaskan = ($r['penugasan']['penilaiPublikId'] ?? '') === $penilaiSub;
            $sudahTerbit = !empty($r['finalisasi']['nomorLaporanDefinitif']);
            $belumTtd = ($r['finalisasi']['statusTandaTangan'] ?? '') !== 'SIGNED';
            return $isDitugaskan && $sudahTerbit && $belumTtd;
        });
        echo json_encode(['success' => true, 'role' => 'PENILAI_PUBLIK', 'total' => count($queue), 'queue' => array_values($queue)]);
        exit;
    }

    if ($actionGet === 'getDualGateDetail') {
        $idPenugasan = trim($_GET['idPenugasan'] ?? '');
        $noReq = trim($_GET['noPermintaan'] ?? '');
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $found = null;
        foreach ($dgRecords as $r) {
            if (($idPenugasan && ($r['idPenugasan'] ?? '') === $idPenugasan) || ($noReq && ($r['noPermintaan'] ?? '') === $noReq)) {
                $found = $r;
                break;
            }
        }
        if ($found) {
            echo json_encode(['success' => true, 'record' => $found]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data dual gate tidak ditemukan.']);
        }
        exit;
    }
`;

const getMarker = "if ($_SERVER['REQUEST_METHOD'] === 'GET') {";
if (!content.includes('$actionGet === \'listAllDualGate\'')) {
  content = content.replace(getMarker, getMarker + '\n' + getActionsCode);
  console.log('GET actions inserted.');
}

// Robust Action and Payload Normalization
const oldPostParser = `$action = $body['action'] ?? null;
    $payload = $body['payload'] ?? null;`;
const newPostParser = `$action = $_GET['action'] ?? $body['action'] ?? null;
    $payload = $body['payload'] ?? $body;
    if (!is_array($payload)) $payload = [];`;

if (content.includes(oldPostParser)) {
  content = content.replace(oldPostParser, newPostParser);
  console.log('POST action & payload parser upgraded.');
}

const postActionsCode = `
    // =========================================================================
    // DUAL SMART MITIGATION GATE: WORKFLOW ENGINE ACTIONS
    // =========================================================================

    // 1. SUBMIT GERBANG 1 (LINGKUP PENUGASAN & SMART MITIGASI AWAL)
    if ($action === 'submitGerbang1Awal') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ('NSR-' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6))));
        $tujuan = $payload['tujuanPenilaian'] ?? 'Agunan Perbankan';
        $objek = $payload['jenisObjek'] ?? 'Tanah dan Bangunan';
        $klien = $payload['namaKlien'] ?? 'Bank Rekanan';
        $penilaiDitunjuk = $payload['penilaiPublikDitunjuk'] ?? 'Deni Siswandi, S.T., MAPPI (Cert.)';
        $penilaiId = $payload['penilaiPublikId'] ?? 'deni_penilai';
        $checklist = $payload['checklistAwal'] ?? [];

        // Evaluasi Red Flag & Konflik Kepentingan
        $hasConflict = !empty($checklist['konflikKepentingan']) && $checklist['konflikKepentingan'] === true;
        $hasRedFlag = !empty($checklist['redFlagLegalitas']) && $checklist['redFlagLegalitas'] === true;

        $statusAwal = ($hasConflict || $hasRedFlag) ? 'HOLD_ESKALASI_AWAL' : 'MENUNGGU_SPM_AWAL';
        $nowWib = date('c');

        $newRecord = [
            'idPenugasan' => $idPenugasan,
            'noPermintaan' => $payload['noPermintaan'] ?? ('REQ-' . date('Ymd') . '-' . substr(md5($idPenugasan), 0, 4)),
            'createdAt' => $nowWib,
            'createdBy' => $currentUser['nama'] ?? $userDisplayName,
            'createdRole' => $currentUser['role'],
            'kantorAsal' => $currentUser['wilayah'] ?? $userBranch ?? 'Pusat',
            'tujuanPenilaian' => $tujuan,
            'jenisObjek' => $objek,
            'namaKlien' => $klien,
            'penugasan' => [
                'penilaiPublikDitunjuk' => $penilaiDitunjuk,
                'penilaiPublikId' => $penilaiId,
                'alasanPenunjukan' => $payload['alasanPenunjukan'] ?? 'Sesuai bidang kompetensi dan ketersediaan jadwal.'
            ],
            'gerbang1' => [
                'status' => $statusAwal,
                'versi' => 1,
                'submittedAt' => $nowWib,
                'submittedBy' => $currentUser['nama'] ?? $userDisplayName,
                'checklistData' => $checklist,
                'catatanPengaju' => $payload['catatanPengaju'] ?? '',
                'history' => [
                    ['versi' => 1, 'waktu' => $nowWib, 'event' => 'SUBMIT_AWAL', 'status' => $statusAwal, 'actor' => $currentUser['nama'] ?? $userDisplayName]
                ]
            ],
            'gerbang2' => [
                'status' => 'BELUM_DIAJUKAN',
                'versi' => 0,
                'history' => []
            ],
            'finalisasi' => [
                'nomorLaporanDefinitif' => null,
                'statusTandaTangan' => 'BELUM_TERBIT',
                'statusAkhir' => 'DRAFT'
            ]
        ];

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $dgRecords[] = $newRecord;
        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Antrekan Notifikasi Email ke Danny Taufik (Kepala SPM)
        $mailJob = antrekanEmailDualGate($mailQueueFile, [
            'event'         => 'GERBANG1_SUBMITTED',
            'idPenugasan'   => $idPenugasan,
            'recipient'     => 'danny.taufik@kjppnanangrahayu.com',
            'recipientName' => 'Danny Taufik, S.H. (Kepala SPM)',
            'subject'       => "[OPINI NSR] Permintaan Review Mitigasi Awal - ID: {$idPenugasan}",
            'body'          => "Yth. Bpk. Danny Taufik (Kepala SPM),\n\nTelah diajukan permohonan Lingkup Penugasan & Smart Mitigasi Awal untuk ID: {$idPenugasan}.\nTujuan: {$tujuan}\nPengaju: " . ($currentUser['nama'] ?? $userDisplayName) . "\n\nMohon lakukan review kepatuhan melalui Portal OPINI NSR.\n(Tembusan info otomatis: Deni Siswandi - Kepala Divtek)."
        ]);

        $waPesan = "Halo Pak Danny (Kepala SPM), mohon izin menginformasikan pengajuan Mitigasi Awal OPINI NSR Nomor {$idPenugasan} telah dikirimkan. Mohon kesediaan Bapak untuk mereview. Terima kasih.";
        $waLink = generateWhatsAppNotificationLink('081280445731', $waPesan);

        echo json_encode([
            'success' => true,
            'message' => 'Pengajuan Lingkup Penugasan & Mitigasi Awal berhasil didaftarkan.',
            'idPenugasan' => $idPenugasan,
            'status' => $statusAwal,
            'emailNotification' => $mailJob ? 'ANTRIAN' : 'GAGAL',
            'waManualLink' => $waLink
        ]);
        exit;
    }

    // 2. REVIEW DANNY TAUFIK (KEPALA SPM) PADA GERBANG 1
    if ($action === 'reviewDannyGerbang1') {
        if ($currentUser['role'] !== 'KEPALA_SPM') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Danny Taufik (Kepala SPM) yang berwenang mengeksekusi review ini.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $keputusan = strtoupper(trim($payload['keputusan'] ?? ''));
        $catatan = trim($payload['catatan'] ?? '');

        if (!in_array($keputusan, ['SETUJU', 'REVISI', 'TOLAK'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Keputusan wajib bernilai 'SETUJU', 'REVISI', atau 'TOLAK'."]);
            exit;
        }
        if (empty($catatan)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Catatan telaah wajib dicantumkan oleh Kepala SPM.']);
            exit;
        }

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

        $currentStatus = $dgRecords[$targetIdx]['gerbang1']['status'] ?? '';
        if (!in_array($currentStatus, ['MENUNGGU_SPM_AWAL', 'HOLD_ESKALASI_AWAL'], true)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => "Tahapan tidak valid: Status saat ini '{$currentStatus}'."]);
            exit;
        }

        $newStatus = ($keputusan === 'SETUJU') ? 'MENUNGGU_DIVTEK_AWAL' : (($keputusan === 'REVISI') ? 'REVISI_SPM_AWAL' : 'DITOLAK_AWAL');
        $nowWib = date('c');

        $dgRecords[$targetIdx]['gerbang1']['status'] = $newStatus;
        $dgRecords[$targetIdx]['gerbang1']['reviewDanny'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Danny Taufik, S.H.'
        ];
        $dgRecords[$targetIdx]['gerbang1']['history'][] = [
            'versi' => $dgRecords[$targetIdx]['gerbang1']['versi'] ?? 1,
            'waktu' => $nowWib,
            'event' => 'REVIEW_SPM_AWAL',
            'keputusan' => $keputusan,
            'status' => $newStatus,
            'actor' => $currentUser['nama'] ?? 'Danny Taufik, S.H.',
            'catatan' => $catatan
        ];

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Jika SETUJU: Kirim notifikasi tindakan otomatis ke Deni Siswandi
        $waLinkDeni = null;
        if ($keputusan === 'SETUJU') {
            antrekanEmailDualGate($mailQueueFile, [
                'event'         => 'GERBANG1_SPM_APPROVED',
                'idPenugasan'   => $idPenugasan,
                'recipient'     => 'deni.siswandi@kjppnanangrahayu.com',
                'recipientName' => 'Deni Siswandi, S.T. (Kepala Divisi Teknik)',
                'subject'       => "[OPINI NSR - TINDAKAN] Permintaan Review Teknis Awal - ID: {$idPenugasan}",
                'body'          => "Yth. Bpk. Deni Siswandi (Kepala Divisi Teknik),\n\nPengajuan Lingkup Penugasan & Mitigasi Awal ID: {$idPenugasan} telah DISETUJUI oleh Kepala SPM (Bpk. Danny Taufik).\nCatatan SPM: {$catatan}\n\nMohon kesediaan Bapak mereview aspek metodologi dan susunan tim teknis di Portal OPINI NSR."
            ]);
            $waPesan = "Halo Pak Deni (Kepala Divtek), mohon izin menginformasikan pengajuan Mitigasi Awal OPINI NSR Nomor {$idPenugasan} telah disetujui SPM dan siap untuk review teknis Bapak. Terima kasih.";
            $waLinkDeni = generateWhatsAppNotificationLink('081381909504', $waPesan);
        }

        echo json_encode([
            'success' => true,
            'message' => "Review Kepala SPM berhasil disimpan: Keputusan '{$keputusan}'.",
            'idPenugasan' => $idPenugasan,
            'newStatus' => $newStatus,
            'waManualLink' => $waLinkDeni
        ]);
        exit;
    }

    // 3. REVIEW DENI SISWANDI (KEPALA DIVTEK) PADA GERBANG 1 (STRICT GUARD!)
    if ($action === 'reviewDeniGerbang1') {
        if ($currentUser['role'] !== 'KEPALA_DIVTEK') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Deni Siswandi (Kepala Divisi Teknik) yang berwenang mengeksekusi review ini.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $keputusan = strtoupper(trim($payload['keputusan'] ?? ''));
        $catatan = trim($payload['catatan'] ?? '');

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

        // PENGAMAN MUTLAK: Deni HANYA BOLEH review jika Danny Taufik sudah SETUJU!
        $currentStatus = $dgRecords[$targetIdx]['gerbang1']['status'] ?? '';
        if ($currentStatus !== 'MENUNGGU_DIVTEK_AWAL') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Pelanggaran Alur Kerja: Kepala Divisi Teknik tidak dapat memberikan review sebelum Kepala SPM memberi persetujuan (Status saat ini: '{$currentStatus}').",
                'violation' => 'OUT_OF_ORDER_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        $newStatus = ($keputusan === 'SETUJU') ? 'SIAP_TERBIT_LP' : (($keputusan === 'REVISI') ? 'REVISI_DIVTEK_AWAL' : 'DITOLAK_AWAL');
        $nowWib = date('c');

        $dgRecords[$targetIdx]['gerbang1']['status'] = $newStatus;
        $dgRecords[$targetIdx]['gerbang1']['reviewDeni'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.'
        ];
        $dgRecords[$targetIdx]['gerbang1']['history'][] = [
            'versi' => $dgRecords[$targetIdx]['gerbang1']['versi'] ?? 1,
            'waktu' => $nowWib,
            'event' => 'REVIEW_DIVTEK_AWAL',
            'keputusan' => $keputusan,
            'status' => $newStatus,
            'actor' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.',
            'catatan' => $catatan
        ];

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Jika SETUJU: Notifikasi hasil ke Admin Pusat & Pengaju
        if ($keputusan === 'SETUJU') {
            antrekanEmailDualGate($mailQueueFile, [
                'event'         => 'GERBANG1_COMPLETED',
                'idPenugasan'   => $idPenugasan,
                'recipient'     => 'admin.operasional@kjppnanangrahayu.com',
                'recipientName' => 'Admin Operasional KJPP NSR',
                'subject'       => "[OPINI NSR - RESMI] Lingkup Penugasan & Mitigasi Awal Terverifikasi - ID: {$idPenugasan}",
                'body'          => "Yth. Tim Operasional & Pengaju,\n\nLingkup Penugasan ID: {$idPenugasan} telah disahkan oleh Kepala SPM dan Kepala Divisi Teknik.\nStatus: SIAP_TERBIT_LP.\nDokumen Lingkup Penugasan / SPK resmi dapat diterbitkan."
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => "Review Kepala Divisi Teknik berhasil disimpan: Keputusan '{$keputusan}'.",
            'idPenugasan' => $idPenugasan,
            'newStatus' => $newStatus
        ]);
        exit;
    }

    // 4. PENERBITAN NOMOR LINGKUP PENUGASAN RESMI OLEH ADMIN PUSAT
    if ($action === 'publishOfficialLP') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Penerbitan nomor Lingkup Penugasan resmi mutlak wewenang Admin Kantor Pusat.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $nomorLpResmi = trim($payload['nomorLpResmi'] ?? '');
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

        $currentStatus = $dgRecords[$targetIdx]['gerbang1']['status'] ?? '';
        if (!in_array($currentStatus, ['SIAP_TERBIT_LP', 'LP_TERVERIFIKASI'], true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => "Akses Ditolak: Lingkup Penugasan belum lengkap disetujui (Status: '{$currentStatus}')."]);
            exit;
        }

        $nowWib = date('c');
        $dgRecords[$targetIdx]['gerbang1']['status'] = 'LP_DITERBITKAN';
        $dgRecords[$targetIdx]['gerbang1']['nomorLpResmi'] = $nomorLpResmi;
        $dgRecords[$targetIdx]['gerbang1']['diterbitkanPada'] = $nowWib;
        $dgRecords[$targetIdx]['gerbang1']['diterbitkanOleh'] = $currentUser['nama'] ?? $userDisplayName;

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => 'Nomor Lingkup Penugasan resmi berhasil diterbitkan.',
            'idPenugasan' => $idPenugasan,
            'status' => 'LP_DITERBITKAN',
            'nomorLpResmi' => $nomorLpResmi
        ]);
        exit;
    }

    // 5. SUBMIT PENGAJUAN NOLAP & SMART MITIGASI AKHIR (GERBANG 2)
    if ($action === 'submitGerbang2Akhir') {
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

        // PENGAMAN MUTLAK: NoLap tidak dapat diajukan jika Gerbang 1 belum sah!
        $statusG1 = $dgRecords[$targetIdx]['gerbang1']['status'] ?? '';
        if (!in_array($statusG1, ['SIAP_TERBIT_LP', 'LP_DITERBITKAN', 'LP_TERVERIFIKASI'], true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Prasyarat Tidak Terpenuhi: Pengajuan NoLap wajib terhubung dengan Lingkup Penugasan & Mitigasi Awal yang telah sah (Status saat ini: '{$statusG1}').",
                'violation' => 'UNVERIFIED_LP_SUBMISSION_ATTEMPT'
            ]);
            exit;
        }

        $checklistAkhir = $payload['checklistAkhir'] ?? [];
        $deltaAnalysis = $payload['deltaAnalysis'] ?? [];

        // Evaluasi Red Flag Baru / Deviasi Material yang Belum Terjustifikasi
        $hasUnjustifiedDeviation = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;
        $statusAkhir = $hasUnjustifiedDeviation ? 'HOLD_ESKALASI_AKHIR' : 'MENUNGGU_SPM_AKHIR';
        $nowWib = date('c');

        $versiG2 = ($dgRecords[$targetIdx]['gerbang2']['versi'] ?? 0) + 1;
        $dgRecords[$targetIdx]['gerbang2'] = [
            'status' => $statusAkhir,
            'versi' => $versiG2,
            'submittedAt' => $nowWib,
            'submittedBy' => $currentUser['nama'] ?? $userDisplayName,
            'checklistData' => $checklistAkhir,
            'deltaAnalysis' => $deltaAnalysis,
            'drafLaporanUrl' => $payload['drafLaporanUrl'] ?? '',
            'baiUrl' => $payload['baiUrl'] ?? '',
            'history' => array_merge($dgRecords[$targetIdx]['gerbang2']['history'] ?? [], [
                ['versi' => $versiG2, 'waktu' => $nowWib, 'event' => 'SUBMIT_AKHIR', 'status' => $statusAkhir, 'actor' => $currentUser['nama'] ?? $userDisplayName]
            ])
        ];

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Antrekan Email ke Danny Taufik (Kepala SPM)
        antrekanEmailDualGate($mailQueueFile, [
            'event'         => 'GERBANG2_SUBMITTED',
            'idPenugasan'   => $idPenugasan,
            'recipient'     => 'danny.taufik@kjppnanangrahayu.com',
            'recipientName' => 'Danny Taufik, S.H. (Kepala SPM)',
            'subject'       => "[OPINI NSR] Permintaan Review NoLap & Mitigasi Akhir - ID: {$idPenugasan}",
            'body'          => "Yth. Bpk. Danny Taufik (Kepala SPM),\n\nDraf Laporan & Smart Mitigasi Akhir telah diajukan untuk ID: {$idPenugasan}.\nMohon memeriksa kelengkapan QC, BAI, dan ketiadaan deviasi material di Portal OPINI NSR."
        ]);

        $waPesan = "Halo Pak Danny (Kepala SPM), mohon izin menginformasikan pengajuan NoLap & Mitigasi Akhir OPINI NSR Nomor {$idPenugasan} telah diajukan. Mohon kesediaan Bapak untuk mereview. Terima kasih.";
        $waLink = generateWhatsAppNotificationLink('081280445731', $waPesan);

        echo json_encode([
            'success' => true,
            'message' => 'Pengajuan NoLap & Smart Mitigasi Akhir berhasil didaftarkan.',
            'idPenugasan' => $idPenugasan,
            'status' => $statusAkhir,
            'waManualLink' => $waLink
        ]);
        exit;
    }

    // 6. REVIEW DANNY TAUFIK (KEPALA SPM) PADA GERBANG 2
    if ($action === 'reviewDannyGerbang2') {
        if ($currentUser['role'] !== 'KEPALA_SPM') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Danny Taufik (Kepala SPM) yang berwenang mengeksekusi review ini.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $keputusan = strtoupper(trim($payload['keputusan'] ?? ''));
        $catatan = trim($payload['catatan'] ?? '');

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

        $currentStatus = $dgRecords[$targetIdx]['gerbang2']['status'] ?? '';
        if (!in_array($currentStatus, ['MENUNGGU_SPM_AKHIR', 'HOLD_ESKALASI_AKHIR'], true)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => "Tahapan tidak valid: Status saat ini '{$currentStatus}'."]);
            exit;
        }

        $newStatus = ($keputusan === 'SETUJU') ? 'MENUNGGU_DIVTEK_AKHIR' : (($keputusan === 'REVISI') ? 'REVISI_SPM_AKHIR' : 'DITOLAK_AKHIR');
        $nowWib = date('c');

        $dgRecords[$targetIdx]['gerbang2']['status'] = $newStatus;
        $dgRecords[$targetIdx]['gerbang2']['reviewDanny'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Danny Taufik, S.H.'
        ];
        $dgRecords[$targetIdx]['gerbang2']['history'][] = [
            'versi' => $dgRecords[$targetIdx]['gerbang2']['versi'] ?? 1,
            'waktu' => $nowWib,
            'event' => 'REVIEW_SPM_AKHIR',
            'keputusan' => $keputusan,
            'status' => $newStatus,
            'actor' => $currentUser['nama'] ?? 'Danny Taufik, S.H.',
            'catatan' => $catatan
        ];

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Notifikasi ke Deni jika SETUJU
        $waLinkDeni = null;
        if ($keputusan === 'SETUJU') {
            antrekanEmailDualGate($mailQueueFile, [
                'event'         => 'GERBANG2_SPM_APPROVED',
                'idPenugasan'   => $idPenugasan,
                'recipient'     => 'deni.siswandi@kjppnanangrahayu.com',
                'recipientName' => 'Deni Siswandi, S.T. (Kepala Divisi Teknik)',
                'subject'       => "[OPINI NSR - TINDAKAN] Permintaan Review Teknis NoLap Akhir - ID: {$idPenugasan}",
                'body'          => "Yth. Bpk. Deni Siswandi (Kepala Divisi Teknik),\n\nMitigasi Akhir NoLap ID: {$idPenugasan} telah DISETUJUI oleh Kepala SPM.\nMohon kesediaan Bapak mereview kertas kerja dan kesesuaian nilai akhir."
            ]);
            $waPesan = "Halo Pak Deni (Kepala Divtek), mohon izin menginformasikan pengajuan NoLap OPINI NSR Nomor {$idPenugasan} telah disetujui SPM dan siap untuk review teknis akhir Bapak. Terima kasih.";
            $waLinkDeni = generateWhatsAppNotificationLink('081381909504', $waPesan);
        }

        echo json_encode([
            'success' => true,
            'message' => "Review SPM Akhir berhasil disimpan: Keputusan '{$keputusan}'.",
            'idPenugasan' => $idPenugasan,
            'newStatus' => $newStatus,
            'waManualLink' => $waLinkDeni
        ]);
        exit;
    }

    // 7. REVIEW DENI SISWANDI (KEPALA DIVTEK) PADA GERBANG 2 (STRICT GUARD!)
    if ($action === 'reviewDeniGerbang2') {
        if ($currentUser['role'] !== 'KEPALA_DIVTEK') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Deni Siswandi (Kepala Divisi Teknik) yang berwenang mengeksekusi review ini.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $keputusan = strtoupper(trim($payload['keputusan'] ?? ''));
        $catatan = trim($payload['catatan'] ?? '');

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

        // PENGAMAN MUTLAK: Deni hanya bisa review jika Danny sudah SETUJU!
        $currentStatus = $dgRecords[$targetIdx]['gerbang2']['status'] ?? '';
        if ($currentStatus !== 'MENUNGGU_DIVTEK_AKHIR') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Pelanggaran Alur Kerja: Review Divisi Teknik Akhir tidak dapat dilakukan sebelum Kepala SPM memberi persetujuan (Status saat ini: '{$currentStatus}').",
                'violation' => 'OUT_OF_ORDER_APPROVAL_ATTEMPT'
            ]);
            exit;
        }

        $newStatus = ($keputusan === 'SETUJU') ? 'SIAP_TERBIT_NOLAP' : (($keputusan === 'REVISI') ? 'REVISI_DIVTEK_AKHIR' : 'DITOLAK_AKHIR');
        $nowWib = date('c');

        $dgRecords[$targetIdx]['gerbang2']['status'] = $newStatus;
        $dgRecords[$targetIdx]['gerbang2']['reviewDeni'] = [
            'keputusan' => $keputusan,
            'catatan' => $catatan,
            'diverifikasiPada' => $nowWib,
            'pejabat' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.'
        ];
        $dgRecords[$targetIdx]['gerbang2']['history'][] = [
            'versi' => $dgRecords[$targetIdx]['gerbang2']['versi'] ?? 1,
            'waktu' => $nowWib,
            'event' => 'REVIEW_DIVTEK_AKHIR',
            'keputusan' => $keputusan,
            'status' => $newStatus,
            'actor' => $currentUser['nama'] ?? 'Deni Siswandi, S.T.',
            'catatan' => $catatan
        ];

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Jika SETUJU: Notifikasi ke Admin Pusat bahwa NoLap Siap Diterbitkan
        if ($keputusan === 'SETUJU') {
            antrekanEmailDualGate($mailQueueFile, [
                'event'         => 'GERBANG2_COMPLETED',
                'idPenugasan'   => $idPenugasan,
                'recipient'     => 'admin.operasional@kjppnanangrahayu.com',
                'recipientName' => 'Admin Pusat Jakarta',
                'subject'       => "[OPINI NSR - SIAP TERBIT] Kedua Gerbang Mitigasi Disetujui - ID: {$idPenugasan}",
                'body'          => "Yth. Admin Pusat,\n\nKedua gerbang mitigasi untuk ID: {$idPenugasan} telah LENGKAP DISETUJUI oleh Kepala SPM & Kepala Divisi Teknik.\nStatus: SIAP_TERBIT_NOLAP.\nSilakan menerbitkan Nomor Laporan Definitif resmi."
            ]);
        }

        echo json_encode([
            'success' => true,
            'message' => "Review Divisi Teknik Akhir berhasil disimpan: Keputusan '{$keputusan}'.",
            'idPenugasan' => $idPenugasan,
            'newStatus' => $newStatus
        ]);
        exit;
    }

    // 8. PENERBITAN NOMOR LAPORAN DEFINITIF OLEH ADMIN PUSAT (STRICT GUARD!)
    if ($action === 'issueDefinitiveNoLap') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Wewenang penerbitan NoLap definitif resmi mutlak milik Admin Kantor Pusat.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
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

        // PENGAMAN MUTLAK: NoLap TIDAK DAPAT DITERBITKAN jika belum SIAP_TERBIT_NOLAP!
        $statusG2 = $dgRecords[$targetIdx]['gerbang2']['status'] ?? '';
        if ($statusG2 !== 'SIAP_TERBIT_NOLAP') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Akses Ditolak: Nomor Laporan Definitif hanya dapat diterbitkan jika kedua gerbang mitigasi telah berstatus 'SIAP_TERBIT_NOLAP' (Status saat ini: '{$statusG2}').",
                'violation' => 'UNAPPROVED_NOLAP_ISSUANCE_ATTEMPT'
            ]);
            exit;
        }

        // Tentukan nomor definitif: Gunakan nomor yang disediakan atau generate unik 7 segmen
        $noDefinitif = trim($payload['nomorLaporan'] ?? '');
        if (empty($noDefinitif)) {
            $seq = str_pad(count($dgRecords) + 530, 5, '0', STR_PAD_LEFT);
            $romawiBulan = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][(int)date('n') - 1];
            $penilaiIzin = (($dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '') === 'nanang_penilai') ? '0218' : '00581';
            $noDefinitif = "{$seq}/2.0160-00/PI/07/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');
        }

        $nowWib = date('c');
        $dgRecords[$targetIdx]['finalisasi']['nomorLaporanDefinitif'] = $noDefinitif;
        $dgRecords[$targetIdx]['finalisasi']['diterbitkanPada'] = $nowWib;
        $dgRecords[$targetIdx]['finalisasi']['diterbitkanOleh'] = $currentUser['nama'] ?? $userDisplayName;
        $dgRecords[$targetIdx]['finalisasi']['statusTandaTangan'] = 'MENUNGGU_TTD_PENILAI';
        $dgRecords[$targetIdx]['finalisasi']['statusAkhir'] = 'NOMOR_DITERBITKAN';

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Notifikasi ke Penilai Publik yang Ditugaskan
        $penilaiSub = $dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '';
        $emailPenilai = ($penilaiSub === 'nanang_penilai') ? 'nanang.rahayu@kjppnanangrahayu.com' : 'deni.siswandi@kjppnanangrahayu.com';
        antrekanEmailDualGate($mailQueueFile, [
            'event'         => 'NOLAP_ISSUED_READY_SIGN',
            'idPenugasan'   => $idPenugasan,
            'recipient'     => $emailPenilai,
            'recipientName' => $dgRecords[$targetIdx]['penugasan']['penilaiPublikDitunjuk'] ?? 'Penilai Publik',
            'subject'       => "[OPINI NSR] Nomor Laporan Diterbitkan - Menunggu Tanda Tangan: {$noDefinitif}",
            'body'          => "Yth. Penilai Publik Penanggung Jawab,\n\nNomor Laporan Definitif telah resmi diterbitkan oleh Admin Pusat: {$noDefinitif}.\nMohon melakukan pemeriksaan dokumen final dan membubuhkan tanda tangan resmi di Portal OPINI NSR."
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Nomor Laporan Definitif resmi berhasil diterbitkan.',
            'idPenugasan' => $idPenugasan,
            'nomorDefinitif' => $noDefinitif,
            'statusTandaTangan' => 'MENUNGGU_TTD_PENILAI'
        ]);
        exit;
    }

    // 9. TANDA TANGAN RESMI PENILAI PUBLIK (TERPISAH DARI DIVTEK!)
    if ($action === 'signLaporanPenilaiPublik') {
        if ($currentUser['role'] !== 'PENILAI_PUBLIK') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Hanya Penilai Publik penanggung jawab berizin yang berwenang menandatangani laporan.']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
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

        // PENGAMAN MUTLAK: Hanya Penilai Publik yang DITUGASKAN yang boleh tanda tangan!
        $assignedPenilaiId = $dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '';
        if ($currentUser['sub'] !== $assignedPenilaiId) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Pelanggaran Otoritas Penilai Publik: Penugasan ini terdaftar atas nama penanggung jawab '{$dgRecords[$targetIdx]['penugasan']['penilaiPublikDitunjuk']}'. Akun Anda ('{$currentUser['nama']}') tidak memiliki hak menandatangani penugasan ini.",
                'violation' => 'UNASSIGNED_PARTNER_SIGN_ATTEMPT'
            ]);
            exit;
        }

        // Pastikan NoLap sudah terbit
        if (empty($dgRecords[$targetIdx]['finalisasi']['nomorLaporanDefinitif'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Laporan belum memiliki Nomor Laporan Definitif resmi.']);
            exit;
        }

        $nowWib = date('c');
        $dgRecords[$targetIdx]['finalisasi']['statusTandaTangan'] = 'SIGNED';
        $dgRecords[$targetIdx]['finalisasi']['penilaiPenandatangan'] = $currentUser['nama'] ?? $userDisplayName;
        $dgRecords[$targetIdx]['finalisasi']['izinPenandatangan'] = $currentUser['izinMenkeu'] ?? '-';
        $dgRecords[$targetIdx]['finalisasi']['metodeTandaTangan'] = $payload['metodeTandaTangan'] ?? 'DIGITAL_VERIFIED';
        $dgRecords[$targetIdx]['finalisasi']['ditandatanganiPada'] = $nowWib;
        $dgRecords[$targetIdx]['finalisasi']['statusAkhir'] = 'LAPORAN_FINAL';

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => 'Laporan penilaian resmi berhasil ditandatangani oleh Penilai Publik Penanggung Jawab.',
            'idPenugasan' => $idPenugasan,
            'statusAkhir' => 'LAPORAN_FINAL',
            'penilaiPenandatangan' => $currentUser['nama'] ?? $userDisplayName
        ]);
        exit;
    }
`;

const postMarker = "if ($action === 'saveMitigasi') {";
if (!content.includes('$action === \'submitGerbang1Awal\'')) {
  content = content.replace(postMarker, postActionsCode + '\n    ' + postMarker);
  console.log('Dual Gate POST actions inserted.');
}

// Update approveRequest to check Dual Gate if linked
const oldApproveGuard = `$isQAVerified = !empty($freshRecords[$targetIndex]['checklistQa']) || 
                            !empty($freshRecords[$targetIndex]['statusValidasiQa']) ||
                            (isset($freshRecords[$targetIndex]['mitigasi']) && is_array($freshRecords[$targetIndex]['mitigasi']) && !empty($freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen']) && $freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen'] === 'APPROVED') ||
                            !empty($payload['bypassQA']);`;

const newApproveGuard = `// Guard Dual Smart Mitigation Gate
            $idPenugasanReq = $freshRecords[$targetIndex]['idPenugasan'] ?? ($payload['idPenugasan'] ?? null);
            $dgRecordsAppr = muatDatabaseDualGate($dualGateDbFile);
            $matchedDgIdx = -1;
            foreach ($dgRecordsAppr as $dgi => $dgr) {
                if (($idPenugasanReq && ($dgr['idPenugasan'] ?? '') === $idPenugasanReq) || (($dgr['noPermintaan'] ?? '') === $noReq)) {
                    $matchedDgIdx = $dgi;
                    break;
                }
            }

            if ($matchedDgIdx >= 0) {
                $statusG2Appr = $dgRecordsAppr[$matchedDgIdx]['gerbang2']['status'] ?? '';
                if ($statusG2Appr !== 'SIAP_TERBIT_NOLAP') {
                    return [
                        'success'   => false,
                        'http_code' => 403,
                        'error'     => "Akses Ditolak: Nomor Laporan Definitif hanya dapat diterbitkan jika kedua gerbang mitigasi telah berstatus 'SIAP_TERBIT_NOLAP' (Status saat ini: '{$statusG2Appr}').",
                        'violation' => 'UNAPPROVED_NOLAP_ISSUANCE_ATTEMPT'
                    ];
                }
            }

            $isQAVerified = !empty($freshRecords[$targetIndex]['checklistQa']) || 
                            !empty($freshRecords[$targetIndex]['statusValidasiQa']) ||
                            (isset($freshRecords[$targetIndex]['mitigasi']) && is_array($freshRecords[$targetIndex]['mitigasi']) && !empty($freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen']) && $freshRecords[$targetIndex]['mitigasi']['spm_penilaian']['statusDokumen'] === 'APPROVED') ||
                            ($matchedDgIdx >= 0) ||
                            !empty($payload['bypassQA']);`;

if (content.includes(oldApproveGuard)) {
  content = content.replace(oldApproveGuard, newApproveGuard);
  console.log('ApproveRequest guard updated with Dual Gate check.');
}

// Update approveRequest mutation to sync with Dual Gate
const oldApproveMut = `$freshRecords[$targetIndex]['status'] = 'Nomor Terbit & Final';
            $freshRecords[$targetIndex]['statusLegacy'] = 'NOMOR DITERBITKAN';
            $freshRecords[$targetIndex]['nomorLaporan'] = $noLap;
            $freshRecords[$targetIndex]['tglTerbit'] = $tglTerbit;
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['authoritativeSSOT'] = 'CPANEL_PHP_NOLAP_DB';
            $freshRecords[$targetIndex]['approvedAt'] = date('Y-m-d H:i:s');`;

const newApproveMut = `$freshRecords[$targetIndex]['status'] = 'Nomor Terbit & Final';
            $freshRecords[$targetIndex]['statusLegacy'] = 'NOMOR DITERBITKAN';
            $freshRecords[$targetIndex]['statusTandaTangan'] = 'MENUNGGU_TTD_PENILAI';
            $freshRecords[$targetIndex]['nomorLaporan'] = $noLap;
            $freshRecords[$targetIndex]['tglTerbit'] = $tglTerbit;
            $freshRecords[$targetIndex]['catatanAdmin'] = $catatanAdmin;
            $freshRecords[$targetIndex]['authoritativeSSOT'] = 'CPANEL_PHP_NOLAP_DB';
            $freshRecords[$targetIndex]['approvedAt'] = date('Y-m-d H:i:s');

            if ($matchedDgIdx >= 0) {
                $dgRecordsAppr[$matchedDgIdx]['finalisasi']['nomorLaporanDefinitif'] = $noLap;
                $dgRecordsAppr[$matchedDgIdx]['finalisasi']['diterbitkanPada'] = date('c');
                $dgRecordsAppr[$matchedDgIdx]['finalisasi']['diterbitkanOleh'] = $currentUser['nama'] ?? $userDisplayName;
                $dgRecordsAppr[$matchedDgIdx]['finalisasi']['statusTandaTangan'] = 'MENUNGGU_TTD_PENILAI';
                $dgRecordsAppr[$matchedDgIdx]['finalisasi']['statusAkhir'] = 'NOMOR_DITERBITKAN';
                simpanDatabaseDualGate($dualGateDbFile, $dgRecordsAppr);

                $penilaiSubAppr = $dgRecordsAppr[$matchedDgIdx]['penugasan']['penilaiPublikId'] ?? '';
                $emailPenilaiAppr = ($penilaiSubAppr === 'nanang_penilai') ? 'nanang.rahayu@kjppnanangrahayu.com' : 'deni.siswandi@kjppnanangrahayu.com';
                antrekanEmailDualGate($mailQueueFile, [
                    'event'         => 'NOLAP_ISSUED_READY_SIGN',
                    'idPenugasan'   => $dgRecordsAppr[$matchedDgIdx]['idPenugasan'],
                    'recipient'     => $emailPenilaiAppr,
                    'recipientName' => $dgRecordsAppr[$matchedDgIdx]['penugasan']['penilaiPublikDitunjuk'] ?? 'Penilai Publik',
                    'subject'       => "[OPINI NSR] Nomor Laporan Diterbitkan - Menunggu Tanda Tangan: {$noLap}",
                    'body'          => "Yth. Penilai Publik Penanggung Jawab,\\n\\nNomor Laporan Definitif telah resmi diterbitkan oleh Admin Pusat: {$noLap}.\\nMohon melakukan pemeriksaan dokumen final dan membubuhkan tanda tangan resmi di Portal OPINI NSR."
                ]);
            }`;

if (content.includes(oldApproveMut)) {
  content = content.replace(oldApproveMut, newApproveMut);
  console.log('ApproveRequest mutation updated with Dual Gate synchronization.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('nolap-data-handler.php fully updated with Dual Gate Engine!');
