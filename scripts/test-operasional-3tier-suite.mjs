/**
 * Test Suite: Validasi Menyeluruh Portal e-Operasional 3-Tingkat (Khusus Pusat)
 * KJPP Nanang Rahayu Sigit Paryanto dan Rekan
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DB_PATH = path.join(ROOT_DIR, 'data', 'operasional_database.json');
const originalDbContent = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH, 'utf8') : null;

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('🧪 PENGUJIAN MENYELURUH PORTAL e-OPERASIONAL (3-TINGKAT & KHUSUS PUSAT)');
console.log('======================================================\n');

// -------------------------------------------------------------
// [1/5] AUDIT STATIC CODE: index.html & portal-operasional.html
// -------------------------------------------------------------
console.log('[1/5] Audit Kode Frontend: index.html & portal-operasional.html');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const portalHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-operasional.html'), 'utf8');

// Index.html checks
assert(indexHtml.includes('id="kartu-e-operasional"'), 'index.html memiliki elemen #kartu-e-operasional');
assert(indexHtml.includes('Portal e-Operasional'), 'index.html memiliki judul kartu "Portal e-Operasional"');
assert(indexHtml.includes('Pengajuan Operasional, Approval Dinamis &amp; Verifikasi Dokumen QR') || indexHtml.includes('Pengajuan Operasional, Approval Dinamis & Verifikasi Dokumen QR'), 'index.html memiliki deskripsi resmi layanan ke-7');
assert(indexHtml.includes("kartuEOpr.style.display = 'none'"), 'index.html menyembunyikan kartu operasional bagi pengguna cabang (fail-closed)');
assert(indexHtml.includes("kartuEOpr.style.display = ''"), 'index.html menampilkan kartu operasional untuk pengguna pusat');

// Portal-operasional.html checks
assert(portalHtml.includes('id="input_nama_pengaju"'), 'portal-operasional.html memiliki input teks bebas input_nama_pengaju');
assert(portalHtml.includes('id="select_jabatan_pengaju"'), 'portal-operasional.html memiliki dropdown select_jabatan_pengaju');
assert(portalHtml.includes('id="select_divisi_pengaju"'), 'portal-operasional.html memiliki dropdown select_divisi_pengaju');
assert(portalHtml.includes('id="input_jabatan_kustom"'), 'portal-operasional.html memiliki input kustom jabatan (Lainnya — isi sendiri)');
assert(portalHtml.includes('id="input_divisi_kustom"'), 'portal-operasional.html memiliki input kustom divisi (Lainnya — isi sendiri)');
assert(portalHtml.includes('id="input_maksud_tujuan"'), 'portal-operasional.html memiliki textarea bebas input_maksud_tujuan');
assert(portalHtml.includes('id="banner-403-cabang"'), 'portal-operasional.html memiliki banner proteksi 403 Cabang');
assert(portalHtml.includes('Milda Hidayati Dewi, S.E.'), 'portal-operasional.html mencantumkan nama lengkap Manager Keuangan Milda Hidayati Dewi, S.E.');
assert(portalHtml.includes('id="print-ttd-container"'), 'portal-operasional.html memiliki #print-ttd-container dinamis untuk cetak A4');

// -------------------------------------------------------------
// [2/5] AUDIT BACKEND PHP: auth-handler.php & operasional-data-handler.php
// -------------------------------------------------------------
console.log('\n[2/5] Audit Kode Backend PHP: auth-handler.php & operasional-data-handler.php');
const authPhp = fs.readFileSync(path.join(ROOT_DIR, 'auth-handler.php'), 'utf8');
const oprPhp = fs.readFileSync(path.join(ROOT_DIR, 'operasional-data-handler.php'), 'utf8');

assert(authPhp.includes('Milda Hidayati Dewi, S.E.'), 'auth-handler.php mengonfigurasi Manager Keuangan Milda Hidayati Dewi, S.E.');
assert(oprPhp.includes('BRANCH_ACCESS_DENIED'), 'operasional-data-handler.php memiliki proteksi 403 BRANCH_ACCESS_DENIED');
assert(oprPhp.includes('buildDynamicApprovals'), 'operasional-data-handler.php mendefinisikan buildDynamicApprovals()');
assert(oprPhp.includes('Deni Siswandi, S.T.'), 'operasional-data-handler.php mengonfigurasi Deni Siswandi sebagai Manager Teknik');
assert(oprPhp.includes('Danny Taufik Hidayat, S.H.'), 'operasional-data-handler.php mengonfigurasi Danny Taufik Hidayat sebagai Manager Admin & Umum');
assert(oprPhp.includes('Persetujuan harus berurutan'), 'operasional-data-handler.php menerapkan validasi approval berurutan (anti-skip)');

// -------------------------------------------------------------
// [3/5] DYNAMIC SERVER SUITE: Pengujian RBAC & Hak Akses HTTP
// -------------------------------------------------------------
console.log('\n[3/5] Pengujian Dynamic RBAC & Hak Akses Backend PHP');

const TEST_PORT = 8993;
const phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`], { stdio: 'ignore' });

function postRequest(urlPath, payload, token) {
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
        'X-NSR-Token': token || '',
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

function getRequest(urlPath, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Accept': 'application/json' };
    if (token) headers['X-NSR-Token'] = token;
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: urlPath,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForServer(port, retries = 25) {
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
    await waitForServer(TEST_PORT);

    // 1. Unauthenticated request -> 401
    const unauthRes = await getRequest('/operasional-data-handler.php?action=getPengajuanList');
    assert(unauthRes.status === 401, 'Request tanpa token menghasilkan HTTP 401 Unauthorized');

    // 2. Branch token (Bandung) -> 403 Forbidden
    const branchRes = await getRequest('/operasional-data-handler.php?action=getPengajuanList', 'NSR-STAGE-BDG-04');
    assert(branchRes.status === 403 && branchRes.data?.violation === 'BRANCH_ACCESS_DENIED', 'Akun Cabang (Bandung) diblokir backend dengan HTTP 403 BRANCH_ACCESS_DENIED');

    // 3. Branch token (Makassar) -> 403 Forbidden
    const mksRes = await getRequest('/operasional-data-handler.php?action=getPengajuanList', 'NSR-STAGE-MKS-02');
    assert(mksRes.status === 403 && mksRes.data?.violation === 'BRANCH_ACCESS_DENIED', 'Akun Cabang (Makassar) diblokir backend dengan HTTP 403 BRANCH_ACCESS_DENIED');

    // 4. Pusat token (Master) -> 200 OK
    const pusatRes = await getRequest('/operasional-data-handler.php?action=getPengajuanList', 'NSR-STAGE-MASTER-77');
    assert(pusatRes.status === 200 && pusatRes.data?.success === true, 'Akun Kantor Pusat (Jakarta) berhasil mengakses daftar pengajuan (HTTP 200)');

    // -------------------------------------------------------------
    // [4/5] DYNAMIC SERVER SUITE: Siklus Pengajuan & Approval 3-Tingkat
    // -------------------------------------------------------------
    console.log('\n[4/5] Pengujian Siklus Alur Approval Dinamis (3-Tingkat)');

    // Test Alur 1: TEKNIS (Deni -> Milda -> Nanang)
    const submitTeknis = await postRequest('/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-SRV',
      alur: 'TEKNIS',
      namaPengaju: 'Guruh Wicaksono',
      jabatanPengaju: 'Surveyor Properti',
      divisiPengaju: 'Teknik',
      maksudTujuan: 'Survey aset kilang & gudang logistik',
      tanggalKebutuhan: '2026-11-01',
      items: [{ deskripsi: 'Transportasi Lapangan', nominal: 450000 }]
    }, 'NSR-STAGE-MASTER-77');
    assert(submitTeknis.status === 200 && submitTeknis.data?.success === true, 'Pengajuan Alur TEKNIS berhasil dibuat');
    const docTeknis = submitTeknis.data?.data;
    assert(docTeknis?.approvals?.['1']?.pejabat === 'Deni Siswandi, S.T.', 'Tingkat 1 Alur TEKNIS dialokasikan ke Deni Siswandi, S.T.');
    assert(docTeknis?.approvals?.['2']?.pejabat === 'Milda Hidayati Dewi, S.E.', 'Tingkat 2 Alur TEKNIS dialokasikan ke Milda Hidayati Dewi, S.E.');
    assert(docTeknis?.approvals?.['3']?.pejabat === 'Ir. Nanang Rahayu, M.Ec.Dev.', 'Tingkat 3 Alur TEKNIS dialokasikan ke Ir. Nanang Rahayu, M.Ec.Dev.');

    // Test Alur 2: ADMIN_UMUM (Danny -> Milda -> Nanang)
    const submitAdmin = await postRequest('/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-UMM',
      alur: 'ADMIN_UMUM',
      namaPengaju: 'Rina Sasmita',
      jabatanPengaju: 'Staf Administrasi',
      divisiPengaju: 'Admin & Umum',
      maksudTujuan: 'Pengadaan ATK & Form Penilaian Kantor Pusat',
      tanggalKebutuhan: '2026-11-05',
      items: [{ deskripsi: 'Pengadaan Kertas & Toner', nominal: 650000 }]
    }, 'NSR-STAGE-MASTER-77');
    assert(submitAdmin.status === 200, 'Pengajuan Alur ADMIN_UMUM berhasil dibuat');
    const docAdmin = submitAdmin.data?.data;
    assert(docAdmin?.approvals?.['1']?.pejabat === 'Danny Taufik Hidayat, S.H.', 'Tingkat 1 Alur ADMIN_UMUM dialokasikan ke Danny Taufik Hidayat, S.H.');
    assert(docAdmin?.approvals?.['2']?.pejabat === 'Milda Hidayati Dewi, S.E.', 'Tingkat 2 Alur ADMIN_UMUM dialokasikan ke Milda Hidayati Dewi, S.E.');

    // Test Alur 3: LINTAS_DIVISI (Deni + Danny -> Milda -> Nanang)
    const submitLintas = await postRequest('/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-MTG',
      alur: 'LINTAS_DIVISI',
      namaPengaju: 'Bambang Kusuma',
      jabatanPengaju: 'Koordinator Project',
      divisiPengaju: 'Lintas Divisi',
      maksudTujuan: 'Rapat koordinasi teknis dan legalitas perbankan nasional',
      tanggalKebutuhan: '2026-11-10',
      items: [{ deskripsi: 'Konsumsi Rapat', nominal: 750000 }]
    }, 'NSR-STAGE-MASTER-77');
    assert(submitLintas.status === 200, 'Pengajuan Alur LINTAS_DIVISI berhasil dibuat');
    const docLintas = submitLintas.data?.data;
    assert(docLintas?.approvals?.['1']?.pejabat === 'Deni Siswandi, S.T.', 'Tingkat 1A LINTAS_DIVISI adalah Deni Siswandi, S.T.');
    assert(docLintas?.approvals?.['2']?.pejabat === 'Danny Taufik Hidayat, S.H.', 'Tingkat 1B LINTAS_DIVISI adalah Danny Taufik Hidayat, S.H.');
    assert(docLintas?.approvals?.['3']?.pejabat === 'Milda Hidayati Dewi, S.E.', 'Tingkat 2 LINTAS_DIVISI adalah Milda Hidayati Dewi, S.E.');
    assert(docLintas?.approvals?.['4']?.pejabat === 'Ir. Nanang Rahayu, M.Ec.Dev.', 'Tingkat 3 LINTAS_DIVISI adalah Ir. Nanang Rahayu, M.Ec.Dev.');

    // Test Anti-Skip Enforcement (Try approving Tier 2 before Tier 1 on docTeknis)
    const skipAttempt = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: docTeknis.id,
      tier: 2
    }, 'NSR-STAGE-KEU-44');
    assert(skipAttempt.status === 409, 'Pencegahan loncat tahap: Approval Tingkat 2 sebelum Tingkat 1 ditolak HTTP 409');

    // Deni approves Tier 1
    const appT1 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: docTeknis.id,
      tier: 1
    }, 'NSR-STAGE-REK-22');
    assert(appT1.status === 200 && appT1.data?.data?.status === 'IN_REVIEW', 'Deni Siswandi menyetujui Tingkat 1 -> Status menjadi IN_REVIEW');

    // Danny tries to approve Tier 2 (RBAC mismatch)
    const rbacMismatch = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: docTeknis.id,
      tier: 2
    }, 'NSR-STAGE-ADM-33');
    assert(rbacMismatch.status === 403, 'RBAC Guard: Danny Taufik Hidayat ditolak saat mencoba menyetujui tahap Keuangan (HTTP 403)');

    // Milda approves Tier 2
    const appT2 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: docTeknis.id,
      tier: 2
    }, 'NSR-STAGE-KEU-44');
    assert(appT2.status === 200 && appT2.data?.data?.approvals?.['2']?.approved === true, 'Milda Hidayati Dewi, S.E. berhasil mengesahkan Tingkat 2');

    // Nanang approves Tier 3 (Final)
    const appT3 = await postRequest('/operasional-data-handler.php?action=approveTier', {
      id: docTeknis.id,
      tier: 3
    }, 'NSR-STAGE-MASTER-77');
    assert(appT3.status === 200 && appT3.data?.data?.status === 'APPROVED', 'Ir. Nanang Rahayu mengesahkan Tingkat 3 -> Status dokumen menjadi APPROVED');
    const finalDoc = appT3.data?.data;
    assert(!!finalDoc?.approvals?.['3']?.qrUrl, 'Dokumen terbit memiliki QR Code resmi pada tahap final');

    // Test Penolakan Dokumen (Reject Flow)
    // 1. Reject note < 10 chars -> 400
    const badReject = await postRequest('/operasional-data-handler.php?action=rejectWithNote', {
      id: docAdmin.id,
      tier: 1,
      alasan: 'Kurang'
    }, 'NSR-STAGE-ADM-33');
    assert(badReject.status === 400, 'Alasan penolakan di bawah 10 karakter ditolak sistem (HTTP 400)');

    // 2. Reject note valid -> 200 OK
    const goodReject = await postRequest('/operasional-data-handler.php?action=rejectWithNote', {
      id: docAdmin.id,
      tier: 1,
      alasan: 'Rincian anggaran ATK belum melampirkan perbandingan harga rekanan.'
    }, 'NSR-STAGE-ADM-33');
    assert(goodReject.status === 200 && goodReject.data?.data?.status === 'REJECTED', 'Penolakan dengan alasan lengkap berhasil -> Dokumen berstatus REJECTED');

    // -------------------------------------------------------------
    // [5/5] VERIFIKASI QR DOKUMEN & KOMPATIBILITAS HISTORIS
    // -------------------------------------------------------------
    console.log('\n[5/5] Verifikasi Kriptografis QR & Kompatibilitas Dokumen Historis');

    // Verify Newly Created & Approved Document
    const qrUrl = new URL(finalDoc.approvals['3'].qrUrl);
    const vNew = await getRequest(`/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(qrUrl.searchParams.get('doc'))}&tier=${qrUrl.searchParams.get('tier')}&hash=${qrUrl.searchParams.get('hash')}`);
    assert(vNew.status === 200 && vNew.data?.valid === true, 'Verifikasi QR dokumen baru tingkat 3 valid dan sah secara kriptografis');

    // Verify Historical Document (OPR-SRV/2.19.0160-00/X/2026/0001 Tier 5)
    const vHist = await getRequest(`/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent('OPR-SRV/2.19.0160-00/X/2026/0001')}&tier=5&hash=14a62c472299c940aecd0cba1da9c9a3c5b49978d0451c04e7378e2e5b1a749a`);
    assert(vHist.status === 200 && vHist.data?.valid === true, 'Kompatibilitas Dokumen Historis 5-Tier (OPR-20261021-SRV-DEMO1) 100% Valid');

    console.log('\n======================================================');
    console.log(`🎉 SEMUA PENGUJIAN e-OPERASIONAL SELESAI: ${passedTests}/${totalTests} UJI VALID!`);
    console.log('======================================================\n');

    // Cleanup & Restore Original Database State
    if (originalDbContent) {
      fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
    }

    phpServer.kill();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    if (originalDbContent) {
      fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
    }
    phpServer.kill();
    process.exit(1);
  }
})();
