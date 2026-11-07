import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const PORT = 8899;
const DEBUG_PORT = 9569;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  if (req.url.includes('job-tracking-handler.php')) {
    // Serve actual staging data so globalJobs is loaded authentically
    const stagingPath = path.join(process.cwd(), 'data', 'job_tracking_staging.json');
    if (fs.existsSync(stagingPath)) {
      const stagingObj = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));
      const arr = Object.values(stagingObj);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ status: 'success', data: arr }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'success', data: [] }));
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/portal-tracking.html';
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

async function main() {
  console.log('=================================================================');
  console.log('   VERIFIKASI TAMPILAN RESMI: KOP SURAT M-03 MODAL CETAK (CDP)');
  console.log('=================================================================\n');

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`1. Server HTTP lokal aktif di http://localhost:${PORT}`);

  const userDataDir = path.join(process.cwd(), '.tmp_chrome_m03_kop_final');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,1400',
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
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    async function evaluate(expression, awaitPromise = false) {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise,
        returnByValue: true
      });
      if (res.result?.exceptionDetails) {
        console.error('EVAL EXCEPTION:', JSON.stringify(res.result.exceptionDetails));
      }
      return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log(`2. Navigasi ke http://127.0.0.1:${PORT}/portal-tracking.html ...`);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/portal-tracking.html` });
    await new Promise(r => {
      const timer = setTimeout(r, 6000);
      const prevHandler = ws.onmessage;
      ws.onmessage = (event) => {
        prevHandler(event);
        const m = JSON.parse(event.data);
        if (m.method === 'Page.loadEventFired') {
          clearTimeout(timer);
          r();
        }
      };
    });
    await new Promise(r => setTimeout(r, 1200));

    console.log('3. Inisialisasi Sesi & Buka Modal Cetak Surat Tugas M-03...');
    const domCheck = await evaluate(`(async () => {
      window.alert = function(msg) { console.log('ALERT:', msg); };

      sessionStorage.setItem('nsr_tracking_auth_token', '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f');
      sessionStorage.setItem('nsr_active_user_nik', 'NSR-2019-005');
      sessionStorage.setItem('nsr_active_user_name', 'Danny Taufik Hidayat, S.H.');
      sessionStorage.setItem('nsr_active_user_role', 'PIMPINAN');
      sessionStorage.setItem('nsr_active_user_jabatan', 'Pemimpin Rekan');

      if (typeof window.initUserSession === 'function') {
        window.initUserSession();
      }

      // Tunggu muat data jika belum
      if (typeof window.muatDataTaskBoard === 'function') {
        await window.muatDataTaskBoard();
      }

      // Pilih job pertama yang ada
      const targetJob = (typeof globalJobs !== 'undefined' && globalJobs.length > 0) ? globalJobs[0] : null;
      const joId = targetJob ? (targetJob.jo_number || targetJob.id_jo || targetJob.id) : null;

      if (joId) {
        window.bukaModalCetakSuratTugas(joId, 'all');
      }

      const modal = document.getElementById('modal-cetak-surat-tugas');
      const imgKopL1 = document.querySelector('#lembar-surat-tugas .header-kop-surat img');
      const imgKopL2 = document.querySelector('#lembar-tanda-terima .header-kop-surat img');
      const footerL1 = document.querySelector('#lembar-surat-tugas .mt-4.pt-2.border-t');
      const footerL2 = document.querySelector('#lembar-tanda-terima .mt-4.pt-2.border-t');

      return {
        targetJo: joId,
        modalVisible: modal ? !modal.classList.contains('hidden') : false,
        l1KopSrc: imgKopL1 ? imgKopL1.getAttribute('src') : null,
        l1KopComplete: imgKopL1 ? imgKopL1.complete : false,
        l1KopNaturalWidth: imgKopL1 ? imgKopL1.naturalWidth : 0,
        l2KopSrc: imgKopL2 ? imgKopL2.getAttribute('src') : null,
        l2KopComplete: imgKopL2 ? imgKopL2.complete : false,
        l2KopNaturalWidth: imgKopL2 ? imgKopL2.naturalWidth : 0,
        hasL1Footer: !!footerL1,
        hasL2Footer: !!footerL2,
        l1FooterText: footerL1 ? footerL1.innerText.trim().replace(/\\s+/g, ' ') : null,
        l2FooterText: footerL2 ? footerL2.innerText.trim().replace(/\\s+/g, ' ') : null
      };
    })()`, true);

    console.log('Status DOM Pratinjau Modal Cetak:', domCheck);

    if (!domCheck.modalVisible) {
      throw new Error('Modal cetak surat tugas tidak terlihat!');
    }
    if (domCheck.l1KopSrc !== 'assets/img/kop-surat-nsr.png') {
      throw new Error(`Kop Lembar 1 src tidak sesuai (aktual: ${domCheck.l1KopSrc})`);
    }
    if (domCheck.l2KopSrc !== 'assets/img/kop-surat-nsr.png') {
      throw new Error(`Kop Lembar 2 src tidak sesuai (aktual: ${domCheck.l2KopSrc})`);
    }
    if (!domCheck.hasL1Footer) {
      throw new Error('Footer legalitas Lembar 1 tidak ditemukan!');
    }
    if (!domCheck.hasL2Footer) {
      throw new Error('Footer legalitas Lembar 2 tidak ditemukan!');
    }

    console.log('  ✅ PASS: Modal M-03 Terbuka dengan Kop Surat Resmi Baku KJPP NSR!');
    console.log('  ✅ PASS: Lembar 1 Kop Image:', domCheck.l1KopSrc, `(naturalWidth: ${domCheck.l1KopNaturalWidth}px)`);
    console.log('  ✅ PASS: Lembar 2 Kop Image:', domCheck.l2KopSrc, `(naturalWidth: ${domCheck.l2KopNaturalWidth}px)`);
    console.log('  ✅ PASS: Footer Legalitas Lembar 1:', domCheck.l1FooterText);
    console.log('  ✅ PASS: Footer Legalitas Lembar 2:', domCheck.l2FooterText);

    await new Promise(r => setTimeout(r, 1000));

    // Capture Screenshot Halaman 1 (Surat Tugas)
    console.log('\n4. Mengambil tangkapan layar Lembar 1: Surat Tugas...');
    await evaluate(`window.setModeCetakSuratTugas('surat_tugas');`);
    await new Promise(r => setTimeout(r, 500));

    const snapL1 = await send('Page.captureScreenshot', { format: 'png' });
    const snapL1Path = path.join(ARTIFACT_DIR, 'bukti_m03_surat_tugas_kop.png');
    fs.writeFileSync(snapL1Path, Buffer.from(snapL1.result.data, 'base64'));
    console.log(`  📸 Tangkapan Layar Lembar 1 tersimpan: ${snapL1Path}`);

    // Capture Screenshot Halaman 2 (Berita Acara Inspeksi Fisik & Tanda Terima Lapangan)
    console.log('\n5. Mengambil tangkapan layar Lembar 2: Berita Acara Inspeksi (BAI)...');
    await evaluate(`window.setModeCetakSuratTugas('tanda_terima');`);
    await new Promise(r => setTimeout(r, 500));

    const snapL2 = await send('Page.captureScreenshot', { format: 'png' });
    const snapL2Path = path.join(ARTIFACT_DIR, 'bukti_m03_bai_kop.png');
    fs.writeFileSync(snapL2Path, Buffer.from(snapL2.result.data, 'base64'));
    console.log(`  📸 Tangkapan Layar Lembar 2 tersimpan: ${snapL2Path}`);

    // Restore to All mode and capture overall view
    console.log('\n6. Mengambil tangkapan layar Pratinjau Keseluruhan (Mode Cetak Semua)...');
    await evaluate(`window.setModeCetakSuratTugas('all');`);
    await new Promise(r => setTimeout(r, 500));

    const snapAll = await send('Page.captureScreenshot', { format: 'png' });
    const snapAllPath = path.join(ARTIFACT_DIR, 'bukti_m03_modal_cetak_all.png');
    fs.writeFileSync(snapAllPath, Buffer.from(snapAll.result.data, 'base64'));
    console.log(`  📸 Tangkapan Layar Pratinjau Lengkap tersimpan: ${snapAllPath}`);

    console.log('\n=================================================================');
    console.log('   SEMUA VERIFIKASI KOP SURAT M-03 SELESAI & SUKSES (100%)!');
    console.log('=================================================================');

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error('ERROR in verify-kop-surat-m03:', err);
  process.exit(1);
});
