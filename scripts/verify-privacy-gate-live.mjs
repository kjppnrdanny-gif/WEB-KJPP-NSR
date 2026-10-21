import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 9522;

async function verifyLivePrivacyGate() {
  console.log('========================================================');
  console.log('🛡️ VERIFIKASI LIVE PRIVACY FIRST GATE (GAS VERSI 16)');
  console.log('Target: Google Apps Script Web App Deployment Publik');
  console.log('========================================================\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-sandbox',
    '--window-size=412,915', // Mobile viewport
    'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec'
  ]);

  console.log('1. Menghubungkan ke Web App Versi 16 via Headless Chrome...');
  await new Promise(r => setTimeout(r, 9000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await listRes.json();

    let appTarget = pages.find(p => p.url.includes('userCodeAppPanel'));
    if (!appTarget) {
      console.log('   Menunggu userCodeAppPanel iframe termuat...');
      await new Promise(r => setTimeout(r, 4000));
      const listRes2 = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages2 = await listRes2.json();
      appTarget = pages2.find(p => p.url.includes('userCodeAppPanel'));
    }

    if (!appTarget || !appTarget.webSocketDebuggerUrl) {
      throw new Error('Target iframe userCodeAppPanel tidak ditemukan: ' + JSON.stringify(pages.map(p => p.url)));
    }

    console.log('   ✓ Terhubung ke userCodeAppPanel:', appTarget.url);
    const ws = new WebSocket(appTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const mainPage = pages.find(p => p.url.includes('script.google.com'));
    let wsMain = null;
    let mainMsgId = 1000;
    const sendMain = (method, params = {}) => new Promise((resolve) => {
      if (!wsMain) return resolve(null);
      const id = mainMsgId++;
      const onMsg = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === id) {
          wsMain.removeEventListener('message', onMsg);
          resolve(m.result || m.error);
        }
      };
      wsMain.addEventListener('message', onMsg);
      wsMain.send(JSON.stringify({ id, method, params }));
    });

    if (mainPage && mainPage.webSocketDebuggerUrl) {
      wsMain = new WebSocket(mainPage.webSocketDebuggerUrl);
      await new Promise(r => wsMain.onopen = r);
      await sendMain('Page.enable');
    }

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(m.result || m.error);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n2. Memeriksa Status Awal Privacy Gate pada Live GAS...');
    const checkGateEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          if (!doc) return { error: 'Doc not found' };

          const modal = doc.getElementById('modal-privasi-karyawan');
          const main = doc.getElementById('main-presensi-content');
          const btnX = doc.getElementById('btn-tutup-privasi-x');
          const badgeWajib = doc.getElementById('badge-gate-wajib');
          const btnConfirm = doc.getElementById('btn-konfirmasi-privasi');
          const point4 = doc.querySelector('#modal-privasi-karyawan .overflow-y-auto');

          return {
            hasModal: !!modal,
            modalVisible: modal ? !modal.classList.contains('hidden') : false,
            mainPointerEvents: main ? window.getComputedStyle(main).pointerEvents : null,
            btnXDisplay: btnX ? window.getComputedStyle(btnX).display : null,
            badgeWajibDisplay: badgeWajib ? window.getComputedStyle(badgeWajib).display : null,
            btnConfirmText: btnConfirm ? btnConfirm.innerText.trim() : null,
            point4Snippet: point4 ? point4.innerText : null,
            sessionVersion: sessionStorage.getItem('nsr_privasi_confirmed_version')
          };
        })()
      `,
      returnByValue: true
    });

    const gateRes = checkGateEval.result?.value;
    console.log('   Hasil Pemeriksaan Gate:', JSON.stringify(gateRes, null, 2));

    if (!gateRes.modalVisible) {
      throw new Error('GATE GAGAL: Modal privasi tidak muncul otomatis saat load!');
    }
    if (gateRes.btnXDisplay !== 'none') {
      throw new Error(`GATE GAGAL: Tombol X seharusnya tersembunyi (didapat: ${gateRes.btnXDisplay})`);
    }
    if (gateRes.mainPointerEvents !== 'none') {
      throw new Error(`GATE GAGAL: Form latar belakang tidak terkunci (pointerEvents: ${gateRes.mainPointerEvents})`);
    }
    if (!gateRes.btnConfirmText.includes('Saya Mengerti & Lanjutkan')) {
      throw new Error(`GATE GAGAL: Teks tombol konfirmasi salah: ${gateRes.btnConfirmText}`);
    }
    if (!gateRes.point4Snippet.includes('PMK No. 101/PMK.01/2014')) {
      throw new Error('GATE GAGAL: Redaksi PMK No. 101/PMK.01/2014 belum termuat!');
    }
    if (gateRes.point4Snippet.includes('Peraturan Kemenkeu RI No. 2.19.0160')) {
      throw new Error('GATE GAGAL: Teks salah "Peraturan Kemenkeu RI No. 2.19.0160" masih muncul!');
    }
    console.log('   ✓ PASS: Modal Privasi Gate muncul otomatis, form terkunci, tombol X nonaktif, redaksi hukum akurat.');

    // Screenshot Gate Active
    if (wsMain) {
      console.log('   Mengambil screenshot modal privasi gate live...');
      const ssGate = await sendMain('Page.captureScreenshot', { format: 'png' });
      if (ssGate && ssGate.data) {
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_modal_privasi_gate.png'), Buffer.from(ssGate.data, 'base64'));
        console.log('   ✓ Disimpan:', path.join(ARTIFACT_DIR, 'live_prod_modal_privasi_gate.png'));
      }
    }

    console.log('\n3. Menguji Ketahanan Non-Bypass (Escape & Backdrop)...');
    const escTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          
          // Simulasi tekan tombol Escape
          doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
          
          const modal = doc.getElementById('modal-privasi-karyawan');
          return { modalStillVisible: modal ? !modal.classList.contains('hidden') : false };
        })()
      `,
      returnByValue: true
    });
    console.log('   ESC ditekan, modal tetap terbuka:', escTest.result?.value?.modalStillVisible ? 'PASS' : 'FAIL');
    if (!escTest.result?.value?.modalStillVisible) {
      throw new Error('BYPASS TERJADI: Tombol ESC dapat menutup modal sebelum konfirmasi!');
    }

    const backdropTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const modal = doc.getElementById('modal-privasi-karyawan');

          // Simulasi klik backdrop luar
          modal.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          
          return { modalStillVisible: modal ? !modal.classList.contains('hidden') : false };
        })()
      `,
      returnByValue: true
    });
    console.log('   Backdrop diklik, modal tetap terbuka:', backdropTest.result?.value?.modalStillVisible ? 'PASS' : 'FAIL');
    if (!backdropTest.result?.value?.modalStillVisible) {
      throw new Error('BYPASS TERJADI: Klik backdrop dapat menutup modal sebelum konfirmasi!');
    }

    console.log('\n4. Menguji Konfirmasi: Klik "Saya Mengerti & Lanjutkan"...');
    const confirmEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const doc = ifr ? (ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document)) : document;
          const btn = doc.getElementById('btn-konfirmasi-privasi');
          if (btn) btn.click();

          const modal = doc.getElementById('modal-privasi-karyawan');
          const main = doc.getElementById('main-presensi-content');

          return {
            modalClosed: modal ? modal.classList.contains('hidden') : false,
            mainUnlocked: main ? window.getComputedStyle(main).pointerEvents : null,
            savedVersion: sessionStorage.getItem('nsr_privasi_confirmed_version'),
            savedAt: sessionStorage.getItem('nsr_privasi_confirmed_at')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('   Hasil Konfirmasi:', JSON.stringify(confirmEval.result?.value, null, 2));
    const cRes = confirmEval.result?.value;
    if (!cRes.modalClosed) throw new Error('Modal tidak tertutup setelah tombol konfirmasi ditekan!');
    if (cRes.mainUnlocked !== 'auto') throw new Error(`Form belum terbuka setelah konfirmasi: ${cRes.mainUnlocked}`);
    if (cRes.savedVersion !== 'PDP-NSR-EMP-2026.10') throw new Error(`Versi PDP tidak tersimpan: ${cRes.savedVersion}`);
    if (!cRes.savedAt) throw new Error('Timestamp konfirmasi tidak tersimpan!');
    console.log('   ✓ PASS: Form terbuka penuh (pointer-events: auto), sesi PDP tersimpan di sessionStorage.');

    // Screenshot Unlocked Form
    if (wsMain) {
      await new Promise(r => setTimeout(r, 500));
      console.log('   Mengambil screenshot formulir presensi yang telah terbuka...');
      const ssUnlocked = await sendMain('Page.captureScreenshot', { format: 'png' });
      if (ssUnlocked && ssUnlocked.data) {
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_prod_presensi_unlocked.png'), Buffer.from(ssUnlocked.data, 'base64'));
        console.log('   ✓ Disimpan:', path.join(ARTIFACT_DIR, 'live_prod_presensi_unlocked.png'));
      }
    }

    console.log('\n5. Menguji Mode Review (Membuka kembali dari Footer)...');
    const reviewEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ifr = document.getElementById('userHtmlFrame');
          const win = ifr ? ifr.contentWindow : window;
          const doc = ifr ? (ifr.contentDocument || ifr.contentWindow.document) : document;

          if (win.bukaModalPrivasiKaryawan) win.bukaModalPrivasiKaryawan();

          const modal = doc.getElementById('modal-privasi-karyawan');
          const btnX = doc.getElementById('btn-tutup-privasi-x');
          const btnConfirm = doc.getElementById('btn-konfirmasi-privasi');

          return {
            modalVisible: modal ? !modal.classList.contains('hidden') : false,
            btnXDisplay: btnX ? window.getComputedStyle(btnX).display : null,
            btnText: btnConfirm ? btnConfirm.innerText.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('   Hasil Review Mode:', JSON.stringify(reviewEval.result?.value, null, 2));
    if (reviewEval.result?.value?.btnXDisplay === 'none') {
      throw new Error('Tombol X seharusnya muncul saat modal dibuka sukarela dari footer');
    }
    console.log('   ✓ PASS: Mode Review berfungsi, tombol X dapat digunakan untuk menutup kembali.');

    console.log('\n========================================================');
    console.log('🎉 VERIFIKASI LIVE PRIVACY FIRST GATE LULUS 100%!');
    console.log('========================================================');

  } finally {
    chrome.kill();
  }
}

verifyLivePrivacyGate().catch(err => {
  console.error('\n❌ VERIFIKASI LIVE GAGAL:', err);
  process.exit(1);
});
