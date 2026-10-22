import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `        // Resolusi Klasifikasi Jasa Penilaian & Kode Laporan Resmi (P0 Compliance)
        $rawServiceInput = $payload['service_classification_id'] ?? $payload['klasifikasiJasa'] ?? 'PROPERTY';
        $serviceDetails = resolveServiceClassificationDetails($rawServiceInput);`;

const replacement = `        // Resolusi Klasifikasi Jasa Penilaian & Kode Laporan Resmi (P0 Compliance)
        $rawServiceInput = $payload['service_classification_id'] ?? $payload['klasifikasiJasa'] ?? '';
        if (empty($rawServiceInput)) {
            if (($pObj['klasifikasi'] ?? '') === 'PS' || (stripos($objek, 'sederhana') !== false)) {
                $rawServiceInput = 'PS';
            } else {
                $rawServiceInput = 'PROPERTY';
            }
        }
        $serviceDetails = resolveServiceClassificationDetails($rawServiceInput);`;

if (!content.includes(target)) {
  throw new Error('target not found in nolap-data-handler.php');
}
content = content.replace(target, replacement);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully updated rawServiceInput smart resolution in submitGerbang1Awal');
