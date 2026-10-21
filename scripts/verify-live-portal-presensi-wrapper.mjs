import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function verifyWrapperLive() {
  console.log('========================================================');
  console.log('🧪 VERIFIKASI LIVE WEBSITE: https://kjppnanangrahayu.com/portal-presensi.html');
  console.log('========================================================\n');

  // Test 1: Desktop
  console.log('1. Membuka portal-presensi.html pada desktop (1280x850)...');
  const chromeDesktop = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9493',
    '--no-sandbox',
    '--window-size=1280,850',
    'https://kjppnanangrahayu.com/portal-presensi.html'
  ]);

  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch('http://127.0.0.1:9493/json/list');
    const pages = await listRes.json();
    const page = pages.find(p => p.url.includes('portal-presensi.html'));

    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);

      let msgId = 1;
      const send = (method, params = {}) => new Promise((resolve) => {
        const id = msgId++;
        const onMsg = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      const evalHeader = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h = document.querySelector('header');
            const ifr = document.getElementById('presensi-frame');
            return {
              headerTitle: h ? h.innerText.replace(/\\s+/g, ' ').trim() : null,
              iframeSrc: ifr ? ifr.src : null,
              isOnline: navigator.onLine
            };
          })()
        `,
        returnByValue: true
      });

      console.log('Header & Wrapper Status:', evalHeader.result?.value);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_portal_presensi_desktop_final.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Screenshot desktop disimpan: live_prod_portal_presensi_desktop_final.png');

      ws.close();
    }
  } finally {
    chromeDesktop.kill();
  }

  // Test 2: Mobile
  console.log('\n2. Membuka portal-presensi.html pada mobile (390x844)...');
  const chromeMobile = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9492',
    '--no-sandbox',
    '--window-size=390,844',
    'https://kjppnanangrahayu.com/portal-presensi.html'
  ]);

  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch('http://127.0.0.1:9492/json/list');
    const pages = await listRes.json();
    const page = pages.find(p => p.url.includes('portal-presensi.html'));

    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);

      let msgId = 1;
      const send = (method, params = {}) => new Promise((resolve) => {
        const id = msgId++;
        const onMsg = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(m.result || m.error);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

      await send('Page.enable');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_portal_presensi_mobile_final.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Screenshot mobile disimpan: live_prod_portal_presensi_mobile_final.png');

      ws.close();
    }
  } finally {
    chromeMobile.kill();
  }

  console.log('\n🎉 VERIFIKASI WEBSITE LIVE SELESAI!');
}

verifyWrapperLive().catch(console.error);
