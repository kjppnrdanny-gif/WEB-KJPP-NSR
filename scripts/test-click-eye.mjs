import { spawn } from 'node:child_process';

async function main() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9370', '--no-sandbox', '--disable-gpu', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const tRes = await fetch('http://127.0.0.1:9370/json/new?about:blank', { method: 'PUT' });
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
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  };

  await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-tracking.html' });
  await new Promise(r => setTimeout(r, 3500));

  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Lihat 7 Milestone"]');
      if (btn) {
        btn.click();
        return { clicked: true, onclick: btn.getAttribute('onclick') };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);

  await new Promise(r => setTimeout(r, 1500));

  const checkRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const m = document.getElementById('modal-tracking-stepper');
      return {
        hasModal: !!m,
        hidden: m ? m.classList.contains('hidden') : null,
        pelaksana: document.getElementById('modal-team-pelaksana')?.innerText,
        reviewer: document.getElementById('modal-team-reviewer')?.innerText,
        penilaiPublik: document.getElementById('modal-team-penilaipublik')?.innerText,
        waHref: document.getElementById('modal-btn-wa')?.href
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal status after click:', checkRes.result.value);

  ws.close();
  chrome.kill();
}

main().catch(console.error);
