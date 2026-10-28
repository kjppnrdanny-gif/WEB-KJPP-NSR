import { spawn } from 'node:child_process';

const DEBUG_PORT = 9298;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('Testing HR Dashboard Timezone Fix via Chrome CDP...');
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    const fileUrl = 'file:///' + process.cwd().replace(/\\/g, '/') + '/portal-presensi.html';
    await send('Page.navigate', { url: fileUrl });
    await new Promise(r => setTimeout(r, 3000));

    // Test getJakartaYmd()
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        ({
          jakartaYmd: typeof getJakartaYmd === 'function' ? getJakartaYmd() : 'NOT_FOUND',
          rosterBadgeText: document.getElementById('hr-subtab-badge-roster')?.textContent || 'NOT_FOUND'
        })
      `,
      returnByValue: true
    });

    console.log('DOM Evaluation Result:', evalRes.result.value);

    if (evalRes.result.value.jakartaYmd !== '2026-10-28') {
      throw new Error('getJakartaYmd did not return 2026-10-28');
    }
    if (evalRes.result.value.rosterBadgeText !== '48') {
      throw new Error('rosterBadgeText is not 48');
    }

    console.log('✓ Timezone fix & Dynamic Roster badge verified successfully!');
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
