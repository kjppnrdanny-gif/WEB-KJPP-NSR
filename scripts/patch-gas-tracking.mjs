import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const gasFile = path.join(ROOT_DIR, 'gas-job-tracking.gs');
let content = fs.readFileSync(gasFile, 'utf8');

// 1. Update headersLog di handleSetupDatabase_
content = content.replace(
  /const headersLog = \[\s*'id_log'[\s\S]*?\];/,
  `const headersLog = [
    'timestamp', 'nomor_jo', 'kode_lacak', 'milestone_baru', 'nik_eksekutor', 'nama_eksekutor', 'jabatan_cabang', 'catatan_progres'
  ];`
);

// 2. Update handleAdvanceMilestone_ untuk menulis 8 kolom ke LOG_PROGRESS
const oldAdvanceLogPattern = /\/\/ Tulis riwayat baru ke LOG_PROGRESS[\s\S]*?sheetLog\.appendRow\(\[\s*logId,\s*idJo,\s*nextM,\s*nowStr,\s*executorNik,\s*internalNote,\s*publicMsg\s*\]\);/;

const newAdvanceLog = `// Tulis riwayat baru ke LOG_PROGRESS (8 Kolom Standar SSOT)
  const kodeLacak = (colMap['kode_lacak'] !== undefined && currentRowValues[colMap['kode_lacak']]) ? String(currentRowValues[colMap['kode_lacak']]) : (payload.kode_lacak || '');
  const executorNama = payload.eksekutor_nama || payload.nama || 'Staf Operasional';
  const executorJabatan = payload.jabatan_cabang || payload.jabatan || 'Tim Teknis';
  const progressNote = payload.catatan_progres || payload.catatan_internal || payload.note || (def.title + ' disahkan.');

  sheetLog.appendRow([
    nowStr,
    idJo,
    kodeLacak,
    nextM,
    executorNik,
    executorNama,
    executorJabatan,
    progressNote
  ]);`;

if (oldAdvanceLogPattern.test(content)) {
  content = content.replace(oldAdvanceLogPattern, newAdvanceLog);
  console.log('✓ Replaced handleAdvanceMilestone_ log writing in gas-job-tracking.gs');
} else {
  console.log('Warning: could not match oldAdvanceLogPattern, trying fallback');
  content = content.replace(
    /sheetLog\.appendRow\(\[\s*logId,\s*idJo,\s*nextM,\s*nowStr,\s*executorNik,\s*internalNote,\s*publicMsg\s*\]\);/,
    `sheetLog.appendRow([
    nowStr,
    idJo,
    (colMap['kode_lacak'] !== undefined ? String(currentRowValues[colMap['kode_lacak']] || '') : ''),
    nextM,
    executorNik,
    payload.eksekutor_nama || 'Staf Operasional',
    payload.jabatan_cabang || 'Tim Teknis',
    payload.catatan_progres || payload.catatan_internal || (def.title + ' disahkan.')
  ]);`
  );
}

// 3. Update handleGetActiveJobs_ untuk menerima parameter kantor/cabang
content = content.replace(
  'function handleGetActiveJobs_() {',
  'function handleGetActiveJobs_(e) {'
);

const filterBranchBlock = `  const filterKantor = e && e.parameter && (e.parameter.kantor || e.parameter.cabang || e.parameter.kantor_code) ? String(e.parameter.kantor || e.parameter.cabang || e.parameter.kantor_code).trim().toUpperCase() : '';
  const filteredJobs = filterKantor && filterKantor !== 'ALL' && filterKantor !== 'SEMUA' ? jobs.filter(j => {
    const jBranch = String(j.kantor_code || '').toUpperCase();
    const targetBranch = filterKantor === 'JKT' ? 'PUSAT' : filterKantor;
    return jBranch === targetBranch || String(j.kantor || '').toUpperCase().includes(targetBranch);
  }) : jobs;

  return createJsonResponse_({
    status: 'success',
    count: filteredJobs.length,
    data: filteredJobs
  });`;

content = content.replace(
  /return createJsonResponse_\({\s*status:\s*'success',\s*count:\s*jobs\.length,\s*data:\s*jobs\s*}\);/,
  filterBranchBlock
);

fs.writeFileSync(gasFile, content, 'utf8');
console.log('✓ gas-job-tracking.gs successfully updated with 8-column LOG_PROGRESS and branch filter!');
