import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureBaseline() {
  console.log('Capturing current live homepage baseline before refinement...');

  // Desktop
  const chromeDesk = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9488',
    '--no-sandbox',
    '--window-size=1280,900',
    'https://kjppnanangrahayu.com/'
  ]);
  await new Promise(r => setTimeout(r, 6000));
  try {
    const list = await (await fetch('http://127.0.0.1:9488/json/list')).json();
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
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'homepage_before_desktop.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured homepage_before_desktop.png');
      ws.close();
    }
  } finally {
    chromeDesk.kill();
  }

  // Mobile
  const chromeMob = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9487',
    '--no-sandbox',
    '--window-size=390,844',
    'https://kjppnanangrahayu.com/'
  ]);
  await new Promise(r => setTimeout(r, 6000));
  try {
    const list = await (await fetch('http://127.0.0.1:9487/json/list')).json();
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
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'homepage_before_mobile.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured homepage_before_mobile.png');
      ws.close();
    }
  } finally {
    chromeMob.kill();
  }
}

captureBaseline().catch(console.error);
