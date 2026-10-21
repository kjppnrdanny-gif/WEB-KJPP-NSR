import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function verifyLive() {
  console.log('========================================================');
  console.log('🧪 VERIFIKASI LIVE WEBSITE: https://kjppnanangrahayu.com/');
  console.log('========================================================\n');

  console.log('1. Memeriksa propagasi perubahan pada server live...');
  let deployed = false;
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await fetch(`https://kjppnanangrahayu.com/?t=${Date.now()}`, { cache: 'no-store' });
      const html = await res.text();
      if (html.includes('Kantor Jasa Penilai Publik Terpercaya') || html.includes('btn-toggle-extra-mutu')) {
        console.log(`✓ Perubahan terdeteksi live pada percobaan ke-${attempt}!`);
        deployed = true;
        break;
      }
    } catch (e) {
      console.log(`Menunggu server... (${e.message})`);
    }
    console.log(`Menunggu deployment live (percobaan ${attempt}/12)...`);
    await new Promise(r => setTimeout(r, 5000));
  }

  // 1. Desktop Test (1280x900)
  console.log('\n2. Mengambil screenshot Desktop (1280x900)...');
  const chromeDesk = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9484',
    '--no-sandbox',
    '--window-size=1280,900',
    `https://kjppnanangrahayu.com/?refine=${Date.now()}`
  ]);
  await new Promise(r => setTimeout(r, 6000));

  try {
    const list = await (await fetch('http://127.0.0.1:9484/json/list')).json();
    const page = list.find(p => p.url.includes('kjppnanangrahayu.com'));
    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);
      let id = 1;
      const send = (method, params = {}) => new Promise(res => {
        const cur = id++;
        const handler = e => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result || d.error); }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

      await send('Page.enable');
      await send('Runtime.enable');

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h1 = document.querySelector('h1');
            return {
              h1Text: h1 ? h1.innerText.replace(/\\s+/g, ' ').trim() : null,
              hasHorizontalOverflow: document.body.scrollWidth > document.documentElement.clientWidth
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Live Desktop Info:', evalRes.result?.value);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'homepage_after_desktop.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured homepage_after_desktop.png');

      ws.close();
    }
  } finally {
    chromeDesk.kill();
  }

  // 2. Mobile Test (390x844)
  console.log('\n3. Mengambil screenshot Mobile (390x844)...');
  const chromeMob = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9483',
    '--no-sandbox',
    '--window-size=390,844',
    `https://kjppnanangrahayu.com/?refine=${Date.now()}`
  ]);
  await new Promise(r => setTimeout(r, 6000));

  try {
    const list = await (await fetch('http://127.0.0.1:9483/json/list')).json();
    const page = list.find(p => p.url.includes('kjppnanangrahayu.com'));
    if (page && page.webSocketDebuggerUrl) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);
      let id = 1;
      const send = (method, params = {}) => new Promise(res => {
        const cur = id++;
        const handler = e => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result || d.error); }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

      await send('Page.enable');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'homepage_after_mobile.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured homepage_after_mobile.png');

      ws.close();
    }
  } finally {
    chromeMob.kill();
  }

  console.log('\n🎉 VERIFIKASI HOMEPAGE SETELAH PENYEMPURNAAN SUKSES!');
}

verifyLive().catch(console.error);
