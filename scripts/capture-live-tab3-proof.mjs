import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9572;
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function captureLiveProof() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-proof-'));
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
  let dialogEvents = [];

  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      dialogEvents.push(m.params);
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

  // Wait until page is completely loaded
  for (let i = 0; i < 30; i++) {
    const readyRes = await send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" && typeof window.simpanSesiSSO === "function" && typeof window.gantiTab === "function"'
    });
    if (readyRes.result?.value === true) break;
    await new Promise(r => setTimeout(r, 300));
  }

  // 1. KING SESSION CAPTURE ON LIVE PRODUCTION
  console.log('Setting KING session and opening Tab 3...');
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
        canSubmit: true,
        permissions: ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all']
      };
      window.simpanSesiSSO(kingSession);
      window.terapkanSesiUI(kingSession);
      if (typeof window.tutupModalToken === 'function') window.tutupModalToken();

      const sampleKing = {
        id: 'JO-WAITING-KING-OVERSIGHT',
        nomor_lp: 'SPK-2026/PST/0099',
        nomor_jo: 'JO-2026/PST/0099',
        debitur_nama: 'PT MEGA CORP INDONESIA',
        klien_nama: 'PT BANK MANDIRI (PERSERO) TBK',
        status: 'WAITING_APPROVAL',
        status_approval: 'WAITING_APPROVAL',
        alur: 'PUSAT',
        tanggal_surat: '2026-10-24',
        objek_list: [{ jenis: 'Tanah dan Bangunan Komersial', lokasi: 'Jl. Jend. Sudirman Kav. 50, Jakarta' }]
      };
      window.DATA_PROYEK_TERPILIH = sampleKing;
      window.activeProjectData = sampleKing;
      if (typeof window.perbaruiIndikatorTab3 === 'function') window.perbaruiIndikatorTab3(sampleKing);
      window.gantiTab(3);
      if (typeof window.renderPratinjauDokumen === 'function') window.renderPratinjauDokumen();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  const kingShot = await send('Page.captureScreenshot', { format: 'png' });
  const kingBuf = Buffer.from(kingShot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_king_tab3_oversight.png'), kingBuf);
  console.log('Saved bukti_live_king_tab3_oversight.png');

  // 2. ADMIN PUSAT PRA-APPROVAL PREVIEW CAPTURE ON LIVE PRODUCTION
  console.log('Setting Admin Pusat session and previewing WAITING_APPROVAL project...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const pusatSession = {
        valid: true,
        role: 'ADMIN_PUSAT',
        roleLabel: 'ADMIN OPERASIONAL PUSAT',
        wilayah: 'Kantor Pusat Jakarta',
        wilayahLabel: 'Kantor Pusat Jakarta',
        isSuperAdmin: false,
        isAdminPusat: true,
        isKing: false,
        mode: 'PUSAT',
        canApprove: true,
        canSubmit: true
      };
      window.simpanSesiSSO(pusatSession);
      window.terapkanSesiUI(pusatSession);
      if (typeof window.tutupModalToken === 'function') window.tutupModalToken();

      const samplePusat = {
        id: 'JO-WAITING-PROD-VERIF',
        nomor_lp: 'SPK-2026/PST/0088',
        nomor_jo: 'JO-2026/PST/0088',
        debitur_nama: 'PT PRIMA ENERGI NUSANTARA',
        klien_nama: 'PT BANK NEGARA INDONESIA (PERSERO) TBK',
        status: 'WAITING_APPROVAL',
        status_approval: 'WAITING_APPROVAL',
        alur: 'PUSAT',
        tanggal_surat: '2026-10-24',
        objek_list: [{ jenis: 'Pabrik dan Mesin Industri', lokasi: 'Kawasan Industri MM2100' }]
      };
      window.DATA_PROYEK_TERPILIH = samplePusat;
      window.activeProjectData = samplePusat;
      if (typeof window.perbaruiIndikatorTab3 === 'function') window.perbaruiIndikatorTab3(samplePusat);
      window.gantiTab(3);
      if (typeof window.renderPratinjauDokumen === 'function') window.renderPratinjauDokumen();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  const pusatShot = await send('Page.captureScreenshot', { format: 'png' });
  const pusatBuf = Buffer.from(pusatShot.data, 'base64');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_admin_pusat_tab3_preview.png'), pusatBuf);
  console.log('Saved bukti_live_admin_pusat_tab3_preview.png');

  console.log('Total dialog events intercepted (should be 0 false alarms):', dialogEvents.length);

  chrome.kill();
  console.log('Capture complete!');
}

captureLiveProof().catch(console.error);
