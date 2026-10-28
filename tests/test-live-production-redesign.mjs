import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const DEBUG_PORT = 9452;
const LIVE_URL = 'https://kjppnanangrahayu.com/index.html';

async function runLiveTest() {
  console.log('====================================================');
  console.log('TESTING LIVE PRODUCTION: https://kjppnanangrahayu.com');
  console.log('====================================================\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
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

  console.log('[INFO] Chrome DevTools Connected');

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
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
        cb(m.result !== undefined ? m.result : m);
      }
    };

    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    // 1. DESKTOP LIVE VIEWPORT AUDIT (1440x900)
    console.log('\n--- 1. DESKTOP LIVE TEST (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    await send('Page.navigate', { url: `${LIVE_URL}?t=${Date.now()}` });

    // Poll until DOM loaded
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      const chk = await send('Runtime.evaluate', {
        expression: `!!document.getElementById('modal-portal')`,
        returnByValue: true
      });
      if (chk && chk.result && chk.result.value) break;
    }

    // Open OPINI modal on live site
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          if (typeof window.bukaModalPortal === 'function') {
            window.bukaModalPortal();
          } else {
            const m = document.getElementById('modal-portal');
            if (m) {
              m.classList.remove('hidden');
              m.style.display = 'flex';
            }
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture Desktop Live Screenshot
    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const deskPath = path.join(ARTIFACTS_DIR, 'live-production-opini-desktop.png');
    fs.writeFileSync(deskPath, Buffer.from(shotDesktop.data, 'base64'));
    console.log(`[PASS] Saved Desktop live screenshot: ${deskPath}`);

    // Verify Desktop DOM metrics
    const deskMetrics = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const dialog = document.getElementById('modal-portal-dialog');
          const form = document.getElementById('form-token-portal');
          const docWidth = document.documentElement.clientWidth;
          const docScroll = document.documentElement.scrollWidth;
          return {
            hasOverflow: docScroll > docWidth,
            dialogWidth: dialog ? dialog.clientWidth : 0,
            hasTwoCol: form ? form.className.includes('grid-cols-12') : false
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[AUDIT] Desktop Metrics:', JSON.stringify(deskMetrics.result.value));

    // 2. SMARTPHONE LIVE VIEWPORT AUDIT (390x844 - iPhone 14)
    console.log('\n--- 2. SMARTPHONE LIVE TEST (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${LIVE_URL}?t=${Date.now()}` });
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      const chk = await send('Runtime.evaluate', {
        expression: `!!document.getElementById('modal-portal')`,
        returnByValue: true
      });
      if (chk && chk.result && chk.result.value) break;
    }

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          if (typeof window.bukaModalPortal === 'function') {
            window.bukaModalPortal();
          } else {
            const m = document.getElementById('modal-portal');
            if (m) {
              m.classList.remove('hidden');
              m.style.display = 'flex';
            }
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 600));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    const mobilePath = path.join(ARTIFACTS_DIR, 'live-production-opini-mobile.png');
    fs.writeFileSync(mobilePath, Buffer.from(shotMobile.data, 'base64'));
    console.log(`[PASS] Saved Smartphone live screenshot: ${mobilePath}`);

    const mobileMetrics = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const dialog = document.getElementById('modal-portal-dialog');
          const docWidth = document.documentElement.clientWidth;
          const docScroll = document.documentElement.scrollWidth;
          return {
            hasOverflow: docScroll > docWidth,
            dialogWidth: dialog ? dialog.clientWidth : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[AUDIT] Mobile Metrics:', JSON.stringify(mobileMetrics.result.value));

    // 3. LIVE FUNCTIONAL TEST: TOGGLE EYE, EMPTY VALIDATION, INVALID TOKEN REJECTION
    console.log('\n--- 3. LIVE FUNCTIONAL VALIDATIONS ---');

    // 3a. Toggle eye
    const togLive = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inp = document.getElementById('input-token');
          const btn = document.getElementById('btn-toggle-token');
          const eyeShow = document.getElementById('icon-eye-show');
          const eyeHide = document.getElementById('icon-eye-hide');

          const t1 = inp.type;
          btn.click();
          const t2 = inp.type;
          btn.click();
          const t3 = inp.type;

          return { initial: t1, toggled: t2, restored: t3 };
        })()
      `,
      returnByValue: true
    });
    const tVal = togLive.result.value;
    const togPass = tVal.initial === 'password' && tVal.toggled === 'text' && tVal.restored === 'password';
    console.log(`[${togPass ? 'PASS' : 'FAIL'}] Live Toggle Show/Hide Eye: ${tVal.initial} -> ${tVal.toggled} -> ${tVal.restored}`);

    // 3b. Empty Token
    const emptyLive = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const inp = document.getElementById('input-token');
          const errEl = document.getElementById('pesan-error');
          const errText = document.getElementById('pesan-error-text');
          inp.value = '';

          await window.verifikasiTokenPortal();

          return {
            visible: !errEl.classList.contains('hidden'),
            text: errText ? errText.innerText : ''
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    const eVal = emptyLive.result.value;
    const empPass = eVal.visible && eVal.text.includes('Silakan masukkan token otorisasi');
    console.log(`[${empPass ? 'PASS' : 'FAIL'}] Live Empty Token: "${eVal.text}"`);

    // 3c. Invalid Token Rejection by Live Backend
    const invalidLive = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const inp = document.getElementById('input-token');
          const errEl = document.getElementById('pesan-error');
          const errText = document.getElementById('pesan-error-text');
          inp.value = 'TOKEN_PALSU_SEMBARANGAN_XYZ';

          await window.verifikasiTokenPortal();

          return {
            visible: !errEl.classList.contains('hidden'),
            text: errText ? errText.innerText : ''
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    const iVal = invalidLive.result.value;
    const invPass = iVal.visible && (iVal.text.includes('Ditolak') || iVal.text.includes('tidak valid'));
    console.log(`[${invPass ? 'PASS' : 'FAIL'}] Live Invalid Token Rejection: "${iVal.text}"`);

    // 3d. Valid Token Authentication via Live Backend
    console.log('\n--- 4. LIVE BACKEND AUTHENTICATION TEST ---');
    const authLive = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          window._targetPortal = null;
          const inp = document.getElementById('input-token');
          const form = document.getElementById('form-token-portal');
          const panel = document.getElementById('panel-layanan');
          const labelLokasi = document.getElementById('label-lokasi');

          // Valid live token: [REDACTED_ADMIN_PUSAT_TOKEN] (Super Admin Pusat)
          inp.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");

          await window.verifikasiTokenPortal();

          return {
            formHidden: form ? form.classList.contains('hidden') : false,
            panelVisible: panel ? !panel.classList.contains('hidden') : false,
            labelLokasiText: labelLokasi ? labelLokasi.innerText : '',
            hasSession: !!sessionStorage.getItem('kjpp_token_internal')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    const aVal = authLive.result.value;
    const authPass = aVal.formHidden && aVal.panelVisible && aVal.hasSession;
    console.log(`[${authPass ? 'PASS' : 'FAIL'}] Live Backend Authentication: Label="${aVal.labelLokasiText}"`);

    // Capture authenticated live panel screenshot
    const shotAuthLive = await send('Page.captureScreenshot', { format: 'png' });
    const authPath = path.join(ARTIFACTS_DIR, 'live-production-opini-authenticated.png');
    fs.writeFileSync(authPath, Buffer.from(shotAuthLive.data, 'base64'));
    console.log(`[PASS] Saved Authenticated Live Screenshot: ${authPath}`);

    // 3e. Logout / "Ganti Token / Keluar"
    console.log('\n--- 5. LIVE LOGOUT / RESET SESSION TEST ---');
    const resetLive = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const form = document.getElementById('form-token-portal');
          const panel = document.getElementById('panel-layanan');
          const inp = document.getElementById('input-token');

          window.resetTokenSesi();

          return {
            formVisible: form ? !form.classList.contains('hidden') : false,
            panelHidden: panel ? panel.classList.contains('hidden') : false,
            sessionCleared: !sessionStorage.getItem('kjpp_token_internal'),
            inpEmpty: inp ? inp.value === '' : false
          };
        })()
      `,
      returnByValue: true
    });
    const rVal = resetLive.result.value;
    const resPass = rVal.formVisible && rVal.panelHidden && rVal.sessionCleared && rVal.inpEmpty;
    console.log(`[${resPass ? 'PASS' : 'FAIL'}] Live Logout & Reset Token Session: Form restored, session cleared`);

    ws.close();
  } finally {
    chrome.kill();
  }
}

runLiveTest().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
