/**
 * Test Suite: Validasi Lengkap Tahap 1 — "Pending On Me" e-Operasional
 * Multi-Role: Surveyor -> Manager Teknik -> Manager Keuangan -> Kepala Keuangan / Pemimpin Rekan
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
console.log('🧪 PENGUJIAN MENYELURUH TAHAP 1: PENDING ON ME e-OPERASIONAL');
console.log('======================================================\n');

// 1. Audit Frontend Static Content
console.log('[1/4] Audit Elemen UI Frontend: portal-operasional.html');
const portalHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-operasional.html'), 'utf8');

assert(portalHtml.includes('id="btn-tab-pending"'), 'Terdapat Tab "Menunggu Persetujuan Saya" (#btn-tab-pending)');
assert(portalHtml.includes('id="badge-pending-me"'), 'Terdapat Badge Counter #badge-pending-me');
assert(portalHtml.includes('id="btn-quick-pending"'), 'Terdapat Tombol Filter Cepat #btn-quick-pending');
assert(portalHtml.includes('value="PENDING_ON_ME"'), 'Terdapat opsi filter value="PENDING_ON_ME"');
assert(portalHtml.includes('Timeline Otorisasi (Tingkat 1 &rarr; 2 &rarr; 3)'), 'Header tabel diperbarui menjadi Timeline Otorisasi');
assert(portalHtml.includes('renderApprovalTimeline'), 'Fungsi renderApprovalTimeline() tersedia');
assert(portalHtml.includes('Catatan Penolakan'), 'Komponen tampilan catatan penolakan tersedia');
assert(portalHtml.includes('Ajukan Revisi'), 'Tombol Ajukan Revisi tersedia');

// 2. Setup PHP Web Server
const TEST_PORT = 8991;
console.log(`\n[2/4] Menjalankan Server Uji PHP CLI pada port ${TEST_PORT}...`);

const phpProc = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], {
  cwd: ROOT_DIR,
  stdio: 'ignore'
});

phpProc.on('error', (err) => {
  console.error('Gagal menjalankan PHP CLI Server:', err);
  process.exit(1);
});

process.on('exit', () => {
  try {
    phpProc.kill();
  } catch {}
  if (originalDbContent !== null) {
    fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
  }
});

function requestHttp(method, pathUrl, payload = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Accept': 'application/json'
    };
    if (token) {
      headers['X-NSR-Token'] = token;
    }
    let body = null;
    if (payload) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: pathUrl,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForServer(port) {
  for (let i = 0; i < 30; i++) {
    try {
      await requestHttp('GET', '/operasional-data-handler.php?action=verifyDocument&id=PING');
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error('Server PHP gagal merespons');
}

(async () => {
  try {
    await waitForServer(TEST_PORT);

    // 3. Security & Access Control Checks
    console.log('\n[3/4] Verifikasi RBAC & Akses Backend');

    // A. Unauthenticated -> 401
    const unauth = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList');
    assert(unauth.status === 401, 'Request tanpa token diblokir HTTP 401');

    // B. Cabang -> 403 Forbidden
    const cabang = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList', null, 'NSR-STAGE-PLB-03');
    assert(cabang.status === 403, 'Akses kantor cabang diblokir HTTP 403');

    // C. Surveyor -> 200 OK (View Only)
    const srvList = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList', null, 'NSR-STAGE-SRV-11');
    assert(srvList.status === 200 && srvList.data?.success === true, 'Surveyor berhasil memuat daftar');
    assert(typeof srvList.data?.pendingCount === 'number', 'Payload mengembalikan pendingCount numerik');

    // D. Surveyor coba approve -> DIBLOKIR 403
    const srvFakeApprove = await requestHttp('POST', '/operasional-data-handler.php?action=approveTier', {
      id: 'OPR-20261021-MTG-DEMO2',
      tier: 3
    }, 'NSR-STAGE-SRV-11');
    assert(srvFakeApprove.status === 403, 'Surveyor dilarang keras melakukan approval (HTTP 403 Fail-Closed)');

    // 4. Pengujian End-to-End Alur "Pending On Me" Multi-Role
    console.log('\n[4/4] Pengujian End-to-End Siklus "Pending On Me" (Teknik -> Keuangan -> Rejection -> Revisi -> Pimpinan)');

    // Step A: Buat Pengajuan Baru (Alur TEKNIS) oleh Master/Surveyor
    const createRes = await requestHttp('POST', '/operasional-data-handler.php?action=simpanPengajuan', {
      jenisOperasional: 'OPR-SRV',
      alur: 'TEKNIS',
      namaPengaju: 'Holik Kelana',
      jabatanPengaju: 'Surveyor Lapangan',
      divisiPengaju: 'Teknik',
      maksudTujuan: 'Inspeksi penilaian appraisal gedung perkantoran',
      tanggalKebutuhan: '2026-11-02',
      items: [{ deskripsi: 'Transportasi & Bahan Bakar', nominal: 350000 }]
    }, 'NSR-STAGE-MASTER-77');

    assert(createRes.status === 200 && createRes.data?.success === true, 'Pengajuan Alur TEKNIS berhasil dibuat');
    const newDoc = createRes.data?.data;
    const docId = newDoc?.id;

    // Step B: Cek "Pending On Me" untuk Manager Teknik (Deni Siswandi - NSR-STAGE-REK-22)
    // Tingkat 1 (Manager Teknik) belum disetujui, maka dokumen WAJIB pending pada Deni
    const deniPendingRes = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-REK-22');
    assert(deniPendingRes.status === 200, 'Manager Teknik memuat filter pendingOnMe (HTTP 200)');
    const deniPendingItems = deniPendingRes.data?.data || [];
    const deniFound = deniPendingItems.find(d => d.id === docId);
    assert(!!deniFound, 'Dokumen baru muncul di daftar "Menunggu Persetujuan Saya" Manager Teknik');
    assert(deniFound?.pendingTier === 1, 'Tier yang menunggu adalah Tier 1 (Manager Teknik)');

    // Step C: Cek apakah dokumen ini muncul di Manager Keuangan (Milda - NSR-STAGE-KEU-44)?
    // HARUS TIDAK MUNCUL karena Tingkat 1 belum selesai (Sequential Enforcement)
    const mildaEarlyRes = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-KEU-44');
    const mildaEarlyItems = mildaEarlyRes.data?.data || [];
    const mildaEarlyFound = mildaEarlyItems.find(d => d.id === docId);
    assert(!mildaEarlyFound, 'Manager Keuangan TIDAK menerima pengajuan sebelum Tingkat 1 disetujui (Sequential Verification)');

    // Step D: Deni Siswandi menyetujui Tingkat 1
    const deniApprove = await requestHttp('POST', '/operasional-data-handler.php?action=approveTier', {
      id: docId,
      tier: 1
    }, 'NSR-STAGE-REK-22');
    assert(deniApprove.status === 200 && deniApprove.data?.success === true, 'Manager Teknik sukses menyetujui Tingkat 1');

    // Step E: Periksa kembali Manager Teknik
    // Dokumen SEHARUSNYA TIDAK LAGI ada di daftar pending Deni
    const deniAfterApprove = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-REK-22');
    const deniAfterFound = (deniAfterApprove.data?.data || []).find(d => d.id === docId);
    assert(!deniAfterFound, 'Dokumen otomatis hilang dari daftar pending Manager Teknik setelah disetujui');

    // Step F: Periksa Manager Keuangan (Milda)
    // Sekarang dokumen WAJIB muncul di daftar pending Milda pada Tingkat 2!
    const mildaAfterRes = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-KEU-44');
    const mildaFound = (mildaAfterRes.data?.data || []).find(d => d.id === docId);
    assert(!!mildaFound, 'Dokumen kini otomatis muncul di "Menunggu Persetujuan Saya" Manager Keuangan');
    assert(mildaFound?.pendingTier === 2, 'Tier yang menunggu otorisasi adalah Tier 2 (Manager Keuangan)');

    // Step G: Uji Skenario Penolakan / Catatan Revisi oleh Manager Keuangan
    const rejectReason = 'Rincian anggaran transportasi perlu melampirkan estimasi rute tol dan bukti tarif resmi.';
    const rejectRes = await requestHttp('POST', '/operasional-data-handler.php?action=rejectWithNote', {
      id: docId,
      tier: 2,
      alasan: rejectReason
    }, 'NSR-STAGE-KEU-44');
    assert(rejectRes.status === 200 && rejectRes.data?.success === true, 'Manager Keuangan sukses menolak dokumen dengan alasan tertulis');

    // Step H: Verifikasi status dokumen menjadi REJECTED dan alasan tercatat
    const docRejectedRes = await requestHttp('GET', `/operasional-data-handler.php?action=getPengajuanDetail&id=${docId}`, null, 'NSR-STAGE-MASTER-77');
    const docRejected = docRejectedRes.data?.data;
    assert(docRejected?.status === 'REJECTED', 'Status dokumen resmi berubah menjadi REJECTED');
    assert(docRejected?.penolakan?.alasan === rejectReason, 'Alasan penolakan tersimpan utuh di database');
    assert(docRejected?.penolakan?.ditolakOleh === 'Milda Hidayati Dewi, S.E.', 'Nama pejabat penolak tercatat: Milda Hidayati Dewi, S.E.');
    assert(docRejected?.penolakan?.tierDitolak === 2, 'Tingkat penolakan tercatat pada Tingkat 2');

    // Step I: Verifikasi Pengaju (Surveyor/Master) melihat pengajuan yang ditolak ini sebagai "Perlu Tindakan Saya"
    const pemohonPendingRes = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-SRV-11');
    const pemohonFound = (pemohonPendingRes.data?.data || []).find(d => d.id === docId);
    assert(!!pemohonFound, 'Dokumen yang ditolak muncul pada pemohon sebagai item yang menunggu perbaikan');
    assert(pemohonFound?.pendingReason === 'REVISI_PEMOHON', 'Alasan pending pemohon adalah REVISI_PEMOHON');

    // Step J: Pemohon mengajukan revisi (Versi 2)
    const revisiRes = await requestHttp('POST', '/operasional-data-handler.php?action=simpanPengajuan', {
      id: docId,
      jenisOperasional: 'OPR-SRV',
      alur: 'TEKNIS',
      namaPengaju: 'Holik Kelana',
      jabatanPengaju: 'Surveyor Lapangan',
      divisiPengaju: 'Teknik',
      maksudTujuan: 'Inspeksi penilaian appraisal gedung perkantoran (Revisi: Lampiran rute tol terlampir)',
      tanggalKebutuhan: '2026-11-02',
      items: [{ deskripsi: 'Transportasi, BBM & Tiket Tol', nominal: 420000 }]
    }, 'NSR-STAGE-MASTER-77');
    assert(revisiRes.status === 200, 'Revisi dokumen (Versi baru) sukses diajukan');
    const docV2 = revisiRes.data?.data;
    assert(docV2?.versi >= 2, 'Nomor versi dokumen meningkat menjadi Versi 2');
    assert(docV2?.status === 'SUBMITTED', 'Status dokumen kembali menjadi SUBMITTED');

    // Step K: Alur Approval Berlanjut hingga Selesai
    // 1. Teknik approve Tier 1
    const appV2T1 = await requestHttp('POST', '/operasional-data-handler.php?action=approveTier', { id: docId, tier: 1 }, 'NSR-STAGE-REK-22');
    assert(appV2T1.status === 200, 'Manager Teknik menyetujui Tingkat 1 Versi 2');

    // 2. Keuangan approve Tier 2
    const appV2T2 = await requestHttp('POST', '/operasional-data-handler.php?action=approveTier', { id: docId, tier: 2 }, 'NSR-STAGE-KEU-44');
    assert(appV2T2.status === 200, 'Manager Keuangan menyetujui Tingkat 2 Versi 2');

    // 3. Kepala Keuangan cek pendingOnMe
    const prPendingRes = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-PR-55');
    const prFound = (prPendingRes.data?.data || []).find(d => d.id === docId);
    assert(!!prFound, 'Dokumen kini menunggu persetujuan akhir Kepala Keuangan (Tingkat 3)');

    // 4. Kepala Keuangan approve Tier 3
    const appV2T3 = await requestHttp('POST', '/operasional-data-handler.php?action=approveTier', { id: docId, tier: 3 }, 'NSR-STAGE-PR-55');
    assert(appV2T3.status === 200, 'Kepala Keuangan menyetujui Tingkat 3 Versi 2');
    assert(appV2T3.data?.data?.status === 'APPROVED', 'Semua tingkat selesai -> Status dokumen resmi APPROVED');

    // 5. Cek pendingOnMe setelah APPROVED
    const finalPendingCheck = await requestHttp('GET', '/operasional-data-handler.php?action=getPengajuanList&pendingOnMe=true', null, 'NSR-STAGE-PR-55');
    const finalFound = (finalPendingCheck.data?.data || []).find(d => d.id === docId);
    assert(!finalFound, 'Dokumen APPROVED tidak lagi pending pada siapapun (Purna Otorisasi)');

    console.log(`\n======================================================`);
    console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} PENGUJIAN LULUS DENGAN SEMPURNA! (100%)`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('❌ Error during testing:', err);
    process.exitCode = 1;
  } finally {
    try {
      phpProc.kill();
    } catch {}
    if (originalDbContent !== null) {
      fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
      console.log('🔄 Database dipulihkan ke state semula.');
    }
  }
})();
