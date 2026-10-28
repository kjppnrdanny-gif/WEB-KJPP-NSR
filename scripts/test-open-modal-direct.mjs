import fs from 'node:fs';
import { spawn } from 'node:child_process';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9352', '--no-sandbox', '--disable-gpu', '--window-size=1280,1000', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const tRes = await fetch('http://127.0.0.1:9352/json/new?about:blank', { method: 'PUT' });
  const tData = await tRes.json();
  const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((res) => {
      const reqId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === reqId) { ws.removeEventListener('message', handler); res(msg); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/index.html' });
  await new Promise(r => setTimeout(r, 3500));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const m = document.getElementById('modal-tracking-stepper-publik');
      if (m) {
        m.classList.remove('hidden');
        return { found: true, style: m.style.cssText, display: window.getComputedStyle(m).display };
      }
      return { found: false };
    })()`,
    returnByValue: true
  });
  console.log('Direct remove hidden:', evalRes.result.value);

  await new Promise(r => setTimeout(r, 800));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_cpanel_live_public_stepper_modal.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved screenshot directly!');

  ws.close();
  chrome.kill();
}

main().catch(console.error);
