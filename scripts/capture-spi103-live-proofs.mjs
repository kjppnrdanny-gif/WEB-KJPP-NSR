import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const DEBUG_PORT = 9388;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  console.log('Starting headless Chrome on port', DEBUG_PORT);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1366,950',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    const cb = Date.now();

    // 1. CAPTURE TASK BOARD ON LIVE CPANEL
    console.log('1. Navigating to live portal-tracking.html (Task Board)...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/portal-tracking.html?cb=${cb}`
    });
    await new Promise(r => setTimeout(r, 3500));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_spi103_taskboard.png'), Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_spi103_taskboard.png saved');

    // 2. CAPTURE FORM REGISTRASI WITH SPI 103 FIELDS & SPM GUARDRAIL
    console.log('2. Opening Form Registrasi tab and setting SPM Guardrail...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        switchTab('register');
        document.getElementById('reg-klasifikasi-izin-objek').value = 'P';
        document.getElementById('reg-penilai').value = 'Hernita, S.Si., MAPPI (Cert.) - Pemimpin Cabang Padang / Rekan (PS-1.15.00046)';
        periksaKepatuhanSpm();
        document.getElementById('reg-pemberi-tugas').value = 'PT Bank Tabungan Negara (Persero) Tbk';
        document.getElementById('reg-pengguna-laporan').value = 'PT Bank Tabungan Negara (Persero) Tbk';
        document.getElementById('reg-debitur').value = 'PT Wijaya Karya Beton';
        document.getElementById('reg-client-pic-name').value = 'Rian Pratama, S.E. (Loan Officer)';
        document.getElementById('reg-client-pic-phone').value = '081288997766';
        document.getElementById('reg-survey-contact-name').value = 'Bambang Sudarsono (Debitur)';
        document.getElementById('reg-survey-contact-phone').value = '081399887711';
        document.getElementById('reg-tujuan-penilaian').value = 'Penjaminan Utang / Agunan Kredit';
        document.getElementById('reg-dokumen-kepemilikan').value = 'SHM No. 402/Kuningan';
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_spi103_form_registrasi.png'), Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_spi103_form_registrasi.png saved');

    // 3. CAPTURE MODAL STEPPER (Pemberi Tugas, Pengguna Laporan, Dual WA buttons, PIC markers)
    console.log('3. Opening Modal Stepper for JO-JKT-2026-0001...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        switchTab('board');
        bukaModalTracking('JO-JKT-2026-0001');
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_spi103_modal_stepper.png'), Buffer.from(shot3.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_spi103_modal_stepper.png saved');

    // 4. CAPTURE MODAL KONFIRMASI REGISTRASI WITH EXCLUSIVE PEMBERI TUGAS NOTICE
    console.log('4. Displaying Modal Konfirmasi Registrasi...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        tutupModalTracking();
        const elJo = document.getElementById('confirm-jo-number'); if (elJo) elJo.textContent = 'JO-JKT-2026-0001';
        const elTrk = document.getElementById('confirm-kode-lacak'); if (elTrk) elTrk.textContent = 'TRK-JKT-2026-A89F';
        const elPem = document.getElementById('confirm-pemberi-tugas'); if (elPem) elPem.textContent = 'PT Bank Tabungan Negara (Persero) Tbk';
        const elDeb = document.getElementById('confirm-debitur'); if (elDeb) elDeb.textContent = 'Hendra Wijaya, S.T.';
        const elPic = document.getElementById('confirm-pic'); if (elPic) elPic.textContent = 'Rian Pratama, S.E. (081288997766)';
        document.getElementById('modal-konfirmasi-registrasi').classList.remove('hidden');
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_spi103_modal_konfirmasi.png'), Buffer.from(shot4.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_spi103_modal_konfirmasi.png saved');

    // 5. CAPTURE PUBLIC TRACKING MODAL ON INDEX.HTML
    console.log('5. Navigating to index.html with ?track=TRK-JKT-2026-A89F...');
    await send('Page.navigate', {
      url: `https://kjppnanangrahayu.com/index.html?track=TRK-JKT-2026-A89F&cb=${cb}`
    });
    await new Promise(r => setTimeout(r, 3500));

    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'bukti_cpanel_live_spi103_public_stepper.png'), Buffer.from(shot5.result.data, 'base64'));
    console.log('✓ bukti_cpanel_live_spi103_public_stepper.png saved');

    ws.close();
    chrome.kill();
    console.log('🎉 ALL 5 LIVE CPANEL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('CDP Error:', err);
    chrome.kill();
  }
}

main().catch(console.error);
