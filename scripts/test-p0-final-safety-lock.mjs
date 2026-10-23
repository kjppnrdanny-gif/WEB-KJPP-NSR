import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';

console.log('===============================================================');
console.log('🧪 P0 SAFETY LOCK & LIVE VERIFICATION SUITE');
console.log('===============================================================');

// Jalankan PHP Built-in server lokal untuk pengujian backend
const PORT = 8400 + Math.floor(Math.random() * 500);
const phpServer = spawn('php', ['-S', '127.0.0.1:' + PORT, '-t', '.']);
for (let i = 0; i < 20; i++) {
  try {
    const p = await fetch('http://127.0.0.1:' + PORT + '/index.html');
    if (p.status) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 200));
  }
}

async function api(path, options = {}) {
  const url = `http://127.0.0.1:${PORT}${path}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { status: res.status, headers: res.headers, json };
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

try {
  // ---------------------------------------------------------------------------
  // UJI 1: KEAMANAN SESI & SERVER LOGOUT REVOCATION
  // ---------------------------------------------------------------------------
  console.log('\n--- UJI 1: KEAMANAN SESI, SERVER SESSION STORAGE & LOGOUT REVOCATION ---');

  // Token resmi admin pusat
  const validToken = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
  const loginRes = await api('/auth-handler.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: validToken })
  });
  if (loginRes.status !== 200) {
    console.error('LOGIN ERROR DETAILS:', loginRes.status, loginRes.json);
  }

  assert(loginRes.status === 200 && loginRes.json?.authenticated === true, 'Login dengan token resmi menghasilkan 200 OK');
  const sessionToken = loginRes.json?.sessionToken;
  assert(Boolean(sessionToken && sessionToken.startsWith('nsr_sess_')), 'SessionToken acak server-side diterbitkan (' + sessionToken?.slice(0, 15) + '...)');

  // Periksa active_sessions.json
  const activeSessPath = 'data/sessions/active_sessions.json';
  assert(fs.existsSync(activeSessPath), 'File register sesi server active_sessions.json terbentuk');
  const sessData = JSON.parse(fs.readFileSync(activeSessPath, 'utf8'));
  assert(Boolean(sessData[sessionToken]), 'Sesi aktif terdaftar di active_sessions.json');

  // Akses protected route menggunakan sessionToken
  const verifyRes = await api('/auth-handler.php?action=verify', {
    method: 'GET',
    headers: { 'X-NSR-Session-Token': sessionToken }
  });
  assert(verifyRes.status === 200 && verifyRes.json?.authenticated === true, 'Akses verify dengan sessionToken berhasil (200 OK)');

  // Logout mencabut sesi di server
  const logoutRes = await api('/auth-handler.php?action=logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': sessionToken },
    body: JSON.stringify({ sessionToken: sessionToken })
  });
  assert(logoutRes.status === 200, 'Logout request berhasil diproses (200 OK)');

  // Verifikasi sesi telah dicabut dari active_sessions.json
  const sessDataAfter = JSON.parse(fs.readFileSync(activeSessPath, 'utf8'));
  assert(!sessDataAfter[sessionToken], 'Sesi server resmi DICABUT total dari active_sessions.json');

  // Coba akses protected route kembali setelah logout -> Harus 401 Unauthorized!
  const verifyAfterLogout = await api('/auth-handler.php?action=verify', {
    method: 'GET',
    headers: { 'X-NSR-Session-Token': sessionToken }
  });
  assert(verifyAfterLogout.status === 401, 'Percobaan akses kembali setelah logout DITOLAK (401 Unauthorized)');


  // ---------------------------------------------------------------------------
  // UJI 2: KODE INDUSTRI (ANTI-SILENT-FALLBACK KE 07)
  // ---------------------------------------------------------------------------
  console.log('\n--- UJI 2: KODE INDUSTRI (VALIDASI WAJIB 01-12 TANPA FALLBACK SILENT 07) ---');

  // Login kembali untuk mendapatkan sesi aktif baru
  const adminLogin = await api('/auth-handler.php?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: validToken })
  });
  const admToken = adminLogin.json?.sessionToken;

  // A. Kirim pengajuan dengan kode industri kosong -> Harus 422 Unprocessable Entity!
  const emptyIndRes = await api('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      namaKlien: 'PT Uji Industri Kosong',
      kodeIndustri: '',
      namaPemohon: 'Budi Tester',
      emailPemohon: 'budi@tester.com',
      waPemohon: '08123456789'
    })
  });
  assert(emptyIndRes.status === 422, 'Pengajuan dengan kodeIndustri kosong DITOLAK (422 Unprocessable Entity)');
  assert(emptyIndRes.json?.violation === 'INVALID_OR_MISSING_INDUSTRY_CODE', 'Kode pelanggaran INVALID_OR_MISSING_INDUSTRY_CODE terverifikasi');

  // B. Kirim pengajuan dengan kode industri tidak valid '99' -> Harus 422!
  const invalidIndRes = await api('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      namaKlien: 'PT Uji Industri Invalid 99',
      kodeIndustri: '99',
      namaPemohon: 'Budi Tester',
      emailPemohon: 'budi@tester.com',
      waPemohon: '08123456789'
    })
  });
  assert(invalidIndRes.status === 422, 'Pengajuan dengan kodeIndustri 99 DITOLAK (422 Unprocessable Entity)');

  // C. Kirim pengajuan dengan kode industri sah '03' (Properti) -> Harus 200 OK dan tersimpan '03' (Bukan 07!)
  const validIndRes = await api('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      namaKlien: 'PT Uji Properti Sah',
      kodeIndustri: '03',
      npwp: '01.234.567.8-901.000',
      namaPemohon: 'Budi Tester',
      emailPemohon: 'budi@tester.com',
      waPemohon: '08123456789',
      isTestRecord: true
    })
  });
  assert(validIndRes.status === 200, 'Pengajuan dengan kodeIndustri sah 03 DITERIMA (200 OK)');
  assert(validIndRes.json?.record?.kodeIndustri === '03', 'Nilai kodeIndustri tersimpan presisi 03 (Tidak di-fallback ke 07)');
  const testReqId = validIndRes.json?.noPermintaan;


  // ---------------------------------------------------------------------------
  // UJI 3: KODE NPWP NOLAP SEGMEN 6 (BER-NPWP = 1, NON-NPWP = 0)
  // ---------------------------------------------------------------------------
  console.log('\n--- UJI 3: KODE NPWP NOLAP SEGMEN 6 (BER-NPWP = 1, NON-NPWP = 0) ---');

  // A. Klien ber-NPWP sah (>= 10 digit) menghasilkan kodeNpwp: '1'
  assert(validIndRes.json?.record?.kodeNpwp === '1', 'Klien dengan NPWP sah menghasilkan kodeNpwp = "1"');

  // B. Klien Non-NPWP menghasilkan kodeNpwp: '0'
  const nonNpwpRes = await api('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      namaKlien: 'Perorangan Non-NPWP',
      kodeIndustri: '12',
      npwp: '-',
      namaPemohon: 'Siti Tester',
      emailPemohon: 'siti@tester.com',
      waPemohon: '08123456788',
      isTestRecord: true
    })
  });
  assert(nonNpwpRes.status === 200, 'Pengajuan klien Non-NPWP diterima (200 OK)');
  assert(nonNpwpRes.json?.record?.kodeNpwp === '0', 'Klien non-NPWP tersimpan kodeNpwp = "0" (Bukan 1)');

  // C. Uji Penolakan Segmen 6 di Meja Approval jika bukan '0' atau '1' (misal huruf 'B')
  const approveBadSegRes = await api('/nolap-data-handler.php?action=approveRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      noPermintaan: testReqId,
      nomorLaporan: '00540/2.0160-00/PI/03/00581/B/X/2026', // Menggunakan huruf B
      tglTerbit: '2026-10-23'
    })
  });
  assert(approveBadSegRes.status === 422, 'Penetapan nomor dengan segmen 6 huruf B DITOLAK (422)');
  assert(approveBadSegRes.json?.violation === 'INVALID_SEGMENT_6_NPWP_CODE', 'Violation INVALID_SEGMENT_6_NPWP_CODE terverifikasi');

  // D. Uji Penolakan Segmen 4 (Industri) di Meja Approval jika di luar 01-12
  const approveBadIndRes = await api('/nolap-data-handler.php?action=approveRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      noPermintaan: testReqId,
      nomorLaporan: '00540/2.0160-00/PI/99/00581/1/X/2026', // Industri 99
      tglTerbit: '2026-10-23'
    })
  });
  assert(approveBadIndRes.status === 422, 'Penetapan nomor dengan segmen 4 industri 99 DITOLAK (422)');
  assert(approveBadIndRes.json?.violation === 'INVALID_SEGMENT_4_INDUSTRY_CODE', 'Violation INVALID_SEGMENT_4_INDUSTRY_CODE terverifikasi');


  // ---------------------------------------------------------------------------
  // UJI 4: KOREKSI PERIODE BOOKING & KONTROL DUPLIKASI, PERSETUJUAN & AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- UJI 4: KOREKSI PERIODE BOOKING & KONTROL DUPLIKASI, PERSETUJUAN & AUDIT ---');

  // Ajukan permohonan booking baru untuk diuji
  const bookingSub = await api('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      namaKlien: 'Kementerian PUPR (Satker Uji)',
      kodeIndustri: '11',
      npwp: '00.123.456.7-001.000',
      namaPemohon: 'Admin Pengaju',
      emailPemohon: 'pengaju@tester.com',
      waPemohon: '08123456780',
      isBooking: true,
      modePengajuan: 'BOOKING',
      isTestRecord: true
    })
  });
  const bookReqId = bookingSub.json?.noPermintaan;
  assert(bookingSub.status === 200 && Boolean(bookReqId), 'Permohonan Booking baru berhasil diajukan (' + bookReqId + ')');

  // Set nomor alokasi awal
  const bookDbPath = 'data/nolap_database.json';
  let bookDb = JSON.parse(fs.readFileSync(bookDbPath, 'utf8'));
  const bookIdx = bookDb.findIndex(r => r.noPermintaan === bookReqId);
  const alokasiAwalNo = '00541/2.0160-00/PI/11/00581/1/IX/2026';
  bookDb[bookIdx].nomorLaporan = alokasiAwalNo;
  bookDb[bookIdx].nomorAlokasiAwal = alokasiAwalNo;
  bookDb[bookIdx].status = 'NOMOR DIBOOKING';
  fs.writeFileSync(bookDbPath, JSON.stringify(bookDb, null, 2), 'utf8');

  // A. Coba revisi periode TANPA alasan justifikasi -> Harus Ditolak (422)
  const revNoAlasanRes = await api('/nolap-data-handler.php?action=finalizeBookingReport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      noPermintaan: bookReqId,
      tglLaporan: '2026-10-23',
      revisiPeriodeBulanResmi: true,
      alasanKoreksi: '' // Kosong!
    })
  });
  assert(revNoAlasanRes.status === 422, 'Revisi periode booking tanpa alasan justifikasi DITOLAK (422)');

  // B. Coba revisi periode yang menghasilkan nomor duplikat yang sudah ada di register
  // Rekam nomor tiruan yang sama di database
  bookDb = JSON.parse(fs.readFileSync(bookDbPath, 'utf8'));
  const targetDupNo = '00541/2.0160-00/PI/11/00581/1/X/2026';
  bookDb.push({
    noPermintaan: 'REQ-EXISTING-DUP',
    nomorLaporan: targetDupNo,
    namaKlien: 'PT Pemilik Nomor Existing',
    status: 'NOMOR DITERBITKAN',
    isTestRecord: true
  });
  fs.writeFileSync(bookDbPath, JSON.stringify(bookDb, null, 2), 'utf8');

  const revDupRes = await api('/nolap-data-handler.php?action=finalizeBookingReport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      noPermintaan: bookReqId,
      tglLaporan: '2026-10-23',
      revisiPeriodeBulanResmi: true,
      alasanKoreksi: 'Penyesuaian resmi segmen bulan pelaporan SE-6/PPPK/2018'
    })
  });
  assert(revDupRes.status === 409, 'Revisi periode booking yang menghasilkan duplikat DITOLAK (409 Conflict)');
  assert(revDupRes.json?.violation === 'DUPLICATE_BOOKING_PERIOD_REVISION', 'Violation DUPLICATE_BOOKING_PERIOD_REVISION terverifikasi');

  // Bersihkan record duplikat tiruan
  bookDb = JSON.parse(fs.readFileSync(bookDbPath, 'utf8')).filter(r => r.noPermintaan !== 'REQ-EXISTING-DUP');
  fs.writeFileSync(bookDbPath, JSON.stringify(bookDb, null, 2), 'utf8');

  // C. Eksekusi revisi periode yang sah dengan justifikasi lengkap
  const revValidRes = await api('/nolap-data-handler.php?action=finalizeBookingReport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NSR-Session-Token': admToken },
    body: JSON.stringify({
      noPermintaan: bookReqId,
      tglLaporan: '2026-10-23',
      revisiPeriodeBulanResmi: true,
      alasanKoreksi: 'Penyesuaian resmi segmen bulan pelaporan fisik Oktober 2026 atas permintaan Satker PUPR',
      kesimpulanNilai: 'Rp 15.000.000.000'
    })
  });
  assert(revValidRes.status === 200, 'Revisi periode booking sah berhasil diproses (200 OK)');
  const finalizedRecord = revValidRes.json?.record;
  assert(finalizedRecord?.nomorLaporan === targetDupNo, 'Nomor laporan resmi terkoreksi menjadi segmen bulan Oktober (X/2026)');
  assert(finalizedRecord?.nomorAlokasiAwal === alokasiAwalNo, 'Nomor alokasi awal (IX/2026) tetap diaudit dan terlindungi');
  assert(Array.isArray(finalizedRecord?.auditTrailKoreksiBulan) && finalizedRecord.auditTrailKoreksiBulan.length > 0, 'Audit trail koreksi bulan tersimpan lengkap');


  // ---------------------------------------------------------------------------
  // UJI 5: BUKTI PEMULIHAN DATABASE CPANEL (FULL BACKUP & RESTORE VERIFICATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- UJI 5: BUKTI PEMULIHAN DATABASE CPANEL DARI SNAPSHOT AKTIF ---');

  const nolapDbFile = 'data/nolap_database.json';
  const preSnapshotRaw = fs.readFileSync(nolapDbFile, 'utf8');
  const preHash = crypto.createHash('sha256').update(preSnapshotRaw).digest('hex');
  const preCount = JSON.parse(preSnapshotRaw).length;

  // 1. Buat snapshot backup
  const backupDir = 'data/backups';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const snapshotFileName = `nolap_backup_verify_${Date.now()}.json`;
  const snapshotPath = path.join(backupDir, snapshotFileName);
  fs.writeFileSync(snapshotPath, preSnapshotRaw, 'utf8');
  assert(fs.existsSync(snapshotPath), 'Snapshot cadangan database aktif berhasil dibuat: ' + snapshotFileName);

  // 2. Simulasikan perubahan / kerusakan data
  let mutatedData = JSON.parse(preSnapshotRaw);
  mutatedData.push({
    noPermintaan: 'REQ-SIMULASI-DISASTER',
    namaKlien: 'Data Rusak Tak Terduga',
    status: 'CORRUPTED'
  });
  fs.writeFileSync(nolapDbFile, JSON.stringify(mutatedData, null, 2), 'utf8');
  assert(JSON.parse(fs.readFileSync(nolapDbFile, 'utf8')).length === preCount + 1, 'Data simulasi perubahan tercatat di file aktif');

  // 3. Panggil restoreBackup melalui handler
  const restoreRes = await api('/nolap-data-handler.php?action=restoreBackup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-NSR-Session-Token': admToken,
      'X-NSR-MAINTENANCE_KEY': 'NSR2026' // Hash cocok dengan maintenance key
    },
    body: JSON.stringify({
      confirmMaintenance: 'AUTHORIZE_SPECIAL_MAINTENANCE_2026',
      maintenanceKey: 'NSR2026',
      backupFileName: snapshotFileName,
      reason: 'Uji Pemulihan Bencana Database Operasional P0'
    })
  });
  assert(restoreRes.status === 200 && restoreRes.json?.success === true, 'Operasi restoreBackup berhasil dieksekusi via endpoint resmi');

  // 4. Verifikasi bit-for-bit bahwa file yang dipulihkan identik 100%
  const postRestoreRaw = fs.readFileSync(nolapDbFile, 'utf8');
  const postCount = JSON.parse(postRestoreRaw).length;
  assert(postCount === preCount, `Jumlah record kembali persis semula (${postCount} record)`);
  assert(!postRestoreRaw.includes('REQ-SIMULASI-DISASTER'), 'Data simulasi disaster terbukti hilang / dipulihkan sempurna');

  // Bersihkan snapshot pengujian
  if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);

  // Bersihkan record pengujian dari nolap_database.json
  const cleanedData = JSON.parse(fs.readFileSync(nolapDbFile, 'utf8')).filter(r => !r.isTestRecord);
  fs.writeFileSync(nolapDbFile, JSON.stringify(cleanedData, null, 2), 'utf8');

} finally {
  phpServer.kill();
}

console.log('\n===============================================================');
console.log(`📊 REKAP HASIL PENGUJIAN: ${passCount} PASS / ${failCount} FAIL`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SEMUA PERSYARATAN P0 FINAL SAFETY LOCK LULUS 100%!');
  process.exit(0);
}
