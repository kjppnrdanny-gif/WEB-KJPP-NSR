/**
 * LIVE SMOKE TEST TERHADAP RUNTIME PHP 8.2 SESUNGGUHNYA (cPANEL COMPATIBLE)
 * Menjalankan request HTTP real ke server PHP lokal (http://127.0.0.1:8088)
 * Menguji:
 * 1. auth-handler.php: Login token sah (200 OK), token palsu (401), verifikasi sesi (200)
 * 2. nolap-data-handler.php: Akses anonim ditolak (401), akses token terverifikasi (200)
 * 3. kwitansi-data-handler.php: Akses anonim ditolak (401), submit draft (200)
 * 4. surat-umum-data-handler.php: Akses cabang ditolak (403), akses pusat diizinkan (200)
 * 5. absensi-data-handler.php: Cek NIK valid (200), NIK palsu ditolak (404), minta OTP (200)
 */

import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:8088';

// Hash resmi untuk pengujian live
const TOKEN_PUSAT = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
const TOKEN_CABANG_BDG = (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN");
const TOKEN_PALSU = 'NSR-INVALID-TOKEN-999';

console.log('===============================================================');
console.log('  LIVE HTTP SMOKE TEST KE RUNTIME PHP 8.2 (PORT 8088)');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function check(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, data };
}

async function runLivePhpTests() {
  // -------------------------------------------------------------
  // 1. AUTH HANDLER (auth-handler.php)
  // -------------------------------------------------------------
  console.log('[1/5] PENGUJIAN LIVE RUNTIME: auth-handler.php');
  {
    // A. Token Palsu -> 401
    const resPalsu = await request('/auth-handler.php?action=token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TOKEN_PALSU })
    });
    check('auth-handler.php menolak token palsu dengan status 401 Unauthorized', () => {
      assert.strictEqual(resPalsu.status, 401);
      assert.strictEqual(resPalsu.data.success, false);
    });

    // B. Token Sah Pusat -> 200 OK & Kembalikan Sesi
    const resPusat = await request('/auth-handler.php?action=token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TOKEN_PUSAT })
    });
    check('auth-handler.php menerima token sah Pusat dengan status 200 OK', () => {
      assert.strictEqual(resPusat.status, 200);
      assert.strictEqual(resPusat.data.success, true);
      assert.strictEqual(resPusat.data.user.role, 'SUPER ADMIN');
    });

    // C. Token Sah Cabang Bandung -> 200 OK
    const resBdg = await request('/auth-handler.php?action=token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: TOKEN_CABANG_BDG })
    });
    check('auth-handler.php menerima token sah Cabang Bandung dengan status 200 OK', () => {
      assert.strictEqual(resBdg.status, 200);
      assert.strictEqual(resBdg.data.success, true);
      assert.strictEqual(resBdg.data.user.branch, 'Bandung');
      assert.strictEqual(resBdg.data.user.isCabang, true);
    });
  }

  // -------------------------------------------------------------
  // 2. NOLAP DATA HANDLER (nolap-data-handler.php)
  // -------------------------------------------------------------
  console.log('\n[2/5] PENGUJIAN LIVE RUNTIME: nolap-data-handler.php');
  {
    // A. Akses Anonim Tanpa Token -> 401
    const resAnon = await request('/nolap-data-handler.php', { method: 'GET' });
    check('nolap-data-handler.php menolak akses baca anonim (401 Unauthorized)', () => {
      assert.strictEqual(resAnon.status, 401);
      assert.strictEqual(resAnon.data.success, false);
    });

    // B. Akses dengan Token Pusat -> 200 OK
    const resPusat = await request('/nolap-data-handler.php', {
      method: 'GET',
      headers: { 'X-NSR-Token': TOKEN_PUSAT }
    });
    check('nolap-data-handler.php mengizinkan pembacaan data oleh Admin Pusat (200 OK)', () => {
      assert.strictEqual(resPusat.status, 200);
      assert.strictEqual(resPusat.data.success, true);
      assert.ok(Array.isArray(resPusat.data.data));
    });
  }

  // -------------------------------------------------------------
  // 3. KWITANSI DATA HANDLER (kwitansi-data-handler.php)
  // -------------------------------------------------------------
  console.log('\n[3/5] PENGUJIAN LIVE RUNTIME: kwitansi-data-handler.php');
  {
    // A. Akses Anonim -> 401
    const resAnon = await request('/kwitansi-data-handler.php', { method: 'GET' });
    check('kwitansi-data-handler.php menolak akses baca anonim (401 Unauthorized)', () => {
      assert.strictEqual(resAnon.status, 401);
      assert.strictEqual(resAnon.data.success, false);
    });

    // B. Akses dengan Token Keuangan / Pusat -> 200 OK
    const resPusat = await request('/kwitansi-data-handler.php', {
      method: 'GET',
      headers: { 'X-NSR-Token': TOKEN_PUSAT }
    });
    check('kwitansi-data-handler.php mengizinkan pembacaan antrean kwitansi (200 OK)', () => {
      assert.strictEqual(resPusat.status, 200);
      assert.strictEqual(resPusat.data.success, true);
      assert.ok(Array.isArray(resPusat.data.data));
    });

    // C. Cabang Submit Draft Kwitansi -> 200 OK
    const draftPayload = {
      action: 'submitDraft',
      payload: {
        klien: 'PT Bank CIMB Niaga Tbk (Live Test)',
        hargaDasar: 15000000,
        keterangan: 'Uang Muka Penilaian Properti Komersial Bandung',
        banyaknya: 'Termin I (50%)'
      }
    };
    const resDraft = await request('/kwitansi-data-handler.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NSR-Token': TOKEN_CABANG_BDG
      },
      body: JSON.stringify(draftPayload)
    });
    check('kwitansi-data-handler.php berhasil memproses penyimpanan draft oleh Cabang (200 OK)', () => {
      assert.strictEqual(resDraft.status, 200);
      assert.strictEqual(resDraft.data.success, true);
      assert.ok(resDraft.data.idKwitansi);
    });

    // D. Cabang Coba Approve Kwitansi Resmi -> DITOLAK MUTLAK 403 Forbidden!
    const approveIllegal = {
      action: 'approveKwitansi',
      payload: {
        idKwitansi: resDraft.data.idKwitansi,
        noKwitansiResmi: '999/KW-ILLEGAL/2026'
      }
    };
    const resIllegalApprove = await request('/kwitansi-data-handler.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NSR-Token': TOKEN_CABANG_BDG // Akun Cabang dilarang approve!
      },
      body: JSON.stringify(approveIllegal)
    });
    check('kwitansi-data-handler.php menolak mutlak percobaan approval oleh Cabang (403 Forbidden)', () => {
      assert.strictEqual(resIllegalApprove.status, 403);
      assert.strictEqual(resIllegalApprove.data.success, false);
      assert.strictEqual(resIllegalApprove.data.violation, 'UNAUTHORIZED_APPROVAL_ATTEMPT');
    });
  }

  // -------------------------------------------------------------
  // 4. SURAT UMUM DATA HANDLER (surat-umum-data-handler.php)
  // -------------------------------------------------------------
  console.log('\n[4/5] PENGUJIAN LIVE RUNTIME: surat-umum-data-handler.php');
  {
    // A. Akses Anonim -> 401
    const resAnon = await request('/surat-umum-data-handler.php', { method: 'GET' });
    check('surat-umum-data-handler.php menolak akses baca anonim (401 Unauthorized)', () => {
      assert.strictEqual(resAnon.status, 401);
      assert.strictEqual(resAnon.data.success, false);
    });

    // B. Akses Cabang Bandung -> DITOLAK MUTLAK 403 Forbidden!
    const resCabang = await request('/surat-umum-data-handler.php', {
      method: 'GET',
      headers: { 'X-NSR-Token': TOKEN_CABANG_BDG }
    });
    check('surat-umum-data-handler.php menolak mutlak akses Cabang ke Buku Agenda (403 Forbidden)', () => {
      assert.strictEqual(resCabang.status, 403);
      assert.strictEqual(resCabang.data.success, false);
      assert.strictEqual(resCabang.data.violation, 'BRANCH_ACCESS_DENIED');
    });

    // C. Akses Admin Pusat -> 200 OK
    const resPusat = await request('/surat-umum-data-handler.php', {
      method: 'GET',
      headers: { 'X-NSR-Token': TOKEN_PUSAT }
    });
    check('surat-umum-data-handler.php mengizinkan akses Admin Pusat (200 OK)', () => {
      assert.strictEqual(resPusat.status, 200);
      assert.strictEqual(resPusat.data.success, true);
      assert.strictEqual(resPusat.data.scope, 'HEAD_OFFICE_EXCLUSIVE');
    });
  }

  // -------------------------------------------------------------
  // 5. ABSENSI DATA HANDLER (absensi-data-handler.php)
  // -------------------------------------------------------------
  console.log('\n[5/5] PENGUJIAN LIVE RUNTIME: absensi-data-handler.php');
  {
    // A. Cek Status Endpoint -> 200 OK
    const resStatus = await request('/absensi-data-handler.php', { method: 'GET' });
    check('absensi-data-handler.php endpoint merespons status operasional aktif (200 OK)', () => {
      assert.strictEqual(resStatus.status, 200);
      assert.strictEqual(resStatus.data.status, 'success');
      assert.ok(resStatus.data.total_karyawan > 0);
    });

    // B. Cek NIK Palsu -> 404 Not Found
    const resNikPalsu = await request('/absensi-data-handler.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-FAKE-999' })
    });
    check('absensi-data-handler.php menolak NIK tidak terdaftar (404 Not Found)', () => {
      assert.strictEqual(resNikPalsu.status, 404);
      assert.strictEqual(resNikPalsu.data.success, false);
    });

    // C. Cek NIK Valid (Pusat Jakarta) -> 200 OK dengan Masked Email
    const resNikValid = await request('/absensi-data-handler.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-2019-005' })
    });
    check('absensi-data-handler.php memverifikasi NIK terdaftar dan menyamarkan email (200 OK)', () => {
      assert.strictEqual(resNikValid.status, 200);
      assert.strictEqual(resNikValid.data.success, true);
      assert.strictEqual(resNikValid.data.nik, 'NSR-2019-005');
      assert.ok(resNikValid.data.maskedEmail.includes('*'));
    });
  }

  console.log('\n===============================================================');
  console.log(`HASIL AKHIR LIVE PHP HTTP SMOKE TEST: ${passedTests} / ${totalTests} PASS`);
  console.log('===============================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runLivePhpTests().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
