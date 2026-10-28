import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const DEBUG_PORT = 9485;
const LIVE_PORTAL_URL = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';

async function captureProof() {
  console.log('====================================================');
  console.log('CAPTURING LIVE PROOF FOR DENI SISWANDI, S.T., MAPPI: ' + LIVE_PORTAL_URL);
  console.log('====================================================\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  let wsUrl = '';
  await new Promise((resolve, reject) => {
    chrome.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsUrl = match[1];
        resolve();
      }
    });
    setTimeout(() => {
      if (!wsUrl) reject(new Error('Timeout connecting to Chrome DevTools'));
    }, 6000);
  });

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();

    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m);
      }
    };

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.result?.value;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res.result?.data) {
        const buf = Buffer.from(res.result.data, 'base64');
        const outPath = path.join(ARTIFACTS_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`[SCREENSHOT] Saved: ${outPath}`);
      }
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`[NAVIGATE] Loading live ${LIVE_PORTAL_URL}`);
    await send('Page.navigate', { url: LIVE_PORTAL_URL });
    await new Promise(r => setTimeout(r, 3500));

    // Set Bandung Admin session
    await evaluate(`
      window.CURRENT_AUTH_SESSION = {
        sub: 'cabang_bdg',
        nama: 'Ahmad Fauzi, S.T.',
        nik: 'NSR-2020-012',
        role: 'ADMIN_CABANG',
        roleLabel: 'Admin Cabang Bandung',
        wilayah: 'Bandung',
        wilayahLabel: 'Kantor Cabang Bandung',
        wilayahCode: 'BDG',
        isCabang: true
      };
      if (typeof inisialisasiModeAksesDariUrl === 'function') inisialisasiModeAksesDariUrl();
      const selWil = document.getElementById('kantor_wilayah');
      if (selWil) { selWil.value = 'Kantor Cabang Bandung'; handleWilayahChange(); }
    `);
    await new Promise(r => setTimeout(r, 1200));

    // Capture Tab 1 (Bandung Mandiri Cabang Form with Deni Siswandi, S.T., MAPPI)
    await screenshot('bukti_live_bandung_deni_siswandi_form.png');

    // Switch to Tab 2 Dashboard
    await evaluate(`gantiTab(2);`);
    await new Promise(r => setTimeout(r, 1000));
    await screenshot('bukti_live_tab2_audit_trail_mandiri.png');

    console.log('\n✓ Berhasil menangkap screenshot bukti live website!');
    ws.close();
  } finally {
    chrome.kill();
  }
}

captureProof().catch(err => {
  console.error('Error capturing proof:', err);
  process.exit(1);
});
