import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_PORT = 8995;
let phpServer = null;

function postRequest(urlPath, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        'Accept': 'application/json',
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

function getRequest(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: urlPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForServer(port, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/`, (res) => resolve(res.statusCode));
        req.on('error', reject);
        req.setTimeout(400, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 150));
    }
  }
  throw new Error('Test server failed to start');
}

(async () => {
  try {
    console.log('========================================================================');
    console.log('🧪 TEST SUITE: EXECUTIVE CONTROL TOWER & SPM HUB (NSR8899 KING EXCLUSIVE)');
    console.log('========================================================================\n');

    // [1] Audit Statis Frontend (index.html & portal-governance.html)
    console.log('[1/5] Memeriksa Integritas Statis Frontend & Isolasi RBAC...');
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const govHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-governance.html'), 'utf8');

    // Pastikan slot banner ada dan default hidden
    assert(indexHtml.includes('id="governance-hero-slot"'), 'ID governance-hero-slot wajib ada di index.html');
    assert(indexHtml.includes('class="hidden mb-3 shrink-0"'), 'Hero slot wajib disembunyikan default (hidden)');
    assert(indexHtml.includes('renderGovernanceBannerIfAuthorized'), 'Fungsi renderGovernanceBannerIfAuthorized wajib terdefinisi di index.html');
    console.log('  ✔ PASS: index.html memiliki slot hero banner terisolasi (default hidden).');

    // Pastikan portal-governance memuat komponen kunci
    assert(govHtml.includes('Danny Taufik Hidayat, S.H.'), 'Header wajib memuat nama Danny Taufik Hidayat, S.H.');
    assert(govHtml.includes('SPM HUB') || govHtml.includes('Kepala SPM'), 'Header wajib mencantumkan otoritas SPM');
    assert(govHtml.includes('kirimIntervensiWA'), 'Mesin intervensi WA wajib terdefinisi');
    assert(govHtml.includes('eksekusiManagementBypass'), 'Fungsi Force Pass bypass wajib terdefinisi');
    assert(govHtml.includes('eksekusiLockoutCabang'), 'Fungsi Branch Lockout wajib terdefinisi');
    console.log('  ✔ PASS: portal-governance.html memuat 4 pilar, matriks 5 kantor, dan mesin intervensi.');

    // [2] Jalankan Server Uji PHP
    console.log('\n[2/5] Menyalakan PHP Test Server pada port ' + TEST_PORT + '...');
    phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], { stdio: 'ignore' });
    await waitForServer(TEST_PORT);
    console.log('  ✔ PHP test server aktif.');

    // [3] Uji RBAC Fail-Closed: Token Staf / Non-KING Wajib Ditolak HTTP 403
    console.log('\n[3/5] Menguji Penolakan Mutlak terhadap Token Non-KING (HTTP 403)...');
    
    // Coba tanpa token
    const noToken = await postRequest('/governance-data-handler.php', { action: 'GET_GOVERNANCE_OVERVIEW' });
    assert.strictEqual(noToken.status, 403, 'Request tanpa token wajib ditolak 403');
    console.log('  ✔ PASS: Request tanpa token ditolak HTTP 403:', noToken.data?.message);

    // Coba dengan token staf cabang (NSR-BDG-2026)
    const staffToken = await postRequest('/governance-data-handler.php', {
      token: 'NSR-BDG-2026',
      action: 'GET_GOVERNANCE_OVERVIEW'
    });
    assert.strictEqual(staffToken.status, 403, 'Token cabang wajib ditolak 403');
    console.log('  ✔ PASS: Token Staf Cabang ditolak HTTP 403:', staffToken.data?.message);

    // [4] Uji Akses Sah Token KING NSR8899 (HTTP 200)
    console.log('\n[4/5] Menguji Hak Akses Otoritas Token KING NSR8899 (HTTP 200)...');
    const kingReq = await postRequest('/governance-data-handler.php', {
      token: 'NSR8899',
      action: 'GET_GOVERNANCE_OVERVIEW'
    });

    assert.strictEqual(kingReq.status, 200, 'Token NSR8899 wajib menghasilkan HTTP 200');
    assert.strictEqual(kingReq.data?.success, true, 'Response wajib success: true');
    assert(kingReq.data?.authority?.nama.includes('Danny Taufik'), 'Otoritas SPM harus terverifikasi');
    assert(Array.isArray(kingReq.data?.kantorMatrix) && kingReq.data.kantorMatrix.length >= 5, 'Matriks 5 kantor wilayah harus lengkap');
    assert(Array.isArray(kingReq.data?.anomaliList) && kingReq.data.anomaliList.length >= 2, 'Daftar anomali kepatuhan harus termuat');
    console.log('  ✔ PASS: Token KING NSR8899 berhasil memuat overview tata kelola lengkap.');
    console.log('    - Indeks Kepatuhan Global:', kingReq.data.summary?.complianceIndex + '%');
    console.log('    - Jumlah Kantor Operasional:', kingReq.data.kantorMatrix.length);
    console.log('    - Total Kasus Anomali Kritis:', kingReq.data.anomaliList.length);

    // [5] Uji Mesin Intervensi (WA, Email Memo, Audit Log, dan Lockout)
    console.log('\n[5/5] Menguji Mesin Intervensi Cepat 1-Klik & Audit Trail...');

    // A. Uji pencatatan intervensi
    const logReq = await postRequest('/governance-data-handler.php', {
      token: 'NSR8899',
      action: 'LOG_INTERVENTION',
      docId: 'REQ-2026-PLB-004',
      pic: 'Ahmad Fauzi',
      channel: 'WHATSAPP',
      violationType: 'NOLAP_BOOKING_EXPIRED'
    });
    assert.strictEqual(logReq.status, 200, 'Logging intervensi wajib HTTP 200');
    assert.strictEqual(logReq.data?.success, true);
    console.log('  ✔ PASS: Intervensi WhatsApp berhasil dicatat ke jejak audit.');

    // B. Uji antrean memo email
    const emailReq = await postRequest('/governance-data-handler.php', {
      token: 'NSR8899',
      action: 'SEND_EMAIL_MEMO',
      docId: 'REQ-2026-PLB-004',
      pic: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@kjppnanangrahayu.com',
      subject: 'MEMO TEGURAN SPM',
      body: 'Harap segera mengunggah draf laporan final.'
    });
    assert.strictEqual(emailReq.status, 200, 'Memo email wajib HTTP 200');
    assert.strictEqual(emailReq.data?.success, true);
    console.log('  ✔ PASS: Memo resmi dialirkan ke antrean email server.');

    // C. Uji lockout cabang
    const lockReq = await postRequest('/governance-data-handler.php', {
      token: 'NSR8899',
      action: 'TOGGLE_BRANCH_LOCKOUT',
      branch: 'Palembang',
      locked: true,
      reason: 'Tunggakan draf laporan NoLap booking > 7 hari'
    });
    assert.strictEqual(lockReq.status, 200, 'Toggle lockout wajib HTTP 200');
    assert.strictEqual(lockReq.data?.locked, true);
    console.log('  ✔ PASS: Tindakan pembekuan (Lockout) cabang Palembang berhasil diaktifkan.');

    // D. Uji ambil daftar audit logs
    const auditLogs = await getRequest(`/governance-data-handler.php?token=NSR8899&action=GET_AUDIT_LOGS`);
    assert.strictEqual(auditLogs.status, 200);
    assert(Array.isArray(auditLogs.data?.logs) && auditLogs.data.logs.length > 0, 'Log harus berisi data intervensi');
    console.log('  ✔ PASS: Riwayat jejak audit berhasil ditarik (' + auditLogs.data.logs.length + ' catatan).');

    console.log('\n========================================================================');
    console.log('🎉 SELURUH PENGUJIAN EXECUTIVE CONTROL TOWER & SPM HUB 100% SUKSES!');
    console.log('========================================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR SUITE PENGUJIAN GOVERNANCE:', err.message);
    process.exit(1);
  } finally {
    if (phpServer) phpServer.kill();
  }
})();
