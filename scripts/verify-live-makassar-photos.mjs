import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9459',
  '--no-sandbox',
  'about:blank'
]);
await new Promise(r => setTimeout(r, 1500));

const targetRes = await fetch('http://127.0.0.1:9459/json/new?about:blank', { method: 'PUT' });
const targetData = await targetRes.json();
const ws = new WebSocket(targetData.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise(res => {
  const curId = id++;
  const handler = (e) => {
    const data = JSON.parse(e.data);
    if (data.id === curId) {
      ws.removeEventListener('message', handler);
      res(data.result);
    }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id: curId, method, params }));
});

await send('Page.enable');
await send('Network.enable');

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false
});

console.log('Navigating to live production portofolio-rekanan.html...');
await send('Page.setLifecycleEventsEnabled', { enabled: true });
await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portofolio-rekanan.html' });

await new Promise(resolve => {
  const handler = e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Page.loadEventFired') {
      ws.removeEventListener('message', handler);
      resolve();
    }
  };
  ws.addEventListener('message', handler);
});

await new Promise(r => setTimeout(r, 1500));

// Scroll to galeri and decode images
const liveEval = await send('Runtime.evaluate', {
  expression: `(async () => {
    const el = document.getElementById('galeri-kegiatan');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    const imgs = Array.from(document.querySelectorAll('#galeri-kegiatan img'));
    imgs.forEach(img => { img.loading = 'eager'; });
    await Promise.all(imgs.map(async img => {
      try {
        if (!img.complete) {
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
        }
        await img.decode();
      } catch (e) {}
    }));
    return {
      total: imgs.length,
      counter: document.querySelector('#galeri-kegiatan .font-semibold')?.innerText || '',
      makassar1: {
        src: document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]')?.src,
        complete: document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]')?.complete,
        w: document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]')?.naturalWidth,
        h: document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]')?.naturalHeight
      },
      makassar2: {
        src: document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]')?.src,
        complete: document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]')?.complete,
        w: document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]')?.naturalWidth,
        h: document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]')?.naturalHeight
      }
    };
  })()`,
  awaitPromise: true,
  returnByValue: true
});

console.log('Live Verification Result:', JSON.stringify(liveEval.result.value, null, 2));

await new Promise(r => setTimeout(r, 600));
const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_makassar_galeri_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));
console.log('Saved live_makassar_galeri_desktop.png');

// Test Live Lightbox Card 1
await send('Runtime.evaluate', {
  expression: `
    const card1 = document.querySelector('img[src*="kantor-cabang-makassar.jpeg"]').closest('.cursor-pointer');
    if (card1) card1.click();
  `
});
await new Promise(r => setTimeout(r, 800));
const shotLb1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_makassar_lightbox1.png'), Buffer.from(shotLb1.data, 'base64'));
console.log('Saved live_makassar_lightbox1.png');

// Test Live Lightbox Card 2
await send('Runtime.evaluate', {
  expression: `
    tutupLightbox();
    const card2 = document.querySelector('img[src*="kantor-cabang-makassar2.jpeg"]').closest('.cursor-pointer');
    if (card2) card2.click();
  `
});
await new Promise(r => setTimeout(r, 800));
const shotLb2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_makassar_lightbox2.png'), Buffer.from(shotLb2.data, 'base64'));
console.log('Saved live_makassar_lightbox2.png');

chrome.kill();
process.exit(0);
