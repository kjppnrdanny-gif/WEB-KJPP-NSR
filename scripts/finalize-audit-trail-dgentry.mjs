import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');

// Replace dgEntry and response in publishMandiriCabangLP
const targetChunk = `            'disetujui_oleh' => $pejabatOtorisasi,
            'pejabatOtorisasi' => $pejabatOtorisasi,
            'pejabat_otorisasi' => $pejabatOtorisasi,
            'tujuanPenilaian' => $payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? 'Agunan Bank'),
            'jenisObjek' => $payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? 'Properti'),
            'namaKlien' => $payload['namaKlien'] ?? ($payload['pemberi_tugas_nama'] ?? 'Klien'),
            'namaDebitur' => $payload['namaDebitur'] ?? ($payload['debitur_nama'] ?? '-'),
            'penugasan' => [
                'penilaiPublikDitunjuk' => $pejabatNama,
                'penilaiPublikId' => $branchConfig['rekan_id'],
                'penilaiPublikIzin' => $pejabatIzin,
                'rekanKlasifikasi' => $branchConfig['rekan_klasifikasi'],
                'originBranchId' => $matchedBranchKey,
                'signingOffice' => $matchedBranchKey
            ],
            'gerbang1' => [
                'status' => 'LP_DITERBITKAN',
                'jalur' => 'MANDIRI_CABANG',
                'nomorLpResmi' => $nomorLpResmi,
                'nomorAdmResmi' => $nomorAdmResmi,
                'diterbitkanPada' => $nowWib,
                'diterbitkanOleh' => $pejabatOtorisasi,
                'pejabatBerwenang' => $pejabatNama,
                'nomorIzinPejabat' => $pejabatIzin,
                'kantorPenerbit' => "Kantor Cabang {$matchedBranchKey}"
            ],
            'pengaju' => $payload['pengaju'] ?? [
                'nama' => $payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName),
                'nik' => $payload['pengaju_nik'] ?? '-',
                'email' => $payload['pengaju_email'] ?? '',
                'whatsapp_number' => $payload['pengaju_wa'] ?? ''
            ],
            'projectData' => $payload['projectData'] ?? $payload
        ];

        if ($targetIdx >= 0) {
            $dgRecords[$targetIdx] = array_merge($dgRecords[$targetIdx], $dgEntry);
        } else {
            $dgRecords[] = $dgEntry;
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => "Nomor Lingkup Penugasan (SPK) & Job Order resmi Mandiri Cabang {$matchedBranchKey} berhasil diterbitkan dan disimpan secara resmi di server.",
            'idPenugasan' => $idPenugasan,
            'status' => 'APPROVED',
            'status_approval' => 'APPROVED_CABANG',
            'jalur' => 'MANDIRI_CABANG',
            'nomorLpResmi' => $nomorLpResmi,
            'nomorAdmResmi' => $nomorAdmResmi,
            'diterbitkanOleh' => $pejabatOtorisasi,
            'pejabatBerwenang' => $pejabatNama,
            'nomorIzinPejabat' => $pejabatIzin,
            'kantorWilayah' => "Kantor Cabang {$matchedBranchKey}"
        ]);`;

const replacementChunk = `            'disetujui_oleh' => $pejabatOtorisasi,
            'pejabatOtorisasi' => $pejabatOtorisasi,
            'pejabat_otorisasi' => $pejabatOtorisasi,
            'penginput' => $penginputData,
            'pejabat_pengesah' => $pejabatPengesah,
            'waktu_input' => $waktuInput,
            'waktu_pengesahan' => $nowWib,
            'audit_trail' => [$auditTrailItem],
            'tujuanPenilaian' => $payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? 'Agunan Bank'),
            'jenisObjek' => $payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? 'Properti'),
            'namaKlien' => $payload['namaKlien'] ?? ($payload['pemberi_tugas_nama'] ?? 'Klien'),
            'namaDebitur' => $payload['namaDebitur'] ?? ($payload['debitur_nama'] ?? '-'),
            'penugasan' => [
                'penilaiPublikDitunjuk' => $pejabatNama,
                'penilaiPublikId' => $branchConfig['rekan_id'],
                'penilaiPublikIzin' => $pejabatIzin,
                'rekanKlasifikasi' => $branchConfig['rekan_klasifikasi'],
                'originBranchId' => $matchedBranchKey,
                'signingOffice' => $matchedBranchKey
            ],
            'gerbang1' => [
                'status' => 'LP_DITERBITKAN',
                'jalur' => 'MANDIRI_CABANG',
                'nomorLpResmi' => $nomorLpResmi,
                'nomorAdmResmi' => $nomorAdmResmi,
                'diterbitkanPada' => $nowWib,
                'waktu_input' => $waktuInput,
                'waktu_pengesahan' => $nowWib,
                'penginput' => $penginputData,
                'pejabat_pengesah' => $pejabatPengesah,
                'diterbitkanOleh' => $pejabatOtorisasi,
                'pejabatBerwenang' => $pejabatNama,
                'nomorIzinPejabat' => $pejabatIzin,
                'kantorPenerbit' => "Kantor Cabang {$matchedBranchKey}"
            ],
            'pengaju' => $payload['pengaju'] ?? [
                'nama' => $payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName),
                'nik' => $payload['pengaju_nik'] ?? '-',
                'email' => $payload['pengaju_email'] ?? '',
                'whatsapp_number' => $payload['pengaju_wa'] ?? ''
            ],
            'projectData' => $payload['projectData'] ?? $payload
        ];

        if ($targetIdx >= 0) {
            $dgRecords[$targetIdx] = array_merge($dgRecords[$targetIdx], $dgEntry);
        } else {
            $dgRecords[] = $dgEntry;
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => "Nomor Lingkup Penugasan (SPK) & Job Order resmi Mandiri Cabang {$matchedBranchKey} berhasil disahkan oleh Pimpinan Cabang ({$pejabatNama}) dan disimpan secara resmi di server.",
            'idPenugasan' => $idPenugasan,
            'status' => 'APPROVED',
            'status_approval' => 'APPROVED_CABANG',
            'jalur' => 'MANDIRI_CABANG',
            'nomorLpResmi' => $nomorLpResmi,
            'nomorAdmResmi' => $nomorAdmResmi,
            'penginput' => $penginputData,
            'pejabat_pengesah' => $pejabatPengesah,
            'waktu_input' => $waktuInput,
            'waktu_pengesahan' => $nowWib,
            'diterbitkanOleh' => $pejabatOtorisasi,
            'pejabatBerwenang' => $pejabatNama,
            'nomorIzinPejabat' => $pejabatIzin,
            'kantorWilayah' => "Kantor Cabang {$matchedBranchKey}"
        ]);`;

content = content.replace(targetChunk.replace(/\r\n/g, '\n'), replacementChunk.replace(/\r\n/g, '\n'));
content = content.replace(targetChunk, replacementChunk);

fs.writeFileSync(filePath, content, 'utf8');
console.log('nolap-data-handler.php updated successfully with dgEntry audit fields');
