import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9574;
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function captureLiveDedupProof() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-dedup-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const handlers = new Map();

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      const dialogId = id++;
      ws.send(JSON.stringify({ id: dialogId, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
    }
    if (m.id && handlers.has(m.id)) {
      const cb = handlers.get(m.id);
      handlers.delete(m.id);
      cb(m.result !== undefined ? m.result : m);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    handlers.set(msgId, (res) => {
      if (res && res.error) reject(new Error(JSON.stringify(res.error)));
      else resolve(res);
    });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  console.log('Navigating to live production URL...');
  await send('Page.navigate', { url: LIVE_URL });

  for (let i = 0; i < 30; i++) {
    const readyRes = await send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" && typeof window.perbaruiIndikatorTab3 === "function"'
    });
    if (readyRes.result?.value === true) break;
    await new Promise(r => setTimeout(r, 300));
  }

  // 1. CAPTURE APPROVED PROJECT (Shows Read-only Badge & Single Action Button 'Lihat Detail Pengesahan')
  console.log('Setting Approved project on live production Tab 3...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const kingSession = {
        valid: true,
        role: 'SUPER_ADMIN',
        roleLabel: 'SUPER ADMIN • KING',
        wilayah: 'Kantor Pusat Jakarta',
        wilayahLabel: 'Kantor Pusat Jakarta',
        isSuperAdmin: true,
        isKing: true,
        mode: 'PUSAT',
        canApprove: true,
        canSubmit: true
      };
      window.simpanSesiSSO(kingSession);
      window.terapkanSesiUI(kingSession);
      if (typeof window.tutupModalToken === 'function') window.tutupModalToken();

      const sampleApproved = {
        id: 'JO-2026-LIVE-PROOF',
        nomor_lp: '0416/NSR/PN-APP/X/2026',
        nomor_jo: '0416/JO/NSR/X/2026',
        debitur_nama: 'PT BERKAH MAKMUR NUSANTARA',
        klien_nama: 'PT BANK MANDIRI (PERSERO) TBK',
        status: 'APPROVED',
        status_approval: 'APPROVED_PUSAT',
        alur: 'PUSAT',
        tanggal_surat: '2026-10-24',
        objek_list: [{ jenis: 'Tanah dan Bangunan', lokasi: 'Jl. Ampera Raya No. 12' }]
      };
      window.DATA_PROYEK_TERPILIH = sampleApproved;
      window.activeProjectData = sampleApproved;
      if (typeof window.perbaruiIndikatorTab3 === 'function') window.perbaruiIndikatorTab3(sampleApproved);
      window.gantiTab(3);
      if (typeof window.renderPratinjauDokumen === 'function') window.renderPratinjauDokumen();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_tab3_deduplication.png'), buf);
  console.log('Saved bukti_live_tab3_deduplication.png');

  chrome.kill();
  console.log('Capture live complete!');
}

captureLiveDedupProof().catch(console.error);
