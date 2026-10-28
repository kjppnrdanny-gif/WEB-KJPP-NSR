import fs from 'node:fs';
import { spawn } from 'node:child_process';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9362', '--no-sandbox', '--disable-gpu', '--window-size=1280,1050', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const tRes = await fetch('http://127.0.0.1:9362/json/new?about:blank', { method: 'PUT' });
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
  
  console.log('Navigating to portal-tracking...');
  await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-tracking.html' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Waiting for globalJobs to populate and clicking first eye button...');
  const evalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      for (let i = 0; i < 20; i++) {
        if (window.globalJobs && window.globalJobs.length > 0) {
          await bukaModalTracking(window.globalJobs[0].id);
          const m = document.getElementById('modal-tracking-stepper');
          return {
            success: true,
            job: window.globalJobs[0].jo_number,
            modalOpen: m && !m.classList.contains('hidden')
          };
        }
        await new Promise(r => setTimeout(r, 400));
      }
      return { success: false, reason: 'globalJobs timeout' };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Result:', evalRes.result.value);

  await new Promise(r => setTimeout(r, 1200));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_cpanel_live_portal_stepper_pic_card.png', Buffer.from(shot.result.data, 'base64'));
  console.log('✓ Successfully saved bukti_cpanel_live_portal_stepper_pic_card.png');

  ws.close();
  chrome.kill();
}

main().catch(console.error);
