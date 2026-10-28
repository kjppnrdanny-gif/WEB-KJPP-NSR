import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9477',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9477/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to live portal...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 3000));

    // Simulate login as Super Admin Pusat
    console.log('Simulating login as Super Admin Pusat...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const user = {
            username: 'superadmin_pusat',
            role: 'SUPER ADMIN',
            roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
            wilayah: 'PUSAT',
            kantor: 'Pusat (Jakarta)',
            cabang: 'Pusat',
            isSuperAdmin: true,
            aksesApproval: true,
            isCabang: false
          };
          localStorage.setItem('auth_portal_nolap', JSON.stringify(user));
          if (typeof sesiAktif !== 'undefined') sesiAktif = user;
          if (typeof applyRBAC === 'function') applyRBAC(user);
          if (typeof gantiTab === 'function') gantiTab('approval');
          if (typeof muatUlangTabel === 'function') muatUlangTabel();
          
          const tbody = document.getElementById('tabel-body-pending');
          return {
            tableHtml: tbody ? tbody.innerHTML : '',
            rowsCount: tbody ? tbody.children.length : 0,
            hasUndefined: tbody ? tbody.innerText.includes('undefined') : false,
            innerText: tbody ? tbody.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Runtime eval result:', JSON.stringify(evalRes, null, 2));

    await new Promise(r => setTimeout(r, 1000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const imgPath = path.join(ARTIFACT_DIR, 'test_live_approval_table_fixed.png');
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log('Screenshot saved to:', imgPath);

  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
