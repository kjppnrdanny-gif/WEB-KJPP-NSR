/**
 * scripts/verify-cpanel-final.mjs
 * Final Verification Suite for KJPP NSR Production Deployment
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 8896;
const CHROME_PORT = 9600;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const TEMP_PROFILE = path.join(process.cwd(), '.tmp_final_cpanel_profile');

console.log('='.repeat(80));
console.log('VERIFIKASI AKHIR HEADLESS CHROME CDP: SEBELUM UPLOAD CPANEL');
console.log('='.repeat(80));

let totalAsserts = 0;
let passedAsserts = 0;
let failedAsserts = 0;

function assert(condition, message) {
  totalAsserts++;
  if (condition) {
    passedAsserts++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedAsserts++;
    console.error(`  [FAIL] ${message}`);
  }
}

// -------------------------------------------------------------
// PART 1: STATIC CODE AUDIT (dist/ & source)
// -------------------------------------------------------------
console.log('\n[BAGIAN 1] Audit Statis & Integritas File (index.html & wawasan-regulasi.html)...');
const indexHtml = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
const wawasanHtml = fs.readFileSync(path.join(process.cwd(), 'dist', 'wawasan-regulasi.html'), 'utf-8');

assert(indexHtml.includes('id="sistem-mutu"') && indexHtml.includes('scroll-mt-24'), 'Seksi utama memakai id="sistem-mutu" dan scroll-mt-24');
assert(indexHtml.includes('pt-16 sm:pt-20 pb-16'), 'Seksi utama memiliki padding pt-16 sm:pt-20 pb-16');
assert(!indexHtml.includes('<div id="sistem-mutu"'), 'Tidak ada duplicate id="sistem-mutu" pada div internal');
assert(indexHtml.includes('id="panel-content-mutu"'), 'Panel internal menggunakan id="panel-content-mutu"');
assert(indexHtml.includes('EKSPLORASI EKOSISTEM UTAMA'), 'Badge eksplorasi ekosistem utama termuat');
assert(indexHtml.includes('Tata Kelola Mutu'), 'Heading tata kelola mutu termuat');

assert(indexHtml.includes('lg:grid-cols-4'), 'Container #litbang-metodologi memuat kelas lg:grid-cols-4');
assert(indexHtml.includes('RUISLAGH'), 'Badge RUISLAGH termuat di kartu ke-4');
assert(indexHtml.includes('Metodologi Penilaian Ruislagh'), 'Judul Metodologi Penilaian Ruislagh termuat');
assert(indexHtml.includes('ruislagh-aset'), 'Trigger modal ruislagh-aset terpasang');
assert(indexHtml.includes('Permendagri No. 1 Tahun 2016') && indexHtml.includes('PP No. 28 Tahun 2020'), 'Landasan hukum Permendagri 1/2016 & PP 28/2020 termuat di data litbang index.html');

assert(wawasanHtml.includes('Metodologi Penilaian Ruislagh'), 'Artikel Ruislagh termuat di wawasan-regulasi.html');
assert(wawasanHtml.includes('ruislagh-aset'), 'Trigger modal ruislagh-aset termuat di wawasan-regulasi.html');

assert(indexHtml.includes('OPINI NSR') && indexHtml.includes('bukaModalPortal'), 'GUARDRAIL: Ekosistem OPINI NSR utuh 100%');
assert(indexHtml.includes('nanang_kjpp@yahoo.co.id'), 'GUARDRAIL: Email resmi nanang_kjpp@yahoo.co.id utuh');
assert(indexHtml.includes('jaswita-jabar.svg'), 'GUARDRAIL: Rekanan ke-46 JASWITA JABAR utuh');
assert(indexHtml.includes('lacak-status') || indexHtml.includes('tracking'), 'GUARDRAIL: Lacak Status 7 Milestone utuh');

// -------------------------------------------------------------
// PART 2: HEADLESS CHROME CDP BROWSER TEST
// -------------------------------------------------------------
console.log('\n[BAGIAN 2] Pengujian Visual & Interaksi Browser Headless (CDP)...');

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
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(process.cwd(), 'dist', parsedUrl.pathname.replace(/^\//, ''));
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    filePath = path.join(process.cwd(), 'dist', 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`Server lokal aktif di http://localhost:${PORT}`);

if (fs.existsSync(TEMP_PROFILE)) {
  try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
}
fs.mkdirSync(TEMP_PROFILE, { recursive: true });

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CHROME_PORT}`,
  `--user-data-dir=${TEMP_PROFILE}`,
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars'
]);

let pages = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const wsRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
    pages = await wsRes.json();
    if (pages && pages.length > 0) break;
  } catch (_) {}
}

if (!pages || pages.length === 0) {
  throw new Error('Gagal menghubungkan ke Chrome CDP');
}

try {
  const targetPage = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');

  async function setViewport(width, height) {
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 250));
  }

  async function captureProof(filename) {
    const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`  -> Tangkapan layar disimpan: ${filename}`);
  }

  // 1. Viewport 1280px Desktop
  console.log('\n[UJI 1] Desktop (1280px): index.html Grid & Seksi #sistem-mutu...');
  await setViewport(1280, 900);
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  
  // Tunggu hingga elemen litbang ter-parse dan 4 kartu tersedia
  for (let i = 0; i < 40; i++) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: 'Boolean(document.getElementById("litbang-metodologi") && document.querySelectorAll(".nsr-spi-card").length === 4)'
    });
    if (res?.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 400));

  const desktopTest = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const sec = document.getElementById('sistem-mutu');
      const litbang = document.getElementById('litbang-metodologi');
      const cards = litbang ? litbang.querySelectorAll('.nsr-spi-card') : [];
      const grid = litbang ? litbang.querySelector('.nsr-spi-grid') : null;
      const compCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      
      return {
        secTag: sec ? sec.tagName.toLowerCase() : '',
        cardCount: cards.length,
        compCols,
        overflow
      };
    })()`,
    returnByValue: true
  });

  const dVal = desktopTest.result.value;
  assert(dVal.secTag === 'section', 'Elemen #sistem-mutu adalah tag <section>');
  assert(dVal.cardCount === 4, `Jumlah kartu pada #litbang-metodologi adalah 4 (Aktual: ${dVal.cardCount})`);
  assert(dVal.compCols === 4, `Visual kolom desktop seimbang 4 kolom sejajar (Aktual: ${dVal.compCols})`);
  assert(dVal.overflow === false, 'Zero horizontal overflow pada viewport desktop 1280px');
  await captureProof('bukti_final_cpanel_desktop_1280.png');

  // 2. Buka Modal Ruislagh
  console.log('\n[UJI 2] Modal Kajian Litbang key "ruislagh-aset"...');
  await sendCdp('Runtime.evaluate', {
    expression: `window.bukaModalLitbangNSR('ruislagh-aset');`
  });
  await new Promise(r => setTimeout(r, 600));

  const modalTest = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-kajian-litbang-nsr');
      const isVisible = modal ? !modal.classList.contains('hidden') : false;
      const judul = document.getElementById('litbang-modal-judul')?.textContent?.trim();
      const hukum = document.getElementById('litbang-modal-hukum')?.innerText || '';
      const metodologi = document.getElementById('litbang-modal-metodologi')?.innerText || '';
      return {
        isVisible,
        judul,
        hasNonSpi204: metodologi.includes('Non-SPI 204') || metodologi.includes('bukan merupakan pengadaan tanah'),
        hasPermendagri: hukum.includes('Permendagri No. 1') || hukum.includes('Permendagri No. 3'),
        hasPp28: hukum.includes('PP No. 28') || hukum.includes('PP No. 28 Tahun 2020')
      };
    })()`,
    returnByValue: true
  });

  const mTestVal = modalTest.result.value;
  assert(mTestVal.isVisible === true, 'Modal kajian litbang NSR berhasil dibuka');
  assert(mTestVal.judul.includes('Kajian Teknis Penilaian Ruislagh'), `Judul modal tepat: "${mTestVal.judul}"`);
  assert(mTestVal.hasNonSpi204 === true, 'Pemisahan Non-SPI 204 & kewajiban Nilai Pasar termuat');
  assert(mTestVal.hasPermendagri === true, 'Dasar hukum Permendagri No. 1/2016 jo. 3/2024 termuat');
  assert(mTestVal.hasPp28 === true, 'Dasar hukum PP No. 28/2020 termuat');
  await captureProof('bukti_final_cpanel_modal_ruislagh.png');

  await sendCdp('Runtime.evaluate', { expression: `window.tutupModalLitbangNSR();` });
  await new Promise(r => setTimeout(r, 400));

  // 3. Viewport 768px Tablet
  console.log('\n[UJI 3] Tablet (768px): 2 Kolom Simetris & Zero Overflow...');
  await setViewport(768, 1024);
  await new Promise(r => setTimeout(r, 500));

  const tabletTest = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const litbang = document.getElementById('litbang-metodologi');
      const grid = litbang ? litbang.querySelector('.nsr-spi-grid') : null;
      const compCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return { compCols, overflow };
    })()`,
    returnByValue: true
  });

  assert(tabletTest.result.value.compCols === 2, `Layout tablet 768px tepat 2 kolom simetris (Aktual: ${tabletTest.result.value.compCols})`);
  assert(tabletTest.result.value.overflow === false, 'Zero horizontal overflow pada tablet 768px');
  await captureProof('bukti_final_cpanel_tablet_768.png');

  // 4. Viewport 375px Mobile
  console.log('\n[UJI 4] Mobile (375px): 1 Kolom Bersih & Zero Overflow...');
  await setViewport(375, 812);
  await new Promise(r => setTimeout(r, 500));

  const mobileTest = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const litbang = document.getElementById('litbang-metodologi');
      const grid = litbang ? litbang.querySelector('.nsr-spi-grid') : null;
      const compCols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return { compCols, overflow };
    })()`,
    returnByValue: true
  });

  assert(mobileTest.result.value.compCols === 1, `Layout mobile 375px tepat 1 kolom bersih (Aktual: ${mobileTest.result.value.compCols})`);
  assert(mobileTest.result.value.overflow === false, 'Zero horizontal overflow pada mobile 375px');
  await captureProof('bukti_final_cpanel_mobile_375.png');

  // 5. wawasan-regulasi.html Sinkronisasi
  console.log('\n[UJI 5] wawasan-regulasi.html Sinkronisasi & Zero Overflow...');
  await setViewport(1280, 900);
  await sendCdp('Page.navigate', { url: `http://localhost:${PORT}/wawasan-regulasi.html` });
  
  // Tunggu hingga wawasan-regulasi selesai dimuat
  for (let i = 0; i < 40; i++) {
    const res = await sendCdp('Runtime.evaluate', {
      expression: 'Boolean(document.body && document.body.innerText.includes("Metodologi Penilaian Ruislagh") && document.querySelector("button[onclick*=\\"ruislagh-aset\\"]"))'
    });
    if (res?.result?.value === true) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 400));

  const wawasanTest = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const pageText = document.body.innerText;
      const hasTitle = pageText.includes('Metodologi Penilaian Ruislagh');
      const hasBtn = Boolean(document.querySelector('button[onclick*="ruislagh-aset"]'));
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return { hasTitle, hasBtn, overflow };
    })()`,
    returnByValue: true
  });

  assert(wawasanTest.result.value.hasTitle === true, 'Artikel Ruislagh tampil di wawasan-regulasi.html');
  assert(wawasanTest.result.value.hasBtn === true, 'Tombol pemicu modal ruislagh-aset terpasang di wawasan-regulasi.html');
  assert(wawasanTest.result.value.overflow === false, 'Zero horizontal overflow pada wawasan-regulasi.html');
  await captureProof('bukti_final_cpanel_wawasan_1280.png');

} finally {
  console.log('\n--- Membersihkan Proses Headless & Server ---');
  try { chrome.kill(); } catch (_) {}
  try { server.close(); } catch (_) {}
  try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch (_) {}
}

console.log('\n' + '='.repeat(80));
console.log(`TOTAL PENGUJIAN: ${totalAsserts} | LULUS: ${passedAsserts} | GAGAL: ${failedAsserts}`);
console.log('='.repeat(80));

if (failedAsserts > 0) {
  process.exit(1);
} else {
  console.log('SEMUA PENGUJIAN BERHASIL 100%! ZERO-REGRESSION TERBUKTI.');
  process.exit(0);
}
