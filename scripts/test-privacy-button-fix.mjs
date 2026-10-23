import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PORT = 9578;
const TEST_URL = 'http://127.0.0.1:8892/portal-presensi.html';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  TEST SUITE: TOMBOL PRIVASI PRESENSI (SAYA MENYETUJUI & LANJUTKAN)');
  console.log('========================================================================\n');

  const phpServer = spawn('php', ['-S', '127.0.0.1:8892', '-t', process.cwd()]);
  await new Promise(r => setTimeout(r, 1000));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-privasi-btn-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
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

  await send('Page.navigate', { url: TEST_URL });

  // Tunggu hingga dokumen selesai dimuat dan tombol #btn-setuju-privasi-presensi tersedia
  console.log('Menunggu pemuatan halaman dan kemunculan modal privasi gate...');
  for (let i = 0; i < 40; i++) {
    const checkReady = await send('Runtime.evaluate', {
      expression: `Boolean(document.readyState === "complete" && document.getElementById("btn-setuju-privasi-presensi") && typeof window.konfirmasiSetujuPrivasi === "function")`
    });
    if (checkReady.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Tunggu timeout modal gate (600ms) agar modal terbuka
  for (let i = 0; i < 30; i++) {
    const checkModalOpen = await send('Runtime.evaluate', {
      expression: `(() => {
        const m = document.getElementById("modal-privasi-karyawan");
        return Boolean(m && !m.classList.contains("hidden") && window.getComputedStyle(m).display !== "none");
      })()`
    });
    if (checkModalOpen.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }

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

  console.log('\n--- [1] VERIFIKASI REKONSTRUKSI ELEMEN TOMBOL DI HTML ---');
  const btnProps = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btn = document.getElementById('btn-setuju-privasi-presensi');
      if (!btn) return null;
      return {
        tag: btn.tagName.toUpperCase(),
        type: btn.getAttribute('type'),
        id: btn.id,
        onclickAttr: btn.getAttribute('onclick'),
        text: btn.textContent.trim(),
        hasAmberBg: btn.classList.contains('bg-amber-500'),
        cursorPointer: btn.classList.contains('cursor-pointer')
      };
    })()`
  });

  const b = btnProps.result.value;
  assert(b !== null, 'Tombol #btn-setuju-privasi-presensi ditemukan di DOM');
  assert(b && b.tag === 'BUTTON', 'Elemen adalah tag <button>');
  assert(b && b.type === 'button', 'Atribut type="button" terpasang');
  assert(b && b.id === 'btn-setuju-privasi-presensi', 'ID elemen adalah "btn-setuju-privasi-presensi"');
  assert(b && b.onclickAttr === 'konfirmasiSetujuPrivasi()', 'Atribut onclick="konfirmasiSetujuPrivasi()" terpasang langsung');
  assert(b && b.text.includes('Saya Menyetujui & Lanjutkan'), 'Teks tombol adalah "Saya Menyetujui & Lanjutkan"');
  assert(b && b.hasAmberBg, 'Styling bg-amber-500 terpasang');

  console.log('\n--- [2] VERIFIKASI MODAL MUNCUL SEBELUM DIKLIK ---');
  const modalBefore = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      return {
        exists: !!m,
        isHidden: m ? m.classList.contains('hidden') : true,
        display: m ? window.getComputedStyle(m).display : 'none'
      };
    })()`
  });
  const mb = modalBefore.result.value;
  assert(mb.exists, 'Modal #modal-privasi-karyawan ditemukan di DOM');
  assert(!mb.isHidden && mb.display !== 'none', 'Modal privasi terbuka (visible) saat awal akses');

  console.log('\n--- [3] PENGUJIAN AKSI KLIK TOMBOL: MODAL MENUTUP SECARA MULUS ---');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-setuju-privasi-presensi').click()`
  });

  await new Promise(r => setTimeout(r, 600));

  const modalAfter = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      const sessionVer = sessionStorage.getItem('nsr_privasi_confirmed_version');
      const sessionAt = sessionStorage.getItem('nsr_privasi_confirmed_at');
      const localAck = localStorage.getItem('nsr_presensi_privacy_ack');
      const bodyOverflow = document.body.style.overflow;

      return {
        isHidden: m ? m.classList.contains('hidden') : false,
        display: m ? window.getComputedStyle(m).display : 'flex',
        sessionVer,
        hasSessionAt: !!sessionAt,
        hasLocalAck: !!localAck,
        bodyOverflow
      };
    })()`
  });
  const ma = modalAfter.result.value;
  assert(ma.isHidden || ma.display === 'none', 'Modal privasi BERHASIL TERTUTUP setelah tombol diklik');
  assert(ma.bodyOverflow === '', 'Scroll body dipulihkan (overflow = "")');
  assert(ma.sessionVer === 'PDP-NSR-EMP-2026.10', 'SessionStorage merekam versi persetujuan');
  assert(ma.hasSessionAt, 'SessionStorage merekam timestamp persetujuan');
  assert(ma.hasLocalAck, 'LocalStorage merekam employeeAck persetujuan');

  console.log('\n--- [4] PENGUJIAN MODAL REVIEW VIA FOOTER SETELAH PERSETUJUAN ---');
  await send('Runtime.evaluate', {
    expression: `window.bukaModalPrivasiKaryawan()`
  });
  await new Promise(r => setTimeout(r, 400));

  const reviewModal = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      const btn = document.getElementById('btn-setuju-privasi-presensi');
      return {
        isOpen: m ? (!m.classList.contains('hidden') && window.getComputedStyle(m).display !== 'none') : false,
        btnText: btn ? btn.textContent.trim() : ''
      };
    })()`
  });
  assert(reviewModal.result.value.isOpen, 'Modal review dapat dibuka kembali dari link footer');
  assert(reviewModal.result.value.btnText === 'Saya Mengerti', 'Tombol beralih menjadi "Saya Mengerti" pada mode review');

  // Tutup mode review
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-setuju-privasi-presensi').click()`
  });
  await new Promise(r => setTimeout(r, 400));

  const reviewClosed = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const m = document.getElementById('modal-privasi-karyawan');
      return m ? (m.classList.contains('hidden') || window.getComputedStyle(m).display === 'none') : true;
    })()`
  });
  assert(reviewClosed.result.value === true, 'Modal review berhasil ditutup kembali dengan klik');

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

runTestSuite().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
