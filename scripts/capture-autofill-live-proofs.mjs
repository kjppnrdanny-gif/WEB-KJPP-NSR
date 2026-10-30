import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9488;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1366,950',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        const timer = setTimeout(() => {
          callbacks.delete(reqId);
          resolve({ error: 'timeout' });
        }, 10000);
        callbacks.set(reqId, (res) => {
          clearTimeout(timer);
          resolve(res);
        });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    const cb = Date.now();

    // 1. CAPTURE LIVE PORTAL-BOP WITH AUTOFILL
    const bopUrl = `https://kjppnanangrahayu.com/portal-bop.html?jo=JO-JKT-2026-0001&pic=${encodeURIComponent('Hendra Wijaya, S.T.')}&bank=${encodeURIComponent('PT Bank Tabungan Negara (Persero) Tbk')}&cb=${cb}`;
    console.log('1. Navigating to:', bopUrl);
    await send('Page.navigate', { url: bopUrl });
    await new Promise(r => setTimeout(r, 4000));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1 && shot1.result && shot1.result.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_autofill_bop.png'), Buffer.from(shot1.result.data, 'base64'));
      console.log('✓ bukti_cpanel_live_autofill_bop.png saved');
    }

    // 2. CAPTURE LIVE PORTAL-NOLAP WITH AUTOFILL
    const nolapUrl = `https://kjppnanangrahayu.com/portal-nolap.html?jo=JO-JKT-2026-0001&debitur=${encodeURIComponent('Hendra Wijaya, S.T.')}&klasifikasi=PS&cb=${cb}`;
    console.log('2. Navigating to:', nolapUrl);
    await send('Page.navigate', { url: nolapUrl });
    await new Promise(r => setTimeout(r, 4000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2 && shot2.result && shot2.result.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_autofill_nolap.png'), Buffer.from(shot2.result.data, 'base64'));
      console.log('✓ bukti_cpanel_live_autofill_nolap.png saved');
    }

    // 3. CAPTURE LIVE PORTAL-KEUANGAN WITH AUTOFILL
    const keuanganUrl = `https://kjppnanangrahayu.com/portal-keuangan.html?jo=JO-JKT-2026-0001&client=${encodeURIComponent('PT Bank Tabungan Negara (Persero) Tbk')}&cb=${cb}`;
    console.log('3. Navigating to:', keuanganUrl);
    await send('Page.navigate', { url: keuanganUrl });
    await new Promise(r => setTimeout(r, 4000));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3 && shot3.result && shot3.result.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_autofill_keuangan.png'), Buffer.from(shot3.result.data, 'base64'));
      console.log('✓ bukti_cpanel_live_autofill_keuangan.png saved');
    }

    // 4. CAPTURE LIVE PORTAL-BOP WITHOUT PARAMS (CLEAN FORM)
    const cleanBopUrl = `https://kjppnanangrahayu.com/portal-bop.html?cb=${cb}`;
    console.log('4. Navigating to clean:', cleanBopUrl);
    await send('Page.navigate', { url: cleanBopUrl });
    await new Promise(r => setTimeout(r, 3000));

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot4 && shot4.result && shot4.result.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_portal_bop_clean.png'), Buffer.from(shot4.result.data, 'base64'));
      console.log('✓ bukti_cpanel_live_portal_bop_clean.png saved');
    }

    ws.close();
    chrome.kill();
    console.log('🎉 ALL LIVE AUTOFILL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('CDP Error:', err);
    chrome.kill();
  }
}

main().catch(console.error);
