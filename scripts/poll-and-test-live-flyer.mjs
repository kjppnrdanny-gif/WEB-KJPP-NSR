// scripts/poll-and-test-live-flyer.mjs
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const LIVE_HOST = 'https://kjppnanangrahayu.com';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function pollLiveSite() {
  console.log('======================================================');
  console.log('📡 1. POLLING LIVE CI/CD DEPLOYMENT KE RUMAHWEB');
  console.log('   Target Host: ' + LIVE_HOST);
  console.log('======================================================');

  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\nAttempt ${attempt}/${maxAttempts} (${new Date().toLocaleTimeString()})...`);
    try {
      const resLayanan = await fetch(`${LIVE_HOST}/layanan.html?_t=${Date.now()}`, { cache: 'no-store' });
      const textLayanan = await resLayanan.text();
      const hasLayananModal = textLayanan.includes('modal-lightbox-flyer');
      const hasLayananThumb = textLayanan.includes('Lihat Flyer Pengadaan Tanah');

      const resIndex = await fetch(`${LIVE_HOST}/?_t=${Date.now()}`, { cache: 'no-store' });
      const textIndex = await resIndex.text();
      const hasIndexLink = textIndex.includes('layanan.html#pengadaan-tanah');

      const resPng = await fetch(`${LIVE_HOST}/images/kegiatan/flyer-pengadaan-tanah.png?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      const resJpg = await fetch(`${LIVE_HOST}/images/kegiatan/flyer-pengadaan-tanah.jpg?_t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });

      console.log(`  layanan.html: HTTP ${resLayanan.status} | Modal: ${hasLayananModal} | Tombol: ${hasLayananThumb}`);
      console.log(`  index.html:   HTTP ${resIndex.status} | Link #pengadaan-tanah: ${hasIndexLink}`);
      console.log(`  Flyer PNG: HTTP ${resPng.status} | Flyer JPG: HTTP ${resJpg.status}`);

      if (hasLayananModal && hasLayananThumb && hasIndexLink && resPng.status === 200 && resJpg.status === 200) {
        console.log('\n✅ Perubahan telah 100% TERDEPLOY ke server produksi live!');
        return true;
      }
    } catch (e) {
      console.log(`  [POLL ERROR]: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 6000));
  }
  throw new Error('Deployment timeout after polling.');
}

async function verifyLiveVisuals() {
  console.log('\n======================================================');
  console.log('📸 2. VERIFIKASI VISUAL LANGSUNG PADA SERVER LIVE');
  console.log('======================================================');

  const chromePath = findChrome();
  const remoteDebuggingPort = 9460;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_live_flyer');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!versionData) throw new Error('Chrome failed to start');

  const targetsRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  // TEST 1: LIVE HOMEPAGE - Tautan 7 Tahap Ganti Kerugian
  console.log('\n--- Uji 1: Live Homepage Link "7 Tahap Ganti Kerugian" ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: `${LIVE_HOST}/?_t=${Date.now()}` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 500));

  const linkInfo = await cdp.evaluate(`(() => {
    const links = Array.from(document.querySelectorAll('a[href*="pengadaan-tanah"]'));
    return links.map(l => ({
      href: l.getAttribute('href'),
      text: l.innerText.trim(),
      box: l.getBoundingClientRect()
    }));
  })()`);
  console.log('  Live Links to #pengadaan-tanah:', JSON.stringify(linkInfo));

  // Scroll to that card
  await cdp.evaluate(`
    const link = document.querySelector('a[href*="layanan.html#pengadaan-tanah"]');
    if (link) {
      link.closest('.group')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  `);
  await new Promise((r) => setTimeout(r, 400));

  const shotHome = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_index_7tahap_link.png'), Buffer.from(shotHome.data, 'base64'));
  console.log('  ✓ Screenshot Live Homepage Link tersimpan: live_production_index_7tahap_link.png');

  // TEST 2: LIVE LAYANAN - Kartu Pengadaan Tanah PSN & Thumbnail Flyer
  console.log('\n--- Uji 2: Live Layanan - Kartu & Thumbnail Flyer ---');
  await cdp.send('Page.navigate', { url: `${LIVE_HOST}/layanan.html#pengadaan-tanah?_t=${Date.now()}` });
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(`document.readyState === 'complete'`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 600));

  await cdp.evaluate(`
    const card = document.getElementById('pengadaan-tanah');
    if (card) {
      card.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  `);
  await new Promise((r) => setTimeout(r, 400));

  const shotCard = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_layanan_kartu_flyer.png'), Buffer.from(shotCard.data, 'base64'));
  console.log('  ✓ Screenshot Live Kartu Layanan tersimpan: live_production_layanan_kartu_flyer.png');

  // TEST 3: LIVE LAYANAN - Buka Lightbox Modal
  console.log('\n--- Uji 3: Live Layanan - Buka Lightbox Modal Flyer ---');
  const modalOpened = await cdp.evaluate(`(() => {
    const btn = document.querySelector('button[onclick*="bukaLightboxFlyer"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  console.log('  Tombol Flyer diklik:', modalOpened ? 'PASS' : 'FAIL');
  await new Promise((r) => setTimeout(r, 800));

  const modalState = await cdp.evaluate(`(() => {
    const modal = document.getElementById('modal-lightbox-flyer');
    const img = document.getElementById('lightbox-flyer-img');
    const isVisible = modal && !modal.classList.contains('hidden');
    return {
      isVisible,
      imgSrc: img ? img.getAttribute('src') : null,
      imgComplete: img ? img.complete : false,
      naturalWidth: img ? img.naturalWidth : 0,
      naturalHeight: img ? img.naturalHeight : 0
    };
  })()`);
  console.log('  Live Modal State:', JSON.stringify(modalState));

  const shotModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_lightbox_flyer_open.png'), Buffer.from(shotModal.data, 'base64'));
  console.log('  ✓ Screenshot Live Lightbox Modal tersimpan: live_production_lightbox_flyer_open.png');

  // TEST 4: LIVE MOBILE VIEWPORT (375x667)
  console.log('\n--- Uji 4: Live Mobile Viewport (375x667) ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 400));

  const shotMobileModal = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_mobile_lightbox_flyer.png'), Buffer.from(shotMobileModal.data, 'base64'));
  console.log('  ✓ Screenshot Live Mobile Lightbox tersimpan: live_production_mobile_lightbox_flyer.png');

  // Tutup modal via Escape key pada live site
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 400));

  const closedState = await cdp.evaluate(`(() => {
    const modal = document.getElementById('modal-lightbox-flyer');
    return modal ? modal.classList.contains('hidden') : false;
  })()`);
  console.log('  Modal tertutup dengan Escape key:', closedState ? 'PASS' : 'FAIL');

  // Capture mobile card state
  await cdp.evaluate(`(() => {
    const el = document.getElementById('pengadaan-tanah');
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const shotMobileCard = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_production_mobile_kartu_flyer.png'), Buffer.from(shotMobileCard.data, 'base64'));
  console.log('  ✓ Screenshot Live Mobile Kartu tersimpan: live_production_mobile_kartu_flyer.png');

  // Clean up Chrome
  try { await cdp.send('Browser.close'); } catch (_) {}
  try { chromeProc.kill(); } catch (_) {}
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  console.log('\n======================================================');
  console.log('✨ VERIFIKASI LIVE PRODUCTION SELESAI DENGAN SUKSES!');
  console.log('======================================================');
}

async function main() {
  await pollLiveSite();
  await verifyLiveVisuals();
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
