import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('nolap-data-handler.php');
let raw = fs.readFileSync(filePath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

console.log('Original content length (raw):', raw.length, 'hadCrlf:', hadCrlf);

// 1. Add $OFFICIAL_BRANCH_CODES definition
const targetConstants = `$mailQueueFile = $dataDir . '/mail_queue.json';`;
const replaceConstants = `$mailQueueFile = $dataDir . '/mail_queue.json';

// P0 Addendum: Master Kode Kantor & Cabang Resmi Kemenkeu RI (PPPK)
$OFFICIAL_BRANCH_CODES = [
    'Pusat'     => '2.0160-00',
    'Padang'    => '2.0160-01',
    'Makassar'  => '2.0160-02',
    'Palembang' => '2.0160-03',
    'Bandung'   => '2.0160-04'
];`;

if (!content.includes(targetConstants)) {
  throw new Error('targetConstants not found in nolap-data-handler.php');
}
content = content.replace(targetConstants, replaceConstants);
console.log('✓ [1/4] $OFFICIAL_BRANCH_CODES added.');

// 2. Update submitGerbang1Awal to capture 8 attributes
const targetG1Awal = `        $newRecord = [
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
            ],`;

const replaceG1Awal = `        $originBranchId = $payload['origin_branch_id'] ?? ($currentUser['wilayah'] ?? $userBranch ?? 'Pusat');
        $originBranchCode = $payload['origin_branch_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00');
        $requestedSigningOffice = strtoupper(trim($payload['requested_signing_office'] ?? ($originBranchId === 'Pusat' ? 'PUSAT' : 'PUSAT')));
        $signingOfficeCode = ($requestedSigningOffice === 'PUSAT') ? '2.0160-00' : ($payload['signing_office_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00'));
        $appraiserLicenseCode = $payload['appraiser_license_code'] ?? (($penilaiId === 'nanang_penilai') ? '0218' : '00581');

        $newRecord = [
            'idPenugasan' => $idPenugasan,
            'noPermintaan' => $payload['noPermintaan'] ?? ('REQ-' . date('Ymd') . '-' . substr(md5($idPenugasan), 0, 4)),
            'createdAt' => $nowWib,
            'createdBy' => $currentUser['nama'] ?? $userDisplayName,
            'createdRole' => $currentUser['role'],
            'kantorAsal' => $originBranchId,
            'origin_branch_id' => $originBranchId,
            'origin_branch_code' => $originBranchCode,
            'requested_signing_office' => $requestedSigningOffice,
            'signing_office_code' => $signingOfficeCode,
            'tujuanPenilaian' => $tujuan,
            'jenisObjek' => $objek,
            'namaKlien' => $klien,
            'penugasan' => [
                'penilaiPublikDitunjuk' => $penilaiDitunjuk,
                'penilaiPublikId' => $penilaiId,
                'appraiserLicenseCode' => $appraiserLicenseCode,
                'requestedSigningOffice' => $requestedSigningOffice,
                'signingOfficeCode' => $signingOfficeCode,
                'originBranchId' => $originBranchId,
                'originBranchCode' => $originBranchCode,
                'alasanPenunjukan' => $payload['alasanPenunjukan'] ?? 'Sesuai bidang kompetensi dan ketersediaan jadwal.'
            ],`;

if (!content.includes(targetG1Awal)) {
  throw new Error('targetG1Awal not found in nolap-data-handler.php');
}
content = content.replace(targetG1Awal, replaceG1Awal);
console.log('✓ [2/4] submitGerbang1Awal 8 attributes updated.');

// 3. Update issueDefinitiveNoLap
const targetIssueDef = `        // Tentukan nomor definitif: Gunakan nomor yang disediakan atau generate unik 7 segmen
        $noDefinitif = trim($payload['nomorLaporan'] ?? '');
        if (empty($noDefinitif)) {
            $seq = str_pad(count($dgRecords) + 530, 5, '0', STR_PAD_LEFT);
            $romawiBulan = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][(int)date('n') - 1];
            $penilaiIzin = (($dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '') === 'nanang_penilai') ? '0218' : '00581';
            $noDefinitif = "{$seq}/2.0160-00/PI/07/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');
        }`;

const replaceIssueDef = `        // Tentukan nomor definitif: Gunakan nomor yang disediakan atau generate unik 7 segmen
        $noDefinitif = trim($payload['nomorLaporan'] ?? '');
        if (empty($noDefinitif)) {
            $seq = str_pad(count($dgRecords) + 530, 5, '0', STR_PAD_LEFT);
            $romawiBulan = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][(int)date('n') - 1];
            $signingCode = $dgRecords[$targetIdx]['penugasan']['signingOfficeCode'] ?? $dgRecords[$targetIdx]['signing_office_code'] ?? '2.0160-00';
            $penilaiIzin = $dgRecords[$targetIdx]['penugasan']['appraiserLicenseCode'] ?? ((($dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '') === 'nanang_penilai') ? '0218' : '00581');
            $noDefinitif = "{$seq}/{$signingCode}/PI/07/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');
        }`;

if (!content.includes(targetIssueDef)) {
  throw new Error('targetIssueDef not found in nolap-data-handler.php');
}
content = content.replace(targetIssueDef, replaceIssueDef);
console.log('✓ [3/4] issueDefinitiveNoLap 7-segment signing office updated.');

// 4. Update submitRequest in nolap-data-handler.php
const targetSubmitReq = `        $cabangPengaju = ($userRole === 'ADMIN_PUSAT') ? ($payload['cabang'] ?? 'Pusat') : $userBranch;`;

const replaceSubmitReq = `        $cabangPengaju = ($userRole === 'ADMIN_PUSAT') ? ($payload['cabang'] ?? 'Pusat') : $userBranch;
        $originBranchId = $payload['origin_branch_id'] ?? $cabangPengaju;
        $originBranchCode = $payload['origin_branch_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00');

        $requestedSigningOffice = strtoupper(trim($payload['requested_signing_office'] ?? ($originBranchId === 'Pusat' ? 'PUSAT' : 'PUSAT')));
        if ($requestedSigningOffice === 'PUSAT') {
            $signingOfficeCode = '2.0160-00';
        } else {
            $signingOfficeCode = $payload['signing_office_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00');
        }

        $assignedAppraiserId = $payload['assigned_public_appraiser_id'] ?? ($payload['penilai'] ?? 'Ir. Nanang Rahayu');
        $appraiserLicenseCode = $payload['appraiser_license_code'] ?? ($payload['izinPenilai'] ?? '0218');`;

if (!content.includes(targetSubmitReq)) {
  throw new Error('targetSubmitReq not found in nolap-data-handler.php');
}
content = content.replace(targetSubmitReq, replaceSubmitReq);

const targetNewRec = `        $newRecord = array_merge($payload, [
            'noPermintaan' => $idReq,
            'cabang'       => $cabangPengaju,
            'namaPemohon'  => $payload['namaPemohon'] ?? $userDisplayName,
            'timestamp'    => date('Y-m-d H:i:s'),
            'dpp'          => $dpp,
            'nominalPpn'   => $ppn,
            'totalBayar'   => $totalBayar,
            'idempotencyKey'=> $idempotencyKey,
            'terbilang'    => $payload['terbilang'] ?? '',
            'status'       => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'BOOKING DIAJUKAN' : 'DIAJUKAN',
            'nomorLaporan' => '',
            'tglTerbit'    => '',
            'statusElsa'   => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'MENUNGGU BERKAS FINAL' : 'BELUM INPUT'
        ]);`;

const replaceNewRec = `        $newRecord = array_merge($payload, [
            'noPermintaan'                 => $idReq,
            'cabang'                       => $originBranchId,
            'origin_branch_id'             => $originBranchId,
            'origin_branch_code'           => $originBranchCode,
            'requested_signing_office'     => $requestedSigningOffice,
            'signing_office_code'          => $signingOfficeCode,
            'assigned_public_appraiser_id' => $assignedAppraiserId,
            'appraiser_license_code'       => $appraiserLicenseCode,
            'official_report_sequence'     => null,
            'request_status'               => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'BOOKING DIAJUKAN' : 'DIAJUKAN',
            'kewenanganTtd'                => $requestedSigningOffice,
            'kodeKantorTtd'                => $signingOfficeCode,
            'namaPemohon'                  => $payload['namaPemohon'] ?? $userDisplayName,
            'timestamp'                    => date('Y-m-d H:i:s'),
            'dpp'                          => $dpp,
            'nominalPpn'                   => $ppn,
            'totalBayar'                   => $totalBayar,
            'idempotencyKey'               => $idempotencyKey,
            'terbilang'                    => $payload['terbilang'] ?? '',
            'status'                       => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'BOOKING DIAJUKAN' : 'DIAJUKAN',
            'nomorLaporan'                 => '',
            'tglTerbit'                    => '',
            'statusElsa'                   => (!empty($payload['isBooking']) || ($payload['modePengajuan'] ?? '') === 'BOOKING') ? 'MENUNGGU BERKAS FINAL' : 'BELUM INPUT'
        ]);`;

if (!content.includes(targetNewRec)) {
  throw new Error('targetNewRec not found in nolap-data-handler.php');
}
content = content.replace(targetNewRec, replaceNewRec);
console.log('✓ [4/4] submitRequest 8 attributes stored in record.');

const finalOut = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(filePath, finalOut, 'utf8');
console.log('SUCCESS: nolap-data-handler.php patched cleanly.');
