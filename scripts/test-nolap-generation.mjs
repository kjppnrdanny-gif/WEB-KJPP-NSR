import assert from 'node:assert';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

console.log('================================================================');
console.log('   PENGUJIAN OTOMASI SINKRONISASI NOMOR LAPORAN (NOLAP) M-06    ');
console.log('   KJPP Nanang Rahayu Sigit Paryanto & Rekan (OPINI NSR)        ');
console.log('================================================================');

const phpServer = spawn('php', ['-S', '127.0.0.1:8419', 'backend/job-tracking-handler.php']);
await new Promise(r => setTimeout(r, 1200));

const BASE = 'http://127.0.0.1:8419';

async function runTests() {
  const timestamp = Date.now().toString().slice(-4);
  const testJo = `JO-BDG-2026-${timestamp}`;

  console.log(`\n1. Registrasi Job Order baru: ${testJo}`);
  const regPayload = {
    jo_number: testJo,
    spk_number: `SPK/BTN-BDG/${timestamp}/2026`,
    pemberi_tugas: 'PT Bank Tabungan Negara (Persero) Tbk - KC Bandung',
    pengguna_laporan: 'PT Bank Tabungan Negara (Persero) Tbk - Divisi Asset & Remedial',
    debitur: 'PT Graha Logistik Parahyangan',
    jenis_properti: 'Kompleks Pergudangan Logistik',
    lokasi_aset: 'Jl. Soekarno Hatta No. 458, Gedebage, Bandung',
    kantor: 'Kantor Cabang Bandung',
    client_pic_name: 'Bapak Ilham Ramadhan',
    client_pic_phone: '081234567890',
    penilai_publik: 'Deni Siswandi, S.E., M.Ec.Dev., MAPPI (Cert.)'
  };

  const regRes = await fetch(`${BASE}/?action=create_job_order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  const regJson = await regRes.json();
  assert.strictEqual(regJson.status, 'success');
  console.log(`[PASS] Registrasi berhasil: ${testJo}`);

  console.log(`\n2. Uji Penolakan: Tanpa NIK & PIN (400)`);
  const noAuthRes = await fetch(`${BASE}/?action=generate_nolap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jo: testJo })
  });
  assert.strictEqual(noAuthRes.status, 400);
  console.log(`[PASS] Penolakan tanpa NIK/PIN terbukti diblokir (400)`);

  console.log(`\n3. Uji Penolakan: Kredensial Salah (401)`);
  const wrongPinRes = await fetch(`${BASE}/?action=generate_nolap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jo: testJo, nik: 'NSR-2019-002', pin: 'WRONGPIN' })
  });
  assert.strictEqual(wrongPinRes.status, 401);
  console.log(`[PASS] Percobaan PIN salah terbukti diblokir (401)`);

  console.log(`\n4. Uji Penolakan: Staf Bukan Penilai Publik / Bukan Admin Pusat (403)`);
  // Surveyor Bandung: NSR-BDG-2020-43
  const unauthRes = await fetch(`${BASE}/?action=generate_nolap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jo: testJo, nik: 'NSR-BDG-2020-43', pin: '123456' })
  });
  assert.strictEqual(unauthRes.status, 403);
  const unauthJson = await unauthRes.json();
  assert(unauthJson.message.includes('Akses Ditolak'));
  console.log(`[PASS] Penolakan staf tanpa wewenang terbukti diblokir (403): "${unauthJson.message}"`);

  console.log(`\n5. Uji Penerbitan Sukses: Penilai Publik Berizin (Deni Siswandi, NSR-2019-002)`);
  const genRes = await fetch(`${BASE}/?action=generate_nolap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jo: testJo, nik: 'NSR-2019-002', pin: '123456' })
  });
  assert.strictEqual(genRes.status, 200);
  const genJson = await genRes.json();
  assert.strictEqual(genJson.status, 'success');
  const issuedNoLap = genJson.data.nomor_laporan_resmi;
  console.log(`[PASS] NoLap Resmi Berhasil Terbit: ${issuedNoLap}`);
  console.log(`[PASS] Signing Office Code: ${genJson.data.signing_office_code}`);
  console.log(`[PASS] Penilai Publik: ${genJson.data.penilai_publik} (Izin: ${genJson.data.penilai_izin})`);

  // Validasi pola format NoLap 8 segmen: XXXXX/2.0160-XX/PI/07/XXXXX/1/X/2026
  const regexPattern = /^(\d{5})\/(2\.0160-\d{2})\/(PI)\/(07)\/(\d{5})\/([01])\/([IVXLCDM]+)\/(\d{4})$/;
  assert(regexPattern.test(issuedNoLap), `Format NoLap ${issuedNoLap} harus memenuhi pola 8-segmen standar KJPP NSR`);
  console.log(`[PASS] Pola NoLap memenuhi standar Kepmenkeu / SPI 105 (8 Segmen Terpadu)`);

  console.log(`\n6. Uji Idempotensi: Memanggil Ulang NoLap untuk JO yang Sama`);
  const reGenRes = await fetch(`${BASE}/?action=generate_nolap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jo: testJo, nik: 'NSR-2019-002', pin: '123456' })
  });
  const reGenJson = await reGenRes.json();
  assert.strictEqual(reGenJson.status, 'success');
  assert.strictEqual(reGenJson.already_issued, true);
  assert.strictEqual(reGenJson.data.nomor_laporan_resmi, issuedNoLap);
  console.log(`[PASS] Idempotensi terbukti: Nomor NoLap yang sama dikembalikan tanpa duplikasi nomor urut baru`);

  console.log(`\n7. Verifikasi Sinkronisasi SSOT ke Database NoLap`);
  const nolapDbPath = 'data/nolap_database.json';
  assert(fs.existsSync(nolapDbPath), 'data/nolap_database.json harus ada');
  const nolapData = JSON.parse(fs.readFileSync(nolapDbPath, 'utf8'));
  const foundInNolap = nolapData.find(x => x.nomorLaporan === issuedNoLap);
  assert(foundInNolap, `NoLap ${issuedNoLap} harus tersimpan di data/nolap_database.json`);
  assert.strictEqual(foundInNolap.nomor_jo, testJo);
  assert.strictEqual(foundInNolap.status, 'APPROVED');
  console.log(`[PASS] Record NoLap terbukti tersinkronisasi di data/nolap_database.json (Status: APPROVED, Debitur: ${foundInNolap.nama_debitur})`);

  console.log(`\n8. Verifikasi Catatan Audit Trail M-06-NOLAP`);
  const auditRes = await fetch(`${BASE}/?action=get_audit_log&jo=${encodeURIComponent(testJo)}`);
  const auditJson = await auditRes.json();
  const nolapAudit = auditJson.data.find(x => x.milestone_baru === 'M-06-NOLAP');
  assert(nolapAudit, 'Audit log M-06-NOLAP harus tercatat');
  console.log(`[PASS] Audit log terekam: [${nolapAudit.milestone_baru}] ${nolapAudit.nama_eksekutor} -> ${nolapAudit.catatan_progres}`);

  console.log('\n================================================================');
  console.log('🏆 SEMUA 8 PENGUJIAN OTOMASI NOLAP M-06 LULUS 100%! 🏆');
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
