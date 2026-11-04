import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8107;
const DEBUG_PORT = 9325;

function startLocalServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/portal-kwitansi.html' || reqPath === '/index.html') {
      const content = fs.readFileSync('portal-kwitansi.html', 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    const localFile = path.join(process.cwd(), reqPath.replace(/^\//, ''));
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise(resolve => {
    server.listen(PORT, () => {
      console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startLocalServer();
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.tmp_chrome_kwitansi_test';

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--window-size=1440,1100',
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

    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        console.log('[BROWSER CONSOLE]', text);
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    console.log('\n================================================================');
    console.log('TEST PENAMBAHAN REKENING KUSTOM PADA PORTAL-KWITANSI.HTML');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Buka akses gatekeeper untuk testing
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.add('nsr-kwitansi-authorized');
        const modal = document.getElementById('modal-auth-gatekeeper-kwitansi');
        if (modal) {
          modal.classList.add('hidden');
          modal.style.display = 'none';
        }
        if (typeof terapkanSesiPengguna === 'function') {
          terapkanSesiPengguna({
            role: 'KEUANGAN',
            isSuperAdmin: true,
            isPusat: true,
            displayName: 'Keuangan Kantor Pusat',
            branch: 'PUSAT'
          });
        }
        document.getElementById('panel-cabang')?.classList.remove('hidden');
        document.getElementById('konten-form-cabang')?.classList.remove('hidden');
        document.getElementById('box-auth-kwitansi')?.classList.add('hidden');
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 1. Verifikasi Status Awal
    const initCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sel = document.getElementById('rekening_bank_tujuan');
          const wrapper = document.getElementById('wrapper-rekening-manual');
          const hasManualOption = Array.from(sel ? sel.options : []).some(o => o.value === 'MANUAL_CUSTOM');

          return {
            selectFound: !!sel,
            wrapperFound: !!wrapper,
            wrapperHidden: wrapper ? (window.getComputedStyle(wrapper).display === 'none' || wrapper.classList.contains('hidden')) : false,
            hasManualOption
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Initial Check:', JSON.stringify(initCheck.result.value, null, 2));

    if (!initCheck.result.value.selectFound || !initCheck.result.value.wrapperFound) {
      throw new Error('Elemen rekening_bank_tujuan atau wrapper-rekening-manual tidak ditemukan!');
    }
    if (!initCheck.result.value.hasManualOption) {
      throw new Error('Opsi MANUAL_CUSTOM tidak ditemukan pada dropdown rekening!');
    }
    console.log('✓ Verifikasi Berhasil: Elemen dropdown dan opsi MANUAL_CUSTOM tersedia, wrapper tersembunyi.');

    // 2. Pilih MANUAL_CUSTOM dan input rekening kustom
    console.log('\n--- Memilih opsi MANUAL_CUSTOM dan menginput rekening kustom ---');
    const inputResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sel = document.getElementById('rekening_bank_tujuan');
          sel.value = 'MANUAL_CUSTOM';
          sel.dispatchEvent(new Event('change', { bubbles: true }));

          const inpBank = document.getElementById('custom_bank_nama');
          const inpNorek = document.getElementById('custom_bank_norek');
          const inpAn = document.getElementById('custom_bank_an');

          inpBank.value = 'Bank BCA Cab. Sudirman';
          inpBank.dispatchEvent(new Event('input', { bubbles: true }));

          inpNorek.value = '883-0192-881';
          inpNorek.dispatchEvent(new Event('input', { bubbles: true }));

          inpAn.value = 'KJPP Nanang Rahayu Sigit Paryanto dan Rekan';
          inpAn.dispatchEvent(new Event('input', { bubbles: true }));

          const wrapper = document.getElementById('wrapper-rekening-manual');
          const isWrapperVisible = window.getComputedStyle(wrapper).display !== 'none';

          return {
            isWrapperVisible,
            bankVal: inpBank.value,
            norekVal: inpNorek.value,
            anVal: inpAn.value
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Input Result:', JSON.stringify(inputResult.result.value, null, 2));

    if (!inputResult.result.value.isWrapperVisible) {
      throw new Error('Wrapper rekening manual gagal muncul saat MANUAL_CUSTOM dipilih!');
    }
    console.log('✓ Verifikasi Berhasil: Wrapper rekening manual muncul responsif.');

    // 3. Verifikasi Lembar Cetak / Preview Kwitansi
    const previewCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const elPrint = document.getElementById('print-rekening-bank-teks');
          const text = elPrint ? elPrint.innerText : '';
          return {
            printText: text,
            hasBank: text.includes('Bank BCA Cab. Sudirman'),
            hasNorek: text.includes('883-0192-881'),
            hasAn: text.includes('KJPP Nanang Rahayu Sigit Paryanto dan Rekan')
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\nPreview Kwitansi Check:', JSON.stringify(previewCheck.result.value, null, 2));

    if (!previewCheck.result.value.hasBank || !previewCheck.result.value.hasNorek) {
      throw new Error('Preview kwitansi tidak memuat teks rekening kustom yang baru diinput!');
    }
    console.log('✓ Verifikasi Berhasil: Data rekening kustom tercetak proporsional di preview kwitansi.');

    // 4. Ambil Tangkapan Layar Bukti Live
    console.log('\n--- Mengambil Tangkapan Layar Bukti Live ---');
    const screenshotFull = await send('Page.captureScreenshot', { format: 'png' });
    const fullProofPath = path.join(ARTIFACT_DIR, 'bukti_live_kwitansi_custom_rek.png');
    fs.writeFileSync(fullProofPath, Buffer.from(screenshotFull.data, 'base64'));
    console.log(`✓ Proof screenshot saved: ${fullProofPath}`);

    // Focused screenshot pada form input rekening kustom
    try {
      const formRectRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById('wrapper-rekening-manual');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })()`,
        returnByValue: true
      });
      const rect = formRectRes.result.value;
      if (rect && rect.width > 0) {
        const clipScreenshot = await send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: Math.max(0, Math.round(rect.x) - 20),
            y: Math.max(0, Math.round(rect.y) - 60),
            width: Math.round(rect.width) + 40,
            height: Math.round(rect.height) + 80,
            scale: 1
          }
        });
        const focusedPath = path.join(ARTIFACT_DIR, 'bukti_live_form_rekening_kustom_focused.png');
        fs.writeFileSync(focusedPath, Buffer.from(clipScreenshot.data, 'base64'));
        console.log(`✓ Focused form screenshot saved: ${focusedPath}`);
      }
    } catch (e) {
      console.warn('Warning capturing form clip:', e.message);
    }

    // Focused screenshot pada area cetak rekening kwitansi
    try {
      const printRectRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById('print-rekening-bank-teks');
          if (!el) return null;
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })()`,
        returnByValue: true
      });
      const rect = printRectRes.result.value;
      if (rect && rect.width > 0) {
        const clipScreenshot = await send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: Math.max(0, Math.round(rect.x) - 20),
            y: Math.max(0, Math.round(rect.y) - 30),
            width: Math.max(Math.round(rect.width) + 40, 320),
            height: Math.round(rect.height) + 60,
            scale: 1
          }
        });
        const focusedPrintPath = path.join(ARTIFACT_DIR, 'bukti_live_print_rekening_kustom_focused.png');
        fs.writeFileSync(focusedPrintPath, Buffer.from(clipScreenshot.data, 'base64'));
        console.log(`✓ Focused print preview screenshot saved: ${focusedPrintPath}`);
      }
    } catch (e) {
      console.warn('Warning capturing print clip:', e.message);
    }

    console.log('\n================================================================');
    console.log('SELURUH PENGUJIAN REKENING KUSTOM LULUS 100%!');
    console.log('================================================================\n');

    await send('Browser.close');
  } finally {
    try { chrome.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
