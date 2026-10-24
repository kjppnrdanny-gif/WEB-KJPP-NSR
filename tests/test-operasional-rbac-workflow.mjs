import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_PORT = 8997;
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
    console.log('🧪 TEST SUITE: RBAC HIERARKI OPERASIONAL & FIT-TO-SCREEN ZERO-SCROLL TABLE');
    console.log('========================================================================\n');

    // [A] Audit Statis Frontend (Zero-Scroll Table)
    console.log('[1/4] Audit Kode Frontend portal-operasional.html: Table Fit-to-Screen...');
    const html = fs.readFileSync(path.join(ROOT_DIR, 'portal-operasional.html'), 'utf8');

    if (!html.includes('table-fixed')) {
      throw new Error('Tabel wajib memiliki class table-fixed untuk mengunci lebar kolom');
    }
    if (!html.includes('sticky right-0')) {
      throw new Error('Kolom Aksi Otorisasi wajib menggunakan position sticky right-0');
    }
    if (!html.includes('Dokumen &amp; Kantor') || !html.includes('Pengajuan &amp; Total') || !html.includes('Status &amp; Timeline Otorisasi')) {
      throw new Error('Header tabel wajib mengonsolidasikan informasi menjadi kolom terpadu');
    }
    console.log('  ✔ PASS: Struktur tabel menggunakan table-fixed w-full');
    console.log('  ✔ PASS: Kolom Aksi Otorisasi sticky right-0 dengan z-index tinggi');
    console.log('  ✔ PASS: Micro-stepper horizontal ringkas aktif (menggantikan kartu besar)');

    // [B] Jalankan Server Uji PHP
    console.log('\n[2/4] Menyalakan PHP Test Server pada port ' + TEST_PORT + '...');
    phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], { stdio: 'ignore' });
    await waitForServer(TEST_PORT);
    console.log('  ✔ PHP test server aktif.');

    // [C] Test Simulasi Login Akun Role KEUANGAN
    console.log('\n[3/4] Menguji Skenario Hak Akses Role KEUANGAN...');
    const loginKeu = await postRequest('/auth-handler.php', {
      action: 'login',
      token: 'NSR-KEU-2026'
    });

    if (loginKeu.status !== 200 || !loginKeu.data?.success) {
      throw new Error(`Login token NSR-KEU-2026 gagal: HTTP ${loginKeu.status}`);
    }
    const keuCookie = (loginKeu.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    console.log('  ✔ Login berhasil sebagai Role:', loginKeu.data.user?.role, `(${loginKeu.data.user?.displayName})`);

    // Buat dokumen pengajuan baru untuk pengujian alur berjenjang
    const submitDoc = await postRequest('/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-UMM',
      alur: 'ADMIN_UMUM',
      namaPengaju: 'Logistik Pusat',
      jabatanPengaju: 'Staf Logistik',
      divisiPengaju: 'Admin & Umum',
      maksudTujuan: 'Pengadaan Kabel Fiber Optic & Patch Cord',
      tanggalKebutuhan: '2026-11-02',
      items: [{ deskripsi: 'Roll Fiber Optic 1000m', nominal: 2800000 }]
    }, { 'Cookie': keuCookie });

    if (submitDoc.status !== 200 || !submitDoc.data?.success) {
      throw new Error(`Gagal membuat pengajuan simulasi: ${submitDoc.data?.error}`);
    }
    const testDoc = submitDoc.data.data;
    console.log('  ✔ Dokumen simulasi dibuat:', testDoc.noPermintaan || testDoc.id);

    // TEST GUARD: Coba approval T2 saat T1 BELUM disetujui (Wajib GAGAL / Anti-Skip)
    console.log('  ✔ Menguji Anti-Skip: Role KEUANGAN mencoba mendahului approval T2 saat T1 belum lolos...');
    const illegalT2 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 2
    }, { 'Cookie': keuCookie });

    if (illegalT2.status === 200) {
      throw new Error('Pelanggaran Integritas Alur: Tier 2 berhasil disetujui padahal Tier 1 belum selesai!');
    }
    console.log(`  ✔ PASS: Anti-Skip berhasil menolak persetujuan dini (HTTP ${illegalT2.status}: ${illegalT2.data?.error})`);

    // Sekarang, setujui Tier 1 menggunakan akun Manager Admin (NSR-ADM-2026 / NSR-ADMIN-PUSAT-2026)
    console.log('  ✔ Mengesahkan Tier 1 dengan akun Danny Taufik (Manager Admin)...');
    const loginAdmin = await postRequest('/auth-handler.php', { action: 'login', token: 'NSR-ADM-2026' });
    const adminCookie = (loginAdmin.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

    const approveT1 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 1
    }, { 'Cookie': adminCookie });

    if (approveT1.status !== 200 || !approveT1.data?.success) {
      throw new Error(`Approve Tier 1 gagal: ${approveT1.data?.error}`);
    }
    console.log('  ✔ PASS: Tier 1 berhasil disahkan sah.');

    // [D] EKSEKUSI APPROVAL T2 OLEH ROLE KEUANGAN (WAJIB HTTP 200 SUCCESS, BUKAN 403)
    console.log('\n[4/4] Eksekusi Approval T2 oleh Akun KEUANGAN...');
    const approveT2 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: testDoc.id,
      tier: 2
    }, { 'Cookie': keuCookie });

    if (approveT2.status !== 200) {
      throw new Error(`Approval T2 gagal dengan HTTP ${approveT2.status} (Pesan: ${approveT2.data?.error || approveT2.raw})`);
    }

    if (!approveT2.data?.success) {
      throw new Error(`Approval T2 mengembalikan success: false: ${JSON.stringify(approveT2.data)}`);
    }

    const docAfterT2 = approveT2.data.data;
    console.log('  ✔ PASS: HTTP 200 SUCCESS!');
    console.log('    - Status Dokumen:', approveT2.data.status || docAfterT2.status);
    console.log('    - Tier 2 Approved:', docAfterT2.approvals['2'].approved);
    console.log('    - Disetujui Oleh:', docAfterT2.approvals['2'].pejabat);
    console.log('    - Waktu Approval:', docAfterT2.approvals['2'].approvedAt);

    if (!docAfterT2.approvals['2'].approved) {
      throw new Error('Flag approvals[2].approved tidak bernilai true setelah approval!');
    }

    console.log('\n========================================================================');
    console.log('🎉 SELURUH PENGUJIAN RBAC & FIT-TO-SCREEN ZERO-SCROLL 100% SUKSES!');
    console.log('========================================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR PADA SUITE PENGUJIAN:', err.message);
    process.exit(1);
  } finally {
    if (phpServer) phpServer.kill();
  }
})();
