import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9580;
const TEST_PORT = 8893;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}/portal-presensi.html`;
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';

async function runMobileTestSuite() {
  console.log('========================================================================');
  console.log('  TEST SUITE: MOBILE RESPONSIVE & EVENT SENTUH PRIVASI (360px & 390px)');
  console.log('========================================================================\n');

  const phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', process.cwd()]);
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mob-touch-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=360,800',
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

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // --- VIEWPORT 1: 360 x 800 px (Android Standard) ---
  console.log('--- [1] PENGUJIAN VIEWPORT ANDROID 360 x 800 px ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
    hasTouch: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  await send('Page.navigate', { url: TEST_URL });

  // Tunggu hingga modal gate terbuka
  for (let i = 0; i < 40; i++) {
    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const m = document.getElementById('modal-privasi-karyawan');
        const b = document.getElementById('btn-setuju-privasi-presensi');
        return Boolean(m && !m.classList.contains('hidden') && b);
      })()`
    });
    if (r.result?.value === true) break;
    await new Promise(res => setTimeout(res, 200));
  }

  const checkViewport360 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      const b = document.getElementById('btn-setuju-privasi-presensi');
      const bRect = b.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      return {
        hasOntouchend: b.hasAttribute('ontouchend'),
        ontouchendAttr: b.getAttribute('ontouchend'),
        onclickAttr: b.getAttribute('onclick'),
        hasTouchManipulation: b.classList.contains('touch-manipulation'),
        buttonBottom: bRect.bottom,
        buttonTop: bRect.top,
        viewportHeight: vh,
        viewportWidth: vw,
        isFullyOnScreen: bRect.bottom <= vh && bRect.top >= 0 && bRect.right <= vw,
        buttonHeight: bRect.height,
        buttonWidth: bRect.width
      };
    })()`
  });

  const v360 = checkViewport360.result.value;
  assert(v360.hasOntouchend === true, 'Tombol memiliki atribut ontouchend="konfirmasiSetujuPrivasi(event)"');
  assert(v360.hasTouchManipulation === true, 'Tombol memiliki kelas CSS touch-manipulation');
  assert(v360.isFullyOnScreen === true, `Tombol TERLIHAT PENUH di layar 360x800 (bottom: ${v360.buttonBottom}px <= vh: ${v360.viewportHeight}px)`);
  assert(v360.buttonHeight >= 44, `Ukuran target sentuh memenuhi standar aksesibilitas mobile (${Math.round(v360.buttonHeight)}px >= 44px)`);

  // Capture Screenshot 360x800
  const shot360 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_mobile_360x800_modal_sticky.png'), Buffer.from(shot360.data, 'base64'));
  console.log('  📸 Screenshot tersimpan: bukti_mobile_360x800_modal_sticky.png');

  // Simulasikan sentuhan (Touch Event / ontouchend)
  console.log('\n--- [2] PENGUJIAN DISPATCH TOUCH EVENT (ONTOUCHEND) PADA TOMBOL ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const b = document.getElementById('btn-setuju-privasi-presensi');
      // Mock error pada GPS untuk memvalidasi isolasi error
      window.ambilGPS = () => { throw new Error("GPS Mock Denied on Android"); };
      
      const touchObj = new Touch({
        identifier: Date.now(),
        target: b,
        clientX: 180,
        clientY: 750,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 10,
        force: 0.5,
      });
      const touchEvent = new TouchEvent('touchend', {
        cancelable: true,
        bubbles: true,
        touches: [touchObj],
        targetTouches: [],
        changedTouches: [touchObj],
      });
      b.dispatchEvent(touchEvent);
    })()`
  });

  await new Promise(r => setTimeout(r, 600));

  const afterTouch = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      const v = sessionStorage.getItem('nsr_privasi_confirmed_version');
      const ack = localStorage.getItem('nsr_presensi_privacy_ack');
      const accepted = localStorage.getItem('nsr_presensi_privacy_accepted');
      return {
        isClosed: m ? (m.classList.contains('hidden') || m.style.display === 'none') : true,
        version: v,
        ack,
        accepted,
        bodyOverflow: document.body.style.overflow
      };
    })()`
  });

  const at = afterTouch.result.value;
  assert(at.isClosed === true, 'Modal privasi BERHASIL TERTUTUP via Touch Event');
  assert(at.version === 'PDP-2026-V1', 'SessionStorage merekam versi PDP-2026-V1');
  assert(at.ack === 'true' && at.accepted === 'true', 'LocalStorage merekam nsr_presensi_privacy_ack & accepted');
  assert(at.bodyOverflow === '', 'Overflow dokumen dipulihkan (scroll unlocked)');

  // --- VIEWPORT 2: 390 x 844 px (iPhone 12/13/14) ---
  console.log('\n--- [3] PENGUJIAN VIEWPORT IPHONE 390 x 844 px ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    hasTouch: true
  });

  // Bersihkan session untuk pengujian iPhone
  await send('Runtime.evaluate', {
    expression: `sessionStorage.clear(); localStorage.clear();`
  });
  await send('Page.navigate', { url: TEST_URL });

  for (let i = 0; i < 40; i++) {
    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const m = document.getElementById('modal-privasi-karyawan');
        const b = document.getElementById('btn-setuju-privasi-presensi');
        return Boolean(m && !m.classList.contains('hidden') && b);
      })()`
    });
    if (r.result?.value === true) break;
    await new Promise(res => setTimeout(res, 200));
  }

  const checkViewport390 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const b = document.getElementById('btn-setuju-privasi-presensi');
      const bRect = b.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      return {
        buttonBottom: bRect.bottom,
        viewportHeight: vh,
        isFullyOnScreen: bRect.bottom <= vh && bRect.top >= 0 && bRect.right <= vw
      };
    })()`
  });

  const v390 = checkViewport390.result.value;
  assert(v390.isFullyOnScreen === true, `Tombol TERLIHAT PENUH di layar iPhone 390x844 (bottom: ${v390.buttonBottom}px <= vh: ${v390.viewportHeight}px)`);

  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_mobile_390x844_modal_sticky.png'), Buffer.from(shot390.data, 'base64'));
  console.log('  📸 Screenshot tersimpan: bukti_mobile_390x844_modal_sticky.png');

  // Klik tombol di iPhone
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-setuju-privasi-presensi').click()`
  });
  await new Promise(r => setTimeout(r, 600));

  const afterClickIphone = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      return m ? (m.classList.contains('hidden') || m.style.display === 'none') : true;
    })()`
  });
  assert(afterClickIphone.result.value === true, 'Modal privasi BERHASIL TERTUTUP di layar iPhone 390x844');

  console.log('\n========================================================================');
  console.log(`  HASIL AKHIR: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  chrome.kill();
  phpServer.kill();

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMobileTestSuite().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
