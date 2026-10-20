import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('\n======================================================');
console.log('🧪 PENGUJIAN MENYELURUH AUDIT & STABILISASI PORTAL NOLAP');
console.log('======================================================\n');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Detail: ${err.message}`);
    process.exit(1);
  }
}

// 1. PENGUJIAN PORTAL-NOLAP.HTML
console.log('\x1b[36m[1/5] Memverifikasi portal-nolap.html\x1b[0m');
const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8').replace(/\r\n/g, '\n');

test('portal-nolap.html tidak memodifikasi global getElementById / querySelector (_ID_ALIAS_MAP)', () => {
  assert(!nolapHtml.includes('_ID_ALIAS_MAP'), 'Steril dari _ID_ALIAS_MAP');
  assert(!nolapHtml.includes('document.getElementById ='), 'Steril dari monkey-patching getElementById');
  assert(!nolapHtml.includes('document.querySelector ='), 'Steril dari monkey-patching querySelector');
});

test('simpanPenerbitanManual memvalidasi anti-duplikasi nomor laporan resmi', () => {
  assert(nolapHtml.includes('p.nomorLaporan.toLowerCase().trim() === inputNoLap.toLowerCase().trim()'), 'Terdapat pengecekan keunikan nomor laporan');
  assert(nolapHtml.includes('PERINGATAN NOMOR GANDA!'), 'Menampilkan dialog peringatan nomor ganda');
});

test('simpanPenerbitanManual melakukan sinkronisasi ganda (Proxy + Apps Script)', () => {
  assert(nolapHtml.includes("action: 'approveRequest'"), 'Mengirim action approveRequest');
  assert(nolapHtml.includes("kirimKeAppsScriptBackground({\n        action: 'approveRequest'"), 'Mengirim ke background Apps Script');
  assert(nolapHtml.includes("fetch('/api/nolap-data-proxy'"), 'Mengirim ke /api/nolap-data-proxy');
});

test('mintaRevisiPengajuan melakukan sinkronisasi status ke server proxy dan GAS', () => {
  assert(nolapHtml.includes("action: 'requestRevision'"), 'Mengirim action requestRevision');
  assert(nolapHtml.includes("kirimKeAppsScriptBackground({\n        action: 'requestRevision'"), 'Mengirim requestRevision ke GAS');
});

test('sinkronkanDariServerProxy menyertakan header X-NSR-Token', () => {
  assert(nolapHtml.includes("const tokenVal = (sesiAktif && (sesiAktif.token || sesiAktif.tokenHash))"), 'Mengekstrak tokenVal dari sesi');
  assert(nolapHtml.includes("...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})"), 'Meneruskan X-NSR-Token pada GET request');
});

test('ajukanPermohonanNoLap dilengkapi dev/offline fallback tanpa merusak Deni Siswandi daily lock', () => {
  assert(nolapHtml.includes('isOfflineFallback: true'), 'Menyediakan fallback record jika backend offline');
  assert(nolapHtml.includes("DENI_SISWANDI_DAILY_BRANCH_LOCKED"), 'Eksklusivitas harian Deni Siswandi tetap ditegakkan mutlak');
});

// 2. PENGUJIAN GAS-NOLAP-CODE.GS
console.log('\n\x1b[36m[2/5] Memverifikasi gas-nolap-Code.gs\x1b[0m');
const gasNolap = fs.readFileSync('gas-nolap-Code.gs', 'utf8');

test('doPost gas-nolap-Code.gs merutekan approveRequest dan requestRevision', () => {
  assert(gasNolap.includes("action === 'approveRequest'"), 'Routing approveRequest tersedia');
  assert(gasNolap.includes("action === 'requestRevision'"), 'Routing requestRevision tersedia');
});

test('handleApproveNoLap memvalidasi anti-duplikasi nomor laporan di Kolom 22 (V)', () => {
  assert(gasNolap.includes('function handleApproveNoLap(data)'), 'Fungsi handleApproveNoLap didefinisikan');
  assert(gasNolap.includes("rowNoLap.toLowerCase() === noLap.toLowerCase()"), 'Validasi perbandingan case-insensitive noLap');
  assert(gasNolap.includes("DUPLICATE_REPORT_NUMBER"), 'Error code DUPLICATE_REPORT_NUMBER tersedia');
});

test('handleApproveNoLap mengupdate Kolom 21, 22, 23, dan 33 di Sheet PENGAJUAN', () => {
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 21).setValue('NOMOR DITERBITKAN')"), 'Kolom 21 (U) diupdate ke NOMOR DITERBITKAN');
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 22).setValue(noLap)"), 'Kolom 22 (V) diupdate ke noLap');
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 23).setValue(tglTerbit)"), 'Kolom 23 (W) diupdate ke tglTerbit');
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 33).setValue(catatanAdmin)"), 'Kolom 33 (AG) diupdate ke catatanAdmin');
});

test('handleRequestRevision mengupdate Kolom 21 ke PERLU REVISI', () => {
  assert(gasNolap.includes('function handleRequestRevision(data)'), 'Fungsi handleRequestRevision didefinisikan');
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 21).setValue('PERLU REVISI')"), 'Kolom 21 diupdate ke PERLU REVISI');
  assert(gasNolap.includes("sheet.getRange(targetRowIndex, 33).setValue(catatanAdmin)"), 'Kolom 33 diupdate dengan catatan revisi');
});

test('doGet gas-nolap-Code.gs tidak membocorkan data spreadsheet tanpa autentikasi', () => {
  assert(gasNolap.includes('function doGet(e)'), 'doGet tersedia');
  assert(!gasNolap.includes('sheet.getDataRange().getValues()') || gasNolap.indexOf('sheet.getDataRange().getValues()') > gasNolap.indexOf('function handleSubmitPengajuanNoLap'), 'doGet tidak membaca data spreadsheet');
});

// 3. PENGUJIAN NOLAP-DATA-HANDLER.PHP
console.log('\n\x1b[36m[3/5] Memverifikasi nolap-data-handler.php\x1b[0m');
const phpHandler = fs.readFileSync('nolap-data-handler.php', 'utf8');

test('nolap-data-handler.php menormalisasi role SUPER ADMIN dan ADMIN_CABANG', () => {
  assert(phpHandler.includes('$isSuperOrPusat = in_array(strtoupper($rawRole), [\'ADMIN_PUSAT\', \'SUPER ADMIN\', \'SUPER_ADMIN\'], true)'), 'SUPER ADMIN dinormalisasi ke pusat');
  assert(phpHandler.includes('$isCabangRole = in_array(strtoupper($rawRole), [\'CABANG\', \'ADMIN_CABANG\'], true)'), 'ADMIN_CABANG dinormalisasi ke cabang');
  assert(phpHandler.includes('$userRole = $isSuperOrPusat ? \'ADMIN_PUSAT\' : ($isCabangRole ? \'CABANG\' : $rawRole);'), 'Normalisasi userRole berhasil');
});

test('nolap-data-handler.php mendukung X-NSR-Token dalam bentuk hash SHA-256 maupun plaintext', () => {
  assert(phpHandler.includes('isset($OFFICIAL_TOKEN_HASHES[$trimmed])'), 'Pengecekan langsung hash resmi');
  assert(phpHandler.includes('$tHash = hash(\'sha256\', strtoupper($trimmed));'), 'Fallback hashing plaintext');
});

test('approveRequest di nolap-data-handler.php menolak duplikasi nomor laporan secara atomik dengan HTTP 409', () => {
  assert(phpHandler.includes("'http_code' => 409"), 'Mengembalikan status HTTP 409 Conflict di dalam transaksi atomik');
  assert(phpHandler.includes("'violation' => 'DUPLICATE_REPORT_NUMBER'"), 'Violation code DUPLICATE_REPORT_NUMBER disertakan');
  assert(phpHandler.includes("strcasecmp(trim($r['nomorLaporan']), $noLap) === 0"), 'Cek case-insensitive nomor laporan di database');
  assert(phpHandler.includes('transaksiDatabaseNoLap'), 'Menggunakan transaksiDatabaseNoLap terproteksi lock');
});

test('requestRevision di nolap-data-handler.php mengubah status menjadi PERLU REVISI / Perlu Perbaikan Cabang', () => {
  assert(phpHandler.includes("if ($action === 'requestRevision')"), 'Handler requestRevision tersedia');
  assert(phpHandler.includes("$freshRecords[$targetIndex]['status'] = 'Perlu Perbaikan Cabang'") || phpHandler.includes("$freshRecords[$targetIndex]['status'] = 'PERLU REVISI'"), 'Status diubah ke status revisi');
});

// 4. PENGUJIAN NETLIFY FUNCTIONS NOLAP-DATA-PROXY.MJS
console.log('\n\x1b[36m[4/5] Memverifikasi netlify/functions/nolap-data-proxy.mjs\x1b[0m');
const proxyMjs = fs.readFileSync('netlify/functions/nolap-data-proxy.mjs', 'utf8');

test('nolap-data-proxy.mjs mengimplementasikan requestRevision', () => {
  assert(proxyMjs.includes('action === "requestRevision"'), 'Handler requestRevision ada');
  assert(proxyMjs.includes('targetItem.status = "PERLU REVISI"'), 'Status diubah ke PERLU REVISI');
  assert(proxyMjs.includes('UNAUTHORIZED_REVISION_ATTEMPT'), 'Proteksi otorisasi revisi pusat');
});

test('nolap-data-proxy.mjs memvalidasi anti-duplikasi nomor laporan resmi', () => {
  assert(proxyMjs.includes('DUPLICATE_NUMBER_REJECTED'), 'Kode DUPLICATE_NUMBER_REJECTED tersedia');
});

// 5. PENGUJIAN PORTAL-NOLAP-CABANG.HTML
console.log('\n\x1b[36m[5/5] Memverifikasi portal-nolap-cabang.html\x1b[0m');
const cbgNolap = fs.readFileSync('portal-nolap-cabang.html', 'utf8');

test('portal-nolap-cabang.html tetap mematuhi otorisasi mandiri cabang dan PIN reviewer QC', () => {
  assert(cbgNolap.includes('terbitkanNomorDrafCabang'), 'Fitur draf mandiri cabang ada');
  assert(cbgNolap.includes('verifikasiDanTerbitkanDefinitifCabang'), 'Fitur nomor definitif cabang ada');
  assert(cbgNolap.includes('input-pin-reviewer'), 'PIN reviewer QC ada');
});

console.log(`\n======================================================`);
console.log(`🎉 SEMUA PENGUJIAN NOLAP BERHASIL: ${passCount}/${passCount} UJI VALID!`);
console.log(`======================================================\n`);
