import fs from 'node:fs';
import { spawn } from 'node:child_process';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9356', '--no-sandbox', '--disable-gpu', '--window-size=1280,1050', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const tRes = await fetch('http://127.0.0.1:9356/json/new?about:blank', { method: 'PUT' });
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

  // Fetch job and call bukaModalTrackingPublik in page context
  const evalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const res = await fetch('backend/job-tracking-handler.php?action=track&jo=TRK-JKT-2026-A89F');
      const json = await res.json();
      if (json && json.data) {
        bukaModalTrackingPublik(json.data);
        // Scroll the modal body down slightly to show vertical stepper items clearly
        const modalBody = document.querySelector('#modal-tracking-stepper-publik .overflow-y-auto');
        if (modalBody) modalBody.scrollTop = 160;
        return { success: true, jo: json.data.jo_number, pelaksana: json.data.penilai_pelaksana };
      }
      return { success: false };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Result:', evalRes.result.value);

  await new Promise(r => setTimeout(r, 1000));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_cpanel_live_public_stepper_modal.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved populated public stepper screenshot!');

  // Now navigate to portal-tracking.html to open detail modal on portal
  console.log('Navigating to live portal-tracking.html...');
  await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-tracking.html' });
  await new Promise(r => setTimeout(r, 3500));

  await send('Runtime.evaluate', {
    expression: `(() => {
      if (typeof bukaModalDetailTracking === 'function') {
        bukaModalDetailTracking('JO-JKT-2026-0001');
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/bukti_cpanel_live_portal_stepper_pic_card.png', Buffer.from(shot2.result.data, 'base64'));
  console.log('Saved populated portal stepper modal screenshot!');

  ws.close();
  chrome.kill();
}

main().catch(console.error);
