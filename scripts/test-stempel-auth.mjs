import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8098;
const DEBUG_PORT = 9295;

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
    console.log('TEST OTORISASI BLOK PENGESAHAN DIGITAL & CAP STEMPEL NSR8899');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Initialize session as authorized Pusat staff (NSR-PST-JKT), but NOT Master Signer NSR8899
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.clear();
        sessionStorage.setItem('nsr_auth_token', 'NSR-PST-JKT');
        sessionStorage.setItem('kjpp_token_internal', 'NSR-PST-JKT');
        delete window.currentUserToken;
      })()`
    });

    // ================================================================
    // UJI 1: Buka pratinjau draf surat dalam kondisi bersih
    // ================================================================
    console.log('\n--- UJI 1: Status Awal Bersih (Mode Manual Default) ---');
    const uji1Res = await send('Runtime.evaluate', {
      expression: `(() => {
        bukaModalDrafSurat({
          No_Surat: '0150/NSR-PST/SU-KOR/XI/2026',
          Klasifikasi_Perihal: 'Surat Pengantar Laporan',
          Perihal: 'Pengantar Laporan Penilaian Properti Komersial',
          Tujuan_Penerima: 'Direksi PT Bank Central Asia Tbk',
          Tanggal_Surat: '2026-11-02',
          Penandatangan: 'Pemimpin Rekan'
        });

        const manualPlaceholder = document.getElementById('placeholder-ttd-manual');
        const activeBlock = document.getElementById('layer-ttd-digital-active');
        const btnToggle = document.getElementById('btn-toggle-ttd-digital');
        const labelBtn = document.getElementById('label-btn-ttd');

        return {
          manualVisible: manualPlaceholder ? !manualPlaceholder.classList.contains('hidden') : false,
          activeHidden: activeBlock ? activeBlock.classList.contains('hidden') : false,
          btnFound: !!btnToggle,
          btnLabel: labelBtn ? labelBtn.innerText.trim() : null,
          isAuthorized: isMasterSignerAuthorized()
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Uji 1:', JSON.stringify(uji1Res.result.value, null, 2));
    const u1 = uji1Res.result.value;

    if (!u1.manualVisible) throw new Error('FAIL Uji 1: Placeholder TTD manual harus terlihat pada kondisi awal!');
    if (!u1.activeHidden) throw new Error('FAIL Uji 1: Layer TTD digital harus tersembunyi pada kondisi awal!');
    if (!u1.btnFound) throw new Error('FAIL Uji 1: Tombol #btn-toggle-ttd-digital tidak ditemukan di toolbar!');
    if (u1.isAuthorized) throw new Error('FAIL Uji 1: isMasterSignerAuthorized harus false pada kondisi bersih!');
    console.log('✓ Uji 1 LULUS: Mode manual default aktif, tombol bubuhkan TTD siap beroperasi.');

    // ================================================================
    // UJI 2: Otorisasi Ditolak saat input Token Salah ('NSR-VAL-2026')
    // ================================================================
    console.log('\n--- UJI 2: Uji Token Salah (Akses Ditolak) ---');
    const uji2Res = await send('Runtime.evaluate', {
      expression: `(() => {
        let alertMessage = null;
        const originalPrompt = window.prompt;
        const originalAlert = window.alert;

        // Mock prompt to return wrong token
        window.prompt = () => 'NSR-VAL-2026';
        window.alert = (msg) => { alertMessage = msg; };

        try {
          handleToggleTtdDigital();
        } finally {
          window.prompt = originalPrompt;
          window.alert = originalAlert;
        }

        const manualPlaceholder = document.getElementById('placeholder-ttd-manual');
        const activeBlock = document.getElementById('layer-ttd-digital-active');
        const labelBtn = document.getElementById('label-btn-ttd');

        return {
          alertMessage,
          manualStillVisible: manualPlaceholder ? !manualPlaceholder.classList.contains('hidden') : false,
          activeStillHidden: activeBlock ? activeBlock.classList.contains('hidden') : false,
          btnLabel: labelBtn ? labelBtn.innerText.trim() : null,
          sessionAuthToken: sessionStorage.getItem('nsr_auth_token')
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Uji 2:', JSON.stringify(uji2Res.result.value, null, 2));
    const u2 = uji2Res.result.value;

    if (!u2.alertMessage || !u2.alertMessage.includes('Akses Ditolak')) {
      throw new Error(`FAIL Uji 2: Pesan penolakan akses tidak muncul! Got: ${u2.alertMessage}`);
    }
    if (!u2.manualStillVisible || !u2.activeStillHidden) {
      throw new Error('FAIL Uji 2: TTD atau Stempel bocor saat token salah!');
    }
    if (u2.sessionAuthToken === 'NSR8899') {
      throw new Error('FAIL Uji 2: Token NSR8899 tersimpan secara tidak sah!');
    }
    console.log('✓ Uji 2 LULUS: Token salah ditolak tegas, TTD dan Stempel tetap terkunci.');

    // ================================================================
    // UJI 3: Otorisasi Berhasil dengan Token Master 'NSR8899'
    // ================================================================
    console.log('\n--- UJI 3: Otorisasi Berhasil dengan Kunci Master NSR8899 ---');
    const uji3Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const originalPrompt = window.prompt;
        window.prompt = () => 'NSR8899';

        try {
          handleToggleTtdDigital();
        } finally {
          window.prompt = originalPrompt;
        }

        const manualPlaceholder = document.getElementById('placeholder-ttd-manual');
        const activeBlock = document.getElementById('layer-ttd-digital-active');
        const imgStempel = document.getElementById('img-stempel-digital');
        const svgTtd = document.getElementById('svg-ttd-digital');
        const labelBtn = document.getElementById('label-btn-ttd');

        return {
          manualHidden: manualPlaceholder ? manualPlaceholder.classList.contains('hidden') : false,
          activeVisible: activeBlock ? !activeBlock.classList.contains('hidden') : false,
          btnLabel: labelBtn ? labelBtn.innerText.trim() : null,
          hasImgStempel: !!imgStempel,
          stempelSrc: imgStempel ? imgStempel.getAttribute('src') : null,
          stempelComplete: imgStempel ? imgStempel.complete : false,
          stempelNaturalWidth: imgStempel ? imgStempel.naturalWidth : 0,
          stempelNaturalHeight: imgStempel ? imgStempel.naturalHeight : 0,
          hasSvgTtd: !!svgTtd,
          svgStroke: svgTtd ? svgTtd.getAttribute('stroke') : null,
          sessionAuthToken: sessionStorage.getItem('nsr_auth_token')
        };
      })()`,
      returnByValue: true
    });

    console.log('Hasil Uji 3:', JSON.stringify(uji3Res.result.value, null, 2));
    const u3 = uji3Res.result.value;

    if (!u3.manualHidden || !u3.activeVisible) {
      throw new Error('FAIL Uji 3: Layer TTD Digital dan Stempel tidak aktif setelah token NSR8899 dimasukkan!');
    }
    if (!u3.btnLabel.includes('Lepas TTD')) {
      throw new Error(`FAIL Uji 3: Label tombol tidak berubah ke toggle lepas! Got: ${u3.btnLabel}`);
    }
    if (!u3.hasImgStempel || u3.stempelNaturalWidth <= 0) {
      throw new Error(`FAIL Uji 3: Gambar stempel resmi gagal dimuat! naturalWidth=${u3.stempelNaturalWidth}`);
    }
    if (!u3.hasSvgTtd || u3.svgStroke !== '#1e3a8a') {
      throw new Error(`FAIL Uji 3: Vektor SVG TTD tidak berkarakter tinta biru tua (#1e3a8a)! Got: ${u3.svgStroke}`);
    }
    console.log('✓ Uji 3 LULUS: Pembubuhan TTD digital & Stempel resmi transparan aktif sempurna (naturalWidth=' + u3.stempelNaturalWidth + 'px).');

    // ================================================================
    // UJI 4: Tangkapan Layar Live Audit Bukti (Scroll to Signature)
    // ================================================================
    console.log('\n--- UJI 4: Mengambil Tangkapan Layar Live Audit ---');
    
    // Scroll area TTD into visible viewport inside the modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('area-ttd-surat');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const fullShot = await send('Page.captureScreenshot', { format: 'png' });
    const fullShotPath = path.join(ARTIFACT_DIR, 'bukti_live_stempel_ttd_digital_nsr8899.png');
    fs.writeFileSync(fullShotPath, Buffer.from(fullShot.data, 'base64'));
    console.log(`✓ Scrolled proof screenshot saved: ${fullShotPath}`);

    // Capture focused screenshot of the signature block area
    const clipRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('area-ttd-surat');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, Math.round(rect.x - 20)),
          y: Math.max(0, Math.round(rect.y - 10)),
          width: Math.min(Math.round(rect.width + 40), 1400),
          height: Math.min(Math.round(rect.height + 20), 400),
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
      const focusedPath = path.join(ARTIFACT_DIR, 'bukti_live_blok_pengesahan_focused.png');
      fs.writeFileSync(focusedPath, Buffer.from(focusedShot.data, 'base64'));
      console.log(`✓ Focused proof screenshot saved: ${focusedPath}`);
    }

    console.log('\n================================================================');
    console.log('SELURUH PENGUJIAN OTORISASI BLOK PENGESAHAN LULUS 100%!');
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
