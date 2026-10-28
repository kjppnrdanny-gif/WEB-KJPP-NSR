// scripts/patch-gas-precise.mjs
import fs from 'fs';
import path from 'path';

const gasPath = path.resolve('gas-job-tracking.gs');
let gas = fs.readFileSync(gasPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add generateTrackingCode_ after MILESTONE_DEFINITIONS
const helperCode = `
/**
 * Generator Kode Unik Pelacakan SPK / JO: TRK-[KANTOR]-[TAHUN]-[4 ALFANUMERIK]
 */
function generateTrackingCode_(kantorCode, year) {
  let kantor = 'JKT';
  const u = String(kantorCode || '').toUpperCase();
  if (u.includes('BDG') || u.includes('BANDUNG')) kantor = 'BDG';
  else if (u.includes('PDG') || u.includes('PADANG')) kantor = 'PDG';
  else if (u.includes('MKS') || u.includes('MAKASSAR')) kantor = 'MKS';
  else if (u.includes('PLM') || u.includes('PALEMBANG')) kantor = 'PLM';
  else if (u.includes('PUSAT') || u.includes('JAKARTA')) kantor = 'JKT';

  if (!year) year = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'TRK-' + kantor + '-' + year + '-' + rand;
}
`;

if (!gas.includes('function generateTrackingCode_(')) {
  gas = gas.replace('const MILESTONE_DEFINITIONS = {', helperCode + '\nconst MILESTONE_DEFINITIONS = {');
  console.log('✓ Added generateTrackingCode_');
}

// 2. Replace search loop in handlePublicTrack_
const oldLoopTarget = `  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowJo = String(row[colMap['id_jo'] || 0] || '').trim().toUpperCase();
    const rowPhone = String(row[colMap['telepon_pic'] || 4] || '').replace(/[^0-9]/g, '');

    if (cleanJo && rowJo === cleanJo) {
      foundRow = row;
      break;
    }

    if (cleanPhone && cleanPhone.length >= 6 && rowPhone.endsWith(cleanPhone.slice(-6))) {
      foundRow = row;
      break;
    }
  }

  // Jika input kosong atau tidak ketemu, berikan default sampel Bank BTN
  if (!foundRow && values.length > 1) {
    foundRow = values[1]; // Skenario Bank BTN Baris Pertama
  }

  if (!foundRow) {
    return createJsonResponse_({ status: 'error', message: 'Data penugasan tidak ditemukan.' }, 404);
  }`;

const newLoopReplacement = `  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
    const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
    const rowPhone = String(row[colMap['telepon_pic'] !== undefined ? colMap['telepon_pic'] : 4] || '').replace(/[^0-9]/g, '');

    if (cleanJo && (rowJo === cleanJo || (rowKode && rowKode === cleanJo))) {
      foundRow = row;
      break;
    }

    if (cleanPhone && cleanPhone.length >= 6 && rowPhone.endsWith(cleanPhone.slice(-6))) {
      foundRow = row;
      break;
    }
  }

  // Jika belum ditemukan, coba pencarian parsial
  if (!foundRow && cleanJo) {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
      const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
      if ((rowJo && rowJo.includes(cleanJo)) || (rowKode && rowKode.includes(cleanJo))) {
        foundRow = row;
        break;
      }
    }
  }

  // VALIDASI KETAT: Kembalikan 404 jika tidak ditemukan
  if (!foundRow) {
    return createJsonResponse_({
      status: 'error',
      message: 'Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.'
    }, 404);
  }`;

if (gas.includes(oldLoopTarget)) {
  gas = gas.replace(oldLoopTarget, newLoopReplacement);
  console.log('✓ Updated search loop in handlePublicTrack_');
} else {
  console.warn('⚠️ oldLoopTarget not matched');
}

// 3. In publicData, add kode_lacak
const oldPublicDataTarget = `  const publicData = {
    id: idJo,
    jo_number: idJo,`;

const newPublicDataReplacement = `  const publicData = {
    id: idJo,
    jo_number: idJo,
    kode_lacak: (colMap['kode_lacak'] !== undefined && foundRow[colMap['kode_lacak']]) ? String(foundRow[colMap['kode_lacak']]) : '',`;

if (gas.includes(oldPublicDataTarget)) {
  gas = gas.replace(oldPublicDataTarget, newPublicDataReplacement);
  console.log('✓ Added kode_lacak to publicData');
}

// 4. In handleGetActiveJobs_, add kode_lacak
const oldJobsPushTarget = `    jobs.push({
      id: idJo,
      jo_number: idJo,`;

const newJobsPushReplacement = `    jobs.push({
      id: idJo,
      jo_number: idJo,
      kode_lacak: (colMap['kode_lacak'] !== undefined && row[colMap['kode_lacak']]) ? String(row[colMap['kode_lacak']]) : '',`;

if (gas.includes(oldJobsPushTarget)) {
  gas = gas.replace(oldJobsPushTarget, newJobsPushReplacement);
  console.log('✓ Added kode_lacak to handleGetActiveJobs_');
}

// 5. In handleCreateJobOrder_, generate kodeLacak and add to newRow
const oldCreateTarget = `  const idJo = 'JO-' + kantorCode + '-' + year + '-' + nextSeq;

  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const spkDate = payload.spk_date || payload.tanggal_spk || Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  const slaDays = parseInt(payload.sla_days) || 3;
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + slaDays);
  const slaDeadlineStr = Utilities.formatDate(deadlineDate, CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  // Baris Baru DATA_PENUGASAN (19 Kolom)
  const newRow = [
    idJo,
    payload.spk_number || payload.nomor_spk || ('SPK/' + nextSeq + '/' + year),`;

const newCreateReplacement = `  const idJo = 'JO-' + kantorCode + '-' + year + '-' + nextSeq;
  const kodeLacak = generateTrackingCode_(kantorCode, year);

  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const spkDate = payload.spk_date || payload.tanggal_spk || Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  const slaDays = parseInt(payload.sla_days) || 3;
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + slaDays);
  const slaDeadlineStr = Utilities.formatDate(deadlineDate, CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  // Baris Baru DATA_PENUGASAN (20 Kolom termasuk kode_lacak)
  const newRow = [
    idJo,
    kodeLacak,
    payload.spk_number || payload.nomor_spk || ('SPK/' + nextSeq + '/' + year),`;

if (gas.includes(oldCreateTarget)) {
  gas = gas.replace(oldCreateTarget, newCreateReplacement);
  console.log('✓ Added kodeLacak generation and newRow to handleCreateJobOrder_');
}

// 6. In handleCreateJobOrder_ response, return kode_lacak
const oldCreateRespTarget = `    data: {
      id_jo: idJo,
      jo_number: idJo,`;

const newCreateRespReplacement = `    data: {
      id_jo: idJo,
      jo_number: idJo,
      kode_lacak: kodeLacak,`;

if (gas.includes(oldCreateRespTarget)) {
  gas = gas.replace(oldCreateRespTarget, newCreateRespReplacement);
  console.log('✓ Returned kode_lacak in handleCreateJobOrder_ response');
}

// 7. In handleSetupDatabase_, update headersData & add migration
const oldSetupHeaderTarget = `  const headersData = [
    'id_jo', 'nomor_spk', 'nama_klien', 'nama_debitur', 'telepon_pic',
    'jenis_jasa', 'lokasi_objek', 'kantor_asal', 'kantor_pelaksana',
    'penilai_pelaksana', 'reviewer_spm', 'penilai_publik', 'milestone_aktif',
    'keterangan_tahap', 'tanggal_spk', 'target_sla', 'tanggal_selesai',
    'status_penugasan', 'link_folder_drive'
  ];
  sheetData.getRange(1, 1, 1, headersData.length).setValues([headersData])
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheetData.setFrozenRows(1);`;

const newSetupHeaderReplacement = `  const headersData = [
    'id_jo', 'kode_lacak', 'nomor_spk', 'nama_klien', 'nama_debitur', 'telepon_pic',
    'jenis_jasa', 'lokasi_objek', 'kantor_asal', 'kantor_pelaksana',
    'penilai_pelaksana', 'reviewer_spm', 'penilai_publik', 'milestone_aktif',
    'keterangan_tahap', 'tanggal_spk', 'target_sla', 'tanggal_selesai',
    'status_penugasan', 'link_folder_drive'
  ];
  sheetData.getRange(1, 1, 1, headersData.length).setValues([headersData])
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheetData.setFrozenRows(1);

  // Migrasi otomatis: Sisipkan kolom kode_lacak jika belum ada di DATA_PENUGASAN
  const curHeaders = sheetData.getRange(1, 1, 1, Math.max(1, sheetData.getLastColumn())).getValues()[0];
  const hasKodeCol = curHeaders.map(function(h) { return String(h).trim().toLowerCase(); }).indexOf('kode_lacak') !== -1;
  if (!hasKodeCol) {
    sheetData.insertColumnAfter(1);
    sheetData.getRange(1, 2).setValue('kode_lacak').setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
    if (sheetData.getLastRow() >= 2) {
      sheetData.getRange(2, 2).setValue('TRK-JKT-2026-A89F');
    }
    if (sheetData.getLastRow() >= 3) {
      sheetData.getRange(3, 2).setValue('TRK-JKT-2026-C42B');
    }
  }`;

if (gas.includes(oldSetupHeaderTarget)) {
  gas = gas.replace(oldSetupHeaderTarget, newSetupHeaderReplacement);
  console.log('✓ Updated headersData and added migration in handleSetupDatabase_');
}

fs.writeFileSync(gasPath, gas, 'utf8');
console.log('✓ gas-job-tracking.gs patched safely!');
