import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('nolap-data-handler.php');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `        // Evaluasi Red Flag Baru / Deviasi Material yang Belum Terjustifikasi
        $hasUnjustifiedDeviation = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;
        $statusAkhir = $hasUnjustifiedDeviation ? 'HOLD_ESKALASI_AKHIR' : 'MENUNGGU_SPM_AKHIR';`;

const replaceStr = `        // Evaluasi Red Flag Baru / Deviasi Material yang Belum Terjustifikasi
        $hasRedFlagLegal = !empty($checklistAkhir['redFlagLegalitas']) || 
                           !empty($deltaAnalysis['redFlagLegalitas']) ||
                           !empty($deltaAnalysis['isSengketa']) ||
                           !empty($deltaAnalysis['isSitaBlokir']);
        $hasUnjustifiedDeviation = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;
        $statusAkhir = ($hasRedFlagLegal || $hasUnjustifiedDeviation) ? 'HOLD_ESKALASI_AKHIR' : 'MENUNGGU_SPM_AKHIR';`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated submitGerbang2Akhir red flag logic (LF).');
} else if (content.includes(targetStr.replace(/\n/g, '\r\n'))) {
  content = content.replace(targetStr.replace(/\n/g, '\r\n'), replaceStr.replace(/\n/g, '\r\n'));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated submitGerbang2Akhir red flag logic (CRLF).');
} else {
  console.error('Target string not found');
  process.exit(1);
}
