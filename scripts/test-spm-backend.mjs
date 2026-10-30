import assert from 'node:assert';
import { spawn } from 'node:child_process';

console.log('================================================================');
console.log('   PENGUJIAN BACKEND: LEMBAR KENDALI MUTU SPM (SPI 105)        ');
console.log('   KJPP Nanang Rahayu Sigit Paryanto & Rekan (OPINI NSR)        ');
console.log('================================================================');

const phpServer = spawn('php', ['-S', '127.0.0.1:8422', 'backend/job-tracking-handler.php']);
await new Promise(r => setTimeout(r, 1200));

const BASE = 'http://127.0.0.1:8422';

async function runTests() {
  const timestamp = Date.now().toString().slice(-4);
  const testJo = `JO-BDG-2026-${timestamp}`;

  console.log(`\n1. Registrasi Job Order baru: ${testJo}`);
  const regRes = await fetch(`${BASE}/?action=create_job_order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo_number: testJo,
      spk_number: `SPK/BTN-BDG/${timestamp}/2026`,
      pemberi_tugas: 'PT Bank Tabungan Negara (Persero) Tbk - KC Bandung',
      pengguna_laporan: 'PT Bank Tabungan Negara (Persero) Tbk - Divisi Asset & Remedial',
      debitur: 'PT Graha Logistik Parahyangan',
      jenis_properti: 'Kompleks Pergudangan Logistik',
      lokasi_aset: 'Jl. Soekarno Hatta No. 458, Gedebage, Bandung',
      kantor: 'Kantor Cabang Bandung',
      client_pic_name: 'Bapak Ilham Ramadhan',
      client_pic_phone: '081234567890'
    })
  });
  const regJson = await regRes.json();
  assert.strictEqual(regJson.status, 'success');
  console.log(`[PASS] Registrasi berhasil: ${testJo}`);

  console.log(`\n2. Uji GET Default SPM Checklist (10 Indikator)`);
  const getRes = await fetch(`${BASE}/?action=get_spm_checklist&jo=${encodeURIComponent(testJo)}`);
  const getJson = await getRes.json();
  assert.strictEqual(getJson.status, 'success');
  assert.strictEqual(getJson.data.checklist.length, 10, 'Checklist harus berisi 10 butir pengujian standar');
  console.log(`[PASS] 10 Butir Pengujian SPI 105 & KEPI terambil lengkap`);
  getJson.data.checklist.forEach(it => {
    console.log(`   [${it.code}] ${it.title} -> ${it.status}`);
  });

  console.log(`\n3. Uji Penolakan Kelulusan M-05 jika ada butir TEMUAN (422 Unprocessable Entity)`);
  const checklistWithTemuan = JSON.parse(JSON.stringify(getJson.data.checklist));
  checklistWithTemuan[3].status = 'TEMUAN'; // Item 4: Kecukupan Data Pasar Pembanding
  checklistWithTemuan[3].note = 'Baru ditemukan 2 data pembanding, belum memenuhi minimal 3 data pasar.';

  const failApproveRes = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-05', // Mencoba meluluskan padahal ada temuan
      nik: 'NSR-BDG-2020-40', // Andri Kusmandana (Reviewer SPM Bandung)
      pin: '123456',
      spm_checklist_data: checklistWithTemuan,
      spm_review_notes: 'Masih ada kekurangan data pembanding'
    })
  });

  assert.strictEqual(failApproveRes.status, 422, 'Harus ditolak dengan status 422 jika ada temuan');
  const failJson = await failApproveRes.json();
  assert(failJson.message.includes('Persetujuan Kendali Mutu SPM Ditolak'));
  console.log(`[PASS] Penolakan persetujuan M-05 saat ada temuan audit bekerja presisi: "${failJson.message}"`);

  console.log(`\n4. Uji Rollback ke M-04 dengan Catatan Revisi Temuan SPM`);
  const rollbackRes = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-04', // Mengembalikan berkas ke penilai pelaksana
      nik: 'NSR-BDG-2020-40', // Andri Kusmandana
      pin: '123456',
      note: '[REVISI SPM]: Tambahkan minimal 1 data pembanding pergudangan di koridor Gedebage yang bertransaksi < 6 bulan terakhir.',
      spm_checklist_data: checklistWithTemuan,
      spm_review_notes: 'Kekurangan 1 data pembanding pada butir 4'
    })
  });
  const rollbackJson = await rollbackRes.json();
  assert.strictEqual(rollbackJson.status, 'success');
  assert.strictEqual(rollbackJson.data.current_milestone, 'M-04');
  assert.strictEqual(rollbackJson.data.spm_status, 'PERLU_REVISI');
  console.log(`[PASS] Rollback ke M-04 berhasil: spm_status='PERLU_REVISI' tersimpan`);

  console.log(`\n5. Uji Kelulusan Penuh M-05 setelah Perbaikan (10/10 SESUAI)`);
  const fixedChecklist = JSON.parse(JSON.stringify(getJson.data.checklist));
  fixedChecklist[3].status = 'SESUAI';
  fixedChecklist[3].note = 'Data pembanding ke-3 (Gudang Gedebage Permai) telah ditambahkan dan divalidasi.';

  const approveRes = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-05',
      nik: 'NSR-BDG-2020-40', // Andri Kusmandana
      pin: '123456',
      note: 'Kertas kerja revisi telah memenuhi standar mutu SPI 105 & Pedoman SPM KJPP NSR. Lulus ke M-06.',
      spm_checklist_data: fixedChecklist,
      spm_review_notes: 'Seluruh 10 indikator terpenuhi tanpa catatan kritis.'
    })
  });
  const approveJson = await approveRes.json();
  assert.strictEqual(approveJson.status, 'success');
  assert.strictEqual(approveJson.data.current_milestone, 'M-05');
  assert.strictEqual(approveJson.data.spm_status, 'LULUS_AUDIT');
  assert.strictEqual(approveJson.data.spm_reviewed_by.nama, 'Andri Kusmandana');
  console.log(`[PASS] Pengesahan M-05 lulus 100%: spm_status='LULUS_AUDIT', reviewer=${approveJson.data.spm_reviewed_by.nama}`);

  console.log('\n================================================================');
  console.log('🏆 SELURUH 5 PENGUJIAN BACKEND KENDALI MUTU SPM LULUS 100%! 🏆');
  console.log('================================================================');
}

runTests()
  .catch(err => {
    console.error('Test Gagal:', err);
    process.exit(1);
  })
  .finally(() => {
    phpServer.kill();
  });
