import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8905;
const CHROME_PORT = 9540;

async function run() {
  console.log('🚀 Memulai pengujian & verifikasi browser headless untuk KING pada Portal JO...');
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: ['ignore', 'ignore', 'pipe'] });
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-king-verify-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1400,900',
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
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const consoleLogs = [];
  const exceptions = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.consoleAPICalled') {
      const txt = m.params.args.map(a => a.value || a.description).join(' ');
      consoleLogs.push({ type: m.params.type, text: txt });
      console.log('BROWSER CONSOLE:', txt);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      exceptions.push(m.params.exceptionDetails);
      console.error('BROWSER EXCEPTION:', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description);
    }
  });

  let loadFired = false;
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') {
      loadFired = true;
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  const pageUrl = `http://127.0.0.1:${PORT}/portal-penugasan-jo.html`;
  await send('Page.navigate', { url: pageUrl });
  for (let i = 0; i < 40; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1200));

  console.log('🔑 Melakukan login KING dengan token NSR8899...');
  const evalRaw = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        const input = document.getElementById('input_token_auth');
        if (input) input.value = 'NSR8899';
        if (typeof verifikasiTokenLogin === 'function') {
          await verifikasiTokenLogin(null);
        } else if (typeof window.verifikasiTokenLogin === 'function') {
          await window.verifikasiTokenLogin(null);
        } else {
          throw new Error('verifikasiTokenLogin is not defined on window');
        }
        return JSON.stringify({
          sessionLabel: document.getElementById('session-label')?.innerText,
          modeTitle: document.getElementById('mode-title')?.innerText,
          role: typeof userSession !== 'undefined' ? userSession.role : null,
          isSuperAdmin: typeof userSession !== 'undefined' ? userSession.isSuperAdmin : null,
          isKing: typeof userSession !== 'undefined' ? userSession.isKing : null,
          tab3Text: document.getElementById('btn-tab-preview')?.innerText
        });
      } catch (e) {
        return JSON.stringify({ error: e.message, stack: e.stack });
      }
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const state1 = JSON.parse(evalRaw.result?.value || '{}');
  console.log('Parsed State 1 (Auth Result):', state1);

  if (state1.error) {
    throw new Error('Script Error inside page: ' + state1.error + '\n' + state1.stack);
  }

  // Verifikasi Kriteria 1: Memuat Sesi selesai & Role adalah SUPER ADMIN
  if (!state1 || state1.sessionLabel.includes('Memuat Sesi')) {
    throw new Error('FAILED: Sesi masih dalam status Memuat Sesi...');
  }
  if (!/SUPER[_ ]ADMIN|KING/i.test(state1.role) && !/SUPER[_ ]ADMIN|KING/i.test(state1.sessionLabel)) {
    throw new Error('FAILED: Role bukan SUPER ADMIN/KING: ' + JSON.stringify(state1));
  }
  if (/Mandiri\s+Cabang/i.test(state1.modeTitle)) {
    throw new Error('FAILED: Mode akses fallback ke Mandiri Cabang: ' + state1.modeTitle);
  }
  console.log('✓ TEST 1 PASS: Identitas kanonik KING aktif, sesi termuat sempurna.');

  // Capture Screenshot Tab 1 (Input Form dengan identitas KING)
  const snapTab1 = await send('Page.captureScreenshot', { format: 'png' });
  const fileTab1 = path.join(ARTIFACT_DIR, 'bukti_king_portal_jo_tab1_auth.png');
  fs.writeFileSync(fileTab1, Buffer.from(snapTab1.data, 'base64'));
  console.log('✓ Screenshot Tab 1 disimpan:', fileTab1);

  // 2. Klik Tab 2 (Dashboard & Antrean Approval) via Mouse
  console.log('🖱️ Menguji klik Tab 2 (Dashboard & Antrean Approval)...');
  const clickTab2Res = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="jo-tab-approval"]') || document.getElementById('btn-tab-dashboard');
      btn.click();
      const panel = document.querySelector('[data-testid="jo-approval-panel"]') || document.getElementById('tab-content-dashboard');
      return JSON.stringify({
        panelVisible: panel && !panel.classList.contains('hidden'),
        btnClass: btn.className
      });
    })()`,
    returnByValue: true
  });
  const state2 = JSON.parse(clickTab2Res.result?.value || '{}');
  console.log('Hasil Klik Tab 2:', state2);
  if (!state2.panelVisible) {
    throw new Error('FAILED: Tab 2 Dashboard tidak tampil setelah diklik!');
  }
  console.log('✓ TEST 2 PASS: Tab 2 Dashboard terbuka sempurna melalui klik mouse.');

  // Capture Screenshot Tab 2
  const snapTab2 = await send('Page.captureScreenshot', { format: 'png' });
  const fileTab2 = path.join(ARTIFACT_DIR, 'bukti_king_portal_jo_tab2_dashboard.png');
  fs.writeFileSync(fileTab2, Buffer.from(snapTab2.data, 'base64'));
  console.log('✓ Screenshot Tab 2 disimpan:', fileTab2);

  // 3. Uji Navigasi Tab 2 via Keyboard Enter/Space
  console.log('⌨️ Menguji aktivasi Tab 2 via Keyboard (Tab 1 -> Tab 2 via Enter)...');
  const keyTab2Res = await send('Runtime.evaluate', {
    expression: `(() => {
      gantiTab(1); // Balik ke tab 1 dulu
      const btn = document.getElementById('btn-tab-dashboard');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      btn.dispatchEvent(event);
      const panel = document.getElementById('tab-content-dashboard');
      return JSON.stringify({ panelVisible: panel && !panel.classList.contains('hidden') });
    })()`,
    returnByValue: true
  });
  const state3 = JSON.parse(keyTab2Res.result?.value || '{}');
  if (!state3.panelVisible) {
    throw new Error('FAILED: Tab 2 tidak merespons aktivasi keyboard!');
  }
  console.log('✓ TEST 3 PASS: Tab 2 dapat dibuka via keyboard.');

  // 4. Uji Klik Tab 3 (Pratinjau & Cetak) untuk KING
  console.log('🖨️ Menguji aktivasi Tab 3 (Pratinjau & Cetak) untuk KING...');
  const clickTab3Res = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="jo-tab-print"]') || document.getElementById('btn-tab-preview');
      btn.click();
      const panel = document.querySelector('[data-testid="jo-print-panel"]') || document.getElementById('tab-3');
      const reason = document.querySelector('[data-testid="jo-print-lock-reason"]');
      return JSON.stringify({
        panelVisible: panel && !panel.classList.contains('hidden'),
        btnText: btn.innerText,
        hasReason: Boolean(reason)
      });
    })()`,
    returnByValue: true
  });
  const state4 = JSON.parse(clickTab3Res.result?.value || '{}');
  console.log('Hasil Klik Tab 3:', state4);
  if (!state4.panelVisible) {
    throw new Error('FAILED: Tab 3 Pratinjau & Cetak tidak dapat dibuka oleh KING!');
  }
  console.log('✓ TEST 4 PASS: Tab 3 Pratinjau & Cetak terbuka untuk KING.');

  // Capture Screenshot Tab 3
  const snapTab3 = await send('Page.captureScreenshot', { format: 'png' });
  const fileTab3 = path.join(ARTIFACT_DIR, 'bukti_king_portal_jo_tab3_preview.png');
  fs.writeFileSync(fileTab3, Buffer.from(snapTab3.data, 'base64'));
  console.log('✓ Screenshot Tab 3 disimpan:', fileTab3);

  // 5. Uji Proteksi Dokumen Sah (Tanpa dokumen dipilih atau dokumen draft tidak sah, cetak dicegah)
  console.log('🛡️ Menguji proteksi pencetakan dokumen legal...');
  const guardRes = await send('Runtime.evaluate', {
    expression: `(() => {
      let alertMsg = '';
      window.alert = (msg) => { alertMsg = msg; };
      eksekusiCetakDokumen();
      return JSON.stringify({ alertMsg });
    })()`,
    returnByValue: true
  });
  const state5 = JSON.parse(guardRes.result?.value || '{}');
  console.log('Hasil Uji Proteksi Cetak:', state5);
  if (!state5.alertMsg.includes('Pilih data proyek terlebih dahulu')) {
    throw new Error('FAILED: Proteksi cetak tidak aktif!');
  }
  console.log('✓ TEST 5 PASS: Proteksi cetak aktif, dokumen ilegal dicegah terbit.');

  console.log('\n=======================================================');
  console.log('🎉 SEMUA PENGUJIAN BROWSER HEADLESS UNTUK KING LULUS 100%!');
  console.log('=======================================================');

  chrome.kill();
  php.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
