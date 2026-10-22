import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8899;
const CHROME_PORT = 9548;

async function run() {
  console.log('🚀 Memulai verifikasi browser headless untuk Klasifikasi Jasa Penilaian (P0 SE-6/PPPK/2018)...');
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-jasa-verify-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,960',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  let connected = false;
  for (let i = 0; i < 20; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) {
        connected = true;
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }

  if (!connected) {
    throw new Error('Could not connect to Chrome debugging port ' + CHROME_PORT);
  }

  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval error');
    }
    return res.result.value;
  }

  // 1. Verifikasi Portal Penugasan JO
  console.log('📄 Membuka Portal Penugasan JO...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-penugasan-jo.html` });
  await new Promise(r => setTimeout(r, 3000));

  // Otentikasi Super Admin pada Portal JO
  const authJoResult = await evaluate(`
    (async () => {
      const inp = document.getElementById('input_token_auth');
      if (inp) inp.value = 'NSR8899';
      if (typeof verifikasiTokenLogin === 'function') {
        await verifikasiTokenLogin(null);
      }
      return { success: true };
    })()
  `);
  console.log('Login JO Result:', authJoResult);
  await new Promise(r => setTimeout(r, 1500));

  // Evaluasi opsi dropdown klasifikasi_jasa_penilaian
  const joDropdownInfo = await evaluate(`
    (() => {
      const el = document.getElementById('klasifikasi_jasa_penilaian');
      if (!el) return { found: false };
      const opts = Array.from(el.options).map(o => ({
        value: o.value,
        text: o.text,
        reportCode: o.getAttribute('data-report-code')
      }));
      // Set to PROPERTY_SIMPLE
      el.value = 'PROPERTY_SIMPLE';
      if (typeof onKlasifikasiJasaJoChange === 'function') {
        onKlasifikasiJasaJoChange();
      }
      return {
        found: true,
        selectedValue: el.value,
        selectedText: el.options[el.selectedIndex]?.text,
        selectedReportCode: el.options[el.selectedIndex]?.getAttribute('data-report-code'),
        options: opts
      };
    })()
  `);
  console.log('Portal JO Dropdown Info:', JSON.stringify(joDropdownInfo, null, 2));

  // Scroll ke Section 04
  await evaluate(`
    const el = document.getElementById('klasifikasi_jasa_penilaian');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 1000));

  const shotJo = await send('Page.captureScreenshot', { format: 'png' });
  const shotJoPath = path.join(ARTIFACT_DIR, 'bukti_portal_jo_klasifikasi_jasa_pi.png');
  fs.writeFileSync(shotJoPath, Buffer.from(shotJo.data, 'base64'));
  console.log('✓ Screenshot Portal JO disimpan:', shotJoPath);

  // 2. Verifikasi Portal NoLap Pusat
  console.log('📄 Membuka Portal NoLap...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-nolap.html` });
  await new Promise(r => setTimeout(r, 3000));

  // Login Admin Pusat
  const authNoLapResult = await evaluate(`
    (async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = 'NSR-ADMIN-PUSAT-2026';
      if (inpPass) inpPass.value = 'NSR-ADMIN-PUSAT-2026';
      if (typeof loginKeServer === 'function') {
        await loginKeServer(null);
      }
      return { success: true };
    })()
  `);
  console.log('Login NoLap Result:', authNoLapResult);
  await new Promise(r => setTimeout(r, 1500));

  // Evaluasi dropdown jenis jasa NoLap dan live preview
  const nolapDropdownInfo = await evaluate(`
    (() => {
      const sel = document.getElementById('f-jasa');
      if (!sel) return { found: false };
      const opts = Array.from(sel.options).map(o => ({
        value: o.value,
        text: o.text,
        reportCode: o.getAttribute('data-report-code')
      }));
      // Set to PROPERTY_SIMPLE
      sel.value = 'PROPERTY_SIMPLE';
      if (typeof updateLivePreview === 'function') {
        updateLivePreview();
      }
      const segJasa = document.getElementById('pv-jasa')?.textContent || '';
      const fullPreview = document.getElementById('live-preview-box')?.textContent || '';
      return {
        found: true,
        selectedValue: sel.value,
        selectedText: sel.options[sel.selectedIndex]?.text,
        badgeSegmenJasa: segJasa,
        fullPreviewText: fullPreview,
        options: opts
      };
    })()
  `);
  console.log('Portal NoLap Dropdown Info:', JSON.stringify(nolapDropdownInfo, null, 2));

  // Scroll ke live preview box
  await evaluate(`
    const box = document.getElementById('live-preview-box') || document.getElementById('f-jasa');
    if (box) box.scrollIntoView({ behavior: 'instant', block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 1000));

  const shotNoLap = await send('Page.captureScreenshot', { format: 'png' });
  const shotNoLapPath = path.join(ARTIFACT_DIR, 'bukti_portal_nolap_klasifikasi_jasa_pi.png');
  fs.writeFileSync(shotNoLapPath, Buffer.from(shotNoLap.data, 'base64'));
  console.log('✓ Screenshot Portal NoLap disimpan:', shotNoLapPath);

  console.log('🎉 Verifikasi browser selesai.');
  ws.close();
  chrome.kill();
  php.kill();
  try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
