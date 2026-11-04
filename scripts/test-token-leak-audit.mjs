import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8130;
const DEBUG_PORT = 9230;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

// =========================================================================
// 1. Audit Statis Kode portal-kwitansi.html (Zero Hardcoded Token Leak)
// =========================================================================
console.log('================================================================');
console.log('AUDIT KEAMANAN: ZERO HARDCODED TOKEN LEAK & SHA-256 GUARD');
console.log('================================================================\n');

const portalPath = path.join(ROOT_DIR, 'portal-kwitansi.html');
const portalContent = fs.readFileSync(portalPath, 'utf8');

console.log('>>> MEMERIKSA FILE STATIS portal-kwitansi.html...');
const forbiddenChecks = [
  { name: "String '8899'", regex: /8899/i },
  { name: "String 'NSR-PST-JKT'", regex: /NSR-PST-JKT/i },
  { name: "String 'NSR-KEU-2026'", regex: /NSR-KEU-2026/i },
  { name: "Manipulasi join 8899", regex: /\[.*8899.*\]\.join/i },
  { name: "Manipulasi concat 8899", regex: /NSR['"]\s*\+\s*['"]8899/i }
];

let leakCount = 0;
for (const check of forbiddenChecks) {
  if (check.regex.test(portalContent)) {
    console.error(`❌ [LEAK DETECTED] ${check.name} ditemukan di dalam portal-kwitansi.html!`);
    leakCount++;
  } else {
    console.log(`✓ [BERSIH] ${check.name} TIDAK DITEMUKAN.`);
  }
}

if (leakCount > 0) {
  console.error(`\nAudit GAGAL: Terdeteksi ${leakCount} kebocoran token pada portal-kwitansi.html!`);
  process.exit(1);
}
console.log('\n✓ Seluruh file portal-kwitansi.html LOLOS audit statis (Zero Token Leak)!\n');

// =========================================================================
// 2. Simulasi Headless Chrome CDP untuk Verifikasi Fungsional Gatekeeper SHA-256
// =========================================================================
async function runHeadlessChromeAudit() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/portal-kwitansi.html';

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
    res.end('Not found');
  });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_audit_test');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  let ws = null;

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
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
        if (!text.includes('cdn.tailwindcss.com')) {
          console.log('[BROWSER CONSOLE]', text);
        }
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

    console.log('>>> Membuka portal-kwitansi.html di Chrome Headless...');
    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-kwitansi.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Bypass dialog alert & confirm
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(msg) { console.log('[BROWSER ALERT]', msg); };
        window.confirm = function(msg) { console.log('[BROWSER CONFIRM]', msg); return true; };
      `
    });

    console.log(`\n>>> Melakukan Login Pusat via SHA-256 Gatekeeper...`);
    const evalLoginPusat = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          sessionStorage.clear();
          localStorage.removeItem('nsr_auth_token');
          localStorage.removeItem('NSR_SESSION_TOKEN');

          const inputGk = document.getElementById('input-gatekeeper-kwitansi');
          if (inputGk) {
            // Masukkan token Pusat resmi
            inputGk.value = 'NSR' + '8899';
          }
          await verifikasiGatekeeperKwitansi();

          const peran = evaluasiPeranKwitansi(currentUser);

          return {
            currentUserRole: currentUser?.role,
            isSuperAdmin: currentUser?.isSuperAdmin,
            wilayahCode: currentUser?.wilayahCode,
            isPusat: peran.isPusat,
            isCabang: peran.isCabang,
            canApprove: peran.canApprove,
            roleNormalized: peran.roleNormalized,
            tokenHash: currentUser?.tokenHash
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const valPusat = evalLoginPusat.result?.value || evalLoginPusat.value || {};
    console.log('Hasil Evaluasi Peran Pengguna Pusat:', JSON.stringify(valPusat, null, 2));

    if (!valPusat.isPusat) {
      throw new Error('Gagal: Pengguna pusat tidak terdeteksi isPusat: true!');
    }
    if (!valPusat.canApprove) {
      throw new Error('Gagal: Pengguna pusat harus memiliki canApprove: true!');
    }
    console.log('✓ Akun Keuangan Pusat terverifikasi 100% valid melalui SHA-256 Guard!');

    console.log('\n>>> Verifikasi Navigasi Dashboard Approval & Tombol Aksi...');
    const evalDashboard = await send('Runtime.evaluate', {
      expression: `
        (() => {
          bukaTabDashboardPusat();

          const panelPusat = document.getElementById('panel-pusat');
          const isPanelVisible = panelPusat && !panelPusat.classList.contains('hidden');
          const guardCabang = document.getElementById('guard-akses-pusat-cabang');
          const isGuardHidden = guardCabang && guardCabang.classList.contains('hidden');

          const btnSahkan = document.getElementById('btn-sahkan-kwitansi');
          const isBtnSahkanReady = !!btnSahkan;

          return {
            isPanelVisible,
            isGuardHidden,
            isBtnSahkanReady
          };
        })()
      `,
      returnByValue: true
    });

    const valDash = evalDashboard.result?.value || evalDashboard.value || {};
    console.log('Status Dashboard Approval Pusat:', JSON.stringify(valDash, null, 2));

    if (!valDash.isPanelVisible) throw new Error('Gagal: Panel pusat harus terbuka!');
    if (!valDash.isGuardHidden) throw new Error('Gagal: Guard pembatasan cabang harus tersembunyi untuk Pusat!');
    if (!valDash.isBtnSahkanReady) throw new Error('Gagal: Tombol pengesahan harus tersedia!');
    console.log('✓ Dashboard Approval & Operasional Keuangan Pusat berfungsi 100%!');

    // Screenshot bukti live audit
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const proofPath = path.join(ARTIFACT_DIR, 'bukti_live_audit_token_bersih_pusat.png');
    fs.writeFileSync(proofPath, Buffer.from(ss.data, 'base64'));
    console.log(`\n✓ Bukti Live Screenshot tersimpan: ${proofPath}`);

    console.log('\n================================================================');
    console.log('SELURUH AUDIT KEAMANAN ZERO TOKEN LEAK & SHA-256 GUARD LULUS 100%!');
    console.log('================================================================\n');

  } finally {
    if (ws) ws.close();
    chrome.kill();
    server.close();
  }
}

runHeadlessChromeAudit().catch(err => {
  console.error('AUDIT TEST FAILED:', err);
  process.exit(1);
});
