import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d';
const LIVE_URL = 'https://kjppnanangrahayu.com/portal-presensi.html';

async function main() {
  const DEBUG_PORT = 9295;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('1. Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
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
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    console.log('2. Navigating to LIVE Portal Presensi:', LIVE_URL);
    await send('Page.navigate', { url: `${LIVE_URL}?v=${Date.now()}` });
    await new Promise(r => setTimeout(r, 4000));

    // Tutup modal privasi jika muncul
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.konfirmasiSetujuPrivasi === 'function') {
          window.konfirmasiSetujuPrivasi();
        } else {
          const m = document.getElementById('modal-privasi-karyawan');
          if (m) m.classList.add('hidden');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll ke auth-card
    await send('Runtime.evaluate', {
      expression: `
        const card = document.getElementById('auth-card');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Bukti 1: Form Login PIN Bersih
    console.log('3. Capturing Form Login PIN Bersih...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const p1 = path.join(ARTIFACT_DIR, 'bukti_live_auth_pin_bersih.png');
    fs.writeFileSync(p1, Buffer.from(shot1.data, 'base64'));
    console.log('   ✓ Saved:', p1);

    // Bukti 2: Uji Buka Modal Reset PIN
    console.log('4. Opening Modal Reset PIN...');
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.bukaModalResetPin === 'function') {
          window.bukaModalResetPin();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const p2 = path.join(ARTIFACT_DIR, 'bukti_live_modal_reset_pin.png');
    fs.writeFileSync(p2, Buffer.from(shot2.data, 'base64'));
    console.log('   ✓ Saved:', p2);

    // Tutup modal reset PIN
    await send('Runtime.evaluate', {
      expression: `
        if (typeof window.tutupModalResetPin === 'function') {
          window.tutupModalResetPin();
        }
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Bukti 3: Uji Auto-Prompt Lengkapi Email Mandiri (NSR-2019-014 Yanto)
    console.log('5. Triggering Auto-Prompt Lengkapi Email for Yanto (NSR-2019-014)...');
    await send('Runtime.evaluate', {
      expression: `
        const elNik = document.getElementById('auth-nik-input');
        const elPin = document.getElementById('auth-pin-input');
        if (elNik) elNik.value = 'NSR-2019-014';
        if (elPin) elPin.value = '123456';
        if (typeof window.eksekusiMasukPresensi === 'function') {
          window.eksekusiMasukPresensi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 3500));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const p3 = path.join(ARTIFACT_DIR, 'bukti_live_auto_prompt_email.png');
    fs.writeFileSync(p3, Buffer.from(shot3.data, 'base64'));
    console.log('   ✓ Saved:', p3);

    // Tutup modal email jika ada
    await send('Runtime.evaluate', {
      expression: `
        const m = document.getElementById('modal-lengkapi-email');
        if (m) m.classList.add('hidden');
        const mn = document.getElementById('modal-notif');
        if (mn) mn.classList.add('hidden');
      `
    });

    // Bukti 4: Login Sukses Karyawan Pusat (NSR-2019-012 Latief Satihi)
    console.log('6. Executing Login Sukses for Latief Satihi (NSR-2019-012)...');
    await send('Runtime.evaluate', {
      expression: `
        const elNik = document.getElementById('auth-nik-input');
        const elPin = document.getElementById('auth-pin-input');
        if (elNik) elNik.value = 'NSR-2019-012';
        if (elPin) elPin.value = '123456';
        if (typeof window.eksekusiMasukPresensi === 'function') {
          window.eksekusiMasukPresensi();
        }
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    // Tutup popup notif agar UI presensi terlihat terbuka
    await send('Runtime.evaluate', {
      expression: `
        const mn = document.getElementById('modal-notif');
        if (mn) mn.classList.add('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    const p4 = path.join(ARTIFACT_DIR, 'bukti_live_pin_login_sukses.png');
    fs.writeFileSync(p4, Buffer.from(shot4.data, 'base64'));
    console.log('   ✓ Saved:', p4);

    ws.close();
  } finally {
    chrome.kill();
    console.log('✓ Chrome terminated');
  }
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
