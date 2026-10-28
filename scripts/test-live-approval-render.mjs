import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9489',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9489/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Runtime.exceptionThrown') {
        console.error('Page Exception:', JSON.stringify(m.params.exceptionDetails));
      }
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

    // Set localStorage BEFORE navigation
    console.log('Injecting auth into localStorage before load...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 4000));

    // Check what is in window
    const globals = await send('Runtime.evaluate', {
      expression: `
        ({
          hasApplyRBAC: typeof applyRBAC !== 'undefined',
          hasWindowApplyRBAC: typeof window.applyRBAC !== 'undefined',
          hasMuatUlangTabel: typeof muatUlangTabel !== 'undefined',
          hasResolveNamaPenilaiDisplay: typeof resolveNamaPenilaiDisplay !== 'undefined',
          scriptsCount: document.scripts.length
        })
      `,
      returnByValue: true
    });
    console.log('Page globals check:', globals.result.value);

    // Perform login via input fields or functions
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const user = {
            username: 'superadmin_pusat',
            role: 'SUPER ADMIN',
            roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
            wilayah: 'PUSAT',
            kantor: 'Pusat (Jakarta)',
            cabang: 'Pusat',
            token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
            tokenHash: '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f',
            isSuperAdmin: true,
            aksesApproval: true,
            isCabang: false
          };
          localStorage.setItem('auth_portal_nolap', JSON.stringify(user));
          sessionStorage.setItem('NSR_AUTH_TOKEN', (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"));
          
          if (typeof window.applyRBAC === 'function') {
            window.applyRBAC(user);
          }
          if (typeof window.gantiTabModul === 'function') {
            window.gantiTabModul('approval');
          } else if (typeof gantiTab === 'function') {
            gantiTab('approval');
          }
          
          // Trigger sync or load
          if (typeof window.sinkronkanDariServerProxy === 'function') {
            await window.sinkronkanDariServerProxy();
          }
          if (typeof window.muatUlangTabel === 'function') {
            window.muatUlangTabel();
          }

          const tbody = document.getElementById('tabel-body-pending');
          const rows = Array.from(tbody ? tbody.querySelectorAll('tr') : []).map(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
            return {
              noReq: cells[0],
              cabang: cells[1],
              klien: cells[2] ? cells[2].split('\\n')[0] : '',
              penilai: cells[3],
              status: cells[4]
            };
          });

          return {
            totalRows: rows.length,
            hasUndefined: tbody ? tbody.innerText.includes('undefined') : false,
            rows: rows
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Eval result:', JSON.stringify(evalRes, null, 2));

    await new Promise(r => setTimeout(r, 1000));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const imgPath = path.join(ARTIFACT_DIR, 'test_live_approval_table_fixed.png');
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log('✅ Screenshot saved to:', imgPath);

  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
