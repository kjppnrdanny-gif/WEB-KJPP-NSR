/**
 * Test Suite: RBAC & Routing State Validation for portal-kwitansi.html
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const htmlContent = fs.readFileSync(path.resolve('portal-kwitansi.html'), 'utf8');

console.log('========================================================');
console.log('🧪 PENGUJIAN RBAC & TAMPILAN APPROVAL PORTAL KWITANSI');
console.log('========================================================\n');

// 1. Ekstrak fungsi evaluasiPeranKwitansi dan getNormalizedCabangFromUser dari HTML
const fnEvaluasiMatch = htmlContent.match(/function evaluasiPeranKwitansi\([\s\S]*?\n    \}/);
assert(fnEvaluasiMatch, 'evaluasiPeranKwitansi harus ada di portal-kwitansi.html');

const fnNormalizedMatch = htmlContent.match(/function getNormalizedCabangFromUser\([\s\S]*?\n    \}/);
assert(fnNormalizedMatch, 'getNormalizedCabangFromUser harus ada di portal-kwitansi.html');

const kodeCabangMapMatch = htmlContent.match(/const KODE_CABANG_NORMALIZATION_MAP = \{[\s\S]*?\};/);
assert(kodeCabangMapMatch, 'KODE_CABANG_NORMALIZATION_MAP harus ada di portal-kwitansi.html');

// Bangun sandbox function
const evaluatorFn = new Function(`
  ${kodeCabangMapMatch[0]}
  ${fnNormalizedMatch[0]}
  ${fnEvaluasiMatch[0]}
  return { evaluasiPeranKwitansi, getNormalizedCabangFromUser };
`)();

const { evaluasiPeranKwitansi, getNormalizedCabangFromUser } = evaluatorFn;

// TEST 1: Skenario Screenshot Pengguna (User Session Sesi PST)
console.log('👉 UJI 1: Evaluasi Payload Sesi Kantor Pusat Jakarta (PST)');
const sesiPstUser = {
  branch: 'PST',
  role: 'CABANG', // Bahkan jika role sempat tersimpan 'CABANG'
  displayName: 'Kantor Pusat Jakarta',
  sub: 'admin_pusat'
};
const peranPst = evaluasiPeranKwitansi(sesiPstUser);
assert.strictEqual(peranPst.isPusat, true, 'Sesi PST harus dievaluasi sebagai isPusat: true');
assert.strictEqual(peranPst.isCabang, false, 'Sesi PST tidak boleh dievaluasi sebagai isCabang: true');
assert.strictEqual(peranPst.roleNormalized, 'PUSAT_KEUANGAN', 'Role harus dinormalisasi menjadi PUSAT_KEUANGAN');
assert.strictEqual(peranPst.branchNormalized, 'Kantor Pusat Jakarta', 'Branch harus dinormalisasi menjadi Kantor Pusat Jakarta');
console.log('  ✅ [PASS] Sesi PST (Pusat) berhasil dinormalisasi tegas ke PUSAT_KEUANGAN / isPusat: true');

// TEST 2: Skenario Token Admin Pusat ([REDACTED_ADMIN_PUSAT_TOKEN] / Danny Taufik Hidayat, S.H.)
console.log('\n👉 UJI 2: Token [REDACTED_ADMIN_PUSAT_TOKEN] (Admin Pusat Verifikasi)');
const sesiAdminPusat = {
  branch: 'PUSAT',
  wilayah: 'PUSAT',
  wilayahCode: 'PST',
  role: 'ADMIN_PUSAT',
  displayName: 'Danny Taufik Hidayat, S.H.',
  canApprove: true
};
const peranAdminPusat = evaluasiPeranKwitansi(sesiAdminPusat);
assert.strictEqual(peranAdminPusat.isPusat, true);
assert.strictEqual(peranAdminPusat.isCabang, false);
assert.strictEqual(peranAdminPusat.roleNormalized, 'PUSAT_KEUANGAN');
console.log('  ✅ [PASS] Token [REDACTED_ADMIN_PUSAT_TOKEN] berhasil dinormalisasi ke PUSAT_KEUANGAN');

// TEST 3: Skenario Token Keuangan Pusat (NSR-KEU-2026 / Milda H)
console.log('\n👉 UJI 3: Token NSR-KEU-2026 (Divisi Keuangan Pusat)');
const sesiKeuangan = {
  branch: 'PUSAT',
  wilayah: 'PUSAT',
  wilayahCode: 'PST',
  role: 'KEUANGAN',
  displayName: 'Milda H',
  canApprove: true
};
const peranKeu = evaluasiPeranKwitansi(sesiKeuangan);
assert.strictEqual(peranKeu.isPusat, true);
assert.strictEqual(peranKeu.isCabang, false);
assert.strictEqual(peranKeu.roleNormalized, 'PUSAT_KEUANGAN');
console.log('  ✅ [PASS] Token NSR-KEU-2026 berhasil dinormalisasi ke PUSAT_KEUANGAN');

// TEST 4: Skenario Token Super Admin Master (Ir. Nanang Rahayu / Deni Siswandi)
console.log('\n👉 UJI 4: Token Pemimpin Rekan & Super Admin Master');
const sesiSuperAdmin = {
  branch: 'PUSAT',
  role: 'SUPER ADMIN',
  isSuperAdmin: true,
  displayName: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)'
};
const peranMaster = evaluasiPeranKwitansi(sesiSuperAdmin);
assert.strictEqual(peranMaster.isPusat, true);
assert.strictEqual(peranMaster.isCabang, false);
assert.strictEqual(peranMaster.roleNormalized, 'PUSAT_KEUANGAN');
console.log('  ✅ [PASS] Super Admin Master berhasil dinormalisasi ke PUSAT_KEUANGAN');

// TEST 5: Skenario Token Cabang (Bandung, Padang, Makassar, Palembang)
console.log('\n👉 UJI 5: Token Admin Cabang (Bandung, Padang, Makassar, Palembang)');
const cabangList = [
  { code: 'BDG', name: 'Cabang Bandung', role: 'ADMIN_CABANG' },
  { code: 'PDG', name: 'Cabang Padang', role: 'ADMIN_CABANG' },
  { code: 'MKS', name: 'Cabang Makassar', role: 'ADMIN_CABANG' },
  { code: 'PLB', name: 'Cabang Palembang', role: 'ADMIN_CABANG' }
];

for (const c of cabangList) {
  const userCab = {
    branch: c.code,
    wilayahCode: c.code,
    role: c.role,
    displayName: c.name
  };
  const peranCab = evaluasiPeranKwitansi(userCab);
  assert.strictEqual(peranCab.isPusat, false, `${c.name} tidak boleh isPusat: true`);
  assert.strictEqual(peranCab.isCabang, true, `${c.name} harus isCabang: true`);
  assert.strictEqual(peranCab.roleNormalized, 'CABANG', `${c.name} harus role CABANG`);
  assert.strictEqual(peranCab.branchNormalized, c.name, `${c.name} branch harus sesuai`);
  console.log(`  ✅ [PASS] ${c.name} terisolasi sebagai CABANG / isCabang: true (bukan Pusat)`);
}

// TEST 6: Verifikasi Kode DOM Sanitasi & Routing di portal-kwitansi.html
console.log('\n👉 UJI 6: Pemeriksaan Kode UI, Dropdown, dan Routing Tab');
assert(htmlContent.includes("evaluasiPeranKwitansi(user)"), 'terapkanSesiPengguna harus memanggil evaluasiPeranKwitansi(user)');
assert(htmlContent.includes("evaluasiPeranKwitansi(currentUser)"), 'gantiTab harus memanggil evaluasiPeranKwitansi(currentUser)');
assert(htmlContent.includes("selCabang.disabled = false"), 'Dropdown tidak boleh terkunci untuk Pusat');
assert(htmlContent.includes("gantiTab('pusat')"), 'Pusat harus diarahkan otomatis ke tab pusat');
assert(htmlContent.includes("pilihModePenerbitan('pusat')"), 'Mode Pusat harus diaktifkan untuk akun Pusat');
assert(!htmlContent.includes("cabang: \"Cabang Bandung\",\n      tanggal"), 'Default dataKwitansiAktif.cabang tidak boleh hardcoded Cabang Bandung');

console.log('  ✅ [PASS] Struktur UI, Dropdown sanitasi, dan dynamic tab routing terverifikasi');

console.log('\n========================================================');
console.log('🎉 SEMUA PENGUJIAN RBAC & TAB UI BERHASIL DIVERIFIKASI!');
console.log('========================================================');
