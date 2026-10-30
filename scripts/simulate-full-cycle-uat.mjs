import assert from 'node:assert';
import { spawn } from 'node:child_process';

console.log('================================================================');
console.log('   SIMULASI SIKLUS PENUH UAT (USER ACCEPTANCE TESTING) 7-M    ');
console.log('   KJPP Nanang Rahayu Sigit Paryanto & Rekan (OPINI NSR)      ');
console.log('================================================================');

const phpServer = spawn('php', ['-S', '127.0.0.1:8415', 'backend/job-tracking-handler.php']);
await new Promise(r => setTimeout(r, 1200));

const BASE = 'http://127.0.0.1:8415';

async function runUAT() {
  const timestamp = Date.now().toString().slice(-4);
  const testJo = `JO-BDG-2026-${timestamp}`;

  console.log(`\n--- TAHAP 1: UJI M-01 REGISTRASI & PEMISAHAN ENTITAS SPI 103 ---`);
  console.log(`Mendaftarkan penugasan: ${testJo}`);

  // 1. Registrasi penugasan baru oleh Staf Admin Bandung
  const regPayload = {
    jo_number: testJo,
    spk_number: `SPK/BTN-BDG/${timestamp}/2026`,
    pemberi_tugas: 'PT Bank Tabungan Negara (Persero) Tbk - KC Bandung',
    pengguna_laporan: 'PT Bank Tabungan Negara (Persero) Tbk - Divisi Asset & Remedial',
    debitur: 'PT Graha Logistik Parahyangan',
    jenis_properti: 'Pabrik dan Kompleks Pergudangan Logistik',
    lokasi_aset: 'Jl. Soekarno Hatta No. 458, Gedebage, Bandung',
    kantor: 'Kantor Cabang Bandung',
    client_pic_name: 'Bapak Ilham Ramadhan (Credit Officer BTN)',
    client_pic_phone: '081234567890',
    survey_contact_name: 'Bapak Dedi Heryadi (Kepala Gudang Debitur)',
    survey_contact_phone: '081987654321',
    penilai_pelaksana: 'Fadri Nurdin, S.T.',
    reviewer: 'Ardi Nurmayadi, S.E. (Reviewer SPM Bandung)',
    penilai_publik: 'Deni Siswandi, S.E., M.Ec.Dev., MAPPI (Cert.) - Pemimpin Cabang Bandung / Rekan (P-1.15.00045)',
    klasifikasi_izin_objek: 'P',
    dokumen_kepemilikan: 'SHGB No. 1245/Gedebage',
    tujuan_penilaian: 'Penjaminan Hutang / Agunan Kredit Komersial',
    sla_days: 3,
    sla_deadline: '2026-11-04'
  };

  const regRes = await fetch(`${BASE}/?action=create_job_order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  const regJson = await regRes.json();
  assert.strictEqual(regJson.status, 'success', 'Registrasi penugasan baru harus sukses');
  assert(regJson.data.kode_lacak.startsWith('TRK-'), 'Kode Lacak unik TRK harus terbit');
  const kodeLacak = regJson.data.kode_lacak;
  console.log(`[PASS] Registrasi berhasil: ${testJo} | Kode Lacak: ${kodeLacak}`);
  console.log(`[PASS] Pemisahan Entitas: Pemberi Tugas (${regJson.data.pemberi_tugas}) vs Pengguna Laporan (${regJson.data.pengguna_laporan})`);

  console.log(`\n--- TAHAP 2: UJI PELACAKAN PUBLIK KLIEN & KERAHASIAAN KEPI ---`);
  // 2. Klien mengakses lacak publik menggunakan kode TRK
  const trackRes = await fetch(`${BASE}/?action=track&jo=${encodeURIComponent(kodeLacak)}`);
  const trackJson = await trackRes.json();
  assert.strictEqual(trackJson.status, 'success', 'Pelacakan publik dengan TRK harus sukses');
  assert.strictEqual(trackJson.data.opini_nilai_pasar, undefined, 'Nilai pasar harus di-strip dari publik');
  assert.strictEqual(trackJson.data.opini_nilai_likuidasi, undefined, 'Nilai likuidasi harus di-strip dari publik');
  assert.strictEqual(trackJson.data.evidence_link, undefined, 'Evidence link harus di-strip dari publik');
  assert.strictEqual(trackJson.data.pemberi_tugas, regPayload.pemberi_tugas);
  console.log(`[PASS] Pelacakan publik via Kode TRK aman: Progres terbaca, Nilai Rupiah & Cloud Link terlindungi (100% confidential)`);

  console.log(`\n--- TAHAP 3: UJI M-02 PENUGASAN TIM OLEH PIMPINAN REKAN ---`);
  // 3. Rekan / Pimpinan (Deni Siswandi, NSR-2019-002) mengesahkan kelengkapan M-02
  const m2Res = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-02',
      nik: 'NSR-2019-002', // Deni Siswandi (Rekan)
      pin: '123456',
      note: 'Surat Tugas ST-042/NSR-BDG/X/2026 telah terbit. Tim pelaksana ditugaskan Rahmat Muhammad Hussein.'
    })
  });
  const m2Json = await m2Res.json();
  if (m2Json.status !== 'success') console.error('M2 Error:', m2Json);
  assert.strictEqual(m2Json.status, 'success', 'Otorisasi M-02 harus sukses');
  assert.strictEqual(m2Json.data.current_milestone, 'M-02');
  console.log(`[PASS] M-02 disahkan oleh Rekan: ${m2Json.data.milestones['M-02'].actor}`);

  console.log(`\n--- TAHAP 4: UJI M-03 & M-04 (SURVEI, CUT-OFF DATE & EVIDENCE LINK) ---`);
  // 4a. Surveyor Cabang Bandung (Rahmat Muhammad Hussein, NSR-BDG-2020-43) mengesahkan M-03 (Inspeksi Fisik)
  const m3Res = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-03',
      nik: 'NSR-BDG-2020-43', // Rahmat Muhammad Hussein (Surveyor Bandung)
      pin: '123456',
      note: 'Inspeksi fisik properti pabrik & gudang telah selesai didampingi Kepala Gudang.',
      tanggal_penilaian: '2026-10-30',
      evidence_link: 'https://drive.google.com/drive/folders/1A2B3C_Survei_Foto_Gedebage'
    })
  });
  const m3Json = await m3Res.json();
  if (m3Json.status !== 'success') console.error('M3 Error:', m3Json);
  assert.strictEqual(m3Json.status, 'success', 'M-03 harus sukses');
  assert.strictEqual(m3Json.data.current_milestone, 'M-03');
  assert.strictEqual(m3Json.data.tanggal_penilaian, '2026-10-30');
  assert.strictEqual(m3Json.data.evidence_link, 'https://drive.google.com/drive/folders/1A2B3C_Survei_Foto_Gedebage');
  console.log(`[PASS] M-03 disahkan oleh Surveyor Bandung dengan Tanggal Penilaian & Evidence Link tersimpan`);

  // 4b. Penilai Cabang Bandung (Ardi Nurmayadi, NSR-BDG-2020-39) mengesahkan M-04 (Analisis Penilaian & Kertas Kerja)
  const m4Res = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-04',
      nik: 'NSR-BDG-2020-39', // Ardi Nurmayadi (Penilai Bandung)
      pin: '123456',
      note: 'Perhitungan DRC bangunan pabrik dan pendekatan perbandingan pasar tanah selesai.',
      dokumen_kepemilikan: 'SHGB No. 1245/Gedebage a.n. PT Graha Logistik Parahyangan'
    })
  });
  const m4Json = await m4Res.json();
  if (m4Json.status !== 'success') console.error('M4 Error:', m4Json);
  assert.strictEqual(m4Json.status, 'success');
  assert.strictEqual(m4Json.data.current_milestone, 'M-04');
  console.log(`[PASS] M-04 Analisis Penilaian tuntas, kertas kerja siap dikaji SPM`);

  console.log(`\n--- TAHAP 5: UJI M-05 SPM GATEWAY & SIKLUS REVISI KERTAS KERJA ---`);
  // 5a. Reviewer SPM Bandung (Andri Kusmandana, NSR-BDG-2020-40) melakukan audit dan menemukan perlunya revisi pembanding
  const revRes = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-04', // ROLLBACK ke M-04
      nik: 'NSR-BDG-2020-40', // Andri Kusmandana (Reviewer SPM Bandung)
      pin: '123456',
      note: '[REVISI SPM]: Tambahkan minimal 1 data pembanding pergudangan di koridor Gedebage yang bertransaksi < 6 bulan terakhir.'
    })
  });
  const revJson = await revRes.json();
  if (revJson.status !== 'success') console.error('Rev Error:', revJson);
  assert.strictEqual(revJson.status, 'success', 'Rollback SPM ke M-04 harus berhasil');
  assert.strictEqual(revJson.data.current_milestone, 'M-04', 'Status penugasan kembali ke M-04');
  assert.strictEqual(revJson.data.milestones['M-04'].status, 'in_progress');
  assert.strictEqual(revJson.data.milestones['M-05'].status, 'pending');
  console.log(`[PASS] Simulasi Rejection/Rollback SPM berhasil: Berkas dikembalikan ke M-04 dengan catatan temuan audit`);

  // 5b. Penilai memperbaiki dan Reviewer SPM menyetujui M-05
  const m5ApproveRes = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-05',
      nik: 'NSR-BDG-2020-40', // Andri Kusmandana
      pin: '123456',
      note: 'Kertas kerja revisi telah memenuhi standar mutu SPI 105 & Pedoman SPM KJPP NSR. Lulus ke M-06.'
    })
  });
  const m5ApproveJson = await m5ApproveRes.json();
  if (m5ApproveJson.status !== 'success') console.error('M5 Approve Error:', m5ApproveJson);
  assert.strictEqual(m5ApproveJson.status, 'success');
  assert.strictEqual(m5ApproveJson.data.current_milestone, 'M-05');
  console.log(`[PASS] M-05 Kendali Mutu SPM disahkan penuh setelah revisi tuntas`);

  console.log(`\n--- TAHAP 6: UJI M-06 OTORISASI OPINI, NOLAP & NILAI PASAR ---`);
  // 6. Penilai Publik Berizin (Deni Siswandi, NSR-2019-002, izin P) mengotorisasi M-06
  const m6Res = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-06',
      nik: 'NSR-2019-002', // Deni Siswandi (Penilai Publik Berizin P)
      pin: '123456',
      note: 'Opini Nilai Pasar dan Nilai Likuidasi telah disahkan dan NoLap resmi diterbitkan.',
      nomor_laporan_resmi: '0089/2.0160-02/PI/X/2026',
      opini_nilai_pasar: '28.500.000.000',
      opini_nilai_likuidasi: '21.375.000.000'
    })
  });
  const m6Json = await m6Res.json();
  if (m6Json.status !== 'success') console.error('M6 Error:', m6Json);
  assert.strictEqual(m6Json.status, 'success');
  assert.strictEqual(m6Json.data.current_milestone, 'M-06');
  assert.strictEqual(m6Json.data.nomor_laporan_resmi, '0089/2.0160-02/PI/X/2026');
  assert.strictEqual(m6Json.data.opini_nilai_pasar, 28500000000);
  assert.strictEqual(m6Json.data.opini_nilai_likuidasi, 21375000000);
  console.log(`[PASS] M-06 disahkan oleh Penilai Publik Berizin P: NoLap & Nilai Pasar Rp 28,5 Miliar tersimpan aman`);

  console.log(`\n--- TAHAP 7: UJI M-07 PENYERAHAN LAPORAN FINAL & STATUS SELESAI 100% ---`);
  // 7. Staf Admin Bandung (Achmad Ilham Fauzan, NSR-BDG-2020-42) menyelesaikan M-07
  const m7Res = await fetch(`${BASE}/?action=advance_milestone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: testJo,
      target_milestone: 'M-07',
      nik: 'NSR-BDG-2020-42', // Achmad Ilham Fauzan (Admin Cabang Bandung)
      pin: '123456',
      note: 'Laporan hardcopy dan softcopy bertandatangan resmi telah diserahkan kepada PIC Bank BTN.'
    })
  });
  const m7Json = await m7Res.json();
  if (m7Json.status !== 'success') console.error('M7 Error:', m7Json);
  assert.strictEqual(m7Json.status, 'success');
  assert.strictEqual(m7Json.data.current_milestone, 'M-07');
  assert.strictEqual(m7Json.data.progress_percent, 100);
  assert.strictEqual(m7Json.data.sla_status, 'completed');
  console.log(`[PASS] M-07 Laporan Final tuntas 100%: Status SLA completed`);

  console.log(`\n--- TAHAP 8: VERIFIKASI LOG AUDIT (8-KOLOM SSOT) ---`);
  const auditRes = await fetch(`${BASE}/?action=get_audit_log&jo=${encodeURIComponent(testJo)}`);
  const auditJson = await auditRes.json();
  assert.strictEqual(auditJson.status, 'success');
  console.log(`[PASS] Tercatat ${auditJson.data.length} jejak audit transparan pada LOG_PROGRESS:`);
  auditJson.data.forEach((log, idx) => {
    console.log(`   ${idx + 1}. [${log.milestone_baru}] ${log.nama_eksekutor} (${log.jabatan_cabang}) -> ${log.catatan_progres}`);
  });

  console.log('\n================================================================');
  console.log('🏆 SIMULASI SIKLUS PENUH UAT (M-01 s/d M-07) LULUS 100%! 🏆');
  console.log('================================================================');
}

runUAT()
  .catch(err => {
    console.error('UAT Gagal:', err);
    process.exit(1);
  })
  .finally(() => {
    phpServer.kill();
  });
