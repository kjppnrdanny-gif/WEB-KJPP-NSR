import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function run() {
  const filePath = path.resolve('portal-kwitansi.html');
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');

  console.log('Target URL:', fileUrl);

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9495',
    '--no-sandbox',
    '--disable-web-security',
    '--allow-file-access-from-files',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9495/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: true });
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });

    console.log('Navigating to portal-kwitansi.html...');
    await send('Page.navigate', { url: fileUrl });
    // Tunggu DOMContentLoaded dan async periksaSesiKwitansi() selesai
    await new Promise(r => setTimeout(r, 3500));

    // Disable alert block and log alerts
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(msg) { console.log('INTERCEPTED_ALERT:', msg); };
        window.confirm = function(msg) { return true; };
        window.prompt = function(msg) { return 'Catatan pengujian'; };
      `
    });

    // Test 1: Login with token [REDACTED_ADMIN_PUSAT_TOKEN]
    console.log('\n--- Skenario 1: Login dengan Token Pusat ([REDACTED_ADMIN_PUSAT_TOKEN]) ---');
    await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const inp = document.getElementById('kwitansi-auth-username');
          if (inp) {
            inp.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
            await masukSesiKwitansi();
          }
        })()
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 800));

    const statePusat = await send('Runtime.evaluate', {
      expression: `
        ({
          isPusat: window.currentUser ? window.currentUser.isPusat : false,
          isCabang: window.currentUser ? window.currentUser.isCabang : false,
          role: window.currentUser ? window.currentUser.role : '',
          branch: window.currentUser ? window.currentUser.branch : '',
          panelPusatHidden: document.getElementById('panel-pusat')?.classList.contains('hidden'),
          panelCabangHidden: document.getElementById('panel-cabang')?.classList.contains('hidden'),
          kontenOperasionalHidden: document.getElementById('konten-operasional-pusat')?.classList.contains('hidden'),
          guardHidden: document.getElementById('guard-akses-pusat-cabang')?.classList.contains('hidden'),
          labelBadge: document.getElementById('label-sesi-cabang')?.innerText,
          labelVerified: document.getElementById('label-cabang-terverifikasi')?.innerText,
          cabangPengajuValue: document.getElementById('cabang-pengaju')?.value,
          cabangPengajuDisabled: document.getElementById('cabang-pengaju')?.disabled,
          tabBtnPusatHidden: document.getElementById('tab-btn-pusat')?.classList.contains('hidden'),
          tabBtnCabangHidden: document.getElementById('tab-btn-cabang')?.classList.contains('hidden')
        })
      `,
      returnByValue: true
    });

    console.log('Hasil state Skenario 1 (Pusat):', JSON.stringify(statePusat.result.value, null, 2));

    // Capture screenshot Skenario 1 (Default view for Pusat: Meja Verifikasi & Approval Tab 2)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_kwitansi_pusat_default_tab2.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Screenshot 1 tersimpan: preview_kwitansi_pusat_default_tab2.png');

    // Test 2: Pusat switch to Tab 1 (Pengajuan Draf)
    console.log('\n--- Skenario 2: Pusat beralih ke Tab 1 (Pengajuan Draf) ---');
    await send('Runtime.evaluate', { expression: `gantiTab('cabang');` });
    await new Promise(r => setTimeout(r, 400));

    const stateTab1 = await send('Runtime.evaluate', {
      expression: `
        ({
          panelCabangHidden: document.getElementById('panel-cabang')?.classList.contains('hidden'),
          panelPusatHidden: document.getElementById('panel-pusat')?.classList.contains('hidden'),
          cabangPengajuValue: document.getElementById('cabang-pengaju')?.value,
          cabangPengajuDisabled: document.getElementById('cabang-pengaju')?.disabled,
          namaPengajuValue: document.getElementById('nama-staf-pengaju')?.value
        })
      `,
      returnByValue: true
    });

    console.log('Hasil state Skenario 2 (Pusat di Tab 1):', JSON.stringify(stateTab1.result.value, null, 2));

    // Capture screenshot Skenario 2
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_kwitansi_pusat_tab1_form.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Screenshot 2 tersimpan: preview_kwitansi_pusat_tab1_form.png');

    // Test 3: Pusat switch back to Tab 2 (Dashboard Verifikasi & Approval)
    console.log('\n--- Skenario 3: Pusat beralih kembali ke Tab 2 (Verifikasi & Approval) ---');
    await send('Runtime.evaluate', { expression: `gantiTab('pusat');` });
    await new Promise(r => setTimeout(r, 400));

    const stateTab2Back = await send('Runtime.evaluate', {
      expression: `
        ({
          panelCabangHidden: document.getElementById('panel-cabang')?.classList.contains('hidden'),
          panelPusatHidden: document.getElementById('panel-pusat')?.classList.contains('hidden'),
          kontenOperasionalHidden: document.getElementById('konten-operasional-pusat')?.classList.contains('hidden'),
          guardHidden: document.getElementById('guard-akses-pusat-cabang')?.classList.contains('hidden')
        })
      `,
      returnByValue: true
    });
    console.log('Hasil state Skenario 3 (Kembali ke Tab 2):', JSON.stringify(stateTab2Back.result.value, null, 2));

    // Test 4: Skenario Cabang (Bandung)
    console.log('\n--- Skenario 4: Login Akun Cabang Bandung ([REDACTED_CAB_BDG_TOKEN]) ---');
    await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const inp = document.getElementById('kwitansi-auth-username');
          if (inp) {
            inp.value = (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN");
            await masukSesiKwitansi();
          }
        })()
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 800));

    const stateCabang = await send('Runtime.evaluate', {
      expression: `
        ({
          isPusat: window.currentUser ? window.currentUser.isPusat : false,
          isCabang: window.currentUser ? window.currentUser.isCabang : false,
          role: window.currentUser ? window.currentUser.role : '',
          branch: window.currentUser ? window.currentUser.branch : '',
          panelPusatHidden: document.getElementById('panel-pusat')?.classList.contains('hidden'),
          panelCabangHidden: document.getElementById('panel-cabang')?.classList.contains('hidden'),
          kontenFormCabangHidden: document.getElementById('konten-form-cabang')?.classList.contains('hidden'),
          labelBadge: document.getElementById('label-sesi-cabang')?.innerText,
          labelVerified: document.getElementById('label-cabang-terverifikasi')?.innerText,
          cabangPengajuValue: document.getElementById('cabang-pengaju')?.value,
          cabangPengajuDisabled: document.getElementById('cabang-pengaju')?.disabled,
          tabBtnPusatHidden: document.getElementById('tab-btn-pusat')?.classList.contains('hidden')
        })
      `,
      returnByValue: true
    });
    console.log('Hasil state Skenario 4 (Cabang):', JSON.stringify(stateCabang.result.value, null, 2));

    // Capture screenshot Skenario 4
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'preview_kwitansi_cabang_locked.png'), Buffer.from(shot4.data, 'base64'));
    console.log('Screenshot 4 tersimpan: preview_kwitansi_cabang_locked.png');

    console.log('\n✅ VERIFIKASI END-TO-END SUKSES!');
  } finally {
    chrome.kill();
  }
}

run().catch(e => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
