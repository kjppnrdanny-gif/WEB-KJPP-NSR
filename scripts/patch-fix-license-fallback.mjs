import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');
const handlerPath = path.join(projectRoot, 'nolap-data-handler.php');
let content = fs.readFileSync(handlerPath, 'utf8');

const isCrlf = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const oldBlock = `$penilaiDitunjuk = $payload['penilaiPublikDitunjuk'] ?? 'Deni Siswandi, S.T., MAPPI (Cert.)';
        $penilaiId = $payload['penilaiPublikId'] ?? 'deni_penilai';
        $checklist = $payload['checklistAwal'] ?? [];

        // Evaluasi Red Flag & Konflik Kepentingan
        $hasConflict = !empty($checklist['konflikKepentingan']) && $checklist['konflikKepentingan'] === true;
        $hasRedFlag = !empty($checklist['redFlagLegalitas']) && $checklist['redFlagLegalitas'] === true;

        $statusAwal = ($hasConflict || $hasRedFlag) ? 'HOLD_ESKALASI_AWAL' : 'MENUNGGU_SPM_AWAL';
        $nowWib = date('c');

        $originBranchId = $payload['origin_branch_id'] ?? ($currentUser['wilayah'] ?? $userBranch ?? 'Pusat');
        $originBranchCode = $payload['origin_branch_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00');
        $requestedSigningOffice = strtoupper(trim($payload['requested_signing_office'] ?? ($originBranchId === 'Pusat' ? 'PUSAT' : 'PUSAT')));
        $signingOfficeCode = ($requestedSigningOffice === 'PUSAT') ? '2.0160-00' : ($payload['signing_office_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00'));
        $appraiserLicenseCode = $payload['appraiser_license_code'] ?? (($penilaiId === 'nanang_penilai') ? '0218' : '00581');`;

const newBlock = `$penilaiId = $payload['penilaiPublikId'] ?? '';
        $rawDitunjuk = $payload['penilaiPublikDitunjuk'] ?? '';
        $pObj = cariMasterPenilaiPublik($mastersDir, $penilaiId ?: $rawDitunjuk);
        $penilaiId = $pObj['id'] ?? 'deni_penilai';
        $penilaiDitunjuk = $payload['penilaiPublikDitunjuk'] ?? ($pObj['nama'] ?? 'Deni Siswandi, S.T., MAPPI (Cert.)');
        $checklist = $payload['checklistAwal'] ?? [];

        // Evaluasi Red Flag & Konflik Kepentingan
        $hasConflict = !empty($checklist['konflikKepentingan']) && $checklist['konflikKepentingan'] === true;
        $hasRedFlag = !empty($checklist['redFlagLegalitas']) && $checklist['redFlagLegalitas'] === true;

        $statusAwal = ($hasConflict || $hasRedFlag) ? 'HOLD_ESKALASI_AWAL' : 'MENUNGGU_SPM_AWAL';
        $nowWib = date('c');

        $originBranchId = $payload['origin_branch_id'] ?? ($currentUser['wilayah'] ?? $userBranch ?? 'Pusat');
        $originBranchCode = $payload['origin_branch_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00');
        $requestedSigningOffice = strtoupper(trim($payload['requested_signing_office'] ?? ($originBranchId === 'Pusat' ? 'PUSAT' : 'PUSAT')));
        $signingOfficeCode = ($requestedSigningOffice === 'PUSAT') ? '2.0160-00' : ($payload['signing_office_code'] ?? ($OFFICIAL_BRANCH_CODES[$originBranchId] ?? '2.0160-00'));
        $appraiserLicenseCode = $payload['appraiser_license_code'] ?? ($pObj['izin_segmen'] ?? '00581');`;

if (norm.includes(oldBlock)) {
  norm = norm.replace(oldBlock, newBlock);
  console.log('✔ Fixed submitGerbang1Awal to dynamically resolve license code for all 5 Penilai');
  const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
  fs.writeFileSync(handlerPath, finalContent, 'utf8');
} else {
  console.warn('✘ Could not find oldBlock in nolap-data-handler.php');
}
