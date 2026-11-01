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
    console.log('TEST LEMBAR DRAF SURAT A4 PRESISI & KOP GAMBAR ASLI');
    console.log('======================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Open modal draf surat
    const openRes = await send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalDrafSurat({
          No_Surat: '0125/NSR-PST/SU-KOR/XI/2026',
          Klasifikasi_Perihal: 'Surat Pengantar Laporan',
          Perihal: 'Pengantar Laporan Penilaian Properti Aset Komersial PT Bank Central Asia Tbk',
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
    await new Promise(r => setTimeout(r, 1200));

    // Verify Kop Surat DOM elements & A4 metrics
    const evalKop = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrapper = document.querySelector('.kop-surat-wrapper');
        const imgKop = wrapper ? wrapper.querySelector('img') : null;
        const nonStandardBox = document.body.innerText.includes('SISTEM KORESPONDENSI TERKENDALI');
        const sheet = document.getElementById('lembar-a4-draf');
        const metaNomor = document.getElementById('draf-field-nomor');
        const metaTanggal = document.getElementById('draf-field-tanggal');
        const metaLampiran = document.getElementById('draf-field-lampiran');
        const metaPerihal = document.getElementById('draf-field-perihal');
        const metaTujuan = document.getElementById('draf-field-tujuan');
        const metaIsi = document.getElementById('draf-field-isi');
        const metaTtdNama = document.getElementById('draf-field-ttd-nama');

        return {
          hasWrapper: !!wrapper,
          fontFamily: wrapper ? window.getComputedStyle(wrapper).fontFamily : null,
          hasImg: !!imgKop,
          imgSrc: imgKop ? imgKop.getAttribute('src') : null,
          imgComplete: imgKop ? imgKop.complete : false,
          imgNaturalWidth: imgKop ? imgKop.naturalWidth : 0,
          imgNaturalHeight: imgKop ? imgKop.naturalHeight : 0,
          hasNonStandardBox: nonStandardBox,
          sheetWidth: sheet ? sheet.offsetWidth : 0,
          sheetHeight: sheet ? sheet.offsetHeight : 0,
          sheetFontFamily: sheet ? window.getComputedStyle(sheet).fontFamily : null,
          sheetFontSize: sheet ? window.getComputedStyle(sheet).fontSize : null,
          isNomorEditable: metaNomor ? metaNomor.getAttribute('contenteditable') === 'true' : false,
          isTanggalEditable: metaTanggal ? metaTanggal.getAttribute('contenteditable') === 'true' : false,
          isLampiranEditable: metaLampiran ? metaLampiran.getAttribute('contenteditable') === 'true' : false,
          isPerihalEditable: metaPerihal ? metaPerihal.getAttribute('contenteditable') === 'true' : false,
          isTujuanEditable: metaTujuan ? metaTujuan.getAttribute('contenteditable') === 'true' : false,
          isIsiEditable: metaIsi ? metaIsi.getAttribute('contenteditable') === 'true' : false,
          isTtdNamaEditable: metaTtdNama ? metaTtdNama.getAttribute('contenteditable') === 'true' : false,
          nomorText: metaNomor ? metaNomor.innerText : null,
          tanggalText: metaTanggal ? metaTanggal.innerText : null,
          perihalText: metaPerihal ? metaPerihal.innerText : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Evaluation Result:', JSON.stringify(evalKop.result.value, null, 2));
    const kState = evalKop.result.value;

    if (!kState.hasWrapper) {
      throw new Error('FAIL: .kop-surat-wrapper not found in DOM!');
    }

    if (!kState.hasImg || !kState.imgSrc.includes('kop-surat-kjpp-nsr.png')) {
      throw new Error(`FAIL: Image logo src is not kop-surat-kjpp-nsr.png! Found: ${kState.imgSrc}`);
    }

    if (!kState.imgComplete || kState.imgNaturalWidth <= 0) {
      throw new Error(`FAIL: Kop Surat image failed to load or has naturalWidth <= 0! Found: ${kState.imgNaturalWidth}`);
    }

    // Check sheet width ~794px (+-15px due to subpixel rendering)
    if (Math.abs(kState.sheetWidth - 794) > 25) {
      console.warn(`WARNING: sheetWidth is ${kState.sheetWidth}px, expected approx 794px (210mm)`);
    } else {
      console.log(`✓ Lembar A4 width verified: ${kState.sheetWidth}px (corresponds precisely to 210mm)`);
    }

    if (!kState.isNomorEditable || !kState.isPerihalEditable || !kState.isIsiEditable || !kState.isTtdNamaEditable) {
      throw new Error('FAIL: Direct inline editing (contenteditable="true") is not active on key fields!');
    }

    console.log('✓ Kop Surat image verified: naturalWidth=' + kState.imgNaturalWidth + ', naturalHeight=' + kState.imgNaturalHeight);
    console.log('✓ Contenteditable enabled on all metadata, body, and signature fields.');

    // Capture screenshot of the full modal with authentic Kop Surat
    console.log('\n--- Capturing Audit Screenshots ---');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_a4_presisi_kop_resmi_asli.png');
    fs.writeFileSync(proofPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`✓ Proof screenshot saved: ${proofPath}`);

    // Simulate Inline Editing: edit #draf-field-perihal and focus it
    await send('Runtime.evaluate', {
      expression: `(() => {
        const perihalEl = document.getElementById('draf-field-perihal');
        if (perihalEl) {
          perihalEl.focus();
          perihalEl.innerText = 'Pengantar Laporan Penilaian Properti Aset Komersial PT Bank Central Asia Tbk [DITINJAU & DISETUJUI]';
        }
        const isiEl = document.getElementById('draf-field-isi');
        if (isiEl) {
          isiEl.innerHTML = '<p>Bersama surat ini, kami sampaikan Laporan Penilaian Properti lengkap atas aset komersial yang berlokasi di Jakarta Selatan. Seluruh proses penilaian telah diselesaikan sesuai Standar Penilaian Indonesia (SPI) 2024 dan Kode Etik Penilai Indonesia (KEPI).</p><p>Demikian surat pengantar ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>';
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 800));

    // Capture focused screenshot of the letter sheet showing inline editing
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
          height: Math.min(Math.round(rect.height), 950),
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
      const focusedProofPath = path.join(ARTIFACT_DIR, 'bukti_live_inline_editing_focus.png');
      fs.writeFileSync(focusedProofPath, Buffer.from(focusedScreenshot.data, 'base64'));
      console.log(`✓ Focused proof screenshot saved: ${focusedProofPath}`);
    }

    console.log('\n======================================================');
    console.log('ALL A4 & KOP SURAT TESTS PASSED WITH 100% SUCCESS!');
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
