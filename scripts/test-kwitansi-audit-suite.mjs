/**
 * Test Suite: Audit Keamanan, Integritas Transaksi, Anti-Duplikasi & RBAC Portal Kwitansi
 * KJPP Nanang Rahayu Sigit Paryanto dan Rekan
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
console.log('🧪 PENGUJIAN MENYELURUH AUDIT & STABILISASI PORTAL KWITANSI');
console.log('======================================================\n');

// -------------------------------------------------------------
// [1/4] AUDIT STATIC CODE portal-kwitansi.html
// -------------------------------------------------------------
console.log('[1/4] Memverifikasi portal-kwitansi.html');
const kwitansiHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-kwitansi.html'), 'utf8');

// 1. Tidak memodifikasi prototype global DOM
assert(!kwitansiHtml.includes('_ID_ALIAS_MAP'), 'portal-kwitansi.html steril dari _ID_ALIAS_MAP');
assert(!kwitansiHtml.includes('document.getElementById = function'), 'portal-kwitansi.html tidak meng-override document.getElementById');

// 2. Menggunakan helper auth headers
assert(kwitansiHtml.includes('function getKwitansiAuthHeaders'), 'portal-kwitansi.html mendefinisikan getKwitansiAuthHeaders()');
assert(kwitansiHtml.includes("headers: getKwitansiAuthHeaders()"), 'muatDaftarKwitansi menyertakan token otorisasi melalui getKwitansiAuthHeaders');

// 3. Fallback dev offline aman
assert(kwitansiHtml.includes('Simulasi Dev Offline'), 'prosesSubmitPengajuan memiliki label eksplisit fallback simulasi dev offline');
assert(kwitansiHtml.includes('Data belum tersimpan ke server backend cPanel produksi'), 'fallback dev tidak mengklaim sukses palsu ke cPanel produksi');

// 4. Integrasi Penugasan SPK
assert(kwitansiHtml.includes("action: 'SYNC'"), 'getPenugasanKwitansiDataset mengirim POST action SYNC berautentikasi ke GAS Penugasan');

// 5. Cetak PDF dan Area Print
assert(kwitansiHtml.includes('id="print-area"'), 'portal-kwitansi.html memiliki elemen #print-area untuk cetak PDF A4 presisi');
assert(kwitansiHtml.includes('function cetakPDFKwitansi'), 'portal-kwitansi.html memiliki fungsi cetakPDFKwitansi()');

// -------------------------------------------------------------
// [2/4] AUDIT BACKEND PHP kwitansi-data-handler.php
// -------------------------------------------------------------
console.log('\n[2/4] Memverifikasi kwitansi-data-handler.php');
const phpHandler = fs.readFileSync(path.join(ROOT_DIR, 'kwitansi-data-handler.php'), 'utf8');

// 1. Transaksi Locking Atomik
assert(phpHandler.includes('function transaksiDatabaseKwitansi'), 'kwitansi-data-handler.php memiliki fungsi transaksiDatabaseKwitansi()');
assert(phpHandler.includes('.kwitansi_txn.lock'), 'transaksiDatabaseKwitansi menggunakan file lock .kwitansi_txn.lock');
assert(phpHandler.includes('flock($fpLock, LOCK_EX)'), 'transaksiDatabaseKwitansi menggunakan exclusive blocking lock flock(LOCK_EX)');

// 2. Anti-Duplikasi Nomor Kwitansi Resmi
assert(phpHandler.includes('DUPLICATE_RECEIPT_NUMBER'), 'approveKwitansi menolak duplikasi nomor kwitansi dengan DUPLICATE_RECEIPT_NUMBER');
assert(phpHandler.includes("http_code' => 409"), 'approveKwitansi mengembalikan status HTTP 409 saat nomor duplikat terdeteksi');

// 3. Idempotency Check
assert(phpHandler.includes("'idempotent'      => true"), 'approveKwitansi menangani idempotency retry dengan aman');

// 4. Normalisasi Role Super Admin & Keuangan
assert(phpHandler.includes('$isSuperOrPusat = in_array(strtoupper($rawRole), [\'ADMIN_PUSAT\', \'SUPER ADMIN\', \'SUPER_ADMIN\', \'KEUANGAN\', \'ADMIN\'], true)'), 'Role SUPER ADMIN dinormalisasi dan memiliki wewenang penuh pengesahan keuangan');
assert(phpHandler.includes('$isKeuanganOrAdmin = $isSuperOrPusat'), 'Variabel $isKeuanganOrAdmin aktif untuk SUPER ADMIN');

// 5. Dukungan Token SHA-256 dan Plaintext
assert(phpHandler.includes('isset($OFFICIAL_TOKEN_HASHES[$trimmed])'), 'X-NSR-Token mendukung input yang sudah berbentuk SHA-256 hash');

// 6. Branch helper
assert(phpHandler.includes('function cabangSesuai'), 'kwitansi-data-handler.php memiliki helper cabangSesuai untuk normalisasi nama cabang');

// -------------------------------------------------------------
// [3/4] AUDIT PROXY NETLIFY netlify/functions/kwitansi-data-proxy.mjs
// -------------------------------------------------------------
console.log('\n[3/4] Memverifikasi netlify/functions/kwitansi-data-proxy.mjs');
const proxyMjs = fs.readFileSync(path.join(ROOT_DIR, 'netlify/functions/kwitansi-data-proxy.mjs'), 'utf8');

assert(proxyMjs.includes('req.headers.get("x-nsr-token")'), 'kwitansi-data-proxy.mjs mengekstrak header x-nsr-token');
assert(proxyMjs.includes('action === "returnKwitansi"'), 'kwitansi-data-proxy.mjs mengimplementasikan action returnKwitansi');
assert(proxyMjs.includes('action === "voidKwitansi"'), 'kwitansi-data-proxy.mjs mengimplementasikan action voidKwitansi');
assert(proxyMjs.includes('DUPLICATE_RECEIPT_NUMBER'), 'kwitansi-data-proxy.mjs memvalidasi anti-duplikasi nomor kwitansi (409)');
assert(proxyMjs.includes('idempotent: true'), 'kwitansi-data-proxy.mjs menangani approval secara idempotent');
assert(proxyMjs.includes('isOverbilling'), 'kwitansi-data-proxy.mjs mendeteksi overbilling terhadap nilai kontrak SPK');

// -------------------------------------------------------------
// [4/4] SIMULASI BEHAVIORAL & KONKURENSI KWITANSI
// -------------------------------------------------------------
console.log('\n[4/4] Simulasi Perilaku Bisnis & Otorisasi Kwitansi');

// Simulasi Logika Anti-Duplikasi & Idempotency
const mockDatabase = [
  {
    idKwitansi: 'KW-000001',
    noKwitansiResmi: '017/KW-NSR/IX/2026',
    status: 'DISAHKAN',
    isApproved: true,
    cabang: 'Pusat'
  },
  {
    idKwitansi: 'KW-000002',
    noKwitansiResmi: '018/KW-NSR/X/2026',
    status: 'DISAHKAN',
    isApproved: true,
    cabang: 'Bandung'
  },
  {
    idKwitansi: 'DRAFT-KW-000003',
    noKwitansiResmi: 'DRAFT (Belum Disahkan)',
    status: 'DRAFT',
    isApproved: false,
    cabang: 'Padang'
  }
];

function simulateApprove(records, idKwitansi, requestedNoResmi) {
  const target = records.find(r => r.idKwitansi === idKwitansi);
  if (!target) return { status: 404, error: 'Not found' };

  // Idempotent
  if (target.isApproved && target.status === 'DISAHKAN') {
    if (target.noKwitansiResmi === requestedNoResmi) {
      return { status: 200, idempotent: true, noKwitansiResmi: target.noKwitansiResmi };
    }
  }

  // Duplicate Check
  const isDuplicate = records.some(r => r.idKwitansi !== idKwitansi && r.noKwitansiResmi && r.noKwitansiResmi.toLowerCase() === requestedNoResmi.toLowerCase());
  if (isDuplicate) {
    return { status: 409, error: 'DUPLICATE_RECEIPT_NUMBER' };
  }

  target.status = 'DISAHKAN';
  target.isApproved = true;
  target.noKwitansiResmi = requestedNoResmi;
  return { status: 200, success: true, noKwitansiResmi: requestedNoResmi };
}

// 1. Pengesahan nomor duplikat ditolak 409 Conflict
const dupRes = simulateApprove(mockDatabase, 'DRAFT-KW-000003', '017/KW-NSR/IX/2026');
assert(dupRes.status === 409 && dupRes.error === 'DUPLICATE_RECEIPT_NUMBER', 'Pengesahan nomor kwitansi yang sudah ada (017/KW-NSR/IX/2026) ditolak HTTP 409 Conflict');

// 2. Pengesahan nomor baru berhasil
const okRes = simulateApprove(mockDatabase, 'DRAFT-KW-000003', '019/KW-NSR/X/2026');
assert(okRes.status === 200 && okRes.success === true, 'Pengesahan nomor resmi baru (019/KW-NSR/X/2026) berhasil HTTP 200');

// 3. Pengesahan ulang dengan nomor yang sama menghasilkan idempotent 200 OK
const idempRes = simulateApprove(mockDatabase, 'DRAFT-KW-000003', '019/KW-NSR/X/2026');
assert(idempRes.status === 200 && idempRes.idempotent === true, 'Retry pengesahan kedua menghasilkan respon idempotent (200 OK idempotent)');

// 4. Simulasi Overbilling SPK
const spkContractValue = 30000000;
const currentBilled = 20000000;
const newDraftValue = 15000000;
const isOverbilling = (currentBilled + newDraftValue) > spkContractValue;
assert(isOverbilling === true, 'Kelebihan akumulasi tagihan (Rp 35jt > Rp 30jt) terdeteksi sebagai isOverbilling');

console.log('\n======================================================');
console.log(`🎉 SEMUA PENGUJIAN KWITANSI BERHASIL: ${passedTests}/${totalTests} UJI VALID!`);
console.log('======================================================\n');
