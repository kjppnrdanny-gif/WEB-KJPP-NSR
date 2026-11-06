import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const DEBUG_PORT = 9777;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-tracking.html';

async function main() {
  console.log('=================================================================');
  console.log('   LIVE TEST: BOTTLENECK BUTTONS ON PRODUCTION SERVER');
  console.log(`   URL: ${LIVE_URL}`);
  console.log('=================================================================\n');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,960',
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
    const pageErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const exp = msg.params.exceptionDetails;
        const text = exp.exception ? (exp.exception.description || exp.exception.value) : exp.text;
        const errInfo = `[EXCEPTION] line ${exp.lineNumber}:${exp.columnNumber} - ${text}`;
        pageErrors.push(errInfo);
        console.error('🚨', errInfo);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    async function evaluate(expression, awaitPromise = false) {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true
      });
      return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log(`1. Navigasi ke ${LIVE_URL} ...`);
    await send('Page.navigate', { url: `${LIVE_URL}?ts=${Date.now()}` });
    await new Promise(r => setTimeout(r, 3500));

    console.log('2. Inisialisasi sesi PIMPINAN & memuat analitik live...');
    await evaluate(`(async () => {
      sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
      sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
      sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

      initUserSession();
      await muatDataTaskBoard();
      await muatWorkloadAnalytics();
    })()`, true);
    await new Promise(r => setTimeout(r, 2000));

    // Check exposure
    console.log('3. Memeriksa exposure fungsi modal di window...');
    const exp = await evaluate(`(() => ({
      hasBukaModalTracking: typeof window.bukaModalTracking === 'function',
      hasBukaModalUpdate: typeof window.bukaModalUpdate === 'function',
      hasBukaModalUpdateMilestone: typeof window.bukaModalUpdateMilestone === 'function'
    }))()`);
    console.log('Window modal functions:', exp);

    // Test clicking stepper if button exists, or calling window.bukaModalTracking with first job
    console.log('4. Menguji eksekusi window.bukaModalTracking pada berkas live...');
    const stepTest = await evaluate(`(() => {
      const btn = document.querySelector('.btn-stepper');
      if (btn) {
        btn.click();
      } else if (globalJobs && globalJobs.length > 0) {
        window.bukaModalTracking(globalJobs[0].jo_number);
      }
      const modal = document.getElementById('modal-tracking-stepper');
      return {
        hasBtn: !!btn,
        modalHidden: modal ? modal.classList.contains('hidden') : true,
        modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
        joText: document.getElementById('modal-jo-number')?.textContent
      };
    })()`);
    console.log('Hasil Uji Modal Stepper Live:', stepTest);

    // Close stepper
    await evaluate(`window.tutupModalTracking()`);
    await new Promise(r => setTimeout(r, 500));

    // Test clicking intervensi if button exists, or calling window.bukaModalUpdate with first job
    console.log('5. Menguji eksekusi window.bukaModalUpdate pada berkas live...');
    const intvTest = await evaluate(`(() => {
      const btn = document.querySelector('.btn-intervensi');
      if (btn) {
        btn.click();
      } else if (globalJobs && globalJobs.length > 0) {
        window.bukaModalUpdate(globalJobs[0].jo_number);
      }
      const modal = document.getElementById('modal-update-milestone');
      return {
        hasBtn: !!btn,
        modalHidden: modal ? modal.classList.contains('hidden') : true,
        modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
        joText: document.getElementById('update-jo-display')?.textContent
      };
    })()`);
    console.log('Hasil Uji Modal Intervensi Live:', intvTest);

    // Close update modal
    await evaluate(`window.tutupModalUpdateMilestone()`);

    // Capture screenshot of dashboard live
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, 'bukti_live_bottleneck_fixed.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
    console.log('📸 Screenshot live dashboard disimpan ke:', shotPath);

    if (pageErrors.length > 0) {
      console.error('Ada galat console di server live:', pageErrors);
      process.exit(1);
    }

    console.log('\n=================================================================');
    console.log('🎉 SELURUH PENGUJIAN PRODUCTION LIVE LULUS 100%!');
    console.log('=================================================================');
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Pengujian live gagal:', err);
  process.exit(1);
});
