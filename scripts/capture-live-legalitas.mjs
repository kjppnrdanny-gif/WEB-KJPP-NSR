// scripts/capture-live-legalitas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUTPUT_DIR = path.join(ROOT_DIR, 'evidence_ringkas');

async function run() {
  console.log('Connecting to Chrome to capture LIVE production proof of Legalitas Terpadu & Asosiasi...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9257',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9257/json/new?about:blank', { method: 'PUT' });
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
    await send('Runtime.enable');

    // 1. Desktop View (1440x900)
    console.log('Navigating to live https://kjppnanangrahayu.com/ ...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll slightly to get the entire Kredensial & Legalitas card perfectly in view
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('profil');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    let buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'legalitas_terpadu_live_desktop.png'), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'legalitas_terpadu_live_desktop.png'), buf);
    console.log('Saved legalitas_terpadu_live_desktop.png');

    // 2. Mobile Smartphone View (390x844 - iPhone 14)
    console.log('Capturing mobile smartphone view...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Runtime.evaluate', {
      expression: `
        // Find Legalitas Terpadu element and scroll to it
        const el = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Legalitas Terpadu'));
        if (el) {
          const card = el.closest('div.flex');
          if (card) {
            const top = card.getBoundingClientRect().top + window.scrollY - 150;
            window.scrollTo(0, top);
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'legalitas_terpadu_live_mobile.png'), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'legalitas_terpadu_live_mobile.png'), buf);
    console.log('Saved legalitas_terpadu_live_mobile.png');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

run().catch(console.error);
