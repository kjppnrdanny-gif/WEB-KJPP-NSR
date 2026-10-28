// scripts/capture-live-branch-photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_DIR = path.join(ROOT_DIR, 'evidence_ringkas');

function saveDual(filename, buffer) {
  const localPath = path.join(OUTPUT_DIR, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  try {
    fs.writeFileSync(artifactPath, buffer);
  } catch(e) {}
  console.log('Saved:', filename, '(' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9254',
    '--no-sandbox',
    '--disable-features=Translate',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9254/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // 1. LIVE PORTFOLIO REKANAN - GALLERY DESKTOP
    console.log('Navigating to live portofolio-rekanan.html...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portofolio-rekanan.html#galeri-kegiatan' });
    await new Promise(r => setTimeout(r, 3500));

    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('galeri-kegiatan');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const shotLiveGallery = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('live_production_galeri_kegiatan_desktop.png', Buffer.from(shotLiveGallery.data, 'base64'));

    // 2. LIVE LIGHTBOX BANDUNG
    console.log('Testing live lightbox Bandung...');
    await send('Runtime.evaluate', {
      expression: `
        const cardBandung = document.querySelector('img[src*="kantor-cabang-bandung"]').closest('.cursor-pointer');
        if (cardBandung) cardBandung.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotLiveBdg = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('live_production_lightbox_bandung.png', Buffer.from(shotLiveBdg.data, 'base64'));

    await send('Runtime.evaluate', { expression: `tutupLightbox();` });
    await new Promise(r => setTimeout(r, 600));

    // 3. LIVE LIGHTBOX PADANG
    console.log('Testing live lightbox Padang...');
    await send('Runtime.evaluate', {
      expression: `
        const cardPadang = document.querySelector('img[src*="kantor-cabang-padang.jpeg"]').closest('.cursor-pointer');
        if (cardPadang) cardPadang.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotLivePdg = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('live_production_lightbox_padang.png', Buffer.from(shotLivePdg.data, 'base64'));

    await send('Runtime.evaluate', { expression: `tutupLightbox();` });
    await new Promise(r => setTimeout(r, 600));

    // 4. LIVE MOBILE VIEW
    console.log('Testing live mobile view...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        const cardBandung = document.querySelector('img[src*="kantor-cabang-bandung"]').closest('.cursor-pointer');
        if (cardBandung) cardBandung.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shotLiveMobile = await send('Page.captureScreenshot', { format: 'png' });
    saveDual('live_production_galeri_mobile.png', Buffer.from(shotLiveMobile.data, 'base64'));

    console.log('All live captures finished!');
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Live capture failed:', err);
  process.exit(1);
});
