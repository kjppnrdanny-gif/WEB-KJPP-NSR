import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

console.log('===============================================================');
console.log('🧪 PENGUJIAN TAHAP 2: MERGE TAGS ENGINE, DRIVE & QUEUE WORKER');
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

function runPhp(code) {
  try {
    return execSync('php', { input: `<?php\n${code}\n`, encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('PHP EXEC ERROR STDOUT:', err.stdout);
    console.error('PHP EXEC ERROR STDERR:', err.stderr);
    throw err;
  }
}

const html = fs.readFileSync('portal-nolap.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const enginePhp = fs.readFileSync('merge-tags-engine.php', 'utf8');
const workerPhp = fs.readFileSync('process-mail-queue.php', 'utf8');

// -------------------------------------------------------------
// [1/4] PENGUJIAN MERGE TAGS ENGINE & DICTIONARY BAKU (22 TAGS)
// -------------------------------------------------------------
console.log('[1/4] KAMUS MERGE TAGS & SANITASI ENGINE:');

const EXPECTED_TAGS = [
  '{{nomor_registrasi}}', '{{nomor_laporan}}', '{{tanggal_registrasi}}', '{{tanggal_laporan}}', '{{tanggal_inspeksi}}',
  '{{nama_klien}}', '{{alamat_klien}}', '{{pemberi_tugas}}', '{{debitur}}', '{{tujuan_penilaian}}', '{{bidang_penilaian}}',
  '{{objek_penilaian}}', '{{alamat_objek}}', '{{kelurahan}}', '{{kecamatan}}', '{{kota_kabupaten}}', '{{provinsi}}',
  '{{tim_penilai}}', '{{reviewer_qa}}', '{{partner_penandatangan}}', '{{nomor_ijin_penilai}}', '{{kode_cabang}}'
];

check('Kamus merge tags di merge-tags-engine.php memuat lengkap seluruh 22 tag baku', () => {
  for (const tag of EXPECTED_TAGS) {
    assert(enginePhp.includes(`'${tag}'`), `Tag ${tag} wajib ada di merge-tags-engine.php`);
  }
});

check('Kamus merge tags di portal-nolap.html (client) memuat lengkap seluruh 22 tag baku', () => {
  for (const tag of EXPECTED_TAGS) {
    assert(html.includes(`'${tag}'`), `Tag ${tag} wajib ada di portal-nolap.html`);
  }
});

check('Engine PHP tidak pernah merender teks "null" atau "undefined" pada data kosong', () => {
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $record = ['namaKlien' => null, 'penilai' => 'undefined', 'nomorLaporan' => ''];
    $rendered = renderMergeTags('Klien: {{nama_klien}} | Penilai: {{partner_penandatangan}} | NoLap: {{nomor_laporan}}', $record);
    if (stripos($rendered, 'null') !== false || stripos($rendered, 'undefined') !== false) {
      echo 'FAIL_LEAK';
      exit(1);
    }
    echo 'OK:' . $rendered;
  `);
  assert(out.startsWith('OK:'), 'Tidak boleh ada kata null atau undefined');
  assert(!out.includes('null') && !out.includes('undefined'));
});

check('Engine PHP melakukan sanitasi HTML XSS pada nilai tag', () => {
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $record = ['namaKlien' => '<script>alert(1)</script>PT Mandiri'];
    $rendered = renderMergeTags('Klien: {{nama_klien}}', $record);
    if (strpos($rendered, '<script>') !== false) {
      echo 'FAIL_XSS';
      exit(1);
    }
    echo 'OK:' . $rendered;
  `);
  assert(out.startsWith('OK:'));
  assert(out.includes('&lt;script&gt;'));
});

// -------------------------------------------------------------
// [2/4] PENGUJIAN 3 TEMPLATE DOKUMEN RESMI (A, B, C)
// -------------------------------------------------------------
console.log('\n[2/4] RENDERING TEMPLATE BAKU DOKUMEN (A, B, C):');

check('Template Surat Tugas Lapangan terdefinisi dan dapat dirender', () => {
  assert(enginePhp.includes('function getTemplateSuratTugas('));
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $record = ['noPermintaan' => 'JO-BDG-2026-001', 'namaKlien' => 'PT Bio Farma', 'cabang' => 'Bandung'];
    $html = renderMergeTags(getTemplateSuratTugas(), $record);
    assert(strpos($html, 'SURAT TUGAS INSPEKSI LAPANGAN') !== false);
    assert(strpos($html, 'PT Bio Farma') !== false);
    echo 'PASS';
  `);
  assert.strictEqual(out, 'PASS');
});

check('Template Lembar Kendali Mutu (QA Checklist) terdefinisi dan dapat dirender', () => {
  assert(enginePhp.includes('function getTemplateQaChecklist('));
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $record = ['noPermintaan' => 'JO-PDG-2026-002', 'namaKlien' => 'PT Semen Padang', 'cabang' => 'Padang'];
    $html = renderMergeTags(getTemplateQaChecklist(), $record);
    assert(strpos($html, 'LEMBAR TELAAH KENDALI MUTU') !== false);
    assert(strpos($html, 'PT Semen Padang') !== false);
    echo 'PASS';
  `);
  assert.strictEqual(out, 'PASS');
});

check('Template Tanda Terima Penyerahan Laporan terdefinisi dan dapat dirender', () => {
  assert(enginePhp.includes('function getTemplateTandaTerima('));
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $record = ['noPermintaan' => 'JO-PLB-2026-003', 'namaKlien' => 'PT Pusri', 'nomorLaporan' => '00526/2.0160-05/PI/02/00581/1/X/2026', 'cabang' => 'Palembang'];
    $html = renderMergeTags(getTemplateTandaTerima(), $record);
    assert(strpos($html, 'TANDA TERIMA PENYERAHAN LAPORAN') !== false);
    assert(strpos($html, '00526/2.0160-05/PI/02/00581/1/X/2026') !== false);
    echo 'PASS';
  `);
  assert.strictEqual(out, 'PASS');
});

check('Modal Detail UI portal-nolap.html menyediakan tombol aksi cetak untuk ketiga dokumen', () => {
  assert(html.includes("onclick=\"cetakSuratTugas('${item.noPermintaan}')\""));
  assert(html.includes("onclick=\"cetakLembarKendaliMutu('${item.noPermintaan}')\""));
  assert(html.includes("onclick=\"cetakTandaTerima('${item.noPermintaan}')\""));
});

// -------------------------------------------------------------
// [3/4] PENGUJIAN HIERARKI FOLDER GOOGLE DRIVE & 4 SUBFOLDER WAJIB (PILAR 3)
// -------------------------------------------------------------
console.log('\n[3/4] OTOMASI HIERARKI FOLDER GOOGLE DRIVE:');

check('Fungsi buatStrukturFolderGoogleDrive menghasilkan path [Tahun] / [Kode Cabang] / [ID - Klien]', () => {
  const out = runPhp(`
    require 'merge-tags-engine.php';
    $item = ['noPermintaan' => 'JO-BDG-2026-0042', 'namaKlien' => 'PT Bio Farma', 'cabang' => 'Bandung', 'tglPenilaian' => '2026-10-18'];
    $res = buatStrukturFolderGoogleDrive($item);
    assert($res['driveFolderPath'] === '2026/BDG/JO-BDG-2026-0042 - PT Bio Farma');
    assert(count($res['driveSubfolders']) === 4);
    assert(isset($res['driveSubfolders']['01_legalitas']));
    assert(isset($res['driveSubfolders']['02_lapangan']));
    assert(isset($res['driveSubfolders']['03_kertas_kerja']));
    assert(isset($res['driveSubfolders']['04_final']));
    echo 'PASS';
  `);
  assert.strictEqual(out, 'PASS');
});

check('Action createDriveFolders tersedia dan menyimpan driveSubfolders ke basis data', () => {
  assert(php.includes("action === 'createDriveFolders'"));
  assert(php.includes("$freshRecords[$targetIndex]['driveSubfolders'] = $driveMeta['driveSubfolders'];"));
});

// -------------------------------------------------------------
// [4/4] PENGUJIAN WORKER ANTREAN EMAIL SMTP CPANEL (PILAR 5)
// -------------------------------------------------------------
console.log('\n[4/4] WORKER ANTREAN EMAIL SMTP (PROCESS-MAIL-QUEUE.PHP):');

check('process-mail-queue.php mengimplementasikan file locking flock(LOCK_EX)', () => {
  assert(workerPhp.includes('flock($fpLock, LOCK_EX'));
  assert(workerPhp.includes('notifikasi@kjppnanangrahayu.com'));
});

check('Worker memproses antrean email secara batching (default limit 10)', () => {
  assert(workerPhp.includes('$batchLimit = 10;'));
  assert(workerPhp.includes('$processed >= $batchLimit'));
});

check('Eksekusi worker dalam mode mock berhasil memproses antrean dan mengupdate status "sent"', () => {
  // Masukkan 1 dummy job ke mail_queue.json
  const dataDir = 'data';
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const queueFile = 'data/mail_queue.json';
  const testJob = [{
    id: 'MQ-TEST-' + Date.now(),
    timestamp: new Date().toISOString(),
    event: 'TEST_DISPATCH',
    noPermintaan: 'REQ-TEST-QUEUE',
    recipient: 'test.cabang@kjppnanangrahayu.com',
    recipientName: 'Tester Cabang',
    subject: '[TEST] Notifikasi Uji Worker',
    body: 'Uji coba antrean worker.',
    status: 'QUEUED',
    attempts: 0,
    smtpConfig: {
      host: 'mail.kjppnanangrahayu.com',
      port: 465,
      sender: 'KJPP Nanang Rahayu & Rekan <notifikasi@kjppnanangrahayu.com>'
    }
  }];
  fs.writeFileSync(queueFile, JSON.stringify(testJob, null, 2));

  // Jalankan worker mode mock
  const out = execSync('php process-mail-queue.php --mock', { encoding: 'utf8' });
  assert(out.includes('Berhasil Terkirim: 1') || out.includes('Total Diproses  : 1'));

  // Verifikasi isi file setelah eksekusi
  const updatedQueue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  const found = updatedQueue.find(j => j.noPermintaan === 'REQ-TEST-QUEUE');
  assert(found, 'Job uji ada di antrean');
  assert.strictEqual(found.status, 'sent', 'Status job berhasil diubah menjadi sent');
  assert.ok(found.sentAt, 'Timestamp sentAt terisi');

  // Bersihkan job uji
  fs.writeFileSync(queueFile, JSON.stringify(updatedQueue.filter(j => j.noPermintaan !== 'REQ-TEST-QUEUE'), null, 2));
});

console.log('\n===============================================================');
console.log(`HASIL AKHIR PENGUJIAN TAHAP 2: ${passedTests} / ${totalTests} PASS`);
console.log('===============================================================');
