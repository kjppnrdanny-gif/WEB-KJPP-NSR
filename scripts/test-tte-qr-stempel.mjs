import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8105;
const DEBUG_PORT = 9305;

function startLocalServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/portal-surat-umum.html' || reqPath === '/index.html') {
      const content = fs.readFileSync('portal-surat-umum.html', 'utf8');
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

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
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
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n================================================================');
    console.log('TEST BLOK PENGESAHAN ELEKTRONIK RESMI (QR SEAL & STEMPEL ASLI)');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Initialize session as Pusat staff
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.clear();
        sessionStorage.setItem('nsr_auth_token', 'NSR-PST-JKT');
        sessionStorage.setItem('kjpp_token_internal', 'NSR-PST-JKT');
      })()`
    });

    // 1. Open draft modal
    const testNoSurat = '0188/NSR-PST/SU-KOR/XI/2026';
    await send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalDrafSurat({
          No_Surat: '${testNoSurat}',
          Klasifikasi_Perihal: 'Surat Pengantar Laporan',
          Perihal: 'Pengantar Laporan Penilaian Properti Aset Strategis BUMN',
          Tujuan_Penerima: 'Direksi PT Bank Mandiri (Persero) Tbk',
          Tanggal_Surat: '2026-11-02',
          Penandatangan: 'Pemimpin Rekan'
        });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Verify NO doodle / blue SVG exists in DOM
    const checkNoDoodle = await send('Runtime.evaluate', {
      expression: `(() => {
        const svgSig = document.getElementById('svg-ttd-digital');
        const allPaths = Array.from(document.querySelectorAll('svg path'));
        const hasBlueSignatureStroke = allPaths.some(p => {
          const s = window.getComputedStyle(p).stroke;
          return s && s.includes('rgb(30, 58, 138)'); // #1e3a8a
        });

        return {
          hasSvgSigElement: !!svgSig,
          hasBlueSignatureStroke: hasBlueSignatureStroke,
          manualPlaceholderVisible: !document.getElementById('placeholder-ttd-manual')?.classList.contains('hidden'),
          activeSealLayerHidden: document.getElementById('layer-ttd-digital-active')?.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });

    console.log('Check No Doodle:', JSON.stringify(checkNoDoodle.result.value, null, 2));
    const cnd = checkNoDoodle.result.value;
    if (cnd.hasSvgSigElement || cnd.hasBlueSignatureStroke) {
      throw new Error('FAIL: Elemen doodle coretan SVG biru masih ditemukan di DOM!');
    }
    console.log('✓ Verifikasi Berhasil: Seluruh coretan doodle SVG telah bersih total dari DOM.');

    // 3. Authorize with NSR8899 and activate electronic seal
    console.log('\n--- Mengotorisasi TTE & Stempel Resmi dengan NSR8899 ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const originalPrompt = window.prompt;
        window.prompt = () => 'NSR8899';
        try {
          handleToggleTtdDigital();
        } finally {
          window.prompt = originalPrompt;
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    // 4. Verify QR Code and Authentic Stamp
    const evalTte = await send('Runtime.evaluate', {
      expression: `(() => {
        const activeLayer = document.getElementById('layer-ttd-digital-active');
        const manualPlaceholder = document.getElementById('placeholder-ttd-manual');
        const qrImg = document.getElementById('qr-verifikasi-surat');
        const imgStempel = document.getElementById('img-stempel-digital');
        const labelId = document.getElementById('label-id-validasi');

        return {
          activeVisible: activeLayer ? !activeLayer.classList.contains('hidden') : false,
          manualHidden: manualPlaceholder ? manualPlaceholder.classList.contains('hidden') : false,
          qrFound: !!qrImg,
          qrSrcLength: qrImg && qrImg.src ? qrImg.src.length : 0,
          qrComplete: qrImg ? qrImg.complete : false,
          qrNaturalWidth: qrImg ? qrImg.naturalWidth : 0,
          qrNaturalHeight: qrImg ? qrImg.naturalHeight : 0,
          stempelFound: !!imgStempel,
          stempelSrc: imgStempel ? imgStempel.getAttribute('src') : null,
          stempelComplete: imgStempel ? imgStempel.complete : false,
          stempelNaturalWidth: imgStempel ? imgStempel.naturalWidth : 0,
          stempelNaturalHeight: imgStempel ? imgStempel.naturalHeight : 0,
          labelIdText: labelId ? labelId.innerText : null,
          hasKemenkeuTitle: document.body.innerText.toLowerCase().includes('ditandatangani secara elektronik'),
          hasValidatorName: document.body.innerText.includes('IR. NANANG RAHAYU, M.Ec.Dev.')
        };
      })()`,
      returnByValue: true
    });

    console.log('TTE Evaluation Result:', JSON.stringify(evalTte.result.value, null, 2));
    const tte = evalTte.result.value;

    if (!tte.activeVisible || !tte.manualHidden) {
      throw new Error('FAIL: Kotak pengesahan elektronik tidak aktif setelah otorisasi!');
    }
    if (!tte.stempelFound || tte.stempelNaturalWidth <= 0) {
      throw new Error(`FAIL: Gambar stempel resmi gagal dimuat! naturalWidth=${tte.stempelNaturalWidth}`);
    }
    if (!tte.qrFound || tte.qrSrcLength <= 10) {
      throw new Error('FAIL: QR Code verifikasi gagal ter-render (src kosong atau terlalu pendek)!');
    }
    if (tte.labelIdText !== testNoSurat) {
      throw new Error(`FAIL: ID validasi (${tte.labelIdText}) tidak cocok dengan nomor surat (${testNoSurat})!`);
    }
    if (!tte.hasKemenkeuTitle || !tte.hasValidatorName) {
      throw new Error('FAIL: Tipografi standar TTE Kemenkeu tidak lengkap di dokumen!');
    }

    console.log('✓ Verifikasi Berhasil: Kotak Pengesahan QR Code aktif (QR ter-render).');
    console.log('✓ Verifikasi Berhasil: Cap Stempel Resmi KJPP NSR ter-load (' + tte.stempelNaturalWidth + ' x ' + tte.stempelNaturalHeight + ' px).');
    console.log('✓ Verifikasi Berhasil: ID Validasi dan Identitas Pemimpin Rekan terstandar.');

    // 5. Scroll area TTD into viewport & capture live audit screenshots
    console.log('\n--- Mengambil Tangkapan Layar Live Audit ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('area-ttd-surat');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const fullShot = await send('Page.captureScreenshot', { format: 'png' });
    const fullShotPath = path.join(ARTIFACT_DIR, 'bukti_live_tte_qr_stempel_nsr8899.png');
    fs.writeFileSync(fullShotPath, Buffer.from(fullShot.data, 'base64'));
    console.log(`✓ Full proof screenshot saved: ${fullShotPath}`);

    const clipRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('area-ttd-surat');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, Math.round(rect.x - 30)),
          y: Math.max(0, Math.round(rect.y - 15)),
          width: Math.min(Math.round(rect.width + 50), 1400),
          height: Math.min(Math.round(rect.height + 30), 450),
          scale: 1
        };
      })()`,
      returnByValue: true
    });

    if (clipRes.result.value && clipRes.result.value.width > 0) {
      const focusedShot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: clipRes.result.value
      });
      const focusedPath = path.join(ARTIFACT_DIR, 'bukti_live_tte_qr_box_focused.png');
      fs.writeFileSync(focusedPath, Buffer.from(focusedShot.data, 'base64'));
      console.log(`✓ Focused proof screenshot saved: ${focusedPath}`);
    }

    console.log('\n================================================================');
    console.log('SELURUH PENGUJIAN TTE QR & STEMPEL ASLI LULUS 100%!');
    console.log('================================================================\n');

    ws.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

runTest().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
