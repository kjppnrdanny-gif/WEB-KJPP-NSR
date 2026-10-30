import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = 9522;
const artifactsDir = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const tmpUserData = path.join(os.tmpdir(), `chrome-test-compact-${Date.now()}`);

async function main() {
  console.log('Launching headless Chrome on port', port, 'userDataDir:', tmpUserData);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpUserData}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,950',
    'about:blank'
  ]);

  let tData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const tRes = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      tData = await tRes.json();
      if (tData && tData.webSocketDebuggerUrl) break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  if (!tData || !tData.webSocketDebuggerUrl) {
    throw new Error('Failed to connect to Chrome debugging endpoint');
  }

  console.log('Connected to Chrome WebSocket:', tData.webSocketDebuggerUrl);
  const ws = new globalThis.WebSocket(tData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((res) => {
      const reqId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', handler);
          res(msg);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to https://kjppnanangrahayu.com ...');
  await send('Page.navigate', { url: `https://kjppnanangrahayu.com/?cb=${Date.now()}` });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Logging in with token NSR8899 on live site...');
  const resAuth = await send('Runtime.evaluate', {
    expression: `(async () => {
      // Buka modal
      if (typeof bukaModalPortal === 'function') {
        bukaModalPortal('all');
      }

      await new Promise(r => setTimeout(r, 500));

      const inp = document.getElementById('input-token');
      const formToken = document.getElementById('form-token-portal');
      if (inp) {
        inp.value = 'NSR8899';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (typeof verifikasiTokenPortal === 'function') {
        const ev = new Event('submit', { cancelable: true });
        await verifikasiTokenPortal(ev);
      }

      await new Promise(r => setTimeout(r, 1200));

      const modal = document.getElementById('modal-portal');
      const panel = document.getElementById('panel-layanan');
      const govHero = document.getElementById('governance-hero-slot');
      const cards = document.getElementById('container-kartu-layanan');
      const label = document.getElementById('label-lokasi');

      return {
        modalVisible: modal && !modal.classList.contains('hidden'),
        panelVisible: panel && !panel.classList.contains('hidden'),
        govHeroDisplay: govHero ? govHero.style.display : null,
        govHeroText: govHero ? govHero.innerText.replace(/\\s+/g, ' ') : null,
        labelLokasi: label ? label.innerHTML : null,
        cardCount: cards ? cards.children.length : 0
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Auth & Modal State:', resAuth.result.value);

  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing screenshot of compact modal portal...');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = `${artifactsDir}/bukti_cpanel_live_compact_portal_modal.png`;
  fs.writeFileSync(outPath, Buffer.from(shot.result.data, 'base64'));
  console.log('✓ Successfully saved screenshot to:', outPath);

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(tmpUserData, { recursive: true, force: true });
  } catch (e) {}
}

main().catch((err) => {
  console.error('Error in capture:', err);
  process.exit(1);
});
