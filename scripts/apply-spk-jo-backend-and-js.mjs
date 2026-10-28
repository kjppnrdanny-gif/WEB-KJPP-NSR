import fs from 'fs';

console.log('=== Mengaplikasikan Backend & JS Penyempurnaan SPK/JO ===');

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Tambahkan action 'submitPermintaanAwalJO' sebelum 'publishMandiriCabangLP'
const targetActionMarker = "    // 4.A. PENERBITAN RESMI LINGKUP PENUGASAN (SPK) & JOB ORDER (JO) MANDIRI CABANG (JALUR A)";
const idxTarget = php.indexOf(targetActionMarker);

if (idxTarget === -1) {
  console.error("ERROR: targetActionMarker di nolap-data-handler.php tidak ditemukan!");
  process.exit(1);
}

const submitPermintaanActionCode = `    // =========================================================================
    // 4.0. PENERIMAAN PERMINTAAN AWAL PENUGASAN (MARKETING / SURVEYOR / PENILAI BEREGISTER)
    // Mode Fast Track SPI 103: Quality Gate Tahap 1 (Pengaju)
    // =========================================================================
    if ($action === 'submitPermintaanAwalJO') {
        if (!$currentUser || empty($currentUser['role'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Sesi tidak sah. Silakan login terlebih dahulu.']);
            exit;
        }

        $nowWib = date('c');
        $idPenugasan = trim($payload['idPenugasan'] ?? ($payload['id'] ?? ''));
        if (!$idPenugasan) {
            $idPenugasan = 'NSR-REQ-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));
        }

        $noReq = trim($payload['noPermintaan'] ?? '');
        if (!$noReq || strpos($noReq, 'REQ-') !== 0) {
            $noReq = 'REQ-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 5));
        }

        $rawKantor = trim($payload['kantorWilayah'] ?? ($payload['kantor_wilayah'] ?? ($userBranch ?: 'Kantor Pusat Jakarta')));
        $branchName = trim(preg_replace('/^(Kantor\s+Cabang|Cabang|Kantor)\s+/i', '', $rawKantor));

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan || ($r['noPermintaan'] ?? '') === $noReq) {
                $targetIdx = $i;
                break;
            }
        }

        $reqEntry = [
            'idPenugasan'       => $idPenugasan,
            'noPermintaan'      => $noReq,
            'createdAt'         => $nowWib,
            'createdBy'         => $currentUser['nama'] ?? $userDisplayName,
            'createdRole'       => $userRole,
            'role_pengaju'      => $userRole,
            'kantorAsal'        => $branchName,
            'kantor_wilayah'    => $rawKantor,
            'status'            => 'MENUNGGU_VERIFIKASI_ADMIN',
            'status_approval'   => 'MENUNGGU_VERIFIKASI_ADMIN',
            'nomor_lp'          => '[Menunggu Verifikasi & Penyusunan Admin]',
            'nomor_adm'         => $noReq,
            'tujuanPenilaian'   => $payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? 'Agunan Bank'),
            'jenisObjek'        => $payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? 'Properti'),
            'namaKlien'         => $payload['namaKlien'] ?? ($payload['pemberi_tugas_nama'] ?? 'Calon Klien'),
            'namaDebitur'       => $payload['namaDebitur'] ?? ($payload['debitur_nama'] ?? '-'),
            'catatan_admin'     => 'Permintaan awal berhasil diterima. Menunggu verifikasi kelengkapan dokumen administrasi oleh Staf Admin.',
            'pengaju'           => [
                'nama'             => $payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName),
                'nik'              => $payload['pengaju_nik'] ?? '-',
                'jabatan'          => $payload['pengaju_jabatan'] ?? $userRole,
                'email'            => $payload['pengaju_email'] ?? '',
                'whatsapp_number'  => $payload['pengaju_wa'] ?? ''
            ],
            'pengguna_laporan'  => [
                'nama'             => $payload['pengguna_laporan_a'] ?? '',
                'alamat'           => $payload['pengguna_laporan_a_alamat'] ?? '',
                'pic'              => $payload['pengguna_laporan_a_pic'] ?? '',
                'jabatan'          => $payload['pengguna_laporan_a_jabatan'] ?? '',
                'kontak'           => $payload['pengguna_laporan_a_kontak'] ?? '',
                'email'            => $payload['pengguna_laporan_a_email'] ?? '',
                'bidang'           => $payload['pengguna_laporan_a_bidang'] ?? '',
                'is_sama_pemberi'  => !empty($payload['pengguna_sama_pemberi'])
            ],
            'biaya_jasa'        => [
                'is_belum_disepakati' => !empty($payload['biaya_belum_disepakati']),
                'honorarium'          => floatval($payload['biaya_honorarium'] ?? ($payload['biaya_dpp'] ?? 0)),
                'transportasi'        => floatval($payload['biaya_transportasi'] ?? 0),
                'status_transportasi' => $payload['status_transportasi'] ?? 'INCLUDED',
                'akomodasi'           => floatval($payload['biaya_akomodasi'] ?? 0),
                'status_akomodasi'    => $payload['status_akomodasi'] ?? 'INCLUDED',
                'operasional_lain'    => floatval($payload['biaya_operasional_lain'] ?? 0),
                'status_operasional'  => $payload['status_operasional_lain'] ?? 'INCLUDED',
                'dpp'                 => floatval($payload['biaya_dpp'] ?? 0),
                'ppn'                 => floatval($payload['biaya_ppn'] ?? 0),
                'total'               => floatval($payload['biaya_total'] ?? 0)
            ],
            'objek_penilaian'   => $payload['objek_rows'] ?? ($payload['objekRows'] ?? []),
            'projectData'       => $payload['projectData'] ?? $payload
        ];

        if ($targetIdx >= 0) {
            $dgRecords[$targetIdx] = array_merge($dgRecords[$targetIdx], $reqEntry);
        } else {
            $dgRecords[] = $reqEntry;
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success'      => true,
            'noPermintaan' => $noReq,
            'idPenugasan'  => $idPenugasan,
            'status'       => 'MENUNGGU_VERIFIKASI_ADMIN',
            'message'      => 'Permintaan awal penugasan berhasil dikirim ke Admin untuk verifikasi kelengkapan SPI 103.'
        ]);
        exit;
    }

`;

php = php.substring(0, idxTarget) + submitPermintaanActionCode + php.substring(idxTarget);

// 2. Koreksi $isBranchAuth di publishMandiriCabangLP: Penilai Beregister BUKAN Penilai Publik berizin!
php = php.replace(
  "$isBranchAuth = in_array($userRole, ['ADMIN_CABANG', 'PENILAI', 'PENILAI_PUBLIK', 'REKAN'], true);",
  "$isBranchAuth = in_array($userRole, ['ADMIN_CABANG', 'PENILAI_PUBLIK', 'REKAN'], true);"
);

fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('✓ Backend nolap-data-handler.php berhasil diupdate.');
