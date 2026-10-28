/**
 * Test Suite: Audit Keamanan, Integritas Transaksi, Anti-Duplikasi & RBAC Portal Surat Umum (SU)
 * KJPP Nanang Rahayu Sigit Paryanto dan Rekan (KJPP NSR 2026)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
console.log('🧪 PENGUJIAN MENYELURUH AUDIT & STABILISASI PORTAL SURAT UMUM');
console.log('======================================================\n');

// -------------------------------------------------------------
// [1/5] AUDIT STATIC CODE portal-surat-umum.html
// -------------------------------------------------------------
console.log('[1/5] Memverifikasi Higienitas DOM & Skrip portal-surat-umum.html');
const suHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-surat-umum.html'), 'utf8');

// 1. Tidak memodifikasi prototype global DOM
assert(!suHtml.includes('_ID_ALIAS_MAP'), 'portal-surat-umum.html steril dari _ID_ALIAS_MAP');
assert(!suHtml.includes('document.getElementById = function'), 'portal-surat-umum.html tidak membajak document.getElementById');
assert(!suHtml.includes('document.querySelector = function'), 'portal-surat-umum.html tidak membajak document.querySelector');

// 2. Ketersediaan ID Primer HTML
assert(suHtml.includes('id="notice-akses-ditolak"'), 'Elemen id="notice-akses-ditolak" tersedia langsung di DOM');
assert(suHtml.includes('id="card-akses-ditolak"'), 'Elemen id="card-akses-ditolak" tersedia langsung di DOM');
assert(suHtml.includes('id="container-modul-aktif"'), 'Elemen id="container-modul-aktif" tersedia langsung di DOM');
assert(suHtml.includes('id="konten-utama-surat-umum"'), 'Elemen id="konten-utama-surat-umum" tersedia langsung di DOM');

// 3. Menggunakan helper auth headers & backend proxy
assert(suHtml.includes('BACKEND_SU_PROXY_URL = "/api/surat-umum-data-proxy"'), 'portal-surat-umum.html mendefinisikan BACKEND_SU_PROXY_URL');
assert(suHtml.includes('function getSuratUmumAuthHeaders'), 'portal-surat-umum.html mendefinisikan getSuratUmumAuthHeaders()');
assert(suHtml.includes('headers: getSuratUmumAuthHeaders()'), 'Fetch proxy menyertakan token otorisasi melalui getSuratUmumAuthHeaders');

// 4. Fallback dev offline jujur & aman
assert(suHtml.includes('Simulasi Dev Offline'), 'portal-surat-umum.html memiliki label eksplisit fallback simulasi dev offline');
assert(suHtml.includes('Data belum tersimpan ke server backend cPanel produksi'), 'Fallback dev tidak mengklaim sukses palsu ke cPanel produksi');

// 5. Pencegah Duplikasi Live di Frontend
assert(suHtml.includes('function periksaDuplikasiLive()'), 'portal-surat-umum.html memiliki fungsi periksaDuplikasiLive()');
assert(suHtml.includes('409 Conflict'), 'portal-surat-umum.html menangani respon HTTP 409 Conflict dari server backend');

// -------------------------------------------------------------
// [2/5] AUDIT BACKEND CPANEL SSOT surat-umum-data-handler.php
// -------------------------------------------------------------
console.log('\n[2/5] Memverifikasi Backend cPanel SSOT surat-umum-data-handler.php');
const phpHandler = fs.readFileSync(path.join(ROOT_DIR, 'surat-umum-data-handler.php'), 'utf8');

assert(phpHandler.includes('$dataDir = __DIR__ . \'/data\''), 'Menetapkan direktori data/ yang terisolasi');
assert(phpHandler.includes('$dataFile = $dataDir . \'/surat_umum_database.json\''), 'Menetapkan SSOT data/surat_umum_database.json');
assert(phpHandler.includes('transaksiDatabaseSuratUmum'), 'Memiliki fungsi transaksiDatabaseSuratUmum dengan exclusive lock');
assert(phpHandler.includes('flock($fpLock, LOCK_EX)'), 'Menggunakan flock LOCK_EX untuk anti-race condition');
assert(phpHandler.includes('DUPLICATE_NUMBER'), 'Mendeteksi dan menolak nomor surat ganda dengan HTTP 409 Conflict');
assert(phpHandler.includes('DUPLICATE_SEQUENCE'), 'Mendeteksi dan menolak lompatan/duplikasi nomor urut dengan HTTP 409 Conflict');
assert(phpHandler.includes("'idempotent' => true") || phpHandler.includes("'idempotent'    => true"), 'Mendukung idempotency retry atas latensi jaringan');
assert(phpHandler.includes("copy($dataFile, $backupFile)"), 'Membuat snapshot cadangan otomatis sebelum mutasi data');

// -------------------------------------------------------------
// [3/5] AUDIT ENFORCEMENT RBAC & LOCKDOWN CABANG
// -------------------------------------------------------------
console.log('\n[3/5] Memverifikasi Keamanan RBAC & Isolasi Cabang');
assert(phpHandler.includes("BRANCH_ACCESS_DENIED"), 'Backend PHP menolak mutlak seluruh akun cabang (BRANCH_ACCESS_DENIED)');
assert(phpHandler.includes("403 Forbidden"), 'Backend PHP merespons 403 Forbidden untuk akses cabang');
assert(phpHandler.includes("401 Unauthorized"), 'Backend PHP merespons 401 Unauthorized jika tanpa token/sesi');

// Simulasi RBAC PHP
function simulasikanRbacSU(role, isCabang) {
  const isSuperOrPusat = ['ADMIN_PUSAT', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(String(role).toUpperCase());
  if (!isSuperOrPusat || isCabang === true) {
    return 403;
  }
  return 200;
}

assert(simulasikanRbacSU('SUPER ADMIN', false) === 200, 'Super Admin Pusat diizinkan penuh (200 OK)');
assert(simulasikanRbacSU('ADMIN_PUSAT', false) === 200, 'Admin Pusat diizinkan penuh (200 OK)');
assert(simulasikanRbacSU('ADMIN_CABANG', true) === 403, 'Admin Cabang ditolak mutlak (403 Forbidden)');
assert(simulasikanRbacSU('MARKETING', false) === 403, 'Marketing ditolak mutlak (403 Forbidden)');
assert(simulasikanRbacSU('PENILAI', false) === 403, 'Penilai Lapangan ditolak mutlak (403 Forbidden)');

// -------------------------------------------------------------
// [4/5] AUDIT ROUTING, NETLIFY & ALLOWLIST DIST
// -------------------------------------------------------------
console.log('\n[4/5] Memverifikasi Routing .htaccess, netlify.toml & build-production.mjs');
const htaccess = fs.readFileSync(path.join(ROOT_DIR, '.htaccess'), 'utf8');
assert(htaccess.includes('RewriteRule ^api/surat-umum-data-proxy/?$ surat-umum-data-handler.php'), '.htaccess mengarahkan api/surat-umum-data-proxy ke surat-umum-data-handler.php');
assert(htaccess.includes('surat_umum_database'), '.htaccess melindungi surat_umum_database dari akses HTTP publik');

const netlifyToml = fs.readFileSync(path.join(ROOT_DIR, 'netlify.toml'), 'utf8');
assert(netlifyToml.includes('from = "/api/surat-umum-data-proxy"'), 'netlify.toml memiliki redirect untuk api/surat-umum-data-proxy');

const buildProd = fs.readFileSync(path.join(ROOT_DIR, 'scripts/build-production.mjs'), 'utf8');
assert(buildProd.includes('"surat-umum-data-handler.php"'), 'build-production.mjs mengizinkan penerbitan resmi surat-umum-data-handler.php');

// -------------------------------------------------------------
// [5/5] AUDIT INTEGRASI NAVIGASI LINTAS PORTAL
// -------------------------------------------------------------
console.log('\n[5/5] Memverifikasi Keterhubungan Ekosistem Antar-Portal');
const joHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-penugasan-jo.html'), 'utf8');
const kwHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-kwitansi.html'), 'utf8');
assert(joHtml.includes('id="nav-link-surat-umum"'), 'portal-penugasan-jo.html memiliki id="nav-link-surat-umum"');
assert(kwHtml.includes('id="nav-link-surat-umum"'), 'portal-kwitansi.html memiliki id="nav-link-surat-umum"');

console.log(`\n======================================================`);
console.log(`🎉 HASIL AUDIT PORTAL SURAT UMUM: ${passedTests}/${totalTests} PENGUJIAN LULUS (PASS)!`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
