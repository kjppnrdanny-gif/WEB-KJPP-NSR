import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');

function safeReplace(str, search, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normSearch)) {
    throw new Error('Search target not found in file: ' + normSearch.substring(0, 80));
  }
  const result = normStr.replace(normSearch, normRepl);
  return result.replace(/\n/g, '\r\n');
}

// 1. UPDATE publishOfficialLP
const searchPublishLp = `    // 4. PENERBITAN NOMOR LINGKUP PENUGASAN RESMI OLEH ADMIN PUSAT / SUPER ADMIN
    if ($action === 'publishOfficialLP') {
        if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Penerbitan nomor Lingkup Penugasan resmi mutlak wewenang Admin Kantor Pusat atau SUPER ADMIN.']);
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

        // Idempotency: Jika nomor LP resmi sudah ada, kembalikan nomor yang sama
        if (!empty($dgRecords[$targetIdx]['gerbang1']['nomorLpResmi']) && ($dgRecords[$targetIdx]['gerbang1']['status'] ?? '') === 'LP_DITERBITKAN') {
            echo json_encode([
                'success' => true,
                'alreadyIssued' => true,
                'message' => 'Nomor Lingkup Penugasan resmi sudah diterbitkan sebelumnya.',
                'idPenugasan' => $idPenugasan,
                'nomorLpResmi' => $dgRecords[$targetIdx]['gerbang1']['nomorLpResmi'],
                'status' => 'LP_DITERBITKAN'
            ]);
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
        if (!empty($dgRecords[$targetIdx]['pengaju'])) {
            kirimNotifikasiWorkflow(
                'PENERBITAN_LP',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $dgRecords[$targetIdx]['pengaju'],
                [
                    'status' => 'LP_DITERBITKAN',
                    'nomorLp' => $nomorLpResmi,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Nomor Lingkup Penugasan (LP) resmi ({$nomorLpResmi}) telah diterbitkan oleh Admin Pusat."
                ],
                $dataDir
            );
        }

        echo json_encode([
            'success' => true,
            'message' => 'Nomor Lingkup Penugasan resmi berhasil diterbitkan.',
            'idPenugasan' => $idPenugasan,
            'status' => 'LP_DITERBITKAN',
            'newStatus' => 'LP_DITERBITKAN',
            'nomorLpResmi' => $nomorLpResmi
        ]);
        exit;
    }`;

const replPublishLp = `    // 4. PENERBITAN NOMOR LINGKUP PENUGASAN (SPK) & JOB ORDER (JO) RESMI OLEH ADMIN PUSAT / SUPER ADMIN KING
    if ($action === 'publishOfficialLP') {
        if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Akses Ditolak: Penerbitan nomor SPK & JO resmi mutlak wewenang Admin Kantor Pusat atau SUPER ADMIN (KING).']);
            exit;
        }

        $idPenugasan = $payload['idPenugasan'] ?? '';
        $nomorLpResmi = trim($payload['nomorLpResmi'] ?? ($payload['nomorLp'] ?? ''));
        $nomorAdmResmi = trim($payload['nomorAdmResmi'] ?? ($payload['nomorAdm'] ?? ''));
        $kantorWilayah = trim($payload['kantorWilayah'] ?? ($payload['kantor_wilayah'] ?? ''));
        $tanggalSurat = trim($payload['tanggalSurat'] ?? ($payload['tanggal_surat'] ?? ''));
        $jenisLaporan = trim($payload['jenisLaporan'] ?? ($payload['jenis_laporan'] ?? ''));

        if (!$nomorLpResmi) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nomor Lingkup Penugasan (SPK) resmi wajib diisi.']);
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

        // Idempotency: Jika nomor LP resmi sudah sama dan status sudah LP_DITERBITKAN
        if (!empty($dgRecords[$targetIdx]['gerbang1']['nomorLpResmi']) &&
            ($dgRecords[$targetIdx]['gerbang1']['status'] ?? '') === 'LP_DITERBITKAN' &&
            strcasecmp($dgRecords[$targetIdx]['gerbang1']['nomorLpResmi'], $nomorLpResmi) === 0) {
            echo json_encode([
                'success' => true,
                'alreadyIssued' => true,
                'message' => 'Nomor Lingkup Penugasan resmi sudah diterbitkan sebelumnya.',
                'idPenugasan' => $idPenugasan,
                'nomorLpResmi' => $dgRecords[$targetIdx]['gerbang1']['nomorLpResmi'],
                'nomorAdmResmi' => $dgRecords[$targetIdx]['gerbang1']['nomorAdmResmi'] ?? '',
                'status' => 'LP_DITERBITKAN'
            ]);
            exit;
        }

        // Validasi Anti-Duplikasi Keras (Berlaku Mutlak Termasuk bagi SUPER ADMIN KING)
        foreach ($dgRecords as $r) {
            if (($r['idPenugasan'] ?? '') !== $idPenugasan && ($r['gerbang1']['status'] ?? '') !== 'VOID' && ($r['gerbang1']['status'] ?? '') !== 'DIBATALKAN') {
                $existLp = trim($r['gerbang1']['nomorLpResmi'] ?? ($r['nomorLp'] ?? ''));
                if ($existLp && strcasecmp($existLp, $nomorLpResmi) === 0) {
                    http_response_code(409); // 409 Conflict
                    echo json_encode([
                        'success' => false,
                        'error' => "Penetapan ditolak (Nomor Duplikat): Nomor SPK '{$nomorLpResmi}' sudah terdaftar pada penugasan {$r['idPenugasan']} ({$r['namaKlien']}). Sistem menolak duplikasi demi integritas register.",
                        'violation' => 'DUPLICATE_SPK_NUMBER'
                    ]);
                    exit;
                }
                $existAdm = trim($r['gerbang1']['nomorAdmResmi'] ?? ($r['nomorAdm'] ?? ''));
                if ($nomorAdmResmi && $existAdm && strcasecmp($existAdm, $nomorAdmResmi) === 0) {
                    http_response_code(409); // 409 Conflict
                    echo json_encode([
                        'success' => false,
                        'error' => "Penetapan ditolak (Nomor Duplikat): Nomor JO '{$nomorAdmResmi}' sudah terdaftar pada penugasan {$r['idPenugasan']} ({$r['namaKlien']}). Sistem menolak duplikasi demi integritas register.",
                        'violation' => 'DUPLICATE_JO_NUMBER'
                    ]);
                    exit;
                }
            }
        }

        $currentStatus = $dgRecords[$targetIdx]['gerbang1']['status'] ?? '';
        if (!in_array($currentStatus, ['SIAP_TERBIT_LP', 'LP_TERVERIFIKASI', 'WAITING_APPROVAL', 'DALAM_PROSES'], true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => "Akses Ditolak: Lingkup Penugasan belum memenuhi syarat penerbitan (Status saat ini: '{$currentStatus}')."]);
            exit;
        }

        $nowWib = date('c');
        $dgRecords[$targetIdx]['gerbang1']['status'] = 'LP_DITERBITKAN';
        $dgRecords[$targetIdx]['gerbang1']['nomorLpResmi'] = $nomorLpResmi;
        $dgRecords[$targetIdx]['gerbang1']['nomorAdmResmi'] = $nomorAdmResmi;
        $dgRecords[$targetIdx]['gerbang1']['diterbitkanPada'] = $nowWib;
        $dgRecords[$targetIdx]['gerbang1']['diterbitkanOleh'] = ($userRole === 'SUPER_ADMIN') ? 'SUPER ADMIN (KING)' : ($currentUser['nama'] ?? $userDisplayName);
        $dgRecords[$targetIdx]['nomorLp'] = $nomorLpResmi;
        if ($nomorAdmResmi) $dgRecords[$targetIdx]['nomorAdm'] = $nomorAdmResmi;
        if ($kantorWilayah) $dgRecords[$targetIdx]['kantorWilayah'] = $kantorWilayah;
        if ($tanggalSurat) $dgRecords[$targetIdx]['tanggalSurat'] = $tanggalSurat;
        if ($jenisLaporan) $dgRecords[$targetIdx]['jenisLaporan'] = $jenisLaporan;

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Update Smart Register Resmi (LP_SPK & JO) secara Atomik
        $regLock = $dataDir . '/register_config.lock';
        $fpRegLock = fopen($regLock, 'c+');
        if ($fpRegLock && flock($fpRegLock, LOCK_EX)) {
            $regList = muatRegisterConfig($registerConfigFile);
            $seqLp = (int)preg_replace('/\\D/', '', explode('/', $nomorLpResmi)[0] ?? '0');
            $seqAdm = $nomorAdmResmi ? (int)preg_replace('/\\D/', '', explode('/', $nomorAdmResmi)[0] ?? '0') : 0;

            foreach ($regList as &$rg) {
                if (($rg['kantor'] ?? '') === 'Pusat' && ($rg['periode'] ?? '') === '2026') {
                    if (($rg['jenisDokumen'] ?? '') === 'LP_SPK' && $seqLp > 0) {
                        $padSeq = str_pad($seqLp, 4, '0', STR_PAD_LEFT);
                        if (!in_array($padSeq, $rg['nomorTerpakai'] ?? [], true)) {
                            $rg['nomorTerpakai'][] = $padSeq;
                        }
                        if ($seqLp > (int)($rg['nomorTerakhir'] ?? 0)) {
                            $rg['nomorTerakhir'] = $seqLp;
                            $rg['kandidatBerikutnya'] = str_pad($seqLp + 1, 4, '0', STR_PAD_LEFT);
                        }
                        $rg['status'] = 'AKTIF';
                        $rg['updatedAt'] = $nowWib;
                    }
                    if (($rg['jenisDokumen'] ?? '') === 'JO' && $seqAdm > 0) {
                        $padSeq = str_pad($seqAdm, 4, '0', STR_PAD_LEFT);
                        if (!in_array($padSeq, $rg['nomorTerpakai'] ?? [], true)) {
                            $rg['nomorTerpakai'][] = $padSeq;
                        }
                        if ($seqAdm > (int)($rg['nomorTerakhir'] ?? 0)) {
                            $rg['nomorTerakhir'] = $seqAdm;
                            $rg['kandidatBerikutnya'] = str_pad($seqAdm + 1, 4, '0', STR_PAD_LEFT);
                        }
                        $rg['status'] = 'AKTIF';
                        $rg['updatedAt'] = $nowWib;
                    }
                }
            }
            unset($rg);
            simpanRegisterConfig($registerConfigFile, $regList);
            flock($fpRegLock, LOCK_UN);
            fclose($fpRegLock);
        }

        // Pengiriman Notifikasi Email & Sedia WhatsApp Siap Kirim (Gunakan Kontak Manual Pengaju pada Permohonan)
        $pengajuKontak = $dgRecords[$targetIdx]['pengaju'] ?? ($payload['pengaju'] ?? []);
        $notifResult = null;
        if (!empty($pengajuKontak['email']) || !empty($pengajuKontak['whatsapp_number'])) {
            $notifResult = kirimNotifikasiWorkflow(
                'PENERBITAN_LP',
                $idPenugasan,
                $dgRecords[$targetIdx]['noPermintaan'] ?? $idPenugasan,
                $pengajuKontak,
                [
                    'status' => 'LP_DITERBITKAN',
                    'nomorLp' => $nomorLpResmi,
                    'nomorAdm' => $nomorAdmResmi,
                    'namaKlien' => $dgRecords[$targetIdx]['namaKlien'] ?? '-',
                    'catatan' => "Nomor Lingkup Penugasan (SPK) resmi [{$nomorLpResmi}]" . ($nomorAdmResmi ? " dan No. JO [{$nomorAdmResmi}]" : "") . " telah diterbitkan secara sah oleh " . ($userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN (KING)' : 'Admin Pusat') . "."
                ],
                $dataDir
            );
        }

        echo json_encode([
            'success' => true,
            'message' => 'Nomor Lingkup Penugasan (SPK) dan JO resmi berhasil diterbitkan.',
            'idPenugasan' => $idPenugasan,
            'status' => 'LP_DITERBITKAN',
            'newStatus' => 'LP_DITERBITKAN',
            'nomorLpResmi' => $nomorLpResmi,
            'nomorAdmResmi' => $nomorAdmResmi,
            'whatsappUrl' => $notifResult['whatsapp_url'] ?? '',
            'emailStatus' => $notifResult['email_status'] ?? 'QUEUED'
        ]);
        exit;
    }`;

content = safeReplace(content, searchPublishLp, replPublishLp);
console.log('Step 1: publishOfficialLP in nolap-data-handler.php patched.');

// 2. UPDATE approveRequest RBAC to include SUPER_ADMIN
const searchApprReqRbac = `    if ($action === 'approveRequest') {
        if ($userRole !== 'ADMIN_PUSAT') {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang approval resmi mutlak milik Admin Kantor Pusat.',
                'violation' => 'UNAUTHORIZED_APPROVAL_ATTEMPT'
            ]);
            exit;
        }`;

const replApprReqRbac = `    if ($action === 'approveRequest') {
        if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
            http_response_code(403);
            echo json_encode([
                'success'   => false,
                'error'     => 'Akses Ditolak (403 Forbidden): Wewenang approval resmi mutlak milik Admin Kantor Pusat atau SUPER ADMIN (KING).',
                'violation' => 'UNAUTHORIZED_APPROVAL_ATTEMPT'
            ]);
            exit;
        }`;

content = safeReplace(content, searchApprReqRbac, replApprReqRbac);
console.log('Step 2: approveRequest RBAC in nolap-data-handler.php patched.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully saved nolap-data-handler.php changes.');
