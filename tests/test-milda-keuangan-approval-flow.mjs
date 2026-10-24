import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_PORT = 8996;
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
    console.log('Starting PHP test server on port ' + TEST_PORT + '...');
    phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], { stdio: 'ignore' });
    await waitForServer(TEST_PORT);
    console.log('PHP test server ready.\n');

    console.log('======================================================');
    console.log('🧪 TEST: LOGIN & APPROVAL FLOW MILDA HIDAYATI DEWI (NSR-KEU-2026)');
    console.log('======================================================\n');

    // 1. Test Login dengan Token NSR-KEU-2026 via auth-handler.php (Simulasi /api/auth-login)
    console.log('[1/4] Menguji Login via auth-handler.php dengan token NSR-KEU-2026...');
    const loginRes = await postRequest('/auth-handler.php', {
      action: 'login',
      token: 'NSR-KEU-2026'
    });

    if (loginRes.status !== 200 || !loginRes.data?.success) {
      throw new Error(`Login gagal (HTTP ${loginRes.status}): ` + JSON.stringify(loginRes.data || loginRes.raw));
    }

    const userData = loginRes.data.user;
    console.log('  ✔ Login berhasil HTTP 200');
    console.log('    - sub:', userData.sub);
    console.log('    - displayName:', userData.displayName);
    console.log('    - role:', userData.role);
    console.log('    - roleLabel:', userData.roleLabel);
    console.log('    - canApprove:', userData.canApprove);
    console.log('    - permissions:', userData.permissions);

    if (userData.displayName !== 'Milda Hidayati Dewi, S.E.') {
      throw new Error(`Expected displayName 'Milda Hidayati Dewi, S.E.', got '${userData.displayName}'`);
    }
    if (userData.role !== 'MANAGER_KEUANGAN') {
      throw new Error(`Expected role 'MANAGER_KEUANGAN', got '${userData.role}'`);
    }
    if (userData.canApprove !== true) {
      throw new Error(`Expected canApprove true, got ${userData.canApprove}`);
    }
    if (!userData.permissions?.includes('APPROVE_KEUANGAN')) {
      throw new Error(`Missing APPROVE_KEUANGAN in permissions`);
    }

    // Ambil session cookie
    const cookies = loginRes.headers['set-cookie'] || [];
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('  ✔ Sesi PHP tercipta dengan cookie:', cookieHeader);

    // 2. Akses getPengajuanList via operasional-data-handler.php dengan cookie sesi
    console.log('\n[2/4] Menguji getPengajuanList via operasional-data-handler.php...');
    const listRes = await getRequest('/operasional-data-handler.php?action=getPengajuanList', {
      'Cookie': cookieHeader
    });

    if (listRes.status !== 200 || !listRes.data?.success) {
      throw new Error(`getPengajuanList gagal (HTTP ${listRes.status}): ` + JSON.stringify(listRes.data || listRes.raw));
    }

    const currentHandlerUser = listRes.data.currentUser;
    console.log('  ✔ operasional-data-handler.php mengenali sesi aktif:');
    console.log('    - displayName:', currentHandlerUser.displayName);
    console.log('    - role:', currentHandlerUser.role);
    console.log('    - canApprove:', currentHandlerUser.canApprove);
    console.log('    - pendingCount:', listRes.data.pendingCount);

    if (currentHandlerUser.displayName !== 'Milda Hidayati Dewi, S.E.') {
      throw new Error(`Handler user displayName mismatch: ${currentHandlerUser.displayName}`);
    }
    if (currentHandlerUser.canApprove !== true) {
      throw new Error(`Handler user canApprove is false!`);
    }

    // 3. Buat pengajuan simulasi dengan alur ADMIN_UMUM (Tier 1: Danny -> Tier 2: Milda -> Tier 3: Nanang)
    console.log('\n[3/4] Membuat pengajuan simulasi dan menguji status pending Milda...');
    const submitRes = await postRequest('/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-UMM',
      alur: 'ADMIN_UMUM',
      namaPengaju: 'Staff IT Pengadaan',
      jabatanPengaju: 'Staff IT',
      divisiPengaju: 'Admin & Umum',
      maksudTujuan: 'Pengadaan Switch Core & Router Kantor Pusat',
      tanggalKebutuhan: '2026-10-30',
      items: [{ deskripsi: 'Switch Catalyst Cisco', nominal: 3500000 }]
    }, { 'Cookie': cookieHeader });

    if (submitRes.status !== 200 || !submitRes.data?.success) {
      throw new Error(`simpanPengajuan gagal: ` + JSON.stringify(submitRes.data || submitRes.raw));
    }

    const testDoc = submitRes.data.data;
    console.log('  ✔ Pengajuan berhasil dibuat:', testDoc.noPermintaan, `(ID: ${testDoc.id})`);
    console.log('    - Tier 1 Target:', testDoc.approvals['1'].pejabat, `(${testDoc.approvals['1'].roleKey})`);
    console.log('    - Tier 2 Target:', testDoc.approvals['2'].pejabat, `(${testDoc.approvals['2'].roleKey})`);
    console.log('    - Tier 3 Target:', testDoc.approvals['3'].pejabat, `(${testDoc.approvals['3'].roleKey})`);

    // Sebelum Tier 1 disetujui, Tier 2 BELUM pending pada Milda (Anti-Skip)
    const listResBeforeT1 = await getRequest('/operasional-data-handler.php?action=getPengajuanList', { 'Cookie': cookieHeader });
    const docBeforeT1 = listResBeforeT1.data.data.find(d => d.id === testDoc.id);
    console.log('  ✔ Evaluasi sebelum Tier 1: isPendingOnMe =', docBeforeT1.isPendingOnMe, '(Alasan:', docBeforeT1.pendingReason, ')');
    if (docBeforeT1.isPendingOnMe === true) {
      throw new Error('Tier 2 tidak boleh pending sebelum Tier 1 disetujui (Pelanggaran Anti-Skip)');
    }

    // Setujui Tier 1 menggunakan token Danny Taufik / Admin Pusat (NSR-ADMIN-PUSAT-2026)
    console.log('  ✔ Menyetujui Tier 1 dengan akun Danny Taufik...');
    const loginDanny = await postRequest('/auth-handler.php', { action: 'login', token: 'NSR-ADMIN-PUSAT-2026' });
    const dannyCookies = (loginDanny.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

    const approveT1Res = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 1
    }, { 'Cookie': dannyCookies });

    if (approveT1Res.status !== 200 || !approveT1Res.data?.success) {
      throw new Error(`Approve Tier 1 gagal: ` + JSON.stringify(approveT1Res.data || approveT1Res.raw));
    }
    console.log('  ✔ Tier 1 berhasil disetujui oleh Danny Taufik.');

    // 4. Periksa kembali dengan sesi Milda Hidayati Dewi
    console.log('\n[4/4] Memeriksa status pending dan eksekusi persetujuan oleh Milda Hidayati Dewi (Tier 2)...');
    const listResAfterT1 = await getRequest('/operasional-data-handler.php?action=getPengajuanList', { 'Cookie': cookieHeader });
    const docAfterT1 = listResAfterT1.data.data.find(d => d.id === testDoc.id);

    console.log('  ✔ Evaluasi setelah Tier 1 disetujui:');
    console.log('    - isPendingOnMe:', docAfterT1.isPendingOnMe);
    console.log('    - pendingTier:', docAfterT1.pendingTier);
    console.log('    - pendingReason:', docAfterT1.pendingReason);

    if (docAfterT1.isPendingOnMe !== true) {
      throw new Error('Dokumen WAJIB isPendingOnMe = true untuk Milda Hidayati Dewi setelah Tier 1 disetujui!');
    }
    if (docAfterT1.pendingTier !== 2) {
      throw new Error(`Expected pendingTier 2, got ${docAfterT1.pendingTier}`);
    }

    // Eksekusi Approve Tier 2 oleh Milda
    const approveT2Res = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 2
    }, { 'Cookie': cookieHeader });

    if (approveT2Res.status !== 200 || !approveT2Res.data?.success) {
      throw new Error(`Approve Tier 2 oleh Milda gagal: ` + JSON.stringify(approveT2Res.data || approveT2Res.raw));
    }

    const approvedDoc = approveT2Res.data.data;
    console.log('  ✔ Tier 2 BERHASIL DISETUJUI SAH OLEH MILDA HIDAYATI DEWI!');
    console.log('    - Status Approval T2:', approvedDoc.approvals['2'].approved ? 'DISETUJUI' : 'BELUM');
    console.log('    - Disetujui Oleh:', approvedDoc.approvals['2'].pejabat);
    console.log('    - Waktu Approval:', approvedDoc.approvals['2'].approvedAt);
    console.log('    - Hash Tanda Tangan Digital:', approvedDoc.approvals['2'].digitalSignature?.hash?.slice(0, 16) + '...');

    // Uji isolasi RBAC: Pastikan Milda TIDAK BISA menyetujui Tier 3 (Khusus Kepala Keuangan Ir. Nanang Rahayu)
    const illegalT3Res = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 3
    }, { 'Cookie': cookieHeader });

    if (illegalT3Res.status !== 403) {
      throw new Error(`Expected HTTP 403 when Milda attempts Tier 3, got HTTP ${illegalT3Res.status}`);
    }
    console.log('  ✔ RBAC Terisolasi Sempurna: Milda ditolak dengan HTTP 403 saat mencoba menyetujui Tier 3.');

    console.log('\n======================================================');
    console.log('🎉 SELURUH PENGUJIAN OTORISASI MILDA HIDAYATI DEWI 100% SUKSES!');
    console.log('======================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR DI SUITE PENGUJIAN:', err.message);
    process.exit(1);
  } finally {
    if (phpServer) phpServer.kill();
  }
})();
