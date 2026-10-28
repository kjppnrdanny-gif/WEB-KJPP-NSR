import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9498',
    '--no-sandbox',
    '--window-size=1280,850',
    'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec'
  ]);

  await new Promise(r => setTimeout(r, 8000));

  try {
    const listRes = await fetch('http://127.0.0.1:9498/json/list');
    const pages = await listRes.json();
    const livePage = pages.find(p => p.url.includes('script.google.com'));

    if (livePage && livePage.webSocketDebuggerUrl) {
      const ws = new WebSocket(livePage.webSocketDebuggerUrl);
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

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h = document.querySelector('header');
            return {
              headerText: h ? h.innerText.replace(/\\s+/g, ' ').trim() : null,
              hasSvg: !!document.querySelector('header svg text'),
              svgTexts: Array.from(document.querySelectorAll('header svg text')).map(t => t.textContent)
            };
          })()
        `,
        returnByValue: true
      });
      console.log('GAS Header Live DOM:', JSON.stringify(evalRes.result?.value, null, 2));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'gas_v12_live_preview.png'), Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured gas_v12_live_preview.png');

      ws.close();
    }
  } catch(e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
