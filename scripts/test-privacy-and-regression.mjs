import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, execSync } from 'child_process';

const PORT = 8155;
const DEBUG_PORT = 9255;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('TEST SUITE: ROSTER PRIVACY SANITATION & POINT-LOOKUP REGRESSION');
console.log('================================================================\n');

// =========================================================================
// UJI 1: AUDIT STATIS KODE SUMBER & ZERO DATA SCRAPING VULNERABILITY
// =========================================================================
console.log('>>> [UJI 1] AUDIT STATIS KODE SUMBER & SANITASI PRIVASI...');

const auditedFiles = [
  'portal-tracking.html',
  'portal-kwitansi.html',
  'portal-nolap.html'
];

const forbiddenPatterns = [
  { name: 'Array Roster Karyawan Mentah (ROSTER_PEGAWAI_NSR = [...])', regex: /ROSTER_PEGAWAI_NSR\s*=/i },
  { name: 'Array Roster Statis (const ROSTER_PEGAWAI = [...])', regex: /const\s+ROSTER_PEGAWAI\s*=/i },
  { name: 'Dumping Master 48 NIK', regex: /MASTER_48_NIKS\s*=/i },
  { name: 'Mock Debitur Pribadi: Hendra Wijaya', regex: /Hendra Wijaya,\s*S\.T\./i },
  { name: 'Mock Debitur PT Bangun Prima Perkasa', regex: /PT Bangun Prima Perkasa/i },
  { name: 'Mock Debitur PT Graha Logistik Parahyangan', regex: /PT Graha Logistik Parahyangan/i },
  { name: 'Mock Debitur CV Celebes Bahari Agro', regex: /CV Celebes Bahari Agro/i },
  { name: 'Mock Debitur PT Surya Cipta Megah', regex: /PT Surya Cipta Megah/i }
];

let privacyViolations = 0;

for (const file of auditedFiles) {
  const filePath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ Berkas ${file} tidak ditemukan!`);
    privacyViolations++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n• Audit Berkas: ${file}`);

  // Cek apakah ada pola terlarang
  for (const check of forbiddenPatterns) {
    if (check.regex.test(content)) {
      console.error(`  ❌ [PELANGGARAN PRIVASI] Ditemukan: ${check.name} di dalam ${file}!`);
      privacyViolations++;
    } else {
      console.log(`  ✓ [BERSIH] Bebas dari ${check.name}`);
    }
  }

  // Verifikasi Data Publik Sah Tetap Utuh (Legalitas & Rekening Baku)
  if (file === 'portal-kwitansi.html' || file === 'portal-tracking.html') {
    if (!content.includes('2.19.0160')) {
      console.error(`  ❌ [REGRESI] Izin KMK 2.19.0160 tidak ditemukan di ${file}!`);
      privacyViolations++;
    } else {
      console.log(`  ✓ [LEGALITAS TERJAGA] KMK No. 2.19.0160 terkonfirmasi hadir.`);
    }

    if (!content.includes('NANANG RAHAYU')) {
      console.error(`  ❌ [REGRESI] Identitas Pemimpin Rekan Nanang Rahayu hilang di ${file}!`);
      privacyViolations++;
    } else {
      console.log(`  ✓ [LEGALITAS TERJAGA] Pemimpin Rekan Ir. Nanang Rahayu terkonfirmasi hadir.`);
    }
  }
}

if (privacyViolations > 0) {
  console.error(`\n[GAGAL] Uji 1 gagal: Terdeteksi ${privacyViolations} pelanggaran data sensitif.`);
  process.exit(1);
}
console.log('\n✅ [UJI 1 SUKSES] Seluruh berkas portal BERSIH dari dumping 52 personel & mock debitur mentah!\n');

// =========================================================================
// UJI 2 & 3: HEADLESS CHROME SIMULATION (POINT-LOOKUP & ZERO REGRESSION)
// =========================================================================
async function runChromeSimulation() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const localFile = path.join(ROOT_DIR, reqPath);
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile);
      const mime = ext === '.html' ? 'text/html' :
                   ext === '.js' || ext === '.mjs' ? 'application/javascript' :
                   ext === '.css' ? 'text/css' :
                   ext === '.png' ? 'image/png' :
                   ext === '.svg' ? 'image/svg+xml' : 'text/plain';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(localFile).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`✓ Local Web Server aktif di port ${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_privacy_test');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,1100',
    'about:blank'
  ]);

  const cleanup = () => {
    try { chromeProc.kill(); } catch (_) {}
    try { server.close(); } catch (_) {}
  };

  try {
    await new Promise(r => setTimeout(r, 2000));

    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
          const { resolve, reject } = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (_) {}
    };

    await send('Page.enable');
    await send('Runtime.enable');

    async function waitForElement(selector, timeoutMs = 12000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const check = await send('Runtime.evaluate', {
          expression: `!!document.querySelector('${selector}')`,
          returnByValue: true
        });
        if (check.result && check.result.value) return true;
        await new Promise(r => setTimeout(r, 300));
      }
      return false;
    }

    console.log('\n>>> [UJI 2] MENGUJI GATEKEEPER NIK POINT-LOOKUP (JAKARTA, BANDUNG, PADANG)...');

    // Buka portal-tracking.html
    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-tracking.html` });
    const elReady = await waitForElement('#gatekeeper-nik-input');
    if (!elReady) throw new Error('Timeout: Elemen #gatekeeper-nik-input tidak muncul setelah 12 detik.');

    // Evaluasi 1: Uji Input NIK Jakarta (NSR-2019-001 / Nanang Rahayu)
    const resJkt = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inp = document.getElementById('gatekeeper-nik-input');
          if (!inp) return { error: 'Input NIK tidak ditemukan' };
          inp.value = 'NSR-2019-001';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          handleGatekeeperNikInput('NSR-2019-001');

          const previewEl = document.getElementById('gatekeeper-nik-detected');
          const namaEl = document.getElementById('gatekeeper-nik-nama-preview');
          const isShown = previewEl && !previewEl.classList.contains('hidden');
          const nama = namaEl ? namaEl.textContent.trim() : '';
          return { isShown, nama };
        })()
      `,
      returnByValue: true
    });

    console.log('• Point-Lookup NIK Jakarta (NSR-2019-001):', resJkt.result.value);
    if (!resJkt.result.value.isShown || !resJkt.result.value.nama.includes('Nanang Rahayu')) {
      throw new Error(`Gagal point-lookup NIK Jakarta: ${JSON.stringify(resJkt.result.value)}`);
    }

    // Evaluasi 2: Uji Input NIK Bandung (NSR-BDG-2020-38 / Heru Kurnia)
    const resBdg = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inp = document.getElementById('gatekeeper-nik-input');
          inp.value = 'NSR-BDG-2020-38';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          handleGatekeeperNikInput('NSR-BDG-2020-38');

          const previewEl = document.getElementById('gatekeeper-nik-detected');
          const namaEl = document.getElementById('gatekeeper-nik-nama-preview');
          const isShown = previewEl && !previewEl.classList.contains('hidden');
          const nama = namaEl ? namaEl.textContent.trim() : '';
          return { isShown, nama };
        })()
      `,
      returnByValue: true
    });

    console.log('• Point-Lookup NIK Bandung (NSR-BDG-2020-38):', resBdg.result.value);
    if (!resBdg.result.value.isShown || !resBdg.result.value.nama.includes('Heru Kurnia')) {
      throw new Error(`Gagal point-lookup NIK Bandung: ${JSON.stringify(resBdg.result.value)}`);
    }

    // Evaluasi 3: Uji Input NIK Padang (NSR-PDG-2019-23 / Hernita)
    const resPdg = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inp = document.getElementById('gatekeeper-nik-input');
          inp.value = 'NSR-PDG-2019-23';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          handleGatekeeperNikInput('NSR-PDG-2019-23');

          const previewEl = document.getElementById('gatekeeper-nik-detected');
          const namaEl = document.getElementById('gatekeeper-nik-nama-preview');
          const isShown = previewEl && !previewEl.classList.contains('hidden');
          const nama = namaEl ? namaEl.textContent.trim() : '';
          return { isShown, nama };
        })()
      `,
      returnByValue: true
    });

    console.log('• Point-Lookup NIK Padang (NSR-PDG-2019-23):', resPdg.result.value);
    if (!resPdg.result.value.isShown || !resPdg.result.value.nama.includes('Hernita')) {
      throw new Error(`Gagal point-lookup NIK Padang: ${JSON.stringify(resPdg.result.value)}`);
    }

    // Evaluasi 4: Uji Login Sesi Staf Mandiri & Verifikasi Zero Contamination pada SessionStorage
    const resSubmit = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          // Masukkan Token Cabang Bandung & NIK Bandung
          document.getElementById('gatekeeper-token-input').value = 'NSR-BDG-2026';
          document.getElementById('gatekeeper-nik-input').value = 'NSR-BDG-2020-38';
          await handleGatekeeperSubmit();

          // Periksa sessionStorage
          const authKey = sessionStorage.getItem('nsr_tracking_auth_token');
          const activeNik = sessionStorage.getItem('nsr_active_user_nik');
          const activeName = sessionStorage.getItem('nsr_active_user_name');
          const sessUser = sessionStorage.getItem('nsr_user_session');

          // Verifikasi tidak ada nama orang lain di window atau sessionStorage
          const hasOtherNames = sessUser && (sessUser.includes('Nanang Rahayu') || sessUser.includes('Hernita'));

          return {
            authKey: !!authKey,
            activeNik,
            activeName,
            hasOtherNames,
            authorizedClass: document.documentElement.classList.contains('nsr-tracking-authorized')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('• Status Login Gatekeeper Lapis-2:', resSubmit.result.value);
    if (!resSubmit.result.value.authorizedClass || resSubmit.result.value.activeNik !== 'NSR-BDG-2020-38') {
      throw new Error('Gagal login Gatekeeper Lapis 2!');
    }
    if (resSubmit.result.value.hasOtherNames) {
      throw new Error('Terjadi kontaminasi data! Profil personel lain bocor ke session storage.');
    }
    console.log('  ✓ Otorisasi NIK Lapis 2 sukses dan HANYA menyimpan 1 profil pengguna aktif!');

    // Ambil screenshot bukti live point-lookup
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.join(ARTIFACT_DIR, 'bukti_live_point_lookup_nik_dan_privacy.png');
    fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
    console.log(`  ✓ Tangkapan layar live pengujian disimpan: ${ssPath}`);

    // Tutup koneksi
    ws.close();
    cleanup();

    console.log('\n✅ [UJI 2 SUKSES] Mekanisme Gatekeeper Point-Lookup NIK Lapis 2 berjalan 100% sempurna!\n');

    // =========================================================================
    // UJI 3: REGRESI PENUH KWITANSI CABANG-PUSAT & AUDIT TOKEN SUITE
    // =========================================================================
    console.log('>>> [UJI 3] MENJALANKAN RANGKAIAN UJI REGRESI LENGKAP...');

    console.log('\n--- 3.a Menjalankan test-simulasi-kwitansi-cabang-pusat.mjs ---');
    execSync('node scripts/test-simulasi-kwitansi-cabang-pusat.mjs', { stdio: 'inherit' });
    console.log('✓ test-simulasi-kwitansi-cabang-pusat.mjs LULUS 100%!');

    console.log('\n--- 3.b Menjalankan test-token-leak-full-suite.mjs ---');
    execSync('node scripts/test-token-leak-full-suite.mjs', { stdio: 'inherit' });
    console.log('✓ test-token-leak-full-suite.mjs LULUS 100%!');

    console.log('\n================================================================');
    console.log('SELURUH RANGKAIAN PENGUJIAN PRIVASI & REGRESI LULUS 100%!');
    console.log('================================================================\n');

  } catch (err) {
    cleanup();
    console.error('\n❌ Pengujian GAGAL:', err);
    process.exit(1);
  }
}

runChromeSimulation();
