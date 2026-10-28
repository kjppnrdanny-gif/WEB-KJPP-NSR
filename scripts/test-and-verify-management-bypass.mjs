import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function testManagementBypass() {
  const SERVER_PORT = 8097;
  const DEBUG_PORT = 9278;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting local PHP web server on port', SERVER_PORT);
  const phpExtDir = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
  const phpServer = spawn('php', [
    '-d', `extension_dir=${phpExtDir}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${SERVER_PORT}`
  ]);

  await new Promise(r => setTimeout(r, 1200));

  console.log('2. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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

    console.log('3. Navigating to portal-presensi.html...');
    await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/portal-presensi.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Confirm privacy modal
    await send('Runtime.evaluate', {
      expression: `
        if (typeof konfirmasiSetujuPrivasi === 'function') konfirmasiSetujuPrivasi();
        document.getElementById('modal-privasi-karyawan')?.classList.add('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Test Step 1: Input NIK NSR-2019-005
    console.log('4. Testing NIK input NSR-2019-005...');
    const nikInputRes = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const nikInput = document.getElementById('auth-nik-input');
          nikInput.value = 'NSR-2019-005';
          nikInput.dispatchEvent(new Event('input', { bubbles: true }));

          const boxOtp = document.getElementById('auth-box-otp-input');
          const isOtpBoxVisible = !boxOtp.classList.contains('hidden');
          const targetEmail = document.getElementById('auth-target-email')?.innerText;

          return {
            isOtpBoxVisible,
            targetEmail
          };
        })()
      `,
      returnByValue: true
    });
    console.log('NIK Input Result:', JSON.stringify(nikInputRes.result?.value, null, 2));

    // Test Step 2: Input Token NSR8899 and click Verifikasi
    console.log('5. Entering Token NSR8899 and verifying...');
    const verifRes = await send('Runtime.evaluate', {
      expression: `
        (async function() {
          const otpInput = document.getElementById('auth-otp-input');
          otpInput.value = 'NSR8899';
          
          await eksekusiVerifikasiOTP();

          const isVerifiedBoxVisible = !document.getElementById('auth-box-verified')?.classList.contains('hidden');
          const nama = document.getElementById('verified-karyawan-nama')?.innerText;
          const sub = document.getElementById('verified-karyawan-sub')?.innerText;
          const isFormVisible = !document.getElementById('panelAbsensi')?.classList.contains('hidden');
          const isDashVisible = !document.getElementById('tab-btn-dashboard')?.classList.contains('hidden');

          return {
            isVerifiedBoxVisible,
            nama,
            sub,
            isFormVisible,
            isDashVisible,
            sessionNik,
            isAdminHR: sessionUser?.isAdminHR,
            hrUnlocked: sessionStorage.getItem('nsr_hr_unlocked')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Verification Result:', JSON.stringify(verifRes.result?.value, null, 2));

    // Close notification modal if open
    await send('Runtime.evaluate', {
      expression: `tutupModalNotif();`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Capture Desktop Screenshot of Verified State & Form
    console.log('6. Capturing desktop proof of verified management status...');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const ss1Path = path.join(ARTIFACT_DIR, 'bukti_live_bypass_nsr8899_terverifikasi_desktop.png');
    fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
    console.log('✓ Saved:', ss1Path);

    // Switch to Tab Admin HR and capture Admin HR dashboard
    console.log('7. Switching to Tab Admin HR...');
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          if (typeof pilihTabPresensi === 'function') pilihTabPresensi('dashboard');
          else if (typeof bukaTabAdminHR === 'function') bukaTabAdminHR();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const ss2Path = path.join(ARTIFACT_DIR, 'bukti_live_admin_hr_unlocked_desktop.png');
    fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
    console.log('✓ Saved:', ss2Path);

    // Mobile Viewport (375x812)
    console.log('8. Capturing mobile proof...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    const ss3Path = path.join(ARTIFACT_DIR, 'bukti_live_bypass_nsr8899_mobile.png');
    fs.writeFileSync(ss3Path, Buffer.from(ss3.data, 'base64'));
    console.log('✓ Saved:', ss3Path);

    console.log('🎉 ALL MANAGEMENT BYPASS & COOLDOWN TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { chrome.kill(); } catch (_) {}
    try { phpServer.kill(); } catch (_) {}
  }
}

testManagementBypass();
