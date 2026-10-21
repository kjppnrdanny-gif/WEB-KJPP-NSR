import fs from 'fs';
import path from 'path';
import vm from 'vm';
import http from 'http';
import { spawn } from 'child_process';

console.log('======================================================');
console.log('🧪 PENGUJIAN MENYELURUH TAHAP 3: INTEGRASI STATUS ANTARPORTAL');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, desc) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

// -----------------------------------------------------------------------------
// [1/8] AUDIT ELEMEN UI FRONTEND: portal-penugasan-jo.html
// -----------------------------------------------------------------------------
console.log('[1/8] Audit Elemen UI Frontend: portal-penugasan-jo.html');
const html = fs.readFileSync(path.join(process.cwd(), 'portal-penugasan-jo.html'), 'utf-8');

assert(html.includes('id="modal-status-terintegrasi"'), 'Modal Status Terintegrasi tersedia (#modal-status-terintegrasi)');
assert(html.includes('id="modal-status-subtitle"'), 'Subtitle Modal Status (#modal-status-subtitle)');
assert(html.includes('id="grid-status-4-portal"'), 'Container Grid 4 Portal (#grid-status-4-portal)');
assert(html.includes('id="card-status-penugasan"'), 'Kartu Status 1: Penugasan/JO (#card-status-penugasan)');
assert(html.includes('id="card-status-nolap"'), 'Kartu Status 2: NoLap (#card-status-nolap)');
assert(html.includes('id="card-status-operasional"'), 'Kartu Status 3: e-Operasional (#card-status-operasional)');
assert(html.includes('id="card-status-kwitansi"'), 'Kartu Status 4: Kwitansi (#card-status-kwitansi)');
assert(html.includes('onclick="bukaModalStatusTerintegrasi('), 'Tombol pemanggil bukaModalStatusTerintegrasi terpasang di baris tabel');
assert(html.includes('onclick="tutupModalStatusTerintegrasi()"'), 'Tombol penutup modal tutupModalStatusTerintegrasi terpasang');

// -----------------------------------------------------------------------------
// [2/8] AUDIT MASA_BERLAKU_LP: JANGAN SAMAKAN KONTRAK DENGAN SLA LAPORAN
// -----------------------------------------------------------------------------
console.log('\n[2/8] Audit Masa_Berlaku_LP vs SLA Target Penyelesaian');

// Setup VM untuk pengujian fungsi client
const domStore = {};
function createMockElement(id, tag = 'div') {
  return {
    id, tagName: tag.toUpperCase(),
    value: id.startsWith('filter_') ? 'ALL' : '',
    textContent: '', innerHTML: '',
    classList: { classes: new Set(), add(...c){c.forEach(x=>this.classes.add(x))}, remove(...c){c.forEach(x=>this.classes.delete(x))}, contains(c){return this.classes.has(c)} }
  };
}
const mockDocument = {
  getElementById(id){ if (!domStore[id]) domStore[id] = createMockElement(id); return domStore[id]; },
  querySelector(sel){ return createMockElement(sel); },
  addEventListener(){}
};

const sandbox = {
  console, document: mockDocument,
  localStorage: { getItem(){return null}, setItem(){}, removeItem(){} },
  sessionStorage: { getItem(){return null}, setItem(){}, removeItem(){} },
  location: { hostname: 'localhost', href: '', search: '' },
  URLSearchParams,
  window: { location: { search: '' }, localStorage: { getItem(){return null} }, sessionStorage: {}, URLSearchParams, CURRENT_AUTH_SESSION: { valid: true, role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' } },
  Intl, Date, Math, confirm: ()=>true, alert: ()=>{}, serverCounter: {}, DAFTAR_REKENING_NSR: {},
  userSession: { role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' }, ambilDataPrivatCabang: ()=>[]
};
vm.createContext(sandbox);

const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatch[1].replace(/<script\b[^>]*>|<\/script>/gi, '');
vm.runInContext(mainScript, sandbox);

assert(typeof sandbox.getProjectTargetDate === 'function', 'Fungsi getProjectTargetDate() aktif');
assert(typeof sandbox.bukaModalStatusTerintegrasi === 'function', 'Fungsi bukaModalStatusTerintegrasi() aktif');
assert(typeof sandbox.tutupModalStatusTerintegrasi === 'function', 'Fungsi tutupModalStatusTerintegrasi() aktif');
assert(typeof sandbox.resolveLocalIntegratedStatus === 'function', 'Fungsi fallback resolveLocalIntegratedStatus() aktif');

// Uji Pembedaan Masa Berlaku LP vs Target Selesai
const jobOnlyContractValidity = {
  id: 'JOB-KONTRAK-VALID-ONLY',
  status: 'APPROVED',
  masa_berlaku_lp: '2026-11-20', // Masa berlaku kontrak 30 hari
  target_selesai: null,          // Target laporan BELUM ditentukan
  deadline: null
};

const targetHasil = sandbox.getProjectTargetDate(jobOnlyContractValidity);
assert(targetHasil === null, 'getProjectTargetDate mengembalikan null jika hanya ada masa_berlaku_lp (bukan SLA laporan)');

const evaluasiHasil = sandbox.evaluasiDeadlinePenugasan(jobOnlyContractValidity, '2026-10-22');
assert(evaluasiHasil.kategori === 'BELUM_DITENTUKAN', 'Status evaluasi dikategorikan BELUM_DITENTUKAN');
assert(evaluasiHasil.label === 'Belum ditentukan', 'Label evaluasi tampil jujur: "Belum ditentukan"');

// Uji jika target_selesai resmi tersedia
const jobWithOfficialTarget = {
  id: 'JOB-WITH-OFFICIAL-TARGET',
  status: 'APPROVED',
  masa_berlaku_lp: '2026-11-20',
  target_selesai: '2026-10-25' // Target laporan resmi H-3
};
const targetResmi = sandbox.getProjectTargetDate(jobWithOfficialTarget);
assert(targetResmi === '2026-10-25', 'Target resmi terbaca akurat: 2026-10-25');
const evResmi = sandbox.evaluasiDeadlinePenugasan(jobWithOfficialTarget, '2026-10-22');
assert(evResmi.kategori === 'DEADLINE_NEAR', 'Target resmi dievaluasi sebagai DEADLINE_NEAR');

// -----------------------------------------------------------------------------
// [3/8] PENGUJIAN BACKEND API PHP: status-terintegrasi-handler.php
// -----------------------------------------------------------------------------
console.log('\n[3/8] Setup Server Uji PHP CLI & Pengujian API Backend');

const TEST_PORT = 8993;
const phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, 'router.php'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(r => setTimeout(r, 1000));

async function apiRequest(path, options = {}) {
  const url = `http://127.0.0.1:${TEST_PORT}${path}`;
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

try {
  // 1. Uji Fail-Closed: Request tanpa token autentikasi
  const resNoAuth = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415');
  assert(resNoAuth.status === 401, 'Request tanpa autentikasi ditolak HTTP 401 Unauthorized');
  assert(resNoAuth.data.success === false, 'Response success = false saat unauthenticated');

  // 2. Uji Penugasan dengan 4 Modul Lengkap (Pusat / Super Admin)
  // Buat data uji di direktori data jika belum ada untuk pembuktian
  const resComplete = await apiRequest('/api/status-terintegrasi-proxy?id=0416/LP/NSR/X/2026&noSpk=0416/LP/NSR/X/2026&noJo=0416/JO/NSR/X/2026', {
    headers: { 'Authorization': 'Bearer 16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' }
  });

  assert(resComplete.status === 200, 'Admin Pusat berhasil memuat status penugasan (HTTP 200)');
  assert(resComplete.data.success === true, 'Response API bernilai success: true');
  assert(typeof resComplete.data.nolap === 'object', 'Data NoLap tersedia dalam response');
  assert(typeof resComplete.data.operasional === 'object', 'Data e-Operasional tersedia dalam response');
  assert(typeof resComplete.data.kwitansi === 'object', 'Data Kwitansi tersedia dalam response');

  // ---------------------------------------------------------------------------
  // [4/8] PENGUJIAN INDEPENDENSI STATUS MODUL & TANPA DATA (BELUM TERHUBUNG)
  // ---------------------------------------------------------------------------
  console.log('\n[4/8] Uji Independensi Modul & Penanganan Data Belum Terhubung');

  const resUnlinked = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-UNLINKED-999&noSpk=SPK-UNLINKED-999&noJo=JO-UNLINKED-999', {
    headers: { 'Authorization': 'Bearer 16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' }
  });

  assert(resUnlinked.status === 200, 'Penugasan tanpa dokumen eksternal tetap merespons HTTP 200 (Independen)');
  assert(resUnlinked.data.nolap.terhubung === false, 'NoLap terhubung = false jika tidak ada data cocok');
  assert(resUnlinked.data.nolap.statusUtama === 'Belum Terhubung', 'Label NoLap = "Belum Terhubung"');
  assert(resUnlinked.data.operasional.terhubung === false, 'e-Operasional terhubung = false jika belum ada pengajuan biaya');
  assert(resUnlinked.data.operasional.statusUtama === 'Belum Ada Pengajuan Biaya', 'Label e-Operasional = "Belum Ada Pengajuan Biaya"');
  assert(resUnlinked.data.kwitansi.terhubung === false, 'Kwitansi terhubung = false jika belum ada kwitansi');
  assert(resUnlinked.data.kwitansi.statusUtama === 'Belum Ada Kwitansi', 'Label Kwitansi = "Belum Ada Kwitansi"');

  // ---------------------------------------------------------------------------
  // [5/8] ANTI-PENCOCOKAN SEMBARANGAN (STRICT ID MATCHING AUDIT)
  // ---------------------------------------------------------------------------
  console.log('\n[5/8] Audit Anti-Pencocokan Sembarangan (Strict Official ID Matching)');

  // Percobaan mencocokkan hanya dengan nama klien yang sama tanpa ID resmi
  const resFuzzyAttempt = await apiRequest('/api/status-terintegrasi-proxy?id=RANDOM-ID-001&namaKlien=PT%20Semen%20Padang', {
    headers: { 'Authorization': 'Bearer 16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' }
  });
  assert(resFuzzyAttempt.data.nolap.terhubung === false, 'Data TIDAK terhubung hanya karena nama klien sama (Anti-Fuzzy Match)');
  assert(resFuzzyAttempt.data.kwitansi.terhubung === false, 'Kwitansi TIDAK terhubung hanya karena kesamaan klien/nominal');

  // ---------------------------------------------------------------------------
  // [6/8] ANTI-ASUMSI "LUNAS" PADA KWITANSI
  // ---------------------------------------------------------------------------
  console.log('\n[6/8] Audit Anti-Asumsi Lunas pada Kwitansi');

  const resKwCheck = await apiRequest('/api/status-terintegrasi-proxy?id=SPK-PLB-2026-001&noSpk=SPK-PLB-2026-001', {
    headers: { 'Authorization': 'Bearer 16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' }
  });

  if (resKwCheck.data.kwitansi.terhubung && resKwCheck.data.kwitansi.items.length > 0) {
    const kwItem = resKwCheck.data.kwitansi.items[0];
    assert(kwItem.status === 'DISAHKAN', 'Kwitansi memiliki status dokumen DISAHKAN');
    assert(kwItem.statusLabel === 'Kwitansi Resmi Diterbitkan', 'Label dokumen adalah "Kwitansi Resmi Diterbitkan"');
    assert(kwItem.statusPembayaran.includes('Menunggu Konfirmasi') || kwItem.statusPembayaran.includes('Rekening'), 
      'Kwitansi disahkan TIDAK otomatis dilabeli Lunas tanpa rekonsiliasi mutasi rekening');
  } else {
    console.log('  ℹ Kwitansi item tidak ditemukan di data statis, melewati sub-assert');
  }

  // ---------------------------------------------------------------------------
  // [7/8] KEAMANAN DATA ANTAR-CABANG (RBAC) & SENSOR NOMINAL (PENILAI/REVIEWER)
  // ---------------------------------------------------------------------------
  console.log('\n[7/8] Uji RBAC Antar-Cabang & Sensor Nominal untuk Penilai/Reviewer');

  // Cabang Padang mencoba mengakses data cabang Bandung
  const resCabangViolation = await apiRequest('/api/status-terintegrasi-proxy?id=BDG-001&noSpk=SPK-BDG-001&kantorWilayah=Kantor%20Cabang%20Bandung', {
    headers: { 'Authorization': 'Bearer ADMIN_CABANG_PADANG' }
  });
  assert(resCabangViolation.status === 403, 'Akses lintas kantor cabang ditolak HTTP 403 Forbidden');
  assert(resCabangViolation.data.error.includes('Akses Ditolak'), 'Pesan penolakan tegas: hanya berwenang memeriksa cabang sendiri');

  // Cabang Padang mengakses data cabangnya sendiri
  const resCabangOwn = await apiRequest('/api/status-terintegrasi-proxy?id=PDG-001&noSpk=SPK-PDG-001&kantorWilayah=Kantor%20Cabang%20Padang', {
    headers: { 'Authorization': 'Bearer ADMIN_CABANG_PADANG' }
  });
  assert(resCabangOwn.status === 200, 'Cabang Padang diizinkan mengakses data penugasan kantornya sendiri (HTTP 200)');

  // Penilai / Reviewer: Wajib disensor nominal keuangannya
  const resPenilai = await apiRequest('/api/status-terintegrasi-proxy?id=SPK/ITB/2026/012&noSpk=SPK/ITB/2026/012', {
    headers: { 'Authorization': 'Bearer PENILAI' }
  });
  assert(resPenilai.status === 200, 'Akun Penilai dapat mengakses status penugasan (HTTP 200)');
  assert(resPenilai.data.aksesPengguna.canSeeFee === false, 'Hak akses melihat fee untuk Penilai adalah false');

  if (resPenilai.data.kwitansi.items.length > 0) {
    const kwPenilai = resPenilai.data.kwitansi.items[0];
    assert(kwPenilai.isFeeMasked === true, 'Flag isFeeMasked = true untuk Penilai pada Kwitansi');
    assert(kwPenilai.totalBayar.includes('Akses Terbatas'), 'Nominal Kwitansi disensor: "[Akses Terbatas: Sesuai Kebijakan Peran]"');
  }

  // ---------------------------------------------------------------------------
  // [8/8] INTEGRASI CLIENT-SIDE: bukaModalStatusTerintegrasi PADA DOM
  // ---------------------------------------------------------------------------
  console.log('\n[8/8] Uji Render Modal & Integrasi Client-Side');

  const testProject = {
    id: 'NSR-TEST-INT-001',
    status: 'APPROVED',
    nomor_lp: '0415/LP/NSR/X/2026',
    nomor_adm: '0415/JO/NSR/X/2026',
    pemberi_tugas_nama: 'PT Bank Mandiri (Persero) Tbk',
    debitur_nama: 'PT Maju Bersama',
    kantor_wilayah: 'Kantor Pusat Jakarta',
    penilai_nama: 'Tedi Setiadi',
    reviewer_nama: 'Nanang Rahayu'
  };

  sandbox.projectDatabase = [testProject];
  vm.runInContext(`projectDatabase = [${JSON.stringify(testProject)}];`, sandbox);

  // Panggil bukaModalStatusTerintegrasi
  await sandbox.bukaModalStatusTerintegrasi('NSR-TEST-INT-001');

  const modalEl = sandbox.document.getElementById('modal-status-terintegrasi');
  assert(!modalEl.classList.contains('hidden'), 'Modal status terintegrasi berhasil terbuka (hidden class removed)');

  const cardJoHtml = sandbox.document.getElementById('card-status-penugasan').innerHTML;
  assert(cardJoHtml.includes('0415/LP/NSR/X/2026'), 'Kartu 1 menampilkan No. SPK resmi');
  assert(cardJoHtml.includes('0415/JO/NSR/X/2026'), 'Kartu 1 menampilkan No. JO resmi');

  const cardNolapHtml = sandbox.document.getElementById('card-status-nolap').innerHTML;
  assert(cardNolapHtml.includes('2. BUKU AGENDA NOLAP'), 'Kartu 2 menampilkan header Buku Agenda NoLap');

  const cardOprHtml = sandbox.document.getElementById('card-status-operasional').innerHTML;
  assert(cardOprHtml.includes('3. e-OPERASIONAL'), 'Kartu 3 menampilkan header e-Operasional');

  const cardKwHtml = sandbox.document.getElementById('card-status-kwitansi').innerHTML;
  assert(cardKwHtml.includes('4. KWITANSI'), 'Kartu 4 menampilkan header Kwitansi');

  // Uji Tutup Modal
  sandbox.tutupModalStatusTerintegrasi();
  assert(modalEl.classList.contains('hidden'), 'Modal status terintegrasi berhasil ditutup');

  console.log('\n======================================================');
  console.log(`HASIL AKHIR TAHAP 3 SUITE: ${passedTests} / ${totalTests} PENGUJIAN LULUS SEMPURNA! (100%)`);
  console.log('======================================================');

} finally {
  phpServer.kill();
}
