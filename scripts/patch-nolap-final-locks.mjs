import fs from 'fs';

let nolap = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');

// 1. Perbaiki finalizeBookingReport dengan kontrol duplikasi, persetujuan, rekonsiliasi & audit
const oldBookingBlock = `                if (!empty($payload['revisiPeriodeBulanResmi']) && in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
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

const newBookingBlock = `                if (!empty($payload['revisiPeriodeBulanResmi'])) {
                    // 1. OTORISASI: Wajib Admin Pusat atau SUPER ADMIN (KING)
                    if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {
                        http_response_code(403);
                        echo json_encode([
                            'success'   => false,
                            'error'     => 'Akses Ditolak (403 Forbidden): Koreksi periode nomor laporan booking hanya dapat disetujui oleh Admin Pusat atau SUPER ADMIN.',
                            'violation' => 'UNAUTHORIZED_BOOKING_PERIOD_REVISION'
                        ]);
                        exit;
                    }

                    // 2. JUSTIFIKASI: Alasan koreksi wajib diisi
                    $alasanKoreksi = trim($payload['alasanKoreksi'] ?? '');
                    if (empty($alasanKoreksi) || strlen($alasanKoreksi) < 8) {
                        http_response_code(422);
                        echo json_encode([
                            'success'   => false,
                            'error'     => 'Koreksi nomor ditolak (422): Alasan justifikasi koreksi periode nomor booking wajib diisi lengkap (minimal 8 karakter).',
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
                            'success'   => false,
                            'error'     => "Koreksi periode nomor booking ditolak: Nomor '{$newNo}' sudah terdaftar pada dokumen {$conflictOwner}. Blokir anti-duplikasi aktif.",
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

if (nolap.includes(oldBookingBlock)) {
  nolap = nolap.replace(oldBookingBlock, newBookingBlock);
  console.log('✔ finalizeBookingReport audit and duplicate control patched');
} else {
  console.log('❌ oldBookingBlock not found in nolap');
}

// 2. Perbaiki validasi Segmen 4 (Industri) di approveRequest
const oldApproveNpwpCheck = `        // Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1' (Kode NPWP Klien)
        $segsNoLap = explode('/', $noLap);
        if (count($segsNoLap) >= 7) {
            $seg6 = trim($segsNoLap[5] ?? '');
            if ($seg6 !== '0' && $seg6 !== '1') {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'error' => "Format nomor laporan '{$noLap}' tidak memenuhi SE-6/PPPK/2018: Segmen ke-6 adalah Kode NPWP Klien dan HANYA boleh bernilai '1' (Ber-NPWP) atau '0' (Non-NPWP). Penggunaan huruf 'B' atau kode status booking dilarang keras pada nomor resmi Kemenkeu.",
                    'violation' => 'INVALID_SEGMENT_6_NPWP_CODE'
                ]);
                exit;
            }
        }`;

const newApproveNpwpCheck = `        // Validasi Kepatuhan SE-6/PPPK/2018: Segmen 4 (Industri 01-12) & Segmen 6 (NPWP 0/1)
        $segsNoLap = explode('/', $noLap);
        if (count($segsNoLap) >= 7) {
            $seg4 = trim($segsNoLap[3] ?? '');
            $validIndSeg4 = resolveKodeIndustri($seg4);
            if (!$validIndSeg4) {
                http_response_code(422);
                echo json_encode([
                    'success'   => false,
                    'error'     => "Format nomor laporan '{$noLap}' tidak memenuhi ketentuan: Segmen ke-4 adalah Kode Industri ('{$seg4}') dan wajib bernilai '01' s/d '12' sesuai Master Baku Sektor Industri.",
                    'violation' => 'INVALID_SEGMENT_4_INDUSTRY_CODE'
                ]);
                exit;
            }
            $seg6 = trim($segsNoLap[5] ?? '');
            if ($seg6 !== '0' && $seg6 !== '1') {
                http_response_code(422);
                echo json_encode([
                    'success'   => false,
                    'error'     => "Format nomor laporan '{$noLap}' tidak memenuhi SE-6/PPPK/2018: Segmen ke-6 adalah Kode NPWP Klien dan HANYA boleh bernilai '1' (Ber-NPWP) atau '0' (Non-NPWP). Penggunaan huruf 'B' atau kode status booking dilarang keras pada nomor resmi Kemenkeu.",
                    'violation' => 'INVALID_SEGMENT_6_NPWP_CODE'
                ]);
                exit;
            }
        }`;

if (nolap.includes(oldApproveNpwpCheck)) {
  nolap = nolap.replace(oldApproveNpwpCheck, newApproveNpwpCheck);
  console.log('✔ approveRequest Segment 4 & Segment 6 validation patched');
} else {
  console.log('❌ oldApproveNpwpCheck not found in nolap');
}

// 3. Perbaiki otorisasi restoreBackup
const oldRestoreAuth = `    if ($action === 'restoreBackup') {
        if ($userRole !== 'ADMIN_PUSAT') {`;
const newRestoreAuth = `    if ($action === 'restoreBackup') {
        if (!in_array($userRole, ['ADMIN_PUSAT', 'SUPER_ADMIN'], true)) {`;

if (nolap.includes(oldRestoreAuth)) {
  nolap = nolap.replace(oldRestoreAuth, newRestoreAuth);
  console.log('✔ restoreBackup authorization for SUPER_ADMIN & ADMIN_PUSAT patched');
} else {
  console.log('❌ oldRestoreAuth not found in nolap');
}

fs.writeFileSync('nolap-data-handler.php', nolap, 'utf8');
console.log('=== NOLAP PATCH COMPLETED ===');
