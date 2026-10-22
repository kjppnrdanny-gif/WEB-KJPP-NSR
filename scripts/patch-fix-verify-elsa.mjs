import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `        if ($foundDgIndex !== -1) {
            $dgRecords[$foundDgIndex]['linkElsa'] = $linkElsa;
            $dgRecords[$foundDgIndex]['statusElsa'] = $statusElsa;
            $dgRecords[$foundDgIndex]['elsaVerifiedAt'] = $nowWib;
            $dgRecords[$foundDgIndex]['elsaVerifiedBy'] = $verifiedBy;
            simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
        // Trigger Notifikasi Otomatis Pengajuan JO Diterima
        kirimNotifikasiWorkflow(
            'PENGAJUAN_JO_DITERIMA',
            $idPenugasan,
            $newRecord['noPermintaan'],
            $pengajuSnapshot,
            [
                'status' => $statusAwal,
                'namaKlien' => $klien,
                'jenisObjek' => $objek,
                'penilaiPublik' => $penilaiDitunjuk,
                'catatan' => 'Permohonan JO telah masuk ke sistem dan dalam antrean review Gerbang 1.'
            ],
            $dataDir
        );
            $targetDgRecord = $dgRecords[$foundDgIndex];
        }`;

const replacement = `        if ($foundDgIndex !== -1) {
            $dgRecords[$foundDgIndex]['linkElsa'] = $linkElsa;
            $dgRecords[$foundDgIndex]['statusElsa'] = $statusElsa;
            $dgRecords[$foundDgIndex]['elsaVerifiedAt'] = $nowWib;
            $dgRecords[$foundDgIndex]['elsaVerifiedBy'] = $verifiedBy;
            simpanDatabaseDualGate($dualGateDbFile, $dgRecords);
            $targetDgRecord = $dgRecords[$foundDgIndex];
        }`;

if (!content.includes(target)) {
  throw new Error('target not found in nolap-data-handler.php');
}
content = content.replace(target, replacement);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully cleaned verifyElsaQrReport in nolap-data-handler.php');
