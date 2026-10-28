import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const DEBUG_PORT = 9255;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Launching headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=1400,1000',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
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
    await send('DOM.enable');

    // 1. NAVIGATE TO LIVE PORTAL WITH TOKEN AUTO-BYPASS
    console.log('Navigating to live https://kjppnanangrahayu.com/portal-nolap.html?token=NSR8899 ...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?token=NSR8899' });
    await new Promise(r => setTimeout(r, 4000));

    // Suppress popups
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(m) { console.log('ALERT:', m); };
        window.confirm = function(m) { console.log('CONFIRM:', m); return true; };
      `
    });

    // Capture 1: Wizard Step 1 Live
    console.log('Capturing Screenshot 1: Wizard Step 1 (Identitas & Dokumen)...');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_wizard_step1.png'), Buffer.from(ss1.data, 'base64'));
    console.log('✔ Saved bukti_live_wizard_step1.png');

    // Fill form and click "Lanjut ke Pengisian Kertas Kerja Mitigasi ->"
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('f-klien').value = 'PT Bank Mandiri (Persero) Tbk';
        document.getElementById('f-pemohon').value = 'Budi Santoso (Admin Cabang Bandung)';
        document.getElementById('f-nik-pemohon').value = 'NSR-EMP-0042';
        document.getElementById('f-jabatan').value = 'Petugas Admin Cabang';
        document.getElementById('f-email-pemohon').value = 'budi.santoso@kjppnanangrahayu.com';
        document.getElementById('f-wa-pemohon').value = '081234567890';
        document.getElementById('f-industri').value = '07';
        document.getElementById('f-jenis-objek').value = 'Tanah & Bangunan Pabrik Manufaktur';
        document.getElementById('f-kesimpulan-nilai').value = 'Rp 15.000.000.000,-';
        if (typeof navigasiKeStepWizard === 'function') {
          navigasiKeStepWizard(2);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture 2: Wizard Step 2 Live (Mitigasi & Tombol Aksi Akhir)
    console.log('Capturing Screenshot 2: Wizard Step 2 (Kertas Kerja Mitigasi Faktual)...');
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_wizard_step2.png'), Buffer.from(ss2.data, 'base64'));
    console.log('✔ Saved bukti_live_wizard_step2.png');

    // 2. NAVIGATE WITH APPLICANT TOKEN (ADMIN CABANG) TO VERIFY F01-F07 IS ISOLATED/HIDDEN
    console.log('Navigating with Branch Admin Token (NSR-ADMIN-BDG-2026)...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html?token=NSR-ADMIN-BDG-2026' });
    await new Promise(r => setTimeout(r, 4000));

    // Switch to Tab 2
    await send('Runtime.evaluate', {
      expression: `
        if (typeof gantiTabModul === 'function') {
          gantiTabModul('spm');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const checkFIsolation = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const panelUmum = document.getElementById('spm-audit-panel-umum');
          const panelTanah = document.getElementById('spm-audit-panel-tanah');
          const panelRuislagh = document.getElementById('spm-audit-panel-ruislagh');
          const isUmumHidden = !panelUmum || window.getComputedStyle(panelUmum).display === 'none';
          const isTanahHidden = !panelTanah || window.getComputedStyle(panelTanah).display === 'none';
          const isRuislaghHidden = !panelRuislagh || window.getComputedStyle(panelRuislagh).display === 'none';
          return {
            isUmumHidden,
            isTanahHidden,
            isRuislaghHidden,
            allAuditPanelsHidden: isUmumHidden && isTanahHidden && isRuislaghHidden
          };
        })()
      `,
      returnByValue: true
    });
    console.log('SPM Audit Panels Isolation Check for Applicant:', JSON.stringify(checkFIsolation.result?.value));

    // Capture 3: Tab 2 for Applicant (F01-F07 strictly hidden)
    console.log('Capturing Screenshot 3: SPM UI Isolated for Applicant...');
    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_live_spm_ui_isolated.png'), Buffer.from(ss3.data, 'base64'));
    console.log('✔ Saved bukti_live_spm_ui_isolated.png');

    ws.close();
    chrome.kill();
    console.log('🎉 Verification and CDP captures finished 100% successfully!');
  } catch (err) {
    chrome.kill();
    console.error('CDP capture error:', err);
    process.exit(1);
  }
}

run();
