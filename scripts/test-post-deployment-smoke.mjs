/**
 * POST-DEPLOYMENT LIVE SMOKE TEST — KJPP NANANG RAHAYU SIGIT PARYANTO & REKAN
 * Domain: https://kjppnanangrahayu.com
 */

import assert from 'assert';

const BASE_URL = 'https://kjppnanangrahayu.com';
const GAS_JO_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';
const GAS_SU_URL = 'https://script.google.com/macros/s/AKfycbwF5SI6A6hj0yuPBVd8FlRNc7uaXqCNDtoe6RdvlPdL7t33ithJ6TFrHQEB11fxzMqF/exec';

console.log('===============================================================');
console.log('   POST-DEPLOYMENT LIVE SMOKE TEST (https://kjppnanangrahayu.com)');
console.log('===============================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function fetchUrl(relPath, options = {}) {
  const url = relPath.startsWith('http') ? relPath : `${BASE_URL}${relPath}`;
  try {
    const res = await fetch(url, { redirect: 'follow', ...options });
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, headers: res.headers, data, text };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runPostDeploySmokeTest() {
  // -------------------------------------------------------------
  // 1. WEBSITE COMPANY PROFILE PUBLIK (100% NORMAL)
  // -------------------------------------------------------------
  console.log('[1/5] PEMERIKSAAN HALAMAN PUBLIK COMPANY PROFILE:');
  {
    const pages = [
      '/',
      '/company-profile.html',
      '/profil-legalitas.html',
      '/layanan.html',
      '/portofolio-rekanan.html',
      '/tim-cabang.html',
      '/wawasan-regulasi.html'
    ];

    for (const page of pages) {
      const res = await fetchUrl(page);
      check(`Halaman ${page} dapat diakses normal (HTTP 200)`, () => {
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.includes('KJPP') || res.text.includes('Nanang Rahayu'));
      });
    }
  }

  // -------------------------------------------------------------
  // 2. PORTAL OPERASIONAL & GERBANG AKSES
  // -------------------------------------------------------------
  console.log('\n[2/5] PEMERIKSAAN PORTAL OPERASIONAL:');
  {
    const portals = [
      '/portal-penugasan-jo.html',
      '/portal-nolap.html',
      '/portal-kwitansi.html',
      '/portal-surat-umum.html'
    ];

    for (const portal of portals) {
      const res = await fetchUrl(portal);
      check(`Portal ${portal} aktif dan menyajikan UI operasional (HTTP 200)`, () => {
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.includes('<!DOCTYPE html>') || res.text.includes('<html'));
      });
    }
  }

  // -------------------------------------------------------------
  // 3. API PHP BACKEND CPANEL (AUTENTIKASI & RBAC)
  // -------------------------------------------------------------
  console.log('\n[3/5] PEMERIKSAAN API PHP BACKEND CPANEL:');
  {
    // A. Auth Token Palsu ditolak
    const resAuthPalsu = await fetchUrl('/api/auth-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'INVALID_TOKEN_TEST_999' })
    });
    check('API /api/auth-token menolak token tidak sah (HTTP 401)', () => {
      assert.strictEqual(resAuthPalsu.status, 401);
      assert.strictEqual(resAuthPalsu.data.success, false);
    });

    // B. Auth Token Sah Pusat diterima
    const resAuthPusat = await fetchUrl('/api/auth-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN") })
    });
    check('API /api/auth-token mengotorisasi kredensial sah Admin Pusat (HTTP 200)', () => {
      assert.strictEqual(resAuthPusat.status, 200);
      assert.strictEqual(resAuthPusat.data.success, true);
    });

    // C. NoLap Proxy menolak baca anonim
    const resNoLapAnon = await fetchUrl('/api/nolap-data-proxy');
    check('API /api/nolap-data-proxy menolak akses anonim (HTTP 401)', () => {
      assert.strictEqual(resNoLapAnon.status, 401);
    });

    // D. Kwitansi Proxy menolak baca anonim
    const resKwAnon = await fetchUrl('/api/kwitansi-data-proxy');
    check('API /api/kwitansi-data-proxy menolak akses anonim (HTTP 401)', () => {
      assert.strictEqual(resKwAnon.status, 401);
    });
  }

  // -------------------------------------------------------------
  // 4. PROTEKSI FILE DATABASE & BACKUP (.htaccess ENFORCEMENT)
  // -------------------------------------------------------------
  console.log('\n[4/5] PEMERIKSAAN ISOLASI DATABASE & BACKUP (.htaccess):');
  {
    const sensitiveUrls = [
      '/data/',
      '/data/nolap_database.json',
      '/data/kwitansi_database.json',
      '/data/surat_umum_database.json',
      '/data/backups/',
      '/visitor-data.json'
    ];

    for (const url of sensitiveUrls) {
      const res = await fetchUrl(url);
      check(`Akses langsung ke ${url} DIBLOKIR oleh server (HTTP 403 Forbidden / 404)`, () => {
        assert.ok(res.status === 403 || res.status === 404, `Status harus 403 atau 404, didapat: ${res.status}`);
      });
    }
  }

  // -------------------------------------------------------------
  // 5. GOOGLE APPS SCRIPT VERSI 5 (LIVE PRODUCTION INTEGRITY)
  // -------------------------------------------------------------
  console.log('\n[5/5] PEMERIKSAAN GOOGLE APPS SCRIPT VERSI 5:');
  {
    // A. GET anonim ke JO endpoint tidak membocorkan submissions
    const resGasJO = await fetchUrl(GAS_JO_URL);
    check('GAS Penugasan JO (Versi 5) aktif tanpa membocorkan submissions (Fail-Closed)', () => {
      assert.strictEqual(resGasJO.status, 200);
      assert.strictEqual(resGasJO.data.authenticated, false);
      assert.strictEqual(resGasJO.data.submissions, undefined);
      assert.strictEqual(resGasJO.data.masterPersonil, undefined);
    });

    // B. GET anonim ke Surat Umum: root aman (tanpa data) dan action GET_SURAT_UMUM_LIST ditolak fail-closed
    const resGasSU = await fetchUrl(`${GAS_SU_URL}?action=GET_SURAT_UMUM_LIST`);
    check('GAS Surat Umum (Versi 5) menolak pengambilan data GET anonim (FORBIDDEN_GET)', () => {
      assert.strictEqual(resGasSU.status, 200);
      assert.strictEqual(resGasSU.data.success, false);
      assert.strictEqual(resGasSU.data.code, 'FORBIDDEN_GET');
      assert.strictEqual(resGasSU.data.suratList, undefined);
    });
  }

  console.log('\n===============================================================');
  console.log(`HASIL AKHIR POST-DEPLOYMENT SMOKE TEST: ${passedChecks} / ${totalChecks} PASS`);
  console.log('===============================================================');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runPostDeploySmokeTest().catch(err => {
  console.error('Fatal smoke test error:', err);
  process.exit(1);
});
