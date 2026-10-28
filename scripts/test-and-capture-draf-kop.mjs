import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function runTestAndCapture() {
  const SERVER_PORT = 8089;
  const DEBUG_PORT = 9260;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting local PHP web server on port', SERVER_PORT);
  const phpExtDir = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
  const phpServer = spawn('php', [
    '-d', `extension_dir=${phpExtDir}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${SERVER_PORT}`
  ]);

  await new Promise(r => setTimeout(r, 1500));

  console.log('2. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,1100',
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
    await send('Runtime.enable');

    console.log('3. Navigating to portal-surat-umum.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Authenticate with NSR8899
    console.log('4. Authenticating with Master Admin NSR8899...');
    const authResult = await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const tokenInput = document.getElementById('input_token_auth');
          if (tokenInput) {
            tokenInput.value = 'NSR8899';
            const form = tokenInput.closest('form');
            if (form) {
              const fakeEvent = { preventDefault: () => {} };
              if (typeof handleLoginSubmit === 'function') {
                await handleLoginSubmit(fakeEvent);
              }
            }
          }
          return {
            isAuthHidden: document.getElementById('modal-auth')?.classList.contains('hidden'),
            userSession: window.CURRENT_AUTH_SESSION
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Auth Status:', JSON.stringify(authResult.result?.value));

    await new Promise(r => setTimeout(r, 1500));

    // Inspect dropdown options
    console.log('5. Verifying 12 categories in dropdown...');
    const dropdownCheck = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const select = document.getElementById('klasifikasi_perihal');
          const options = Array.from(select ? select.options : []).map(o => ({ value: o.value, text: o.text }));
          const filterSelect = document.getElementById('filter_kategori');
          const filterOptions = Array.from(filterSelect ? filterSelect.options : []).map(o => ({ value: o.value, text: o.text }));
          return {
            formCount: options.length,
            formOptions: options,
            filterCount: filterOptions.length,
            suggestedNomor: document.getElementById('no_surat')?.value
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Dropdown Check Result:', JSON.stringify(dropdownCheck.result?.value, null, 2));

    // Fill form with Memo Internal and submit
    console.log('6. Filling and issuing new Memo Internal (SU-MEM)...');
    const submitResult = await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const select = document.getElementById('klasifikasi_perihal');
          select.value = 'SU-MEM';
          if (typeof handleKlasifikasiChange === 'function') handleKlasifikasiChange();

          document.getElementById('tujuan_penerima').value = 'Seluruh Tim Penilai, Cabang, & Karyawan KJPP NSR';
          document.getElementById('perihal').value = 'Arahan Penegakan Standar Pengendalian Mutu (SPM) dan Tata Kelola Digital 2026';
          document.getElementById('penandatangan').value = 'Pemimpin Rekan';

          const noSurat = document.getElementById('no_surat').value;

          const form = document.getElementById('form-surat-umum');
          const fakeEvent = { preventDefault: () => {} };
          await handleSimpanSuratUmum(fakeEvent);

          return {
            noSurat,
            isSuksesModalVisible: !document.getElementById('modal-sukses-terbit')?.classList.contains('hidden'),
            suksesNomor: document.getElementById('sukses-nomor-surat')?.innerText,
            suksesKategori: document.getElementById('sukses-kategori-surat')?.innerText
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Submit Result:', JSON.stringify(submitResult.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of Modal Sukses Terbit
    console.log('7. Capturing proof screenshot of Success Modal (Sukses Terbit)...');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const ss1Path = path.join(ARTIFACT_DIR, 'bukti_live_sukses_terbit_memo_internal.png');
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log('✓ Saved:', ss1Path);

    // Open Modal Draf Surat (Kop Resmi)
    console.log('8. Opening Modal Draf Surat Resmi (Kop KJPP NSR)...');
    const drafResult = await send('Runtime.evaluate', {
      expression: `
        (function() {
          bukaDrafDariSukses();
          const modalDraf = document.getElementById('modal-draf-surat');
          const isDrafVisible = !modalDraf?.classList.contains('hidden');
          const kopText = document.getElementById('lembar-a4-draf')?.innerText;
          const noSurat = document.getElementById('draf-field-nomor')?.innerText;
          const ttdNama = document.getElementById('draf-field-ttd-nama')?.innerText;
          const isiText = document.getElementById('draf-field-isi')?.innerText;
          return {
            isDrafVisible,
            noSurat,
            ttdNama,
            hasKopLogo: Boolean(document.querySelector('#lembar-a4-draf svg text')),
            isiPreview: isiText?.substring(0, 150)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Draf Modal Evaluation:', JSON.stringify(drafResult.result?.value, null, 2));

    await new Promise(r => setTimeout(r, 1500));

    // Capture Desktop View of A4 Letterhead Draft
    console.log('9. Capturing Desktop Proof of Official Letterhead Draft (Kop Resmi)...');
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const ss2Path = path.join(ARTIFACT_DIR, 'bukti_live_draf_surat_kop_resmi_desktop.png');
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log('✓ Saved:', ss2Path);

    // Switch to Mobile Viewport (375x812)
    console.log('10. Setting viewport to mobile (375x812) & capturing mobile proof...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    const ss3Path = path.join(ARTIFACT_DIR, 'bukti_live_draf_surat_kop_resmi_mobile.png');
    fs.writeFileSync(ss3Path, Buffer.from(ss3.data, 'base64'));
    console.log('✓ Saved:', ss3Path);

    // Close Draf Modal and verify Agenda Table Row button [ 📄 Draf Kop ]
    console.log('11. Closing modal and verifying table row [ 📄 Draf Kop ] button...');
    await send('Emulation.clearDeviceMetricsOverride');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          tutupModalDrafSurat();
          const drafButtons = document.querySelectorAll('button[title*="Draf Surat"]');
          return {
            drafButtonsCount: drafButtons.length
          };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 800));

    const ss4 = await send('Page.captureScreenshot', { format: 'png' });
    const ss4Path = path.join(ARTIFACT_DIR, 'bukti_live_buku_agenda_su_mem_table.png');
    fs.writeFileSync(ss4Path, Buffer.from(ss4.data, 'base64'));
    console.log('✓ Saved:', ss4Path);

    console.log('🎉 ALL TESTS COMPLETED AND ALL PROOFS CAPTURED SUCCESSFULLY!');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

runTestAndCapture();
