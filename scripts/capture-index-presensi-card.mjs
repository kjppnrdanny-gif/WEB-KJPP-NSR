import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureIndexCard() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9491',
    '--no-sandbox',
    '--window-size=1280,900',
    'https://kjppnanangrahayu.com/'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  try {
    const listRes = await fetch('http://127.0.0.1:9491/json/list');
    const pages = await listRes.json();
    const p = pages.find(page => page.url.includes('kjppnanangrahayu.com'));

    if (p && p.webSocketDebuggerUrl) {
      const ws = new WebSocket(p.webSocketDebuggerUrl);
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

      // Scroll to the card section or open modal
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.getElementById('kartu-presensi-wrapper');
            if (el) {
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              return true;
            }
            return false;
          })()
        `
      });

      await new Promise(r => setTimeout(r, 1000));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_index_presensi_card.png'), Buffer.from(shot.data, 'base64'));
      console.log('Saved live_prod_index_presensi_card.png');
      ws.close();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

captureIndexCard();
