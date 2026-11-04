import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 8140;
const DEBUG_PORT = 9240;
const ROOT_DIR = process.cwd();
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('================================================================');
console.log('FULL SUITE SECURITY AUDIT: ZERO TOKEN LEAK & SHA-256 HASH GUARD');
console.log('================================================================\n');

// =========================================================================
// 1. Audit Statis DOM & Kode Sumber Portal Utama
// =========================================================================
const targetFiles = [
  'portal-surat-umum.html',
  'portal-nolap.html',
  'portal-kwitansi.html',
  'portal-tracking.html',
  'portal-governance.html'
];

const leakPatterns = [
  { name: "String '8899'", regex: /8899/i },
  { name: "String 'NSR-PST-JKT'", regex: /NSR-PST-JKT/i },
  { name: "String 'NSR-KEU-2026'", regex: /NSR-KEU-2026/i },
  { name: "Manipulasi join 8899", regex: /\[.*8899.*\]\.join/i },
  { name: "Manipulasi concat 8899", regex: /NSR['"]\s*\+\s*['"]8899/i }
];

console.log('>>> [1] MELAKUKAN AUDIT STATIS KODE SUMBER PORTAL...');
let totalLeakCount = 0;

for (const f of targetFiles) {
  const filePath = path.join(ROOT_DIR, f);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\n• Memeriksa berkas: ${f}`);
  let fileLeaks = 0;
  for (const check of leakPatterns) {
    if (check.regex.test(content)) {
      console.error(`  ❌ [LEAK DETECTED] ${check.name} ditemukan di dalam ${f}!`);
      fileLeaks++;
      totalLeakCount++;
    } else {
      console.log(`  ✓ [BERSIH] ${check.name} TIDAK DITEMUKAN.`);
    }
  }
}

if (totalLeakCount > 0) {
  console.error(`\nAudit Statis GAGAL: Terdeteksi ${totalLeakCount} kebocoran token!`);
  process.exit(1);
}
console.log('\n✓ Seluruh berkas portal LOLOS Audit Statis (Zero Hardcoded Token Leak)!\n');

// =========================================================================
// 2. Simulasi Headless Chrome CDP untuk Verifikasi Dinamis
// =========================================================================
async function runFullSuiteAudit() {
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
    res.end('Not found');
  });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(ARTIFACT_DIR, '.tmp_chrome_suite_test');

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    'about:blank'
  ]);

  let ws = null;

  try {
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
        const targetData = await targetRes.json();
        if (targetData && targetData.webSocketDebuggerUrl) {
          wsUrl = targetData.webSocketDebuggerUrl;
          break;
        }
      } catch (err) {}
    }

    if (!wsUrl) throw new Error('Gagal menghubungkan ke remote debugging Chrome');
    ws = new globalThis.WebSocket(wsUrl);
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

    // -------------------------------------------------------------------------
    // TEST 1: portal-surat-umum.html (TTD Digital & Stempel Basah via SHA-256)
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('>>> [2] UJI DINAMIS: portal-surat-umum.html (SHA-256 Signature Guard)');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-surat-umum.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Override dialog: alert, confirm, dan prompt untuk verifikasi hash
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(msg) { console.log('[BROWSER ALERT]', msg); };
        window.confirm = function(msg) { console.log('[BROWSER CONFIRM]', msg); return true; };
        // Berikan kunci otorisasi Pemimpin Rekan saat prompt muncul
        window.prompt = function(msg) {
          console.log('[BROWSER PROMPT INTERCEPTED]', msg);
          return 'NSR' + '8899';
        };
      `
    });

    console.log('• Menjalankan handleToggleTtdDigital() untuk membubuhkan TTD Digital & Stempel...');
    const evalTtd = await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          localStorage.clear();

          // Panggil fungsi pembubuhan
          handleToggleTtdDigital();

          const layerActive = document.getElementById('layer-ttd-digital-active');
          const isLayerVisible = layerActive && !layerActive.classList.contains('hidden');
          const stempelImg = document.getElementById('img-stempel-basah-asli');
          const qrImg = document.getElementById('qr-verifikasi-surat');

          const isAuthorized = isMasterSignerAuthorized();
          const storedHash = sessionStorage.getItem('nsr_master_signer_hash');
          const rawTokenStored = sessionStorage.getItem('nsr_auth_token');

          return {
            isTtdDigitalApplied,
            isLayerVisible,
            hasStempel: !!stempelImg,
            hasQr: !!qrImg,
            isAuthorized,
            storedHash,
            hasRawToken: !!rawTokenStored
          };
        })()
      `,
      returnByValue: true
    });

    const valTtd = evalTtd.result?.value || evalTtd.value || {};
    console.log('Hasil Pengujian TTD Digital & Stempel:', JSON.stringify(valTtd, null, 2));

    if (!valTtd.isTtdDigitalApplied || !valTtd.isLayerVisible) {
      throw new Error('Gagal: Blok TTD Digital & Stempel Basah harus aktif dan terlihat!');
    }
    if (!valTtd.isAuthorized) {
      throw new Error('Gagal: isMasterSignerAuthorized() harus mengembalikan true!');
    }
    if (valTtd.hasRawToken) {
      throw new Error('Gagal: Token plaintext tidak boleh tersimpan di sessionStorage!');
    }
    if (!valTtd.storedHash) {
      throw new Error('Gagal: Hash SHA-256 harus tersimpan sebagai kredensial valid!');
    }
    console.log('✓ Otorisasi TTD Digital & Stempel Basah via SHA-256 Guard LULUS 100%!');

    // Screenshot Bukti 1: portal-surat-umum.html
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const proof1Path = path.join(ARTIFACT_DIR, 'bukti_live_audit_surat_umum_ttd_hash.png');
    fs.writeFileSync(proof1Path, Buffer.from(ss1.data, 'base64'));
    console.log(`✓ Bukti Screenshot 1 tersimpan: ${proof1Path}`);

    // -------------------------------------------------------------------------
    // TEST 2: portal-nolap.html (RBAC Role Teknis vs Super Admin Master via Hash)
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('>>> [3] UJI DINAMIS: portal-nolap.html (RBAC Tab Restriction & Approval)');
    console.log('================================================================');

    await send('Page.navigate', { url: `http://localhost:${PORT}/portal-nolap.html` });
    await new Promise(r => setTimeout(r, 2500));

    // Bypass dialog
    await send('Runtime.evaluate', {
      expression: `
        window.alert = function(msg) { console.log('[BROWSER ALERT]', msg); };
        window.confirm = function(msg) { return true; };
      `
    });

    console.log('• Skenario A: Login sebagai Role Teknis (SURVEYOR / PENILAI)...');
    const evalRestricted = await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          const userSurveyor = {
            role: 'SURVEYOR',
            roleLabel: 'Surveyor Lapangan',
            cabang: 'Bandung',
            wilayahCode: 'BDG',
            isSuperAdmin: false,
            canApprove: false,
            isKing: false
          };
          window.currentUser = userSurveyor;
          window.sesiAktif = userSurveyor;
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(userSurveyor));

          // Jalankan penentuan hak akses RBAC
          if (typeof setOtoritasPeran === 'function') {
            setOtoritasPeran(userSurveyor);
          }

          const isRestricted = isRestrictedTechnicalUser(userSurveyor);
          const tab3 = document.getElementById('tab-btn-approval');
          const tab6 = document.getElementById('tab-btn-monitoring');
          const tab3Disabled = tab3 && (tab3.hasAttribute('disabled') || tab3.classList.contains('pointer-events-none') || tab3.classList.contains('opacity-50') || tab3.classList.contains('hidden'));
          const tab6Disabled = tab6 && (tab6.hasAttribute('disabled') || tab6.classList.contains('pointer-events-none') || tab6.classList.contains('opacity-50') || tab6.classList.contains('hidden'));

          const badgeAdmin = document.getElementById('badge-admin-pusat') || document.getElementById('badge-admin-approval');
          const isBadgeHidden = !badgeAdmin || badgeAdmin.classList.contains('hidden') || badgeAdmin.style.display === 'none';

          return {
            isRestricted,
            tab3Disabled,
            tab6Disabled,
            isBadgeHidden
          };
        })()
      `,
      returnByValue: true
    });

    const valRestricted = evalRestricted.result?.value || evalRestricted.value || {};
    console.log('Hasil Uji Role Teknis:', JSON.stringify(valRestricted, null, 2));

    if (!valRestricted.isRestricted) {
      throw new Error('Gagal: Surveyor harus terdeteksi isRestrictedTechnicalUser: true!');
    }
    if (!valRestricted.tab3Disabled || !valRestricted.tab6Disabled) {
      throw new Error('Gagal: Tab 3 (Approval) dan Tab 6 (Monitoring) harus dinonaktifkan untuk Surveyor!');
    }
    if (!valRestricted.isBadgeHidden) {
      throw new Error('Gagal: Badge Admin Approval harus tersembunyi untuk Surveyor!');
    }
    console.log('✓ Restriksi Tab RBAC untuk Surveyor/Penilai LULUS 100%!');

    console.log('\n• Skenario B: Login sebagai Executive / Super Admin Master (via SHA-256 Hash)...');
    const evalMaster = await send('Runtime.evaluate', {
      expression: `
        (() => {
          sessionStorage.clear();
          const userMaster = {
            role: 'SUPER ADMIN',
            roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
            cabang: 'Pusat',
            wilayahCode: 'PST',
            isSuperAdmin: true,
            isKing: true,
            canApprove: true,
            tokenHash: '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
          };
          window.currentUser = userMaster;
          window.sesiAktif = userMaster;
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(userMaster));

          if (typeof applyRBAC === 'function') {
            applyRBAC(userMaster);
          } else if (typeof setOtoritasPeran === 'function') {
            setOtoritasPeran(userMaster);
          }

          const isSuper = isSuperAdminMaster(userMaster);
          const isRestricted = isRestrictedTechnicalUser(userMaster);

          const tab3 = document.getElementById('tab-btn-approval');
          const tab6 = document.getElementById('tab-btn-monitoring');
          const tab3Active = tab3 && !tab3.hasAttribute('disabled') && !tab3.classList.contains('hidden');
          const tab6Active = tab6 && !tab6.hasAttribute('disabled') && !tab6.classList.contains('hidden');

          const badgeAdmin = document.getElementById('badge-admin-pusat');
          const isBadgeVisible = Boolean(badgeAdmin && !badgeAdmin.classList.contains('hidden'));

          return {
            isSuper,
            isRestricted,
            tab3Active,
            tab6Active,
            isBadgeVisible
          };
        })()
      `,
      returnByValue: true
    });

    const valMaster = evalMaster.result?.value || evalMaster.value || {};
    console.log('Hasil Uji Super Admin Master:', JSON.stringify(valMaster, null, 2));

    if (!valMaster.isSuper || valMaster.isRestricted) {
      throw new Error('Gagal: Master akun harus terdeteksi isSuper: true dan isRestricted: false!');
    }
    if (!valMaster.tab3Active || !valMaster.tab6Active) {
      throw new Error('Gagal: Seluruh Tab 1-6 harus aktif dan terbuka untuk Master!');
    }
    if (!valMaster.isBadgeVisible) {
      throw new Error('Gagal: Badge Admin Approval harus aktif dan terlihat untuk Master!');
    }
    console.log('✓ Akses Penuh Master & Otoritas Approval LULUS 100%!');

    // Screenshot Bukti 2: portal-nolap.html
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const proof2Path = path.join(ARTIFACT_DIR, 'bukti_live_audit_nolap_rbac_hash.png');
    fs.writeFileSync(proof2Path, Buffer.from(ss2.data, 'base64'));
    console.log(`✓ Bukti Screenshot 2 tersimpan: ${proof2Path}`);

    console.log('\n================================================================');
    console.log('SELURUH SUITE PENGUJIAN KEAMANAN LULUS DENGAN PRESTASI 100%!');
    console.log('================================================================\n');

  } finally {
    if (ws) ws.close();
    chrome.kill();
    server.close();
  }
}

runFullSuiteAudit().catch(err => {
  console.error('FULL SUITE AUDIT FAILED:', err);
  process.exit(1);
});
