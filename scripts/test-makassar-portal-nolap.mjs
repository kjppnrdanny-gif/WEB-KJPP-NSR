import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TARGET_URL = 'file:///d:/WEB%20KJPP%20NSR_Compro%20new%20ver/kjpp-nsr-netlify-production/portal-nolap.html';

async function testMakassarFlow() {
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mks-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9499',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9499/json/new?' + encodeURIComponent(TARGET_URL), { method: 'PUT' });
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 2500));

    // 1. Lakukan login nyata melalui input form dengan Token Cabang Makassar
    const loginRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const inpId = document.getElementById('input-auth-id');
          const inpPass = document.getElementById('input-auth-pass');

          if (inpId && inpPass) {
            inpId.value = 'NSR-MKS-2026';
            inpPass.value = 'NSR-MKS-2026';
            if (typeof loginKeServer === 'function') {
              await loginKeServer();
            }
          }
          return {
            sesi: window.currentUser || window.sesiAktif,
            cabangVal: document.getElementById('f-cabang')?.value,
            penilaiVal: document.getElementById('f-penilai')?.value
          };
        })()
      `,
      returnByValue: true,
      awaitPromise: true
    });
    console.log('Login result:', loginRes?.result?.value);

    await new Promise(r => setTimeout(r, 1500));

    // 2. Ambil status DOM form & tab
    const domCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabPengajuan = document.getElementById('tab-btn-pengajuan');
          const tabSpm = document.getElementById('tab-btn-spm');
          const tabRiwayat = document.getElementById('tab-btn-riwayat');
          const tabApproval = document.getElementById('tab-btn-approval');
          const tabElsa = document.getElementById('tab-btn-elsa');
          const tabMonitoring = document.getElementById('tab-btn-monitoring');

          const elCabang = document.getElementById('f-cabang');
          const elPenilai = document.getElementById('f-penilai');
          const elLiveNo = document.getElementById('live-preview-no');

          return {
            tabPengajuanText: tabPengajuan?.innerText?.trim(),
            tabSpmText: tabSpm?.innerText?.trim(),
            tabSpmHidden: tabSpm?.classList.contains('hidden') || tabSpm?.style.display === 'none',
            tabRiwayatText: tabRiwayat?.innerText?.trim(),
            tabApprovalHidden: tabApproval?.classList.contains('hidden') || tabApproval?.style.display === 'none',
            tabElsaHidden: tabElsa?.classList.contains('hidden') || tabElsa?.style.display === 'none',
            tabMonitoringHidden: tabMonitoring?.classList.contains('hidden') || tabMonitoring?.style.display === 'none',
            cabangSelected: elCabang?.value,
            penilaiSelected: elPenilai?.value,
            liveNoText: elLiveNo?.innerText?.trim()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DOM Check Makassar Session:', domCheck?.result?.value);

    // Capture screenshot Tab 1 Form Pengajuan dengan Tab 2 Smart Mitigasi & SPM terlihat jelas
    console.log('Capturing shot1...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'makassar_nolap_tab_spm_visible.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved makassar_nolap_tab_spm_visible.png');

    // 3. Klik Tab 2 Smart Mitigasi & SPM dan pilih Sub-SPM 2 Pengadaan Tanah
    console.log('Switching tab to SPM & Sub-SPM tanah...');
    const spmEvalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof gantiTabModul === 'function') {
            gantiTabModul('spm');
          }
          if (typeof pilihSubSpm === 'function') {
            pilihSubSpm('tanah');
          }
          return {
            panelSpmVisible: !document.getElementById('panel-spm')?.classList.contains('hidden'),
            boxTanahVisible: !document.getElementById('box-sub-spm-tanah')?.classList.contains('hidden')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('SPM eval result:', spmEvalRes);
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot modul Mitigasi Pengadaan Tanah PLN aktif
    console.log('Capturing shot2...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'makassar_spm_tanah_active.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved makassar_spm_tanah_active.png');

    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

testMakassarFlow();
