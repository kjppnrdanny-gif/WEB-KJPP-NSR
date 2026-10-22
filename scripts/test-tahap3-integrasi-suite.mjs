import fs from 'fs';
import path from 'path';
import vm from 'vm';
import http from 'http';
import crypto from 'crypto';
import { spawn } from 'child_process';
import {
  createSessionToken,
  getJwtSecret,
  ROLES
} from '../netlify/functions/lib/auth-core.mjs';
import { handler as netlifyStatusHandler } from '../netlify/functions/status-terintegrasi-proxy.mjs';

console.log('======================================================================');
console.log('🛡️  TEST SUITE P0 SECURITY HARDENING TAHAP 3: INTEGRASI STATUS PORTAL');
console.log('======================================================================\n');

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
// [1/8] AUDIT ELEMEN UI FRONTEND & KEAMANAN DOM
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
assert(html.includes('Sumber Data Offline'), 'Penanganan status offline / sumber data tidak tersedia ada di UI');

// -----------------------------------------------------------------------------
// [2/8] AUDIT MASA_BERLAKU_LP: JANGAN SAMAKAN KONTRAK DENGAN SLA LAPORAN
// -----------------------------------------------------------------------------
console.log('\n[2/8] Audit Masa_Berlaku_LP vs SLA Target Penyelesaian');

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

// -----------------------------------------------------------------------------
// [3/8] PERSIAPAN KREDENSIAL UJI SINTESIS (ANTI-KEBOCORAN TOKEN)
// -----------------------------------------------------------------------------
console.log('\n[3/8] Pembuatan Kredensial Uji Sintesis & Peluncuran Server PHP');

// Generate Synthetic Tokens on-the-fly (Zero hardcoded secrets!)
const synthPusatToken = 'SYNTH_PST_' + crypto.randomBytes(16).toString('hex');
const synthPusatHash  = crypto.createHash('sha256').update(synthPusatToken).digest('hex');

const synthPadangToken = 'SYNTH_PDG_' + crypto.randomBytes(16).toString('hex');
const synthPadangHash  = crypto.createHash('sha256').update(synthPadangToken).digest('hex');

const synthBandungToken = 'SYNTH_BDG_' + crypto.randomBytes(16).toString('hex');
const synthBandungHash  = crypto.createHash('sha256').update(synthBandungToken).digest('hex');

const synthPenilaiToken = 'SYNTH_VAL_' + crypto.randomBytes(16).toString('hex');
const synthPenilaiHash  = crypto.createHash('sha256').update(synthPenilaiToken).digest('hex');

const synthTestRegistry = {
  [synthPusatHash]: {
    displayName: 'Super Admin Pusat (Synthetic Test)',
    role: 'SUPER ADMIN',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: '00',
    isCabang: false,
    seeFee: true
  },
  [synthPadangHash]: {
    displayName: 'Admin Cabang Padang (Synthetic Test)',
    role: 'ADMIN_CABANG',
    wilayah: 'PADANG',
    wilayahLabel: 'Kantor Cabang Padang',
    wilayahCode: '01',
    isCabang: true,
    seeFee: true
  },
  [synthBandungHash]: {
    displayName: 'Admin Cabang Bandung (Synthetic Test)',
    role: 'ADMIN_CABANG',
    wilayah: 'BANDUNG',
    wilayahLabel: 'Kantor Cabang Bandung',
    wilayahCode: '04',
    isCabang: true,
    seeFee: true
  },
  [synthPenilaiHash]: {
    displayName: 'Tedi Setiadi (Penilai Publik Synthetic)',
    role: 'PENILAI',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: '00',
    isCabang: false,
    seeFee: false // FEE WAJIB DISEMBUNYIKAN
  }
};

const TEST_PORT = 8994;
const phpServer = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, 'router.php'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  env: {
    ...process.env,
    NSR_TEST_MODE: '1',
    NSR_JWT_SECRET: getJwtSecret(),
    NSR_TEST_SYNTHETIC_REGISTRY: JSON.stringify(synthTestRegistry)
  }
});

await new Promise(r => setTimeout(r, 1200));

async function apiRequest(path, options = {}) {
  const url = `http://127.0.0.1:${TEST_PORT}${path}`;
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

try {
  // ---------------------------------------------------------------------------
  // [4/8] P0: PENGUJIAN PENUTUPAN CELAH AUTENTIKASI (NEGATIVE TEST MATRIX)
  // ---------------------------------------------------------------------------
  console.log('\n[4/8] Pengujian Penutupan Celah Autentikasi (Negative Test Matrix)');

  // 1. Request tanpa token sama sekali
  const resEmptyToken = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415');
  assert(resEmptyToken.status === 401, 'Request tanpa token autentikasi ditolak HTTP 401 Unauthorized');
  assert(resEmptyToken.data.success === false, 'success = false saat request tanpa token');

  // 2. Request dengan token palsu / acak
  const resBogusToken = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer TOKEN_PALSU_TIDAK_TERDAFTAR_12345' }
  });
  assert(resBogusToken.status === 401, 'Token palsu/acak ditolak HTTP 401 Unauthorized');

  // 3. Request dengan nama peran string (Percobaan bypass: SUPER_ADMIN)
  const resBypassSuperAdmin = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer SUPER_ADMIN' }
  });
  assert(resBypassSuperAdmin.status === 401, 'Percobaan bypass string "SUPER_ADMIN" ditolak HTTP 401 (Bukan fallback Super Admin!)');

  // 4. Request dengan nama peran string (Percobaan bypass: ADMIN_PUSAT)
  const resBypassAdminPusat = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer ADMIN_PUSAT' }
  });
  assert(resBypassAdminPusat.status === 401, 'Percobaan bypass string "ADMIN_PUSAT" ditolak HTTP 401');

  // 5. Request dengan nama peran string (Percobaan bypass: PENILAI)
  const resBypassPenilai = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer PENILAI' }
  });
  assert(resBypassPenilai.status === 401, 'Percobaan bypass string "PENILAI" ditolak HTTP 401');

  // 6. Request dengan nama peran cabang string (Percobaan bypass: ADMIN_CABANG_PADANG)
  const resBypassPadang = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer ADMIN_CABANG_PADANG' }
  });
  assert(resBypassPadang.status === 401, 'Percobaan bypass string "ADMIN_CABANG_PADANG" ditolak HTTP 401');

  // 7. Request dengan token yang mengandung substring peran (Percobaan substring matching)
  const resSubstringPenilai = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': 'Bearer RANDOM_STRING_CONTAINING_PENILAI_WORD' }
  });
  assert(resSubstringPenilai.status === 401, 'Token dengan substring peran ditolak HTTP 401 (Tidak ada parsing substring)');

  // 8. Percobaan bypass menggunakan HASH PENYIMPAN langsung (Anti-Stored-Hash Login Bypass)
  const resHashBypass = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-2026-0415', {
    headers: { 'Authorization': `Bearer ${synthPusatHash}` }
  });
  assert(resHashBypass.status === 401, 'Nilai hash penyimpan DITOLAK sebagai kredensial login (Anti-Hash-Bypass Protection)');

  // 9. Permintaan dengan token JWT sah langsung ke backend PHP
  const validDirectJwt = createSessionToken({
    sub: 'synth_jwt_admin',
    role: 'SUPER ADMIN',
    branch: 'PUSAT',
    seeFee: true
  });
  const resPhpJwt = await apiRequest('/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&noSpk=0415/LP/NSR/X/2026', {
    headers: { 'Authorization': `Bearer ${validDirectJwt}` }
  });
  assert(resPhpJwt.status === 200, 'Backend PHP berhasil memverifikasi token JWT secara langsung (Interoperabilitas Netlify-PHP)');
  assert(resPhpJwt.data.aksesPengguna.role === 'SUPER ADMIN', 'Identitas pengguna JWT dikenali dengan benar oleh backend PHP');

  // 10. Permintaan server-to-server terotentikasi (X-NSR-Server-Secret)
  const userCtxBase64 = Buffer.from(JSON.stringify({
    sub: 's2s_admin',
    role: 'SUPER ADMIN',
    branch: 'PUSAT',
    seeFee: true
  })).toString('base64');
  const resS2S = await apiRequest('/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&noSpk=0415/LP/NSR/X/2026', {
    headers: {
      'X-NSR-Server-Secret': getJwtSecret(),
      'X-NSR-User-Context': userCtxBase64
    }
  });
  assert(resS2S.status === 200, 'Backend PHP berhasil memvalidasi komunikasi server-to-server (X-NSR-Server-Secret)');

  // 11. Request dengan token yang dikirim melalui URL Query String (Percobaan token via query)
  const resQueryParamToken = await apiRequest(`/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&token=${synthPusatToken}`);
  assert(resQueryParamToken.status === 401, 'Token via URL query string ditolak HTTP 401 (Wajib menggunakan Header Otorisasi)');

  // ---------------------------------------------------------------------------
  // [5/8] P0: PENGUJIAN SERVER-SIDE RBAC ISOLASI ANTAR-CABANG
  // ---------------------------------------------------------------------------
  console.log('\n[5/8] Pengujian Server-Side RBAC & Isolasi Antar-Cabang (Fail-Closed)');

  // 1. Cabang Padang mencoba mengakses data penugasan cabang Bandung
  const resCrossBranch = await apiRequest('/api/status-terintegrasi-proxy?id=SPK-BDG-001&noSpk=SPK-BDG-001', {
    headers: { 'Authorization': `Bearer ${synthPadangToken}` }
  });
  assert(resCrossBranch.status === 403, 'Akses lintas kantor cabang (Padang -> Bandung) ditolak HTTP 403 Forbidden');
  assert(resCrossBranch.data.error.includes('Akses Ditolak'), 'Pesan penolakan tegas bahwa akun hanya berwenang memeriksa cabangnya sendiri');

  // 2. Cabang Padang mencoba memalsukan parameter kantorWilayah pada query (Anti-Spoofing Client Param)
  const resSpoofAttempt = await apiRequest('/api/status-terintegrasi-proxy?id=SPK-BDG-001&noSpk=SPK-BDG-001&kantorWilayah=Kantor%20Cabang%20Padang', {
    headers: { 'Authorization': `Bearer ${synthPadangToken}` }
  });
  assert(resSpoofAttempt.status === 403, 'Parameter palsu kantorWilayah=Padang diabaikan; backend tetap menolak SPK-BDG-001 (HTTP 403)');

  // 3. Cabang Padang mencoba mengakses penugasan yang tidak dapat dipastikan cabangnya (Fail-Closed Verification)
  const resUnknownJob = await apiRequest('/api/status-terintegrasi-proxy?id=JOB-UNKNOWN-ANONYMOUS-999&noSpk=JOB-UNKNOWN-999', {
    headers: { 'Authorization': `Bearer ${synthPadangToken}` }
  });
  assert(resUnknownJob.status === 403, 'Penugasan dengan cabang yang tidak terverifikasi ditolak HTTP 403 (Fail-Closed Protection)');

  // 4. Cabang Padang mengakses data cabangnya sendiri yang sah
  const resPadangOwn = await apiRequest('/api/status-terintegrasi-proxy?id=SPK-PDG-001&noSpk=SPK-PDG-001', {
    headers: { 'Authorization': `Bearer ${synthPadangToken}` }
  });
  assert(resPadangOwn.status === 200, 'Cabang Padang diizinkan mengakses data penugasan cabangnya sendiri (HTTP 200)');
  assert(resPadangOwn.data.query.resolvedOffice === 'PADANG', 'Backend berhasil memvalidasi kantor penugasan secara objektif sebagai PADANG');

  // ---------------------------------------------------------------------------
  // [6/8] P0: PENGUJIAN SENSOR NOMINAL FINANSIAL (FEE MASKING)
  // ---------------------------------------------------------------------------
  console.log('\n[6/8] Pengujian Sensor Nominal Finansial untuk Penilai / Reviewer');

  // Akun Penilai mengakses penugasan Pusat
  const resPenilaiFee = await apiRequest('/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&noSpk=0415/LP/NSR/X/2026', {
    headers: { 'Authorization': `Bearer ${synthPenilaiToken}` }
  });
  assert(resPenilaiFee.status === 200, 'Penilai publik terverifikasi dapat mengakses status penugasan (HTTP 200)');
  assert(resPenilaiFee.data.aksesPengguna.canSeeFee === false, 'Flag aksesPengguna.canSeeFee = false untuk Penilai');

  if (resPenilaiFee.data.kwitansi.items.length > 0) {
    const kw = resPenilaiFee.data.kwitansi.items[0];
    assert(kw.isFeeMasked === true, 'isFeeMasked = true pada Kwitansi');
    assert(kw.totalBayar.includes('Akses Terbatas'), 'Nominal tagihan kwitansi disensor: "[Akses Terbatas: Sesuai Kebijakan Peran]"');
  }

  if (resPenilaiFee.data.operasional.items.length > 0) {
    const opr = resPenilaiFee.data.operasional.items[0];
    assert(opr.isFeeMasked === true, 'isFeeMasked = true pada e-Operasional');
    assert(opr.totalEstimasi.includes('Akses Terbatas'), 'Estimasi biaya operasional disensor: "[Akses Terbatas: Sesuai Kebijakan Peran]"');
  }

  // Akun Super Admin Pusat mengakses penugasan yang sama -> Nominal terlihat jelas
  const resAdminFee = await apiRequest('/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&noSpk=0415/LP/NSR/X/2026', {
    headers: { 'Authorization': `Bearer ${synthPusatToken}` }
  });
  assert(resAdminFee.status === 200, 'Super Admin Pusat dapat mengakses status penugasan (HTTP 200)');
  assert(resAdminFee.data.aksesPengguna.canSeeFee === true, 'Flag aksesPengguna.canSeeFee = true untuk Super Admin');

  // ---------------------------------------------------------------------------
  // [7/8] P0: PEMBEDAAN KEGAGALAN SUMBER DATA VS PEKERJAAN BELUM TERHUBUNG
  // ---------------------------------------------------------------------------
  console.log('\n[7/8] Pengujian Pembedaan Kegagalan Sumber Data vs Dokumen Belum Terhubung');

  // Periksa respon NoLap saat file database nolap_database.json tidak ada di disk
  const resDbHealth = await apiRequest('/api/status-terintegrasi-proxy?id=0415/LP/NSR/X/2026&noSpk=0415/LP/NSR/X/2026', {
    headers: { 'Authorization': `Bearer ${synthPusatToken}` }
  });

  const nolapCheck = resDbHealth.data.nolap;
  const kwitansiCheck = resDbHealth.data.kwitansi;

  // Jika file nolap_database.json tidak ada di server, wajib lapor SUMBER_TIDAK_TERSEDIA (bukan Belum Terhubung)
  if (!fs.existsSync(path.join(process.cwd(), 'data/nolap_database.json'))) {
    assert(nolapCheck.statusKoneksi === 'SUMBER_TIDAK_TERSEDIA', 'NoLap statusKoneksi = "SUMBER_TIDAK_TERSEDIA" saat file database tidak ada di server');
    assert(nolapCheck.statusUtama === 'Sumber Data Tidak Tersedia', 'NoLap statusUtama = "Sumber Data Tidak Tersedia" (Tidak mengklaim Belum Terhubung secara keliru)');
    assert(nolapCheck.terhubung === false, 'terhubung = false');
  }

  // Kwitansi yang ada datanya di disk tapi tidak cocok dengan ID uji NSR-UNLINKED-999
  const resUnlinkedKw = await apiRequest('/api/status-terintegrasi-proxy?id=NSR-UNLINKED-999&noSpk=SPK-UNLINKED-999', {
    headers: { 'Authorization': `Bearer ${synthPusatToken}` }
  });
  const kwUnlinked = resUnlinkedKw.data.kwitansi;
  if (fs.existsSync(path.join(process.cwd(), 'data/kwitansi_database.json'))) {
    assert(kwUnlinked.statusKoneksi === 'TERHUBUNG_AKTIF', 'Kwitansi statusKoneksi = "TERHUBUNG_AKTIF" saat database berhasil dibaca');
    assert(kwUnlinked.terhubung === false, 'terhubung = false saat tidak ada dokumen cocok');
    assert(kwUnlinked.statusUtama === 'Belum Ada Kwitansi', 'statusUtama menyatakan jujur: "Belum Ada Kwitansi"');
  }

  // ---------------------------------------------------------------------------
  // [8/8] P0: PENGUJIAN NETLIFY SERVERLESS FUNCTION (ASYNC AWAIT & ZERO FALLBACK)
  // ---------------------------------------------------------------------------
  console.log('\n[8/8] Pengujian Netlify Function: status-terintegrasi-proxy.mjs');

  // 1. Uji tanpa token di Netlify Function
  const netlifyNoAuth = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { id: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyNoAuth.statusCode === 401, 'Netlify function menolak request tanpa token dengan HTTP 401');

  // 2. Uji token palsu di Netlify Function
  const netlifyBogusAuth = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: 'Bearer FORGED_TOKEN_XYZ' },
    queryStringParameters: { id: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyBogusAuth.statusCode === 401, 'Netlify function menolak token palsu dengan HTTP 401 (Tidak fallback ke Super Admin)');

  // 3. Uji string peran SUPER_ADMIN di Netlify Function
  const netlifyBypassAttempt = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: 'Bearer SUPER_ADMIN' },
    queryStringParameters: { id: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyBypassAttempt.statusCode === 401, 'Netlify function menolak string "SUPER_ADMIN" dengan HTTP 401');

  // 3B. Uji token via query string ditolak di Netlify Function (Wajib Header)
  const netlifyQueryTokenAttempt = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { id: '0415/LP/NSR/X/2026', token: 'SOME_TOKEN' }
  });
  assert(netlifyQueryTokenAttempt.statusCode === 401, 'Netlify function menolak token via query string dengan HTTP 401 (Wajib Header)');

  // 4. Uji token sesi kriptografis sah (Admin Pusat)
  const validPusatJwt = createSessionToken({
    sub: 'nanang_rahayu',
    role: ROLES.SUPER_ADMIN,
    branch: 'PUSAT',
    seeFee: true
  });

  const netlifyValidPusat = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${validPusatJwt}` },
    queryStringParameters: { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyValidPusat.statusCode === 200, 'Netlify function mengizinkan token JWT sah untuk Admin Pusat (HTTP 200)');
  const netlifyPusatBody = JSON.parse(netlifyValidPusat.body);
  assert(netlifyPusatBody.success === true, 'Netlify function response success = true');

  // 5. Uji cross-branch pada Netlify Function (Cabang Padang -> Job Bandung)
  const validPadangJwt = createSessionToken({
    sub: 'admin_padang',
    role: ROLES.CABANG,
    branch: 'PADANG',
    seeFee: true
  });

  const netlifyCrossBranch = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${validPadangJwt}` },
    queryStringParameters: { id: 'SPK-BDG-001', noSpk: 'SPK-BDG-001' }
  });
  assert(netlifyCrossBranch.statusCode === 403, 'Netlify function menolak akses lintas cabang dengan HTTP 403 Forbidden');

  // 6. Uji fee masking pada Netlify Function (Penilai)
  const validPenilaiJwt = createSessionToken({
    sub: 'penilai_tedi',
    role: ROLES.PENILAI,
    branch: 'PUSAT',
    seeFee: false
  });

  const netlifyPenilai = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${validPenilaiJwt}` },
    queryStringParameters: { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyPenilai.statusCode === 200, 'Netlify function mengizinkan akses Penilai (HTTP 200)');
  const netlifyPenilaiBody = JSON.parse(netlifyPenilai.body);
  assert(netlifyPenilaiBody.aksesPengguna.canSeeFee === false, 'Netlify function menyetel canSeeFee = false untuk Penilai');

  // 7. Uji RBAC Default Deny pada role non-finansial
  const validStaffJwt = createSessionToken({
    sub: 'staf_lapangan',
    role: 'STAF_OPERATOR',
    branch: 'PUSAT',
    seeFee: true // Role STAF_OPERATOR tidak terdaftar di allowlist finansial
  });

  const netlifyDefaultDeny = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${validStaffJwt}` },
    queryStringParameters: { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyDefaultDeny.statusCode === 200, 'Netlify function memproses peran non-finansial (HTTP 200)');
  const netlifyDefaultDenyBody = JSON.parse(netlifyDefaultDeny.body);
  assert(netlifyDefaultDenyBody.aksesPengguna.canSeeFee === false, 'RBAC Default Deny aktif: canSeeFee = false untuk role non-finansial');

  // 8. Uji Anti-Loopback Netlify: request dengan origin netlify-proxy tidak memanggil upstream secara berulang
  const netlifyLoopback = await netlifyStatusHandler({
    httpMethod: 'GET',
    headers: {
      authorization: `Bearer ${validStaffJwt}`,
      'x-nsr-proxy-origin': 'netlify-proxy'
    },
    queryStringParameters: { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' }
  });
  assert(netlifyLoopback.statusCode === 200, 'Netlify menangani kondisi loopback proxy tanpa recursion (HTTP 200)');
  const netlifyLoopbackBody = JSON.parse(netlifyLoopback.body);
  assert(netlifyLoopbackBody.nolap.statusKoneksi === 'SUMBER_TIDAK_TERSEDIA', 'Loopback diproteksi dan melaporkan status jujur');

  console.log('\n======================================================================');
  console.log(`🎉 SEMUA PENGUJIAN P0 SECURITY AUDIT LULUS SEMPURNA: ${passedTests} / ${totalTests} (100%)`);
  console.log('======================================================================');

} finally {
  phpServer.kill();
}
