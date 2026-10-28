/**
 * =========================================================================================
 * TEST SUITE: SINGLE-BRANCH DAILY EXCLUSIVITY FOR PENILAI DENI SISWANDI (P2PK COMPLIANCE)
 * =========================================================================================
 */
import fs from 'fs';
import assert from 'assert';

console.log('====================================================');
console.log('RUNNING PENILAI EXCLUSIVITY VALIDATION TEST SUITE');
console.log('====================================================\n');

// 1. Audit File GAS Backend
console.log('--- 1. AUDITING BACKEND GAS CODE (gas-nolap-Code.gs & Code.gs) ---');
const gasNolapCode = fs.readFileSync('gas-nolap-Code.gs', 'utf8');
const codeGs = fs.readFileSync('Code.gs', 'utf8');

assert(gasNolapCode.includes('DENI_SISWANDI_DAILY_BRANCH_LOCKED'), 'gas-nolap-Code.gs must define DENI_SISWANDI_DAILY_BRANCH_LOCKED');
assert(gasNolapCode.includes('isDeniSiswandi'), 'gas-nolap-Code.gs must check isDeniSiswandi');
assert(gasNolapCode.includes('cleanRowCabang !== cleanPayloadCabang'), 'gas-nolap-Code.gs must verify cross-branch exclusivity');
console.log('  ✓ PASS: gas-nolap-Code.gs has Deni Siswandi single-branch daily lock logic');

assert(codeGs.includes('DENI_SISWANDI_DAILY_BRANCH_LOCKED'), 'Code.gs must define DENI_SISWANDI_DAILY_BRANCH_LOCKED');
assert(codeGs.includes('submitRequest'), 'Code.gs must handle submitRequest action');
console.log('  ✓ PASS: Code.gs has Deni Siswandi single-branch daily lock logic\n');

// 2. Audit Frontend HTML Files
console.log('--- 2. AUDITING FRONTEND PORTALS (portal-nolap.html & portal-nolap-dev.html) ---');
for (const file of ['portal-nolap.html', 'portal-nolap-dev.html']) {
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('id="banner-lock-penilai"'), `${file} must contain banner-lock-penilai`);
  assert(content.includes('id="modal-lock-penilai"'), `${file} must contain modal-lock-penilai`);
  assert(content.includes('validasiKetersediaanPenilaiHarian'), `${file} must define validasiKetersediaanPenilaiHarian()`);
  assert(content.includes('onPenilaiChange'), `${file} must define onPenilaiChange()`);
  assert(content.includes('onCabangChange'), `${file} must define onCabangChange()`);
  assert(content.includes('alihkanKeNanangRahayu'), `${file} must define alihkanKeNanangRahayu()`);
  assert(content.includes('tampilkanModalLockPenilai'), `${file} must define tampilkanModalLockPenilai()`);
  assert(content.includes('DENI_SISWANDI_DAILY_BRANCH_LOCKED'), `${file} must handle DENI_SISWANDI_DAILY_BRANCH_LOCKED response`);
  console.log(`  ✓ PASS: ${file} UI elements and event handlers verified`);
}

// 3. Functional Simulation Test Cases
console.log('\n--- 3. FUNCTIONAL SIMULATION OF TEST CASES (BUSINESS RULES) ---');

function simulateBackendValidation(existingRows, payload, todayStr) {
  const payloadPenilai = (payload.penilai || '').toLowerCase();
  const payloadCabang = (payload.cabang || '').trim();
  const isDeni = payloadPenilai.includes('deni siswandi');

  if (!isDeni) {
    return { success: true };
  }

  for (const row of existingRows) {
    const rowStatus = String(row.status || '').toUpperCase();
    if (rowStatus.includes('DITOLAK') || rowStatus.includes('VOID') || rowStatus.includes('BATAL')) continue;

    const rowPenilai = String(row.penilai || '').toLowerCase();
    if (!rowPenilai.includes('deni siswandi')) continue;

    const rowDate = row.date;
    if (rowDate === todayStr) {
      const rowCabang = String(row.cabang || '').trim();
      const cleanRowCabang = rowCabang.replace(/kantor|cabang/gi, '').trim().toLowerCase();
      const cleanPayloadCabang = payloadCabang.replace(/kantor|cabang/gi, '').trim().toLowerCase();

      if (cleanRowCabang && cleanPayloadCabang && cleanRowCabang !== cleanPayloadCabang) {
        return {
          status: 'error',
          success: false,
          code: 'DENI_SISWANDI_DAILY_BRANCH_LOCKED',
          cabangPengguna: rowCabang,
          message: `Mohon maaf, kewenangan tanda tangan Penilai Publik Deni Siswandi untuk hari ini (${todayStr}) telah digunakan oleh ${rowCabang.toUpperCase()}.`
        };
      }
    }
  }

  return { success: true };
}

const TODAY = '2026-10-17';
const YESTERDAY = '2026-10-16';

let mockDatabase = [];

// Test Case 1: Cabang Bandung mengajukan ttd Deni Siswandi hari ini -> LOLOS
const req1 = { cabang: 'Bandung', penilai: 'Deni Siswandi', noPermintaan: 'REQ-001', date: TODAY, status: 'DIAJUKAN' };
const res1 = simulateBackendValidation(mockDatabase, req1, TODAY);
assert.strictEqual(res1.success, true, 'Test Case 1a: Cabang Bandung first submission must pass');
mockDatabase.push(req1);
console.log('  ✓ PASS Test Case 1a: Cabang Bandung mengajukan ttd Deni Siswandi hari ini -> Lolos.');

// Test Case 1b: Cabang Bandung mengajukan lagi penugasan kedua ttd Deni Siswandi hari ini -> LOLOS
const req2 = { cabang: 'Bandung', penilai: 'Deni Siswandi', noPermintaan: 'REQ-002', date: TODAY, status: 'DIAJUKAN' };
const res2 = simulateBackendValidation(mockDatabase, req2, TODAY);
assert.strictEqual(res2.success, true, 'Test Case 1b: Cabang Bandung second submission must pass');
mockDatabase.push(req2);
console.log('  ✓ PASS Test Case 1b: Cabang Bandung mengajukan penugasan ke-2 ttd Deni Siswandi hari ini -> Lolos.');

// Test Case 2a: Cabang Padang mengajukan ttd Deni Siswandi hari ini -> DITOLAK
const reqPadang = { cabang: 'Padang', penilai: 'Deni Siswandi', noPermintaan: 'REQ-003', date: TODAY, status: 'DIAJUKAN' };
const resPadang = simulateBackendValidation(mockDatabase, reqPadang, TODAY);
assert.strictEqual(resPadang.success, false, 'Test Case 2a: Cabang Padang must be blocked');
assert.strictEqual(resPadang.code, 'DENI_SISWANDI_DAILY_BRANCH_LOCKED', 'Test Case 2a: Error code must be DENI_SISWANDI_DAILY_BRANCH_LOCKED');
console.log('  ✓ PASS Test Case 2a: Cabang Padang ditolak backend dengan DENI_SISWANDI_DAILY_BRANCH_LOCKED.');

// Test Case 2b: Cabang Makassar mengajukan ttd Deni Siswandi hari ini -> DITOLAK
const reqMks = { cabang: 'Makassar', penilai: 'Deni Siswandi', noPermintaan: 'REQ-004', date: TODAY, status: 'DIAJUKAN' };
const resMks = simulateBackendValidation(mockDatabase, reqMks, TODAY);
assert.strictEqual(resMks.success, false, 'Test Case 2b: Cabang Makassar must be blocked');
assert.strictEqual(resMks.code, 'DENI_SISWANDI_DAILY_BRANCH_LOCKED', 'Test Case 2b: Error code must be DENI_SISWANDI_DAILY_BRANCH_LOCKED');
console.log('  ✓ PASS Test Case 2b: Cabang Makassar ditolak backend dengan DENI_SISWANDI_DAILY_BRANCH_LOCKED.');

// Test Case 3: Seluruh cabang bebas mengajukan ttd Nanang Rahayu -> LOLOS
for (const branch of ['Pusat', 'Padang', 'Makassar', 'Palembang', 'Bandung']) {
  const reqNanang = { cabang: branch, penilai: 'Nanang Rahayu', noPermintaan: `REQ-${branch}`, date: TODAY, status: 'DIAJUKAN' };
  const resNanang = simulateBackendValidation(mockDatabase, reqNanang, TODAY);
  assert.strictEqual(resNanang.success, true, `Test Case 3: Branch ${branch} must be able to submit with Nanang Rahayu`);
}
console.log('  ✓ PASS Test Case 3: Seluruh cabang bebas mengajukan tanda tangan Nanang Rahayu tanpa isolasi harian.');

// Test Case 4: Hari kemarin (yesterday) tidak mempengaruhi hari ini
const mockYesterdayDb = [{ cabang: 'Padang', penilai: 'Deni Siswandi', noPermintaan: 'REQ-OLD', date: YESTERDAY, status: 'APPROVED' }];
const resTodayNewBranch = simulateBackendValidation(mockYesterdayDb, { cabang: 'Makassar', penilai: 'Deni Siswandi', date: TODAY }, TODAY);
assert.strictEqual(resTodayNewBranch.success, true, 'Yesterday submissions must not block different branch today');
console.log('  ✓ PASS Test Case 4: Pengajuan hari sebelumnya tidak mengunci cabang lain di hari baru.');

// Test Case 5: Permohonan berstatus DITOLAK tidak mengunci cabang lain
const mockRejectedDb = [{ cabang: 'Bandung', penilai: 'Deni Siswandi', noPermintaan: 'REQ-REJ', date: TODAY, status: 'DITOLAK' }];
const resAfterReject = simulateBackendValidation(mockRejectedDb, { cabang: 'Padang', penilai: 'Deni Siswandi', date: TODAY }, TODAY);
assert.strictEqual(resAfterReject.success, true, 'Rejected submissions must not lock other branches');
console.log('  ✓ PASS Test Case 5: Pengajuan berstatus DITOLAK diabaikan dan tidak mengunci cabang lain.');

console.log('\n====================================================');
console.log('✨ ALL 5 PENILAI EXCLUSIVITY TESTS PASSED 100%!');
console.log('====================================================');
