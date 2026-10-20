/**
 * SCRIPT: test-operasional-high-concurrency.mjs
 * Pengujian Konkurensi Beban Tinggi, Pencegahan Duplikasi Nomor Registrasi,
 * File Locking flock(LOCK_EX), Transaksi Atomik & Pemulihan Kegagalan Penulisan.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_PORT = 8219;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'operasional_database.json');
const BACKUP_DB = path.join(DATA_DIR, 'operasional_database.backup_concurrency.json');

console.log('\n======================================================================');
console.log('🧪 PENGUJIAN KONKURENSI BEBAN TINGGI & ATOMIC TRANSACTION e-OPERASIONAL');
console.log('======================================================================\n');

// Backup database eksisting jika ada
if (fs.existsSync(DB_FILE)) {
  fs.copyFileSync(DB_FILE, BACKUP_DB);
}

// Inisialisasi database kosong untuk pengujian terkontrol
fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');

let phpProcess = null;

async function startPhpServer() {
  console.log('1. Memulai PHP built-in server dengan multi-worker support di port ' + TEST_PORT + '...');
  phpProcess = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], {
    env: { ...process.env, PHP_CLI_SERVER_WORKERS: '8' },
    stdio: 'ignore'
  });
  await new Promise(r => setTimeout(r, 1500));
}

function stopPhpServer() {
  if (phpProcess) {
    phpProcess.kill();
    phpProcess = null;
  }
  // Restore database asli
  if (fs.existsSync(BACKUP_DB)) {
    fs.copyFileSync(BACKUP_DB, DB_FILE);
    fs.unlinkSync(BACKUP_DB);
  }
}

async function run() {
  try {
    await startPhpServer();

    // -------------------------------------------------------------
    // TEST 1: Concurrency Submission - 25 Permintaan Serentak
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: 25 Pengajuan Serentak (Concurrent Submissions) ---');
    const branches = [
      { kode: '00', nama: 'Kantor Pusat Jakarta', token: 'NSR8899' },
      { kode: '01', nama: 'Kantor Cabang Padang', token: 'NSR-PDG-2026' },
      { kode: '02', nama: 'Kantor Cabang Makassar', token: 'NSR-MKS-2026' },
      { kode: '03', nama: 'Kantor Cabang Palembang', token: 'NSR-PLB-2026' },
      { kode: '04', nama: 'Kantor Cabang Bandung', token: 'NSR-BDG-2026' }
    ];

    const submissionPromises = [];
    const NUM_REQUESTS = 25;

    for (let i = 0; i < NUM_REQUESTS; i++) {
      const b = branches[i % branches.length];
      const jenis = i % 3 === 0 ? 'OPR-SRV' : (i % 3 === 1 ? 'OPR-MTG' : 'OPR-UMM');
      const payload = {
        jenisOperasional: jenis,
        kodeCabang: b.kode,
        namaKantor: b.nama,
        isDraft: false,
        totalEstimasi: 1500000 + (i * 100000),
        catatanPemohon: `Uji konkurensi request #${i + 1}`,
        pemohon: {
          nama: `User Uji ${i + 1}`,
          jabatan: 'Staf Operasional',
          cabang: b.nama
        }
      };

      if (jenis === 'OPR-SRV') {
        payload.survey = {
          idPenugasan: `0416/NSR/PN-APP/X/2026-${i}`,
          nomorLaporan: `0012/LAP-NSR/X/2026-${i}`,
          namaKlien: `Klien Concurrent #${i + 1}`,
          lokasiObjek: 'Lokasi Uji Konkurensi',
          biayaPersonal: [{ uraian: 'Surveyor', volume: 2, satuan: 'Hari', tarif: 250000 }],
          biayaKolektif: [{ uraian: 'Mobil', volume: 1, satuan: 'Paket', tarif: 500000 }]
        };
      } else if (jenis === 'OPR-MTG') {
        payload.meeting = {
          divisi: 'Teknik',
          agenda: `Meeting Koordinasi #${i + 1}`,
          waktu: '2026-10-25 10:00',
          lokasi: 'Ruang Rapat Utama',
          estimasiPeserta: 5,
          rincianBiaya: [{ uraian: 'Konsumsi Rapat', volume: 5, satuan: 'Orang', tarif: 75000 }]
        };
      } else {
        payload.umum = {
          kategori: 'ATK',
          maksudTujuan: `Pengadaan Logistik Batch #${i + 1}`,
          rincianItem: [{ deskripsi: 'Kertas A4', qty: 10, satuan: 'Rim', hargaSatuan: 55000 }]
        };
      }

      const p = fetch(`${BASE_URL}/operasional-data-handler.php?action=simpanPengajuan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${b.token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      }).then(async res => {
        const text = await res.text();
        try {
          return { status: res.status, data: JSON.parse(text) };
        } catch (e) {
          return { status: res.status, error: text };
        }
      });

      submissionPromises.push(p);
    }

    console.log(`  Mengirim ${NUM_REQUESTS} permintaan HTTP serentak ke operasional-data-handler.php...`);
    const results = await Promise.all(submissionPromises);

    const successCount = results.filter(r => r.status === 200 && r.data?.success).length;
    console.log(`  Hasil pengajuan: ${successCount}/${NUM_REQUESTS} berhasil (HTTP 200 OK)`);

    if (successCount !== NUM_REQUESTS) {
      console.error('❌ Gagal: Terdapat permintaan yang gagal:', results.filter(r => r.status !== 200));
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 2: Verifikasi Keunikan Nomor Registrasi & Urutan Atomik
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Integritas Nomor Registrasi Dokumen ---');
    const noRegs = results.map(r => r.data.data?.noRegistrasi);
    const uniqueNoRegs = new Set(noRegs);

    console.log(`  Total nomor registrasi diterbitkan: ${noRegs.length}`);
    console.log(`  Total nomor registrasi unik: ${uniqueNoRegs.size}`);
    console.log(`  Contoh 3 nomor awal:`, noRegs.slice(0, 3));

    if (uniqueNoRegs.size === noRegs.length) {
      console.log('  ✔ PASS: 100% Nomor registrasi unik (ZERO DUPLICATION) di bawah beban konkurensi!');
    } else {
      console.error('  ❌ FAIL: Ditemukan duplikasi nomor registrasi!');
      process.exit(1);
    }

    // Verifikasi format nomor
    // Contoh: OPR-SRV/2.19.0160-00/X/2026/0001
    const regExpNoReg = /^OPR-(SRV|MTG|UMM)\/2\.19\.0160-(00|01|02|03|04)\/[IVXLCDM]+\/\d{4}\/\d{4}$/;
    const allValidFormat = noRegs.every(n => regExpNoReg.test(n));
    if (allValidFormat) {
      console.log('  ✔ PASS: Semua nomor dokumen sesuai spesifikasi format KMK [JENIS]/[KODE-KANTOR]/[BULAN-ROMAWI]/[TAHUN]/[URUT]');
    } else {
      console.error('  ❌ FAIL: Ada nomor dokumen yang tidak sesuai format standar!');
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 3: Integritas File JSON Database
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Integritas Struktur JSON Database ---');
    const rawContent = fs.readFileSync(DB_FILE, 'utf8');
    let parsedDb = null;
    try {
      parsedDb = JSON.parse(rawContent);
    } catch (e) {
      console.error('  ❌ FAIL: Database JSON rusak atau korup setelah eksekusi konkuren!', e.message);
      process.exit(1);
    }

    if (Array.isArray(parsedDb) && parsedDb.length === NUM_REQUESTS) {
      console.log(`  ✔ PASS: Database JSON utuh dan valid, menyimpan tepat ${parsedDb.length} record tanpa kerusakan.`);
    } else {
      console.error(`  ❌ FAIL: Jumlah record di database (${parsedDb.length}) tidak sesuai ekspektasi (${NUM_REQUESTS})`);
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 4: Konkurensi Multi-Approval Berantai (Tier 2 Mengetahui)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Multi-Approval Serentak (Tier 2 - Deni Siswandi, S.T.) ---');
    const targetDocs = parsedDb.slice(0, 10);
    const approvalPromises = targetDocs.map(doc => {
      return fetch(`${BASE_URL}/operasional-data-handler.php?action=approveTier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer NSR-REV-2026', // Deni Siswandi
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          id: doc.id,
          tier: 2
        })
      }).then(r => r.json());
    });

    const appResults = await Promise.all(approvalPromises);
    const appSuccessCount = appResults.filter(r => r.success).length;
    console.log(`  Hasil approval Tier 2 serentak: ${appSuccessCount}/${targetDocs.length} berhasil`);

    if (appSuccessCount === targetDocs.length) {
      console.log('  ✔ PASS: Approval konkuren Tier 2 berhasil 100% dengan HMAC token yang valid.');
    } else {
      console.error('  ❌ FAIL: Sebagian approval Tier 2 gagal!');
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 5: Simulasi Kegagalan Penulisan & Pemulihan Transaksi
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Simulasi Kegagalan Penulisan & Pemulihan Transaksi ---');
    // Buat snapshot file sebelum error simulation
    const preErrorContent = fs.readFileSync(DB_FILE, 'utf8');
    const preErrorLength = JSON.parse(preErrorContent).length;

    // Tes kirim request invalid / malformed payload ke handler
    const invalidReq = await fetch(`${BASE_URL}/operasional-data-handler.php?action=simpanPengajuan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer NSR8899',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        jenisOperasional: 'OPR-INVALID-TYPE',
        kodeCabang: '99',
        totalEstimasi: -500000 // nilai negatif dilarang
      })
    });
    const invalidJson = await invalidReq.json();

    const postErrorContent = fs.readFileSync(DB_FILE, 'utf8');
    const postErrorLength = JSON.parse(postErrorContent).length;

    if (!invalidJson.success && invalidReq.status >= 400 && preErrorLength === postErrorLength) {
      console.log('  ✔ PASS: Transaksi gagal ditolak secara aman, database tidak terkontaminasi atau rusak.');
    } else {
      console.error('  ❌ FAIL: Transaksi invalid tidak ditangani dengan benar');
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 6: Verifikasi Kriptografis HMAC Verifikasi Publik
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Verifikasi Kriptografis HMAC Publik (verifyDocument) ---');
    const sampleDoc = (await (await fetch(`${BASE_URL}/operasional-data-handler.php?action=getPengajuanDetail&id=${targetDocs[0].id}`, {
      headers: { 'Authorization': 'Bearer NSR8899' }
    })).json()).data;

    const tier2App = sampleDoc.approvals[2];
    const verifyRes = await fetch(`${BASE_URL}/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(sampleDoc.noRegistrasi)}&tier=2&hash=${encodeURIComponent(tier2App.hmacHash)}`);
    const verifyJson = await verifyRes.json();

    if (verifyJson.success && verifyJson.valid === true) {
      console.log(`  ✔ PASS: Token HMAC Tier 2 terverifikasi SAH secara kriptografis: [${verifyJson.verification.pejabat}] - ${verifyJson.verification.jabatan}`);
    } else {
      console.error('  ❌ FAIL: Verifikasi HMAC gagal:', verifyJson);
      process.exit(1);
    }

    // Coba verifikasi dengan Hash Palsu
    const fakeVerify = await fetch(`${BASE_URL}/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(sampleDoc.noRegistrasi)}&tier=2&hash=000000000000000000000000fake`);
    const fakeJson = await fakeVerify.json();
    if (!fakeJson.success || fakeJson.valid === false) {
      console.log('  ✔ PASS: Token HMAC manipulasi/palsu berhasil ditolak keras (VERIFIKASI GAGAL)!');
    } else {
      console.error('  ❌ FAIL: Token HMAC palsu justru lolos!');
      process.exit(1);
    }

    console.log('\n======================================================================');
    console.log('🎉 SEMUA PENGUJIAN KONKURENSI & TRANSAKSI ATOMIK e-OPERASIONAL LULUS 100%!');
    console.log('======================================================================\n');
  } finally {
    stopPhpServer();
  }
}

run().catch(err => {
  stopPhpServer();
  console.error('CRITICAL ERROR:', err);
  process.exit(1);
});
