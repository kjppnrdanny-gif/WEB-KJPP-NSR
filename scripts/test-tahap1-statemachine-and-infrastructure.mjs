import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('===============================================================');
console.log('🧪 PENGUJIAN TAHAP 1: STATE MACHINE 8 STATUS & INFRASTRUKTUR');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function check(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

const html = fs.readFileSync('portal-nolap.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// -------------------------------------------------------------
// [1/4] PENGUJIAN LOGIKA STATE MACHINE & GUARD GENERATE NOLAP (FRONTEND)
// -------------------------------------------------------------
console.log('[1/4] LOGIKA STATE MACHINE & GUARD GENERATE NOLAP (FRONTEND):');

const isEligibleMatch = html.match(/function isEligibleForGenerateNoLap\(p\)\s*\{([\s\S]*?)\n    \}/);
assert(isEligibleMatch, 'Fungsi isEligibleForGenerateNoLap wajib ada di portal-nolap.html');

const isEligibleTester = new Function('p', `
  ${isEligibleMatch[0]}
  return isEligibleForGenerateNoLap(p);
`);

check('Record dengan status "Disetujui Partner" menghasilkan TRUE (Tombol Aktif)', () => {
  assert.strictEqual(isEligibleTester({ status: 'Disetujui Partner' }), true);
});

check('Record dengan checklist QA = true dan otorisasi Partner = true menghasilkan TRUE', () => {
  assert.strictEqual(isEligibleTester({
    status: 'Dalam Review Mutu (QA)',
    checklistQa: true,
    otorisasiPartner: true
  }), true);
});

check('Record "Dalam Review Mutu (QA)" tanpa checklist QA menghasilkan FALSE (Tombol Terkunci/Disabled)', () => {
  assert.strictEqual(isEligibleTester({
    status: 'Dalam Review Mutu (QA)',
    checklistQa: false,
    otorisasiPartner: false
  }), false);
});

check('Record "Perlu Perbaikan Cabang" atau "PERLU REVISI" menghasilkan FALSE (Menunggu Pengajuan Ulang)', () => {
  assert.strictEqual(isEligibleTester({ status: 'Perlu Perbaikan Cabang' }), false);
  assert.strictEqual(isEligibleTester({ status: 'PERLU REVISI' }), false);
});

check('Tombol Terkunci menyertakan atribut disabled dan tooltip informatif', () => {
  assert(html.includes('button disabled title="Terkunci: Checklist QA dan Otorisasi Partner wajib bernilai TRUE'));
  assert(html.includes('Terbitkan (Terkunci)'));
});

check('Fungsi bukaModalTerbitkanManual memblokir eksekusi jika isEligibleForGenerateNoLap FALSE', () => {
  assert(html.includes('if (!isEligibleForGenerateNoLap(item)) {'));
  assert(html.includes('GENERATE NOMOR LAPORAN TERKUNCI!'));
});

// -------------------------------------------------------------
// [2/4] PENGUJIAN FORM REVISI DENGAN CATATAN WAJIB (MIN. 10 KARAKTER)
// -------------------------------------------------------------
console.log('\n[2/4] FORM REVISI REVIEWER & VALIDASI CATATAN WAJIB:');

check('Modal id "modal-minta-revisi" tersedia di DOM', () => {
  assert(html.includes('id="modal-minta-revisi"'));
  assert(html.includes('id="input-catatan-revisi"'));
  assert(html.includes('id="btn-submit-revisi"'));
  assert(html.includes('id="revisi-char-count"'));
});

check('Fungsi validasiInputRevisi mewajibkan minimal 10 karakter untuk mengaktifkan tombol', () => {
  assert(html.includes('function validasiInputRevisi()'));
  assert(html.includes('len >= 10'));
  assert(html.includes('btn.disabled = false'));
});

check('Fungsi eksekusiKirimRevisi memvalidasi panjang catatan sebelum kirim ke backend', () => {
  assert(html.includes('if (catatan.length < 10) {'));
  assert(html.includes('status = "Perlu Perbaikan Cabang"'));
});

// -------------------------------------------------------------
// [3/4] PENGUJIAN REPOSITORI GOOGLE DRIVE TERPUSAT (PILAR 3)
// -------------------------------------------------------------
console.log('\n[3/4] INTEGRASI REPOSITORI GOOGLE DRIVE TERPUSAT (PILAR 3):');

check('Modal rincian detail memuat kartu Repositori Google Drive Terpusat', () => {
  assert(html.includes('Repositori Google Drive Terpusat'));
  assert(html.includes('Buka Folder Penugasan'));
  assert(html.includes('item.driveFolderUrl'));
  assert(html.includes('item.driveFolderPath'));
});

check('Seed data baseline nolap-data-handler.php menyertakan skema folder Drive (Tahun > Cabang > ID)', () => {
  assert(php.includes("'driveFolderId' => '1AbC_pdg000011'"));
  assert(php.includes("'driveFolderPath' => '2026/PDG/REQ-000011 - PT Semen Padang'"));
  assert(php.includes("'driveFolderUrl' => 'https://drive.google.com/drive/folders/1AbC_pdg000011'"));
});

// -------------------------------------------------------------
// [4/4] PENGUJIAN ANTREAN NOTIFIKASI EMAIL ASYNCHRONOUS & SMTP (PILAR 5)
// -------------------------------------------------------------
console.log('\n[4/4] ANTREAN NOTIFIKASI EMAIL ASYNCHRONOUS & SMTP CPANEL (PILAR 5):');

check('Fungsi antrekanNotifikasiEmail terpasang dengan konfigurasi notifikasi@kjppnanangrahayu.com (Port 465)', () => {
  assert(php.includes('function antrekanNotifikasiEmail($dataFile, $job)'));
  assert(php.includes("'username'  => 'notifikasi@kjppnanangrahayu.com'"));
  assert(php.includes("'port'      => 465"));
  assert(php.includes("'encryption'=> 'ssl'"));
  assert(php.includes('mail_queue.json'));
});

check('approveRequest di backend memvalidasi checklist QA & otorisasi Partner (Precondition Guard)', () => {
  assert(php.includes('APPROVAL_PRECONDITIONS_NOT_MET'));
  assert(php.includes('$isQAVerified'));
  assert(php.includes('$isPartnerAuthorized'));
  assert(php.includes("'http_code' => 422"));
});

check('approveRequest mengantrekan email NOMOR_RESMI_TERBIT secara asynchronous', () => {
  assert(php.includes("'event'         => 'NOMOR_RESMI_TERBIT'"));
  assert(php.includes('antrekanNotifikasiEmail($dataFile,'));
});

check('requestRevision di backend mewajibkan minimal 10 karakter catatan perbaikan (400 Bad Request)', () => {
  assert(php.includes('REVISION_NOTE_MANDATORY'));
  assert(php.includes('strlen($catatanPerbaikan) < 10'));
  assert(php.includes("'status' = 'Perlu Perbaikan Cabang'") || php.includes("status'] = 'Perlu Perbaikan Cabang'"));
});

check('requestRevision mengantrekan email PERMINTAAN_REVISI_CABANG secara asynchronous', () => {
  assert(php.includes("'event'         => 'PERMINTAAN_REVISI_CABANG'"));
});

check('Endpoint getMailQueue tersedia untuk pemantauan antrean email resmi', () => {
  assert(php.includes("if ($action === 'getMailQueue')"));
  assert(php.includes("'totalQueue' => count($queue)"));
});

console.log('\n===============================================================');
console.log(`HASIL AKHIR PENGUJIAN TAHAP 1: ${passedTests} / ${totalTests} PASS`);
console.log('===============================================================');
