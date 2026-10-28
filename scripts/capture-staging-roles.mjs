import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function captureStagingRoles() {
  console.log('🚀 Menjalankan headless Chrome untuk capture tampilan portal staging...');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-staging-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9525',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetUrl = 'http://127.0.0.1:8899/portal-dual-gate-staging.html';
    const targetRes = await fetch('http://127.0.0.1:9525/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' });
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

    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        handlers.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');

    // Desktop Viewport (1280x800)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 1500));

    async function takeShot(filename, actionScript = '') {
      if (actionScript) {
        await send('Runtime.evaluate', { expression: actionScript });
        await new Promise(r => setTimeout(r, 1000));
      }
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shot.data, 'base64');
      const outPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`✔ Screenshot tersimpan: ${filename} (${buffer.length} bytes)`);
    }

    // 1. Admin Cabang: Form Pengajuan LP & Smart Mitigasi Awal
    await takeShot('staging_view_admin_cabang.png', `
      gantiPeranAktif('ADMIN_CABANG');
      gantiTab('form-awal');
    `);

    // 2. Danny Taufik (Kepala SPM): Antrean Review SPM
    await takeShot('staging_view_kepala_spm_danny.png', `
      gantiPeranAktif('KEPALA_SPM');
      gantiTab('antrean');
    `);

    // 3. Deni Siswandi (Kepala Divisi Teknik): Antrean Review Divtek
    await takeShot('staging_view_kepala_divtek_deni.png', `
      gantiPeranAktif('KEPALA_DIVTEK');
      gantiTab('antrean');
    `);

    // 4. Admin Pusat: Antrean Siap Terbit NoLap Definitif
    await takeShot('staging_view_admin_pusat.png', `
      gantiPeranAktif('ADMIN_PUSAT');
      gantiTab('antrean');
    `);

    // 5. Deni Siswandi (Penilai Publik Penanggung Jawab): Antrean Tanda Tangan Laporan Sah
    await takeShot('staging_view_penilai_publik.png', `
      gantiPeranAktif('PENILAI_DENI');
      gantiTab('semua');
    `);

    // 6. Log Notifikasi Email & WhatsApp Manual
    await takeShot('staging_view_mail_wa_log.png', `
      gantiTab('notifikasi');
    `);

    ws.close();
  } finally {
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

captureStagingRoles().catch(console.error);
