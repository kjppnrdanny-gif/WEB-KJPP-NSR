/**
 * Skrip Verifikasi Pengujian Pasca-Patch Keamanan Google Apps Script (Live Verification)
 * Memverifikasi secara langsung ke endpoint aktif produksi bahwa celah kebocoran HTTP GET anonim
 * telah tertutup 100% (Fail-Closed) dan tidak ada kebocoran data sensitif.
 */

import assert from 'assert';

console.log('===============================================================');
console.log('   VERIFIKASI LANGSUNG ENDPOINT GAS AKTIF (LIVE PROBING)       ');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function assertTest(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    redirect: 'follow',
    ...options
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, parseError: e.message };
  }
}

async function runLiveVerification() {
  const JO_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';
  const SU_URL = 'https://script.google.com/macros/s/AKfycbwF5SI6A6hj0yuPBVd8FlRNc7uaXqCNDtoe6RdvlPdL7t33ithJ6TFrHQEB11fxzMqF/exec';

  console.log('[PROBE 1] Pengujian GET Anonim ke Endpoint Penugasan JO:');
  {
    const res = await fetchJSON(JO_URL);
    assertTest('Endpoint merespons dengan status success (metadata status operasional)', () => {
      assert.strictEqual(res.status, 'success');
      assert.strictEqual(res.success, true);
    });
    assertTest('Respons menandai authenticated bernilai false', () => {
      assert.strictEqual(res.authenticated, false);
    });
    assertTest('Array submissions sensitif TIDAK BOCOR (bersih/tidak ada dalam payload)', () => {
      assert.strictEqual(res.submissions, undefined);
    });
    assertTest('Array masterPersonil sensitif TIDAK BOCOR', () => {
      assert.strictEqual(res.masterPersonil, undefined);
    });
    assertTest('Counter agregat tetap tersedia untuk sinkronisasi awal', () => {
      assert.ok(res.counter);
    });
  }

  console.log('\n[PROBE 2] Pengujian GET Anonim ke Modul Surat Umum pada Endpoint JO:');
  {
    const res = await fetchJSON(`${JO_URL}?action=GET_SURAT_UMUM_LIST`);
    assertTest('Akses GET Surat Umum ditolak fail-closed (status: error)', () => {
      assert.strictEqual(res.status, 'error');
      assert.strictEqual(res.success, false);
    });
    assertTest('Respons menyertakan kode FORBIDDEN_GET', () => {
      assert.strictEqual(res.code, 'FORBIDDEN_GET');
    });
    assertTest('Respons TIDAK menyertakan data array surat atau tautan arsip', () => {
      assert.strictEqual(res.data, undefined);
      assert.strictEqual(res.surat, undefined);
    });
  }

  console.log('\n[PROBE 3] Pengujian Upaya Bypass Token via Query String URL GET:');
  {
    const res = await fetchJSON(`${JO_URL}?token=[REDACTED_ADMIN_PUSAT_TOKEN]`);
    assertTest('Token di URL GET diabaikan; submissions TETAP terproteksi', () => {
      assert.strictEqual(res.submissions, undefined);
    });

    const resSU = await fetchJSON(`${JO_URL}?action=GET_SURAT_UMUM_LIST&token=[REDACTED_ADMIN_PUSAT_TOKEN]`);
    assertTest('Token di URL GET tidak dapat membuka GET_SURAT_UMUM_LIST (tetap FORBIDDEN_GET)', () => {
      assert.strictEqual(resSU.code, 'FORBIDDEN_GET');
      assert.strictEqual(resSU.data, undefined);
    });
  }

  console.log('\n[PROBE 4] Pengujian GET Anonim ke Endpoint Surat Umum Langsung:');
  {
    const resDefault = await fetchJSON(SU_URL);
    assertTest('Endpoint Surat Umum merespons status publik tanpa membocorkan surat', () => {
      assert.strictEqual(resDefault.status, 'success');
      assert.strictEqual(resDefault.authenticated, false);
      assert.strictEqual(resDefault.submissions, undefined);
      assert.strictEqual(resDefault.data, undefined);
    });

    const resSUAction = await fetchJSON(`${SU_URL}?action=GET_SURAT_UMUM_LIST`);
    assertTest('Aksi GET_SURAT_UMUM_LIST ditolak fail-closed (code: FORBIDDEN_GET)', () => {
      assert.strictEqual(resSUAction.status, 'error');
      assert.strictEqual(resSUAction.code, 'FORBIDDEN_GET');
      assert.strictEqual(resSUAction.data, undefined);
    });
  }

  console.log('\n[PROBE 5] Pengujian Akses Anonim POST ke Endpoint Penugasan JO:');
  {
    const resPost = await fetchJSON(JO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC' }) // Tanpa token/kredensial
    });
    assertTest('Akses POST anonim ditolak (status: error)', () => {
      assert.strictEqual(resPost.status, 'error');
      assert.strictEqual(resPost.success, false);
    });
    assertTest('Akses POST anonim tidak mengembalikan data submissions', () => {
      assert.strictEqual(resPost.submissions, undefined);
    });
  }

  console.log('\n===============================================================');
  console.log(`HASIL AKHIR VERIFIKASI LANGSUNG: ${passCount} PASS / ${failCount} FAIL`);
  console.log('===============================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch(console.error);
