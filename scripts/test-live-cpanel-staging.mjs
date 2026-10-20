/**
 * SCRIPT: test-live-cpanel-staging.mjs
 * Melakukan verifikasi langsung (smoke test & auth check) ke staging server hosting cPanel:
 * https://kjppnanangrahayu.com/staging/
 */

const BASE_URL = 'https://kjppnanangrahayu.com/staging';

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const text = await res.text();
    const isOk = res.status >= 200 && res.status < 400;
    console.log(`${isOk ? '✅' : '❌'} [${res.status}] ${label}`);
    console.log(`   URL: ${url}`);
    console.log(`   Panjang Konten: ${text.length} bytes`);
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      console.log(`   Judul Halaman : "${titleMatch[1].trim()}"`);
    }
    return { ok: isOk, status: res.status, len: text.length };
  } catch (e) {
    console.error(`❌ [ERR] ${label}: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

async function run() {
  console.log('======================================================================');
  console.log('🔍 PENGUJIAN SMOKE TEST LIVE STAGING HOSTING CPANEL');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('======================================================================\n');

  const r1 = await checkUrl(`${BASE_URL}/portal-operasional.html`, 'Portal e-Operasional');
  const r2 = await checkUrl(`${BASE_URL}/portal-kwitansi.html`, 'Portal Kwitansi Dual Mode');
  const r3 = await checkUrl(`${BASE_URL}/verifikasi-dokumen.html`, 'Halaman Verifikasi Dokumen Publik');
  const r4 = await checkUrl(`${BASE_URL}/index.html`, 'Beranda Staging');

  // Test API e-Operasional
  try {
    const apiRes = await fetch(`${BASE_URL}/operasional-data-handler.php?action=getPengajuanList`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NSR-Token': 'NSR-STAGE-MASTER-77'
      },
      body: JSON.stringify({})
    });
    const apiJson = await apiRes.json();
    console.log(`\n${apiJson.success ? '✅' : '❌'} [${apiRes.status}] API e-Operasional getPengajuanList`);
    console.log(`   Total Pengajuan Ditemukan: ${apiJson.data?.length || 0}`);
  } catch (e) {
    console.error(`❌ [ERR] API e-Operasional: ${e.message}`);
  }

  // Test Verifikasi Dokumen Publik QR Valid
  try {
    const docNo = 'OPR-SRV/2.19.0160-00/X/2026/0001';
    // Ambil data detail untuk cek QR
    const verifUrl = `${BASE_URL}/verifikasi-dokumen.html?doc=${encodeURIComponent(docNo)}&tier=5`;
    const verifRes = await checkUrl(verifUrl, 'Verifikasi Dokumen Publik Sample QR Tier 5');
  } catch (e) {
    console.error(`❌ [ERR] QR Verif: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('🏁 Pengujian Selesai');
  console.log('======================================================================');
}

run();
