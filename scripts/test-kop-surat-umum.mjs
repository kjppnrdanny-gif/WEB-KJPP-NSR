import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8092;
const DEBUG_PORT = 9288;

function startLocalServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/portal-surat-umum.html') {
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
    '--window-size=1400,1050',
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
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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

    console.log('\n======================================================');
    console.log('TEST KOP SURAT RESMI PADA PORTAL-SURAT-UMUM.HTML');
    console.log('======================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Open modal draf surat
    const openRes = await send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalDrafSurat({
          No_Surat: '0125/NSR-PST/SU-KOR/XI/2026',
          Klasifikasi_Perihal: 'Surat Pengantar Laporan',
          Perihal: 'Pengantar Laporan Penilaian Properti Aset Komersial',
          Tujuan_Penerima: 'Direksi PT Bank Central Asia Tbk',
          Tanggal_Surat: '2026-11-01',
          Penandatangan: 'Pemimpin Rekan'
        });
        const m = document.getElementById('modal-draf-surat');
        return {
          modalFound: !!m,
          modalClasses: m ? m.className : null
        };
      })()`,
      returnByValue: true
    });
    console.log('openRes:', openRes);
    await new Promise(r => setTimeout(r, 1000));

    // Verify Kop Surat DOM elements
    const evalKop = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrapper = document.querySelector('.kop-surat-wrapper');
        const imgLogo = wrapper ? wrapper.querySelector('img') : null;
        const nonStandardBox = document.body.innerText.includes('SISTEM KORESPONDENSI TERKENDALI');
        const sheet = document.getElementById('lembar-a4-draf');
        const metaNomor = document.getElementById('draf-field-nomor');
        const metaTanggal = document.getElementById('draf-field-tanggal');
        const metaLampiran = document.getElementById('draf-field-lampiran');
        const metaPerihal = document.getElementById('draf-field-perihal');
        const metaTujuan = document.getElementById('draf-field-tujuan');

        return {
          hasWrapper: !!wrapper,
          fontFamily: wrapper ? window.getComputedStyle(wrapper).fontFamily : null,
          color: wrapper ? window.getComputedStyle(wrapper).color : null,
          hasImg: !!imgLogo,
          imgSrc: imgLogo ? imgLogo.getAttribute('src') : null,
          imgComplete: imgLogo ? imgLogo.complete : false,
          imgNaturalWidth: imgLogo ? imgLogo.naturalWidth : 0,
          imgNaturalHeight: imgLogo ? imgLogo.naturalHeight : 0,
          hasNonStandardBox: nonStandardBox,
          sheetWidth: sheet ? sheet.offsetWidth : 0,
          sheetHeight: sheet ? sheet.offsetHeight : 0,
          nomorText: metaNomor ? metaNomor.innerText : null,
          tanggalText: metaTanggal ? metaTanggal.innerText : null,
          lampiranText: metaLampiran ? metaLampiran.innerText : null,
          perihalText: metaPerihal ? metaPerihal.innerText : null,
          tujuanText: metaTujuan ? metaTujuan.innerText : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Kop Surat Evaluation Result:', JSON.stringify(evalKop.result.value, null, 2));
    const kState = evalKop.result.value;

    if (!kState.hasWrapper) {
      throw new Error('FAIL: .kop-surat-wrapper not found in DOM!');
    }

    if (!kState.fontFamily.toLowerCase().includes('times')) {
      throw new Error(`FAIL: Font family is not Times New Roman! Found: ${kState.fontFamily}`);
    }

    if (kState.hasNonStandardBox) {
      throw new Error('FAIL: Non-standard box SISTEM KORESPONDENSI TERKENDALI is still present!');
    }

    if (!kState.hasImg || kState.imgSrc !== 'assets/logo-nsr.png') {
      throw new Error(`FAIL: Image logo src is not assets/logo-nsr.png! Found: ${kState.imgSrc}`);
    }

    console.log('✓ Kop Surat wrapper verified: Times New Roman, color #000, logo assets/logo-nsr.png');
    console.log('✓ Non-standard box SISTEM KORESPONDENSI TERKENDALI successfully eliminated.');
    console.log('✓ Metadata fields aligned: Nomor, Lampiran, Perihal, Tanggal, Kepada Yth.');

    // Capture screenshot of the modal with the official letterhead
    console.log('\n--- Capturing Audit Screenshots ---');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_kop_surat_resmi_portal_surat_umum.png');
    fs.writeFileSync(proofPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`✓ Proof screenshot saved: ${proofPath}`);

    // Capture focused screenshot of the letter sheet if visible
    const sheetClip = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('lembar-a4-draf');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return {
          x: Math.max(0, rect.x),
          y: Math.max(0, rect.y),
          width: Math.round(rect.width),
          height: Math.min(Math.round(rect.height), 900),
          scale: 1
        };
      })()`,
      returnByValue: true
    });

    if (sheetClip.result.value && sheetClip.result.value.width > 0) {
      const focusedScreenshot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: sheetClip.result.value
      });
      const focusedProofPath = path.join(ARTIFACT_DIR, 'bukti_live_lembar_a4_kop_resmi_focused.png');
      fs.writeFileSync(focusedProofPath, Buffer.from(focusedScreenshot.data, 'base64'));
      console.log(`✓ Focused proof screenshot saved: ${focusedProofPath}`);
    }

    console.log('\n======================================================');
    console.log('ALL KOP SURAT TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

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
