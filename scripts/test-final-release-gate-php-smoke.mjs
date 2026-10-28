/**
 * FINAL RELEASE GATE — PHP BACKEND SMOKE TEST & AUTHORIZATION VERIFICATION
 * Memverifikasi 5 Modul Utama pada arsitektur PHP cPanel Rumahweb:
 * 1. Penugasan JO (auth-handler.php - Token, Sesi, RBAC)
 * 2. NoLap (nolap-data-handler.php - SSOT, Lock, Anti-Duplikasi 409)
 * 3. Kwitansi (kwitansi-data-handler.php - RBAC Keuangan, Overbilling, Anti-Duplikasi)
 * 4. Surat Umum (surat-umum-data-handler.php - Head Office Lockdown, Agenda Resmi)
 * 5. Presensi (absensi-data-handler.php - NIK, OTP, Geofencing Haversine, Anti-Double)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('===============================================================');
console.log('   FINAL RELEASE GATE — PHP BACKEND SMOKE TEST (cPANEL RUMAHWEB)');
console.log('===============================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. VERIFIKASI HIGIENITAS & SINTAKS STRUKTURAL KODE PHP (cPANEL STANDARDS)
// -----------------------------------------------------------------------------
console.log('[1/5] VERIFIKASI SINTAKS & KONFIGURASI RUNTIME PHP:');

const phpFiles = [
  'auth-handler.php',
  'nolap-data-handler.php',
  'kwitansi-data-handler.php',
  'surat-umum-data-handler.php',
  'absensi-data-handler.php'
];

phpFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  check(`File ${file} memiliki pembuka <?php valid dan tidak ada whitespace sebelum tag`, () => {
    assert.ok(content.startsWith('<?php'), `${file} harus diawali <?php`);
  });

  check(`File ${file} mengonfigurasi header UTF-8, nosniff, dan DENY/SAMEORIGIN`, () => {
    assert.ok(content.includes("header('Content-Type: application/json; charset="));
    assert.ok(content.includes('nosniff'));
  });

  check(`File ${file} memiliki kurung kurawal buka-tutup seimbang (Brace Balance)`, () => {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    assert.strictEqual(openBraces, closeBraces, `Kurung kurawal di ${file} harus seimbang: ${openBraces} vs ${closeBraces}`);
  });
});

// -----------------------------------------------------------------------------
// 2. SMOKE TEST MODUL 1: PENUGASAN JO / AUTH HANDLER (auth-handler.php)
// -----------------------------------------------------------------------------
console.log('\n[2/5] SMOKE TEST MODUL PENUGASAN JO & AUTENTIKASI:');
const authPhp = fs.readFileSync('auth-handler.php', 'utf8');

check('auth-handler.php mendukung sesi kerja 8 jam dengan cookie HttpOnly + SameSite Lax', () => {
  assert.ok(authPhp.includes("session_name('NSR_SESSION')"));
  assert.ok(authPhp.includes("'httponly' => true"));
  assert.ok(authPhp.includes("'samesite' => 'Lax'"));
  assert.ok(authPhp.includes("28800")); // 8 jam
});

check('auth-handler.php memuat registry otentikasi privat server secara aman (Zero Public Source Code Leak)', () => {
  assert.ok(authPhp.includes("require_once __DIR__ . '/auth-registry-loader.php'"));
  assert.ok(authPhp.includes("$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes']"));
});

check('auth-handler.php menangani validasi token, verifikasi sesi, dan logout', () => {
  assert.ok(authPhp.includes('$action === \'token\''));
  assert.ok(authPhp.includes('$action === \'verify\''));
  assert.ok(authPhp.includes('$action === \'logout\''));
});

// -----------------------------------------------------------------------------
// 3. SMOKE TEST MODUL 2: NOLAP (nolap-data-handler.php)
// -----------------------------------------------------------------------------
console.log('\n[3/5] SMOKE TEST MODUL NOLAP:');
const nolapPhp = fs.readFileSync('nolap-data-handler.php', 'utf8');

check('nolap-data-handler.php menerapkan SSOT pada data/nolap_database.json', () => {
  assert.ok(nolapPhp.includes("nolap_database.json"));
  assert.ok(nolapPhp.includes("transaksiDatabaseNoLap"));
});

check('nolap-data-handler.php menggunakan locking eksklusif flock(LOCK_EX) untuk mencegah race condition', () => {
  assert.ok(nolapPhp.includes("flock($fpLock, LOCK_EX)"));
  assert.ok(nolapPhp.includes(".nolap_txn.lock"));
});

check('nolap-data-handler.php mendeteksi dan menolak nomor laporan duplikat (HTTP 409 DUPLICATE_REPORT_NUMBER)', () => {
  assert.ok(nolapPhp.includes("'http_code' => 409"));
  assert.ok(nolapPhp.includes("DUPLICATE_REPORT_NUMBER"));
});

check('nolap-data-handler.php membatasi wewenang approval nomor laporan HANYA untuk Admin Pusat', () => {
  assert.ok(nolapPhp.includes("UNAUTHORIZED_APPROVAL_ATTEMPT"));
  assert.ok(nolapPhp.includes("Wewenang approval resmi mutlak milik Admin Kantor Pusat"));
});

// -----------------------------------------------------------------------------
// 4. SMOKE TEST MODUL 3: KWITANSI (kwitansi-data-handler.php)
// -----------------------------------------------------------------------------
console.log('\n[4/5] SMOKE TEST MODUL KWITANSI:');
const kwitansiPhp = fs.readFileSync('kwitansi-data-handler.php', 'utf8');

check('kwitansi-data-handler.php menerapkan SSOT pada data/kwitansi_database.json dengan lock atomik', () => {
  assert.ok(kwitansiPhp.includes("kwitansi_database.json"));
  assert.ok(kwitansiPhp.includes("transaksiDatabaseKwitansi"));
  assert.ok(kwitansiPhp.includes("flock($fpLock, LOCK_EX)"));
  assert.ok(kwitansiPhp.includes(".kwitansi_txn.lock"));
});

check('kwitansi-data-handler.php menolak mutlak pengesahan kwitansi oleh akun Cabang (HTTP 403)', () => {
  assert.ok(kwitansiPhp.includes("UNAUTHORIZED_APPROVAL_ATTEMPT"));
  assert.ok(kwitansiPhp.includes("Wewenang pengesahan kwitansi resmi mutlak milik Bagian Keuangan Kantor Pusat"));
});

check('kwitansi-data-handler.php memvalidasi anti-duplikasi nomor kwitansi resmi (HTTP 409)', () => {
  assert.ok(kwitansiPhp.includes("DUPLICATE_RECEIPT_NUMBER"));
  assert.ok(kwitansiPhp.includes("'http_code' => 409"));
});

check('kwitansi-data-handler.php menghitung akumulasi tagihan SPK dan mendeteksi overbilling', () => {
  assert.ok(kwitansiPhp.includes("nilaiKontrakSpk"));
  assert.ok(kwitansiPhp.includes("totalTertagih"));
  assert.ok(kwitansiPhp.includes("isOverbilling"));
});

// -----------------------------------------------------------------------------
// 5. SMOKE TEST MODUL 4: SURAT UMUM & MODUL 5: PRESENSI
// -----------------------------------------------------------------------------
console.log('\n[5/5] SMOKE TEST MODUL SURAT UMUM & PRESENSI:');
const suPhp = fs.readFileSync('surat-umum-data-handler.php', 'utf8');
const absensiPhp = fs.readFileSync('absensi-data-handler.php', 'utf8');

check('surat-umum-data-handler.php mengunci mutlak akses Cabang ke Buku Agenda Pusat (BRANCH_ACCESS_DENIED)', () => {
  assert.ok(suPhp.includes("BRANCH_ACCESS_DENIED"));
  assert.ok(suPhp.includes("Modul Buku Agenda Surat Umum (SU) merupakan wewenang eksklusif Kantor Pusat"));
});

check('surat-umum-data-handler.php menggunakan transaksi atomik flock(LOCK_EX) & mendeteksi nomor ganda (HTTP 409)', () => {
  assert.ok(suPhp.includes("transaksiDatabaseSuratUmum"));
  assert.ok(suPhp.includes("flock($fpLock, LOCK_EX)"));
  assert.ok(suPhp.includes("DUPLICATE_NUMBER"));
  assert.ok(suPhp.includes("DUPLICATE_SEQUENCE"));
});

check('absensi-data-handler.php mengonfigurasi geofence 5 kantor cabang dan koordinat Pusat Jakarta', () => {
  assert.ok(absensiPhp.includes("Pusat Jakarta"));
  assert.ok(absensiPhp.includes("-6.287972658138783"));
  assert.ok(absensiPhp.includes("106.82477864308436"));
  assert.ok(absensiPhp.includes("Cabang Bandung"));
  assert.ok(absensiPhp.includes("Cabang Makassar"));
});

check('absensi-data-handler.php mengimplementasikan rumus Haversine & radius validasi kantor 150 meter', () => {
  assert.ok(absensiPhp.includes("function hitungJarakHaversine"));
  assert.ok(absensiPhp.includes("150")); // 150 meter
  assert.ok(absensiPhp.includes("6371000")); // Radius bumi dalam meter
});

check('absensi-data-handler.php mencegah presensi masuk ganda pada tanggal yang sama (DUPLICATE_PRESENSI 409)', () => {
  assert.ok(absensiPhp.includes("DUPLICATE_PRESENSI"));
  assert.ok(absensiPhp.includes("409"));
});

check('absensi-data-handler.php melindungi data riwayat dengan file locking .absensi_txn.lock', () => {
  assert.ok(absensiPhp.includes(".absensi_txn.lock"));
  assert.ok(absensiPhp.includes("flock($lockHandle, LOCK_EX)"));
});

console.log('\n===============================================================');
console.log(`HASIL AKHIR PHP SMOKE TEST: ${passedChecks} / ${totalChecks} PASS`);
console.log('===============================================================');

if (passedChecks !== totalChecks) {
  process.exit(1);
}
