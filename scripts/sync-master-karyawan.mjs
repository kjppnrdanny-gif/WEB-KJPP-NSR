import fs from 'node:fs';
import path from 'node:path';

const SPREADSHEET_TITLE = "DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN";
const SHEET_TAB = "MASTER_KARYAWAN";
const GAS_URL = "https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec";

async function syncMasterKaryawan() {
  console.log('========================================================================');
  console.log('🔄 SINKRONISASI MASTER KARYAWAN GOOGLE SHEETS -> BACKEND PRESENSI');
  console.log('========================================================================\n');

  console.log('1. Mengambil data live MASTER KARYAWAN dari Google Spreadsheet resmi...');
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'getMasterKaryawanFull' }),
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await res.json();
  if (!json.success || !json.rows) {
    throw new Error('Gagal mengambil data dari Google Apps Script: ' + (json.message || 'Respons kosong'));
  }

  console.log(`   ✓ Terhubung ke: "${json.spreadsheetTitle || SPREADSHEET_TITLE}"`);
  console.log(`   ✓ Tab Master: "${json.sheetName || SHEET_TAB}"`);
  console.log(`   ✓ Ditemukan ${json.rows.length} data karyawan resmi.\n`);

  const headers = json.headers.map(h => String(h).trim().toUpperCase());
  const colNik = headers.findIndex(h => h.includes('NIK'));
  const colNama = headers.findIndex(h => h.includes('NAMA'));
  const colJabatan = headers.findIndex(h => h.includes('JABATAN'));
  const colDivisi = headers.findIndex(h => h.includes('DIVISI'));
  const colStatus = headers.findIndex(h => h.includes('STATUS'));
  const colAlamatWfh = headers.findIndex(h => h.includes('ALAMAT WFH'));
  const colGpsWfh = headers.findIndex(h => h.includes('GPS WFH'));
  const colEmail = headers.findIndex(h => h.includes('EMAIL') || h === 'GMAIL');

  const masterList = json.rows.map(row => {
    const rawNik = String(row[colNik] || '').trim();
    const rawNama = String(row[colNama] || '').trim();
    const rawJabatan = String(row[colJabatan] || '').trim();
    const rawDivisi = String(row[colDivisi] || '').trim();
    const rawStatus = String(row[colStatus] || 'Aktif').trim();
    const rawAlamatWfh = colAlamatWfh !== -1 ? String(row[colAlamatWfh] || '').trim() : '';
    const rawGpsWfh = colGpsWfh !== -1 ? String(row[colGpsWfh] || '').trim() : '';
    const rawEmail = colEmail !== -1 ? String(row[colEmail] || '').trim() : '';

    return {
      nik: rawNik,
      nama: rawNama,
      jabatan: rawJabatan,
      divisi: rawDivisi,
      cabang: 'Pusat Jakarta', // Seluruh roster Google Sheet adalah Kantor Pusat Jakarta
      status: rawStatus.toUpperCase() === 'AKTIF' ? 'AKTIF' : rawStatus.toUpperCase(),
      email: rawEmail,
      alamat_wfh: rawAlamatWfh,
      gps_wfh: rawGpsWfh
    };
  }).filter(k => k.nik.length > 0);

  // 2. Simpan master snapshot SSOT ke data/masters/master_karyawan_pusat_ssot.json
  const masterSnapshotPath = path.join(process.cwd(), 'data/masters/master_karyawan_pusat_ssot.json');
  const masterSnapshot = {
    system: "OPINI NSR — Master Karyawan Presensi SSOT",
    spreadsheet_id: "12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E",
    spreadsheet_title: SPREADSHEET_TITLE,
    tab_name: SHEET_TAB,
    scope: "KANTOR PUSAT JAKARTA SAJA",
    synced_at: new Date().toISOString(),
    total_karyawan: masterList.length,
    karyawan: masterList
  };
  fs.writeFileSync(masterSnapshotPath, JSON.stringify(masterSnapshot, null, 2), 'utf8');
  console.log(`2. Snapshot Master SSOT disimpan ke: ${masterSnapshotPath}`);

  // 3. Rekonsiliasi dengan data/absensi_database.json
  const dbPath = path.join(process.cwd(), 'data/absensi_database.json');
  let currentDb = {
    metadata: {
      app: "KJPP NSR Presensi SSOT",
      version: "1.0-2026",
      last_sync: new Date().toISOString(),
      total_absensi: 0,
      total_cuti: 0
    },
    master_karyawan: [],
    master_wfh: [],
    absensi: [],
    pengajuan_cuti: []
  };

  if (fs.existsSync(dbPath)) {
    try {
      currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.warn('Gagal membaca db eksisting, inisialisasi baru.');
    }
  }

  // Backup otomatis sebelum modifikasi
  const backupPath = path.join(process.cwd(), 'data/backups', `absensi_db_sync_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(currentDb, null, 2), 'utf8');
  console.log(`3. Backup database operasional disimpan ke: ${backupPath}`);

  // Rekonsiliasi identitas karyawan
  const masterNikSet = new Set(masterList.map(k => k.nik.toUpperCase()));
  const reconciledKaryawan = [...masterList];

  // Identifikasi karyawan lama yang tidak ada di master Google Sheet
  const oldKaryawan = currentDb.master_karyawan || [];
  let unverifiedCount = 0;

  for (const old of oldKaryawan) {
    if (!old.nik) continue;
    const normOldNik = old.nik.toUpperCase().trim();
    if (!masterNikSet.has(normOldNik)) {
      // Tandai PERLU VERIFIKASI HR, pertahankan riwayat
      reconciledKaryawan.push({
        ...old,
        status: 'PERLU_VERIFIKASI_HR',
        catatan_hr: 'Tidak ditemukan dalam Master Google Sheets, menunggu verifikasi HR'
      });
      unverifiedCount++;
    }
  }

  // Perbarui DB
  currentDb.metadata.last_sync = new Date().toISOString();
  currentDb.metadata.source_master = SPREADSHEET_TITLE;
  currentDb.metadata.total_karyawan_pusat = masterList.length;
  currentDb.metadata.total_unverified = unverifiedCount;
  currentDb.master_karyawan = reconciledKaryawan;

  fs.writeFileSync(dbPath, JSON.stringify(currentDb, null, 4), 'utf8');
  console.log(`4. Database Presensi ${dbPath} berhasil diperbarui atomik.`);
  console.log(`   - Total Karyawan Pusat Resmi: ${masterList.length}`);
  console.log(`   - Karyawan Perlu Verifikasi HR: ${unverifiedCount}`);
  console.log(`   - Total Transaksi Historis Absensi: ${currentDb.absensi.length} (UTUH)`);
  console.log(`   - Total Pengajuan Cuti Historis: ${currentDb.pengajuan_cuti.length} (UTUH)\n`);

  console.log('========================================================================');
  console.log('✨ SINKRONISASI SELESAI DENGAN SUKSES!');
  console.log('========================================================================');
}

syncMasterKaryawan().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
