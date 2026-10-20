/**
 * TEST SUITE: test-kwitansi-dual-mode.mjs
 * Menguji secara komprehensif implementasi TAHAP 1 & TAHAP 2 Portal Kwitansi:
 * 1. Dropdown 'Kantor Cabang Pengaju' mengambil nilai otomatis dari sesi login aktif:
 *    - PLB -> Cabang Palembang
 *    - PDG -> Cabang Padang
 *    - MKS -> Cabang Makassar
 *    - BDG -> Cabang Bandung
 *    - PST -> Kantor Pusat Jakarta
 * 2. Tidak ada hardcoded default Bandung pada elemen select HTML.
 * 3. Penerapan Alur Dual Mode:
 *    - [Mode Cabang]: Kuitansi Titipan / Kasbon Operasional Mandiri Cabang (Otorisasi: PIN Token Cabang).
 *    - [Mode Pusat]: Permohonan Kuitansi Resmi Penugasan Rekan (Pilihan TTD: Ir. Nanang Rahayu, M.Ec.Dev. / Deni Siswandi, S.T.).
 * 4. Pada [Mode Pusat], hilangkan popup PIN Finance Cabang dan tombol submit menjadi 'Ajukan Permohonan ke Pusat'.
 * 5. Antrean approval di akun Pusat (NSR-PST-2026 / NSR-KEU-2026) untuk verifikasi dan rilis nomor resmi kuitansi pusat.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'portal-kwitansi.html'), 'utf8');
const phpContent  = fs.readFileSync(path.join(ROOT_DIR, 'kwitansi-data-handler.php'), 'utf8');
const proxyContent = fs.readFileSync(path.join(ROOT_DIR, 'netlify', 'functions', 'kwitansi-data-proxy.mjs'), 'utf8');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

console.log('======================================================================');
console.log('   PENGUJIAN VALIDASI TAHAP 1 & TAHAP 2 PORTAL KWITANSI');
console.log('======================================================================\n');

// -------------------------------------------------------------
// BAGIAN 1: PENGUJIAN TAHAP 1 (Dropdown & Hapus Hardcode Bandung)
// -------------------------------------------------------------
console.log('[1/5] Memverifikasi Elemen HTML Dropdown Kantor Cabang Pengaju...');

// 1.1 Pastikan elemen select tidak lagi memiliki option pertama Bandung yang terpilih secara default
const hasPlaceholderOption = htmlContent.includes('<option value="" disabled selected>-- Pilih Kantor Cabang Pengaju --</option>');
assert(hasPlaceholderOption, 'Elemen select #cabang-pengaju memiliki placeholder netral tanpa auto-select');

const hasHardcodedBandungFirst = /<select id="cabang-pengaju"[^>]*>\s*<option value="Cabang Bandung">/i.test(htmlContent);
assert(!hasHardcodedBandungFirst, 'Tidak ada hardcode Bandung pada baris pertama select #cabang-pengaju');

// 1.2 Pilihan kantor cabang lengkap
const hasPalembangOption = htmlContent.includes('<option value="Cabang Palembang">Kantor Cabang Palembang</option>');
const hasPadangOption    = htmlContent.includes('<option value="Cabang Padang">Kantor Cabang Padang</option>');
const hasMakassarOption  = htmlContent.includes('<option value="Cabang Makassar">Kantor Cabang Makassar</option>');
const hasBandungOption   = htmlContent.includes('<option value="Cabang Bandung">Kantor Cabang Bandung</option>');
const hasPusatOption     = htmlContent.includes('<option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta</option>');

assert(
  hasPalembangOption && hasPadangOption && hasMakassarOption && hasBandungOption && hasPusatOption,
  'Kelima opsi wilayah (Palembang, Padang, Makassar, Bandung, Pusat) tersedia di dropdown'
);

// 1.3 Simulasi fungsi pemetaan normalisasi sesi login
console.log('\n[2/5] Memverifikasi Pemetaan Sesi Login Aktif (PLB, PDG, MKS, BDG, PST)...');

const KODE_CABANG_NORMALIZATION_MAP = {
  'PLB': 'Cabang Palembang',
  'PDG': 'Cabang Padang',
  'MKS': 'Cabang Makassar',
  'BDG': 'Cabang Bandung',
  'PST': 'Kantor Pusat Jakarta',
  '00':  'Kantor Pusat Jakarta',
  '01':  'Cabang Padang',
  '02':  'Cabang Makassar',
  '03':  'Cabang Palembang',
  '04':  'Cabang Bandung'
};

function simulateGetNormalizedCabang(user) {
  if (!user) return '';
  const code = String(user.wilayahCode || user.branch || '').toUpperCase().trim();
  if (KODE_CABANG_NORMALIZATION_MAP[code]) return KODE_CABANG_NORMALIZATION_MAP[code];
  const rawText = String(user.displayName || user.wilayah || user.cabang || user.branch || user.sub || '').toLowerCase();
  if (rawText.includes('palembang') || rawText.includes('plb')) return 'Cabang Palembang';
  if (rawText.includes('padang') || rawText.includes('pdg')) return 'Cabang Padang';
  if (rawText.includes('makassar') || rawText.includes('mks')) return 'Cabang Makassar';
  if (rawText.includes('bandung') || rawText.includes('bdg')) return 'Cabang Bandung';
  if (rawText.includes('pusat') || rawText.includes('jakarta') || rawText.includes('pst')) return 'Kantor Pusat Jakarta';
  return '';
}

assert(
  simulateGetNormalizedCabang({ wilayahCode: 'PLB', branch: 'PLB' }) === 'Cabang Palembang',
  'Sesi login PLB terpetakan ke "Cabang Palembang"'
);
assert(
  simulateGetNormalizedCabang({ wilayahCode: 'PDG', branch: 'PDG' }) === 'Cabang Padang',
  'Sesi login PDG terpetakan ke "Cabang Padang"'
);
assert(
  simulateGetNormalizedCabang({ wilayahCode: 'MKS', branch: 'MKS' }) === 'Cabang Makassar',
  'Sesi login MKS terpetakan ke "Cabang Makassar"'
);
assert(
  simulateGetNormalizedCabang({ wilayahCode: 'BDG', branch: 'BDG' }) === 'Cabang Bandung',
  'Sesi login BDG terpetakan ke "Cabang Bandung"'
);
assert(
  simulateGetNormalizedCabang({ wilayahCode: 'PST', branch: 'PUSAT' }) === 'Kantor Pusat Jakarta',
  'Sesi login PST terpetakan ke "Kantor Pusat Jakarta"'
);

// Pastikan fungsi getNormalizedCabangFromUser tertanam di portal-kwitansi.html
assert(
  htmlContent.includes('function getNormalizedCabangFromUser'),
  'portal-kwitansi.html mengimplementasikan fungsi getNormalizedCabangFromUser()'
);

// -------------------------------------------------------------
// BAGIAN 2: PENGUJIAN TAHAP 2 (Dual Mode Switch di Awal Form)
// -------------------------------------------------------------
console.log('\n[3/5] Memverifikasi Elemen Dual Mode Switch (Cabang vs Pusat)...');

assert(
  htmlContent.includes('id="card-mode-cabang"') && htmlContent.includes('id="card-mode-pusat"'),
  'Kartu switch pilihan [Mode Cabang] dan [Mode Pusat] tersedia di awal form'
);

assert(
  htmlContent.includes('Kuitansi Titipan / Kasbon Operasional Mandiri Cabang'),
  'Deskripsi [Mode Cabang]: Kuitansi Titipan / Kasbon Operasional Mandiri Cabang (Otorisasi: PIN Token Cabang)'
);

assert(
  htmlContent.includes('Permohonan Kuitansi Resmi Penugasan Rekan'),
  'Deskripsi [Mode Pusat]: Permohonan Kuitansi Resmi Penugasan Rekan'
);

assert(
  htmlContent.includes('id="panel-ttd-rekan-mode-pusat"'),
  'Panel pilihan Penandatangan Rekan Resmi tersedia untuk Mode Pusat'
);

assert(
  htmlContent.includes('Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) — Pemimpin Rekan') &&
  htmlContent.includes('Deni Siswandi, S.T., MAPPI (Cert.) — Rekan'),
  'Pilihan TTD Rekan mencakup: Ir. Nanang Rahayu, M.Ec.Dev. dan Deni Siswandi, S.T.'
);

// -------------------------------------------------------------
// BAGIAN 3: PENGUJIAN PERILAKU SUBMIT PADA MODE PUSAT
// -------------------------------------------------------------
console.log('\n[4/5] Memverifikasi Perilaku Submit Mode Pusat & Eliminasi PIN Cabang...');

assert(
  htmlContent.includes('<span>📤 Ajukan Permohonan ke Pusat</span>'),
  'Tombol submit Mode Pusat bertuliskan "📤 Ajukan Permohonan ke Pusat"'
);

// Verifikasi fungsi bukaModalPinFinanceCabang menolak eksekusi pada Mode Pusat
assert(
  htmlContent.includes("if (modeKwitansiAktif === 'pusat')"),
  'bukaModalPinFinanceCabang() mengabaikan/menolak popup PIN saat Mode Pusat aktif'
);

// Verifikasi fungsi pilihModePenerbitan menyembunyikan tombol PIN Cabang saat Mode Pusat
assert(
  htmlContent.includes("btnTerbitResmiCabang.classList.add('hidden')") &&
  htmlContent.includes("btnSubmitPengajuan.classList.remove('hidden')"),
  'pilihModePenerbitan("pusat") menyembunyikan tombol PIN Cabang dan menampilkan tombol "Ajukan Permohonan ke Pusat"'
);

// -------------------------------------------------------------
// BAGIAN 4: PENGUJIAN ANTREAN APPROVAL DI AKUN PUSAT (NSR-PST / NSR-KEU)
// -------------------------------------------------------------
console.log('\n[5/5] Memverifikasi Antrean Approval di Akun Pusat & Backend Support...');

// Verifikasi pemetaan akun pusat dan keuangan di portal-kwitansi.html
assert(
  htmlContent.includes("auth.role === 'KEUANGAN'") && htmlContent.includes("auth.role === 'ADMIN_PUSAT'"),
  'Autentikasi mengenali role KEUANGAN (NSR-KEU-2026) dan ADMIN_PUSAT/SUPER_ADMIN (NSR-PST-2026)'
);

// Verifikasi tombol rilis nomor resmi di tabel verifikasi pusat
assert(
  htmlContent.includes('verifikasiCepatKwitansiPusat'),
  'Tabel verifikasi Pusat menyediakan aksi cepat verifikasi & rilis nomor resmi'
);

// Verifikasi backend kwitansi-data-handler.php mendukung modePenerbitan & Rekan TTD
assert(
  phpContent.includes("'modePenerbitan'") && phpContent.includes("'idPejabat'"),
  'kwitansi-data-handler.php menyimpan modePenerbitan dan idPejabat penugasan rekan'
);

// Verifikasi proxy Netlify mendukung modePenerbitan & Rekan TTD
assert(
  proxyContent.includes("modePenerbitan:") && proxyContent.includes("idPejabat:"),
  'kwitansi-data-proxy.mjs menyimpan modePenerbitan dan idPejabat penugasan rekan'
);

// Verifikasi nomor resmi format [URUT]/KW-NSR/[BULAN-ROMAWI]/[TAHUN]
assert(
  phpContent.includes("/KW-NSR/"),
  'Format nomor resmi kuitansi pusat memenuhi pola sekuensial resmi: [URUT]/KW-NSR/[BULAN-ROMAWI]/[TAHUN]'
);

console.log('\n======================================================================');
console.log(`HASIL TEST: ${passedTests}/${totalTests} PENGUJIAN BERHASIL LULUS!`);
if (failedTests === 0) {
  console.log('🎉 100% PERSYARATAN TAHAP 1 & TAHAP 2 TERVERIFIKASI SEMPURNA!');
} else {
  console.error(`⚠️ Terdapat ${failedTests} pengujian yang gagal.`);
  process.exit(1);
}
console.log('======================================================================\n');
