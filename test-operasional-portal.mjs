/**
 * AUTOMATED TEST SUITE: PORTAL PENGAJUAN OPERASIONAL TERPADU (e-OPERASIONAL)
 * Sistem: KJPP Nanang Rahayu Sigit Paryanto & Rekan (KMK No. 2.19.0160)
 * Target: Branch dev
 *
 * Menguji 15 Kriteria Wajib:
 * 1. Inisialisasi database baru
 * 2. Pengajuan tiga jenis formulir (Survey, Meeting, Umum)
 * 3. Validasi data dan perhitungan biaya (subtotal, grand total, non-negatif)
 * 4. Nomor registrasi unik ([JENIS]/[KODE-KANTOR]/[BULAN-ROMAWI]/[TAHUN]/[URUT])
 * 5. Penyimpanan dan pembacaan ulang dokumen (SSOT)
 * 6. Persetujuan berurutan Tier 1–5 (Sequential Workflow)
 * 7. Penolakan approval yang melompati tier
 * 8. Penolakan permintaan tanpa autentikasi atau role yang benar
 * 9. Validasi alasan penolakan (min 10 karakter)
 * 10. Pembatalan QR yang tidak berlaku setelah revisi
 * 11. Penolakan QR palsu atau dimodifikasi (HMAC Tamper Resistance)
 * 12. Pengujian concurrent request (Concurrency & Locking Protection)
 * 13. Perlindungan akses langsung terhadap file database & secret key
 * 14. Pengujian verifikasi publik (Sanitized output & Failure banners)
 * 15. Pengujian format cetak A4 (@page margin 10mm & 5 kolom TTD)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const TEST_PORT = 8199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Official test tokens
const TOKEN_MASTER = 'NSR8899';         // Super Admin Master / Ir. Nanang Rahayu
const TOKEN_PUSAT  = 'NSR-PST-2026';    // Admin Pusat / Danny Taufik Hidayat, S.H.
const TOKEN_REV    = 'NSR-REV-2026';    // Reviewer QC / Deni Siswandi, S.T.
const TOKEN_KEU    = 'NSR-KEU-2026';    // Keuangan / Milda H
const TOKEN_SRV    = 'NSR-SRV-2026';    // Surveyor / Holik Kelana
const TOKEN_CABANG = 'NSR-BDG-2026';    // Admin Cabang Bandung
const TOKEN_PALSU  = 'NSR-INVALID-999';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

function assertTest(condition, testNumber, description, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${testNumber}] PASS: ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ [TEST ${testNumber}] FAIL: ${description}`);
    if (details) console.error(`     Detail: ${details}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, headers: res.headers, text, json };
  } catch (err) {
    return { status: 0, error: err.message, text: '', json: null };
  }
}

// Backup & restore fixture helper
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'operasional_database.json');
const BACKUP_DB_FILE = path.join(DATA_DIR, 'operasional_database.test_backup.json');

function backupDatabase() {
  if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_DB_FILE);
  }
}

function restoreDatabase() {
  if (fs.existsSync(BACKUP_DB_FILE)) {
    fs.copyFileSync(BACKUP_DB_FILE, DB_FILE);
    fs.unlinkSync(BACKUP_DB_FILE);
  }
}

async function runAllTests() {
  console.log('======================================================================');
  console.log('   PENGUJIAN OTOMATIS: PORTAL e-OPERASIONAL (KJPP NSR DEV BRANCH)');
  console.log('   Server Test: ' + BASE_URL);
  console.log('======================================================================\n');

  backupDatabase();

  // Jalankan built-in server PHP
  const phpProcess = spawn('php', ['-S', `127.0.0.1:${TEST_PORT}`, '-t', ROOT_DIR], {
    stdio: 'ignore'
  });

  // Tunggu server PHP siap
  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const probe = await fetch(`${BASE_URL}/operasional-data-handler.php?action=verifyDocument`);
      if (probe.status !== 0) {
        serverReady = true;
        break;
      }
    } catch {}
  }

  if (!serverReady) {
    console.error('FATAL: Gagal memulai server PHP lokal pada port ' + TEST_PORT);
    phpProcess.kill();
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------
    // 1. Inisialisasi Database Baru
    // -------------------------------------------------------------
    console.log('[1/15] Menguji Inisialisasi Database Baru...');
    {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      const res = await request('/operasional-data-handler.php?action=getPengajuanList', {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      assertTest(
        res.status === 200 && res.json && res.json.success === true && Array.isArray(res.json.data) && res.json.data.length === 0,
        1,
        'Inisialisasi database baru berhasil tanpa file awal (fail-safe empty array)',
        res.text
      );
    }

    // -------------------------------------------------------------
    // 2. Pengajuan Tiga Jenis Formulir (Survey, Meeting, Umum)
    // -------------------------------------------------------------
    console.log('[2/15] Menguji Pengajuan 3 Jenis Formulir...');
    let idDocSurvey = '';
    let noRegSurvey = '';
    let idDocMeeting = '';
    let idDocUmum = '';

    // A. Survey
    {
      const payloadSurvey = {
        isDraft: false,
        jenisOperasional: 'OPR-SRV',
        kodeCabang: '00',
        pemohon: { nama: 'Holik Kelana', jabatan: 'Surveyor Lapangan' },
        survey: {
          idPenugasan: 'REQ-000006',
          nomorLaporan: '00523/2.0160-00/PI/07/00581/1/IX/2026',
          namaKlien: 'PT. BANK TABUNGAN NEGARA (PERSERO), Tbk',
          lokasiObjek: 'Perumahan Green Lavender Sukamekar Bekasi',
          tglMulaiSurvey: '2026-10-21',
          tglSelesaiSurvey: '2026-10-23',
          daftarSurveyor: ['Holik Kelana'],
          biayaPersonal: [
            { uraian: 'Uang Harian / Allowance', volume: 3, satuan: 'Hari', tarif: 250000 }
          ],
          biayaKolektif: [
            { uraian: 'BBM & Tol Armada Lapangan', volume: 1, satuan: 'Paket', tarif: 500000 }
          ]
        }
      };

      const res = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_SRV },
        body: JSON.stringify(payloadSurvey)
      });

      const ok = res.status === 200 && res.json && res.json.success && res.json.data.status === 'SUBMITTED';
      if (ok) {
        idDocSurvey = res.json.data.id;
        noRegSurvey = res.json.data.noRegistrasi;
      }
      assertTest(ok, 2.1, 'Pengajuan Form A (Allowance Survey Lapangan) berhasil diterbitkan', res.text);
    }

    // B. Meeting
    {
      const payloadMeeting = {
        isDraft: false,
        jenisOperasional: 'OPR-MTG',
        kodeCabang: '00',
        pemohon: { nama: 'Danny Taufik Hidayat, S.H.', jabatan: 'Manajemen' },
        meeting: {
          divisi: 'Teknik',
          agenda: 'Rapat Koordinasi Penilaian Tol Cipali',
          waktu: '2026-10-22 14:00',
          lokasi: 'Ruang Rapat Kantor Pusat',
          estimasiPeserta: 8,
          rincianBiaya: [
            { uraian: 'Konsumsi Rapat', volume: 8, satuan: 'Orang', tarif: 45000 }
          ]
        }
      };

      const res = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify(payloadMeeting)
      });

      const ok = res.status === 200 && res.json && res.json.success && res.json.data.status === 'SUBMITTED';
      if (ok) idDocMeeting = res.json.data.id;
      assertTest(ok, 2.2, 'Pengajuan Form B (Allowance Meeting) berhasil diterbitkan', res.text);
    }

    // C. Umum
    {
      const payloadUmum = {
        isDraft: false,
        jenisOperasional: 'OPR-UMM',
        kodeCabang: '04', // Bandung
        pemohon: { nama: 'Tiara', jabatan: 'Admin Cabang' },
        umum: {
          kategori: 'ATK & Perlengkapan Kantor',
          maksudTujuan: 'Pengadaan Kertas A4 & Toner Cabang Bandung',
          rincianItem: [
            { deskripsi: 'Kertas HVS PaperOne A4 80gr', qty: 10, satuan: 'Rim', hargaSatuan: 55000 },
            { deskripsi: 'Toner HP LaserJet 85A', qty: 1, satuan: 'Pcs', hargaSatuan: 350000 }
          ]
        }
      };

      const res = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_CABANG },
        body: JSON.stringify(payloadUmum)
      });

      const ok = res.status === 200 && res.json && res.json.success && res.json.data.status === 'SUBMITTED';
      if (ok) idDocUmum = res.json.data.id;
      assertTest(ok, 2.3, 'Pengajuan Form C (Operasional Umum) berhasil diterbitkan', res.text);
    }

    // -------------------------------------------------------------
    // 3. Validasi Data dan Perhitungan Biaya (Termasuk Non-Negatif)
    // -------------------------------------------------------------
    console.log('[3/15] Menguji Validasi Data & Kalkulasi Biaya...');
    {
      // A. Validasi Akurasi Kalkulasi pada Dokumen Survey
      const resDetail = await request(`/operasional-data-handler.php?action=getPengajuanDetail&id=${idDocSurvey}`, {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      const d = resDetail.json?.data;
      const calcOk = d && d.survey.subtotalPersonal === 750000 && d.survey.subtotalKolektif === 500000 && d.totalEstimasi === 1250000;
      assertTest(calcOk, 3.1, 'Perhitungan subtotal personal (3x250rb), kolektif (500rb), dan grand total (1.25jt) akurat 100%', resDetail.text);

      // B. Penolakan Nilai Negatif
      const negativePayload = {
        isDraft: false,
        jenisOperasional: 'OPR-SRV',
        kodeCabang: '00',
        survey: {
          idPenugasan: 'REQ-000006',
          biayaPersonal: [{ uraian: 'Biaya Invalid', volume: -2, satuan: 'Hari', tarif: 100000 }],
          biayaKolektif: []
        }
      };
      const resNeg = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_SRV },
        body: JSON.stringify(negativePayload)
      });
      assertTest(
        resNeg.status === 400 && resNeg.json && resNeg.json.success === false && resNeg.json.error.includes('negatif'),
        3.2,
        'Server menolak input biaya negatif dengan HTTP 400 Bad Request',
        resNeg.text
      );
    }

    // -------------------------------------------------------------
    // 4. Nomor Registrasi Unik Sesuai Format Resmi
    // Format: [JENIS]/[KODE-KANTOR]/[BULAN-ROMAWI]/[TAHUN]/[URUT]
    // Contoh: OPR-SRV/2.19.0160-00/X/2026/0001
    // -------------------------------------------------------------
    console.log('[4/15] Menguji Format & Keunikan Nomor Registrasi...');
    {
      const regexPusat = /^OPR-SRV\/2\.19\.0160-00\/[IVXLCDM]+\/\d{4}\/\d{4}$/;
      const matchOk = regexPusat.test(noRegSurvey);
      assertTest(matchOk, 4.1, `Nomor registrasi sesuai pola resmi: ${noRegSurvey}`);

      // Terbitkan dokumen kedua dengan jenis dan cabang yang sama untuk memeriksa urut atomik (+1)
      const res2 = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_SRV },
        body: JSON.stringify({
          isDraft: false,
          jenisOperasional: 'OPR-SRV',
          kodeCabang: '00',
          survey: {
            idPenugasan: 'REQ-000007',
            biayaPersonal: [{ uraian: 'Allowance', volume: 1, satuan: 'Hari', tarif: 100000 }],
            biayaKolektif: []
          }
        })
      });
      const noReg2 = res2.json?.data?.noRegistrasi || '';
      const seq1 = parseInt(noRegSurvey.split('/').pop(), 10);
      const seq2 = parseInt(noReg2.split('/').pop(), 10);
      assertTest(
        seq2 === seq1 + 1,
        4.2,
        `Nomor urut registrasi inkremental atomik berurutan (${noRegSurvey} -> ${noReg2})`
      );
    }

    // -------------------------------------------------------------
    // 5. Penyimpanan dan Pembacaan Ulang Dokumen (SSOT)
    // -------------------------------------------------------------
    console.log('[5/15] Menguji Integritas Penyimpanan & Pembacaan Ulang (SSOT)...');
    {
      const res = await request(`/operasional-data-handler.php?action=getPengajuanDetail&id=${idDocSurvey}`, {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      const doc = res.json?.data;
      assertTest(
        doc && doc.id === idDocSurvey && doc.pemohon.nama === 'Holik Kelana' && doc.approvals[1].approved === true,
        5,
        'Penyimpanan terpusat cPanel (SSOT) menyimpan dan membaca ulang seluruh relasi data secara presisi'
      );
    }

    // -------------------------------------------------------------
    // 6. Persetujuan Berurutan Tier 1–5 (Sequential Workflow)
    // -------------------------------------------------------------
    console.log('[6/15] Menguji Persetujuan Berurutan Tier 1–5...');
    {
      // Tier 1 sudah disahkan saat submit (pengajuan awal)
      // Eksekusi Tier 2: Mengetahui (Deni Siswandi, S.T. / Reviewer / Admin Cabang)
      const resT2 = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_REV },
        body: JSON.stringify({ id: idDocSurvey, tier: 2 })
      });
      assertTest(resT2.status === 200 && resT2.json?.data?.approvals[2]?.approved === true, 6.1, 'Tier 2 (Mengetahui) berhasil disetujui');

      // Eksekusi Tier 3: Verifikasi Administrasi (Danny Taufik Hidayat, S.H. / Admin Pusat)
      const resT3 = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify({ id: idDocSurvey, tier: 3 })
      });
      assertTest(resT3.status === 200 && resT3.json?.data?.approvals[3]?.approved === true, 6.2, 'Tier 3 (Verifikasi Administrasi) berhasil disetujui');

      // Eksekusi Tier 4: Menyetujui (Milda H / Keuangan)
      const resT4 = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_KEU },
        body: JSON.stringify({ id: idDocSurvey, tier: 4 })
      });
      assertTest(resT4.status === 200 && resT4.json?.data?.approvals[4]?.approved === true, 6.3, 'Tier 4 (Menyetujui - Keuangan) berhasil disetujui');

      // Eksekusi Tier 5: Penanggung Jawab (Ir. Nanang Rahayu / Pemimpin Rekan / Super Admin)
      const resT5 = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_MASTER },
        body: JSON.stringify({ id: idDocSurvey, tier: 5 })
      });
      const finalDoc = resT5.json?.data;
      assertTest(
        resT5.status === 200 && finalDoc?.approvals[5]?.approved === true && finalDoc?.status === 'APPROVED',
        6.4,
        'Tier 5 (Penanggung Jawab) disetujui dan status final dokumen menjadi APPROVED'
      );
    }

    // -------------------------------------------------------------
    // 7. Penolakan Approval yang Melompati Tier
    // -------------------------------------------------------------
    console.log('[7/15] Menguji Penolakan Approval yang Melompati Tier...');
    {
      // Buat dokumen baru (Tier 1 disetujui, Tier 2 belum)
      const resNew = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_SRV },
        body: JSON.stringify({
          isDraft: false,
          jenisOperasional: 'OPR-MTG',
          kodeCabang: '00',
          meeting: {
            divisi: 'Manajemen',
            agenda: 'Rapat Rencana Strategis',
            rincianBiaya: [{ uraian: 'Snack', volume: 5, satuan: 'Paket', tarif: 25000 }]
          }
        })
      });
      const testSkipId = resNew.json?.data?.id;

      // Coba langsung setujui Tier 3 (Melompati Tier 2)
      const resSkip = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify({ id: testSkipId, tier: 3 })
      });
      assertTest(
        resSkip.status === 409 && resSkip.json && resSkip.json.success === false && resSkip.json.error.includes('berurutan'),
        7,
        'Server menolak lompatan tier dengan HTTP 409 Conflict: "Persetujuan harus berurutan. Tier 2 belum disetujui."'
      );
    }

    // -------------------------------------------------------------
    // 8. Penolakan Permintaan Tanpa Autentikasi atau Role yang Benar
    // -------------------------------------------------------------
    console.log('[8/15] Menguji Penolakan Tanpa Autentikasi atau Role Ilegal...');
    {
      // A. Tanpa token autentikasi -> 401
      const resNoAuth = await request('/operasional-data-handler.php?action=getPengajuanList');
      assertTest(resNoAuth.status === 401, 8.1, 'Akses tanpa token ditolak dengan HTTP 401 Unauthorized');

      // B. Token tidak terdaftar -> 401
      const resBadToken = await request('/operasional-data-handler.php?action=getPengajuanList', {
        headers: { 'X-NSR-Token': TOKEN_PALSU }
      });
      assertTest(resBadToken.status === 401, 8.2, 'Token palsu ditolak dengan HTTP 401 Unauthorized');

      // C. Role tidak berwenang mencoba menyetujui Tier 4 Keuangan -> 403
      // Surveyor (NSR-SRV-2026) mencoba approve Tier 4 pada idDocUmum
      const resForbidden = await request('/operasional-data-handler.php?action=approveTier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_SRV },
        body: JSON.stringify({ id: idDocUmum, tier: 4 })
      });
      assertTest(
        resForbidden.status === 403 && resForbidden.json?.error?.includes('403 Forbidden'),
        8.3,
        'Role tidak berwenang ditolak dengan HTTP 403 Forbidden'
      );
    }

    // -------------------------------------------------------------
    // 9. Validasi Alasan Penolakan (Minimal 10 Karakter)
    // -------------------------------------------------------------
    console.log('[9/15] Menguji Validasi Alasan Penolakan (Min 10 Karakter)...');
    {
      // A. Alasan terlalu pendek (< 10 karakter)
      const resShort = await request('/operasional-data-handler.php?action=rejectWithNote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify({ id: idDocMeeting, tier: 2, alasan: 'Salah' })
      });
      assertTest(
        resShort.status === 400 && resShort.json && resShort.json.error.includes('minimal 10 karakter'),
        9.1,
        'Server menolak alasan penolakan < 10 karakter dengan HTTP 400'
      );

      // B. Alasan sah (>= 10 karakter)
      const resValidReject = await request('/operasional-data-handler.php?action=rejectWithNote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify({
          id: idDocMeeting,
          tier: 2,
          alasan: 'Alokasi konsumsi rapat melebihi plafon harian divisi teknik.'
        })
      });
      assertTest(
        resValidReject.status === 200 && resValidReject.json?.data?.status === 'REJECTED',
        9.2,
        'Penolakan sah diterima, status dokumen berubah menjadi REJECTED dan alasan tersimpan'
      );
    }

    // -------------------------------------------------------------
    // 10. Pembatalan QR yang Tidak Berlaku Setelah Revisi
    // -------------------------------------------------------------
    console.log('[10/15] Menguji Pembatalan QR Code & Kenaikan Versi Setelah Revisi...');
    {
      // Ambil detail dokumen meeting yang baru saja ditolak
      const resOld = await request(`/operasional-data-handler.php?action=getPengajuanDetail&id=${idDocMeeting}`, {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      const oldDoc = resOld.json?.data;
      const oldTier1Hash = oldDoc.approvals[1].hmacHash;
      const oldVersion = oldDoc.versi;

      // Pemohon mengirim revisi dokumen (simpanPengajuan dengan id sama)
      const resRev = await request('/operasional-data-handler.php?action=simpanPengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_PUSAT },
        body: JSON.stringify({
          id: idDocMeeting,
          isDraft: false,
          jenisOperasional: 'OPR-MTG',
          kodeCabang: '00',
          meeting: {
            divisi: 'Teknik',
            agenda: 'Rapat Koordinasi Tol Cipali (Disesuaikan)',
            rincianBiaya: [{ uraian: 'Konsumsi Rapat', volume: 8, satuan: 'Orang', tarif: 30000 }]
          }
        })
      });

      const newDoc = resRev.json?.data;
      const newVersion = newDoc?.versi;

      // Verifikasi token QR lama versi 1 terhadap endpoint publik
      const resVerifOld = await request(
        `/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(oldDoc.noRegistrasi)}&tier=1&hash=${encodeURIComponent(oldTier1Hash)}`
      );

      const oldQrInvalid = resVerifOld.json?.valid === false;
      const versionIncremented = newVersion === oldVersion + 1;

      assertTest(
        versionIncremented && oldQrInvalid,
        10,
        `Revisi dokumen menaikkan versi (v${oldVersion} -> v${newVersion}) dan membatalkan QR token dari versi lama`
      );
    }

    // -------------------------------------------------------------
    // 11. Penolakan QR Palsu atau Dimodifikasi (HMAC Tamper Resistance)
    // -------------------------------------------------------------
    console.log('[11/15] Menguji Penolakan QR Palsu / Modifikasi (HMAC Protection)...');
    {
      // Ambil token sah dari doc survey Tier 5
      const resSurvey = await request(`/operasional-data-handler.php?action=getPengajuanDetail&id=${idDocSurvey}`, {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      const validDoc = resSurvey.json?.data;
      const validHash = validDoc.approvals[5].hmacHash;

      // Buat hash palsu dengan memodifikasi karakter akhir
      const fakeHash = validHash.substring(0, validHash.length - 4) + 'abcd';

      const resFake = await request(
        `/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(validDoc.noRegistrasi)}&tier=5&hash=${encodeURIComponent(fakeHash)}`
      );

      assertTest(
        resFake.json?.valid === false && resFake.json?.status === 'INVALID' && resFake.json?.message.includes('DOKUMEN TIDAK VALID'),
        11,
        'Server memvalidasi kriptografi HMAC dan menolak token palsu/dimanipulasi dengan status INVALID'
      );
    }

    // -------------------------------------------------------------
    // 12. Pengujian Concurrent Request (Locking & Anti Race Condition)
    // -------------------------------------------------------------
    console.log('[12/15] Menguji Transaksi Bersamaan (Concurrency & Atomicity)...');
    {
      const CONCURRENCY_COUNT = 8;
      const promises = [];

      for (let i = 0; i < CONCURRENCY_COUNT; i++) {
        const payloadConcurrent = {
          isDraft: false,
          jenisOperasional: 'OPR-UMM',
          kodeCabang: '00',
          pemohon: { nama: `Staf Uji ${i + 1}`, jabatan: 'Staf Operasional' },
          umum: {
            kategori: 'Operasional Lain-lain',
            maksudTujuan: `Uji Transaksi Konkuren #${i + 1}`,
            rincianItem: [{ deskripsi: `Item Uji ${i + 1}`, qty: 1, satuan: 'Paket', hargaSatuan: 10000 }]
          }
        };

        promises.push(
          request('/operasional-data-handler.php?action=simpanPengajuan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-NSR-Token': TOKEN_MASTER },
            body: JSON.stringify(payloadConcurrent)
          })
        );
      }

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.status === 200 && r.json?.success === true);
      const generatedNumbers = results.map(r => r.json?.data?.noRegistrasi).filter(Boolean);
      const uniqueNumbers = new Set(generatedNumbers);

      assertTest(
        allSuccess && uniqueNumbers.size === CONCURRENCY_COUNT,
        12,
        `Locking flock(LOCK_EX) berhasil menangani ${CONCURRENCY_COUNT} permintaan simultan tanpa duplikasi nomor atau race condition`
      );
    }

    // -------------------------------------------------------------
    // 13. Perlindungan Akses Langsung Terhadap File Database & Secret
    // -------------------------------------------------------------
    console.log('[13/15] Menguji Proteksi File Database, Secret & .htaccess...');
    {
      const htaccessPath = path.join(DATA_DIR, '.htaccess');
      const htaccessExists = fs.existsSync(htaccessPath);
      const htaccessContent = htaccessExists ? fs.readFileSync(htaccessPath, 'utf8') : '';
      const secretFile = path.join(DATA_DIR, '.operasional_secret');
      const secretExists = fs.existsSync(secretFile);
      const secretContent = secretExists ? fs.readFileSync(secretFile, 'utf8').trim() : '';

      const gitignorePath = path.join(ROOT_DIR, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

      const isProtected = htaccessExists &&
                          htaccessContent.includes('Require all denied') &&
                          secretExists &&
                          secretContent.length >= 64 &&
                          gitignoreContent.includes('.operasional_secret');

      assertTest(
        isProtected,
        13,
        'Direktori data dilindungi .htaccess (Require all denied) dan kunci rahasia HMAC terisolasi dari git'
      );
    }

    // -------------------------------------------------------------
    // 14. Pengujian Halaman Publik untuk Dokumen Valid dan Tidak Valid
    // -------------------------------------------------------------
    console.log('[14/15] Menguji Halaman Publik verifikasi-dokumen.html...');
    {
      const verifHtmlPath = path.join(ROOT_DIR, 'verifikasi-dokumen.html');
      const verifHtml = fs.readFileSync(verifHtmlPath, 'utf8');

      // Cek dokumen sah
      const resSurvey = await request(`/operasional-data-handler.php?action=getPengajuanDetail&id=${idDocSurvey}`, {
        headers: { 'X-NSR-Token': TOKEN_MASTER }
      });
      const validDoc = resSurvey.json?.data;
      const validHash = validDoc.approvals[5].hmacHash;

      const resPublicValid = await request(
        `/operasional-data-handler.php?action=verifyDocument&doc=${encodeURIComponent(validDoc.noRegistrasi)}&tier=5&hash=${encodeURIComponent(validHash)}`
      );

      const v = resPublicValid.json?.verification;
      const sanitized = v && v.noRegistrasi && v.pejabat && !v.totalEstimasi && !v.biayaPersonal;

      const htmlIntegrity = verifHtml.includes('DOKUMEN TIDAK VALID / VERIFIKASI GAGAL') &&
                            verifHtml.includes('Dokumen Terverifikasi Sah &amp; Terdaftar Resmi') &&
                            verifHtml.includes('operasional-data-handler.php?action=verifyDocument');

      assertTest(
        sanitized && htmlIntegrity,
        14,
        'Halaman verifikasi publik menyajikan status otentik tersanitasi tanpa mengekspos rincian biaya internal'
      );
    }

    // -------------------------------------------------------------
    // 15. Pengujian Format Cetak A4 (Print Stylesheet & 5 Kolom TTD)
    // -------------------------------------------------------------
    console.log('[15/15] Menguji Format Cetak A4 & CSS @page...');
    {
      const portalHtmlPath = path.join(ROOT_DIR, 'portal-operasional.html');
      const portalHtml = fs.readFileSync(portalHtmlPath, 'utf8');

      const hasA4Page = portalHtml.includes('@page') && portalHtml.includes('size: A4 portrait') && portalHtml.includes('margin: 10mm');
      const has5Columns = portalHtml.includes('print-qr-1') &&
                          portalHtml.includes('print-qr-2') &&
                          portalHtml.includes('print-qr-3') &&
                          portalHtml.includes('print-qr-4') &&
                          portalHtml.includes('print-qr-5');
      const hasPrintWindow = portalHtml.includes('window.print()');
      const hasQrLibrary = portalHtml.includes('qrcode.min.js') || portalHtml.includes('QRCode');

      assertTest(
        hasA4Page && has5Columns && hasPrintWindow && hasQrLibrary,
        15,
        'Tampilan cetak A4 portrait margin 10mm dengan 5 kolom otorisasi dan QR Code dinamis terkonfigurasi sempurna'
      );
    }

  } finally {
    // Matikan server PHP lokal
    phpProcess.kill();
    restoreDatabase();
  }

  // -------------------------------------------------------------
  // RINGKASAN AKHIR PENGUJIAN
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('   LAPORAN AKHIR AUTOMATED TEST e-OPERASIONAL');
  console.log('======================================================================');
  console.log(`  Total Pengujian Dijalankan : ${totalTests}`);
  console.log(`  Pengujian LULUS (PASS)     : ${passedTests}`);
  console.log(`  Pengujian GAGAL (FAIL)     : ${failedTests}`);
  console.log(`  Pengujian DILEWATI (SKIP)  : ${skippedTests}`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    console.error('HASIL: PENGUJIAN BELUM LENGKAP ATAU TERDAPAT KEGAGALAN.');
    process.exit(1);
  } else {
    console.log('HASIL: 100% PENGUJIAN BERHASIL LULUS (ALL PASS)!');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('FATAL UNCAUGHT ERROR:', err);
  process.exit(1);
});
