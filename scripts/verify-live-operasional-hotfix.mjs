import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = path.resolve('C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d');

function liveRequest(method, pathUrl, payload = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isPost = method === 'POST';
    const postData = isPost && payload ? JSON.stringify(payload) : null;
    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/html, */*',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request({
      hostname: 'kjppnanangrahayu.com',
      port: 443,
      path: pathUrl,
      method: method,
      headers: reqHeaders,
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Live request timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  console.log('========================================================================');
  console.log('🌐 VERIFIKASI LANGSUNG (LIVE PRODUCTION): e-OPERASIONAL HOTFIX');
  console.log('========================================================================\n');

  console.log('[1/3] Menunggu sinkronisasi cPanel & memeriksa HTML portal-operasional.html...');
  let synced = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await liveRequest('GET', `/portal-operasional.html?_ts=${Date.now()}`);
      if (res.status === 200 && typeof res.raw === 'string' && res.raw.includes('table-fixed') && res.raw.includes('sticky right-0')) {
        console.log(`  ✔ Live HTML tersinkronisasi pada percobaan ke-${attempt}!`);
        synced = true;
        break;
      } else {
        console.log(`  ⏳ Percobaan ke-${attempt}: Server masih mengalirkan cache lama. Menunggu 5 detik...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      console.log(`  ⚠️ Gagal menghubungi server (${e.message}), mencoba lagi...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (!synced) {
    console.warn('  ⚠️ Server cPanel / CDN cache mungkin butuh sedikit waktu lebih lama, melanjutkan verifikasi endpoint...');
  }

  // [2/3] Login live menggunakan token NSR-KEU-2026
  console.log('\n[2/3] Menguji Login Live dengan token NSR-KEU-2026...');
  const loginRes = await liveRequest('POST', `/auth-handler.php?_ts=${Date.now()}`, {
    action: 'login',
    token: 'NSR-KEU-2026'
  });

  console.log('  Live login HTTP Status:', loginRes.status);
  console.log('  Live login User Data:', JSON.stringify(loginRes.data?.user || loginRes.raw));

  const cookies = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

  // [3/3] Cek getPengajuanList pada live backend
  console.log('\n[3/3] Memeriksa Hak Otorisasi Live pada operasional-data-handler.php...');
  const oprRes = await liveRequest('GET', `/operasional-data-handler.php?action=getPengajuanList&_ts=${Date.now()}`, null, {
    'Cookie': cookies,
    'X-NSR-Token': 'NSR-KEU-2026'
  });

  console.log('  Live Operasional HTTP Status:', oprRes.status);
  console.log('  Live Operasional Session User:', JSON.stringify(oprRes.data?.currentUser || oprRes.raw));
  console.log('  Total Pengajuan di Server:', oprRes.data?.records?.length ?? 0);

  console.log('\n========================================================================');
  console.log('VERIFIKASI LIVE SELESAI');
  console.log('========================================================================');
})();
