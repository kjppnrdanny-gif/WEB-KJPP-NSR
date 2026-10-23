import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PORT = 9580;
const PORT = 8960;
const PAGES = [
  'index.html',
  'layanan.html',
  'portofolio-rekanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

async function main() {
  console.log('🚀 Memulai Uji Komprehensif Desain Premium Login OPINI NSR pada 6 Halaman...');
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-modal-audit-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,900',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }
  if (!connected) throw new Error('Gagal koneksi ke Chrome CDP port ' + CHROME_PORT);

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  let loadFired = false;
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') loadFired = true;
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  for (const pageName of PAGES) {
    console.log(`\n📄 Menguji halaman: ${pageName}...`);
    loadFired = false;
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${pageName}` });
    for (let i = 0; i < 40; i++) {
      if (loadFired) break;
      await new Promise(r => setTimeout(r, 150));
    }
    await new Promise(r => setTimeout(r, 600));

    // Buka Modal Portal
    const openRes = await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof bukaModalPortal === 'function') {
          bukaModalPortal();
        } else {
          const m = document.getElementById('modal-portal');
          if (m) m.classList.remove('hidden');
        }
        const m = document.getElementById('modal-portal');
        const form = document.getElementById('form-token-portal');
        const inp = document.getElementById('input-token');
        const btn = document.getElementById('btn-submit-token');
        return JSON.stringify({
          isOpen: m && !m.classList.contains('hidden'),
          hasForm: Boolean(form),
          hasInput: Boolean(inp),
          hasSubmit: Boolean(btn),
          hasLogo: Boolean(m?.querySelector('svg')),
          formClass: form?.className
        });
      })()`,
      returnByValue: true
    });

    const state = JSON.parse(openRes.result?.value || '{}');
    console.log(`   State Modal ${pageName}:`, state);
    if (!state.isOpen || !state.hasForm || !state.hasInput || !state.hasSubmit) {
      throw new Error(`FAILED: Modal premium login tidak valid di ${pageName}! State: ` + JSON.stringify(state));
    }

    // Capture screenshot Desktop
    if (pageName === 'index.html') {
      const ssDesktop = await send('Page.captureScreenshot', { format: 'png' });
      const fDesktop = path.join(ARTIFACT_DIR, 'bukti_login_premium_desktop.png');
      fs.writeFileSync(fDesktop, Buffer.from(ssDesktop.data, 'base64'));
      console.log('   📸 Screenshot Desktop Login Premium tersimpan:', fDesktop);

      // Ubah viewport ke Mobile (375x812)
      await send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 500));
      const ssMobile = await send('Page.captureScreenshot', { format: 'png' });
      const fMobile = path.join(ARTIFACT_DIR, 'bukti_login_premium_mobile.png');
      fs.writeFileSync(fMobile, Buffer.from(ssMobile.data, 'base64'));
      console.log('   📸 Screenshot Mobile Login Premium tersimpan:', fMobile);

      // Reset viewport ke Desktop
      await send('Emulation.clearDeviceMetricsOverride');
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`   ✅ Halaman ${pageName} LULUS verifikasi modal premium.`);
  }

  console.log('\n===============================================================');
  console.log('🎉 SEMUA 6 HALAMAN LULUS VERIFIKASI PREMIUM LOGIN OPINI NSR!');
  console.log('===============================================================');

  chrome.kill();
  php.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL MODAL TEST ERROR:', err);
  process.exit(1);
});
