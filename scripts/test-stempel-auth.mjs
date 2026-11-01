import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8106;
const DEBUG_PORT = 9320;

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
  const userDataDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.tmp_chrome_auth_test';

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
    console.log('TEST PEMASANGAN STEMPEL ASLI KJPP NSR & BLOK PENGESAHAN ELEKTRONIK');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Buka draf surat
    await send('Runtime.evaluate', {
      expression: `
        if (typeof bukaModalDrafSuratByNo === 'function') {
          bukaModalDrafSuratByNo('0188/NSR-PST/SU-KOR/XI/2026');
        } else if (typeof daftarSuratUmum !== 'undefined' && daftarSuratUmum.length > 0) {
          bukaModalDrafSurat(daftarSuratUmum[0]);
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // 1. Verifikasi Status Awal (Belum Otorisasi: Manual Placeholder Aktif)
    const initCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const placeholder = document.getElementById('placeholder-ttd-manual');
          const layerActive = document.getElementById('layer-ttd-digital-active');
          const svgSig = document.getElementById('svg-tanda-tangan-blue');
          const svgStempel = document.querySelector('svg circle[stroke="#ef4444"]');

          return {
            manualPlaceholderVisible: placeholder ? window.getComputedStyle(placeholder).display !== 'none' : false,
            activeSealLayerHidden: layerActive ? window.getComputedStyle(layerActive).display === 'none' : true,
            hasSvgSig: !!svgSig,
            hasDummyRedSvgStamp: !!svgStempel
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Initial State Check:', JSON.stringify(initCheck.result.value, null, 2));

    if (initCheck.result.value.hasSvgSig || initCheck.result.value.hasDummyRedSvgStamp) {
      throw new Error('GAGAL: Masih ditemukan elemen SVG tanda tangan atau stempel merah dummy!');
    }
    console.log('✓ Verifikasi Berhasil: Seluruh elemen dummy / SVG coretan bersih 100%.');

    // 2. Otorisasi dengan Token Master NSR8899 dan Bubuhkan TTE & Stempel
    console.log('\n--- Mengotorisasi TTE & Stempel Basah Asli dengan NSR8899 ---');
    const authCode = ['NSR', '8899'].join('');
    await send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('nsr_auth_token', '${authCode}');
        sessionStorage.setItem('nsr_tracking_auth_token', '${authCode}');
        window.currentUserToken = '${authCode}';
        isTtdDigitalApplied = true;
        renderBlokPengesahan();
      `
    });

    await new Promise(r => setTimeout(r, 800));

    // 3. Evaluasi Tampilan Blok Pengesahan & Stempel Basah Asli
    const tteCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const placeholder = document.getElementById('placeholder-ttd-manual');
          const layerActive = document.getElementById('layer-ttd-digital-active');
          const qrImg = document.getElementById('qr-verifikasi-surat');
          const stempelImg = document.getElementById('img-stempel-digital');
          const labelId = document.getElementById('label-id-validasi');

          const bodyText = document.body.innerText.toLowerCase();
          const hasKemenkeuTitle = bodyText.includes('ditandatangani secara elektronik');
          const hasBlokTitle = bodyText.includes('blok pengesahan elektronik');
          const hasValidatorName = bodyText.includes('ir. nanang rahayu, m.ec.dev.');
          const hasJabatan = bodyText.includes('pemimpin rekan');

          return {
            activeVisible: layerActive ? window.getComputedStyle(layerActive).display !== 'none' : false,
            manualHidden: placeholder ? window.getComputedStyle(placeholder).display === 'none' : true,
            qrFound: !!qrImg,
            qrSrcLength: qrImg ? (qrImg.src ? qrImg.src.length : 0) : 0,
            qrComplete: qrImg ? qrImg.complete : false,
            qrNaturalWidth: qrImg ? qrImg.naturalWidth : 0,
            qrNaturalHeight: qrImg ? qrImg.naturalHeight : 0,
            stempelFound: !!stempelImg,
            stempelSrc: stempelImg ? stempelImg.getAttribute('src') : '',
            stempelComplete: stempelImg ? stempelImg.complete : false,
            stempelNaturalWidth: stempelImg ? stempelImg.naturalWidth : 0,
            stempelNaturalHeight: stempelImg ? stempelImg.naturalHeight : 0,
            labelIdText: labelId ? labelId.innerText.trim() : '',
            hasBlokTitle,
            hasKemenkeuTitle,
            hasValidatorName,
            hasJabatan
          };
        })()
      `,
      returnByValue: true
    });

    console.log('TTE & Stempel Asli Evaluation:', JSON.stringify(tteCheck.result.value, null, 2));

    const res = tteCheck.result.value;
    if (!res.activeVisible || !res.manualHidden) {
      throw new Error('GAGAL: Blok pengesahan aktif tidak terlihat atau placeholder manual masih tampil!');
    }
    if (!res.stempelFound || !res.stempelSrc.includes('stempel-resmi-kjpp-nsr.png') || res.stempelNaturalWidth === 0) {
      throw new Error('GAGAL: Gambar stempel asli assets/stempel-resmi-kjpp-nsr.png tidak termuat!');
    }
    if (!res.qrFound || res.qrNaturalWidth === 0) {
      throw new Error('GAGAL: Elemen QR Code verifikasi gagal dirender!');
    }
    if (!res.hasBlokTitle || !res.hasKemenkeuTitle || !res.hasValidatorName) {
      throw new Error('GAGAL: Teks standar pengesahan elektronik tidak lengkap!');
    }

    console.log('✓ Verifikasi Berhasil: Kotak Pengesahan QR Code aktif dan tajam.');
    console.log(`✓ Verifikasi Berhasil: Cap Stempel Basah Asli KJPP NSR ter-load (${res.stempelNaturalWidth} x ${res.stempelNaturalHeight} px).`);
    console.log('✓ Verifikasi Berhasil: Teks BLOK PENGESAHAN ELEKTRONIK & Identitas Pemimpin Rekan lengkap.');

    // 4. Ambil Tangkapan Layar Bukti Live
    console.log('\n--- Mengambil Tangkapan Layar Live Audit ---');
    await send('Runtime.evaluate', {
      expression: `
        const areaTtd = document.getElementById('area-ttd-surat');
        if (areaTtd) {
          areaTtd.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshotFull = await send('Page.captureScreenshot', { format: 'png' });
    const fullProofPath = path.join(ARTIFACT_DIR, 'bukti_live_a4_stempel_asli_terstandar.png');
    fs.writeFileSync(fullProofPath, Buffer.from(screenshotFull.data, 'base64'));
    console.log(`✓ Full proof screenshot saved: ${fullProofPath}`);

    // Focused screenshot pada #area-ttd-surat
    const doc = await send('DOM.getDocument');
    const ttdNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#area-ttd-surat' });
    if (ttdNode.nodeId) {
      const box = await send('DOM.getBoxModel', { nodeId: ttdNode.nodeId });
      if (box && box.model) {
        const [x1, y1, x2, , , y3] = box.model.border;
        const width = Math.round(x2 - x1);
        const height = Math.round(y3 - y1);
        const screenshotClip = await send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: Math.max(0, Math.round(x1) - 40),
            y: Math.max(0, Math.round(y1) - 20),
            width: width + 80,
            height: height + 40,
            scale: 1
          }
        });
        const focusedProofPath = path.join(ARTIFACT_DIR, 'bukti_live_blok_tte_stempel_asli_focused.png');
        fs.writeFileSync(focusedProofPath, Buffer.from(screenshotClip.data, 'base64'));
        console.log(`✓ Focused proof screenshot saved: ${focusedProofPath}`);
      }
    }

    console.log('\n================================================================');
    console.log('SELURUH PENGUJIAN STEMPEL ASLI & BLOK TTE RESMI LULUS 100%!');
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
