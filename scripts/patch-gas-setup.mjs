// scripts/patch-gas-setup.mjs
import fs from 'fs';
import path from 'path';

const gasPath = path.resolve('gas-job-tracking.gs');
let gas = fs.readFileSync(gasPath, 'utf8');

// Replace handleSetupDatabase_ implementation with clean 20-column headers & seedData
const oldSetupRegex = /\/\*\*[\s\S]*?6\. SETUP DATABASE GENERATOR OTOMATIS[\s\S]*?function handleSetupDatabase_\(\) \{[\s\S]*?\/\/ 4\. Tab DASHBOARD_KONTROL[\s\S]*?sheetDash\.getRange\('A3:E3'\)\.setBackground\('#1e293b'\)\.setFontColor\('#ffffff'\)\.setFontWeight\('bold'\);[\s\S]*?return createJsonResponse_\(\{[\s\S]*?message: 'Database 4 Tab Google Spreadsheet[\s\S]*?\}\);[\s\S]*?\}/;

const newSetupFunc = `/**
 * =========================================================================
 * 6. SETUP DATABASE GENERATOR OTOMATIS
 * Menyiapkan 4 tab lengkap dengan tata letak, warna, formula dan seed data.
 * =========================================================================
 */
function handleSetupDatabase_() {
  const ss = getSpreadsheet_();

  // 1. Tab DATA_PENUGASAN (20 Kolom Resmi Termasuk kode_lacak)
  let sheetData = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  if (!sheetData) {
    sheetData = ss.insertSheet(CONFIG_TRACKING.SHEET_DATA);
  }
  const headersData = [
    'id_jo', 'kode_lacak', 'nomor_spk', 'nama_klien', 'nama_debitur', 'telepon_pic',
    'jenis_jasa', 'lokasi_objek', 'kantor_asal', 'kantor_pelaksana',
    'penilai_pelaksana', 'reviewer_spm', 'penilai_publik', 'milestone_aktif',
    'keterangan_tahap', 'tanggal_spk', 'target_sla', 'tanggal_selesai',
    'status_penugasan', 'link_folder_drive'
  ];
  sheetData.getRange(1, 1, 1, headersData.length).setValues([headersData])
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheetData.setFrozenRows(1);

  const seedData = [
    // Skenario 1: KPR Retail Rumah Tinggal Bank BTN (M-04 Kalkulasi)
    [
      'JO-JKT-2026-0001',
      'TRK-JKT-2026-A89F',
      '042/BTN-JKT/SPK/X/2026',
      'PT Bank Tabungan Negara (Persero) Tbk',
      'Hendra Wijaya, S.T.',
      '081288997766',
      'KPR Retail Rumah Tinggal',
      'Perumahan Taman Rasuna Blok C No. 15, Kuningan, Jakarta Selatan',
      'Kantor Pusat Jakarta',
      'Kantor Pusat Jakarta',
      'Hendra Wijaya, S.T.',
      'Sigit Paryanto, S.E., MAPPI (Cert.)',
      'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
      'M-04',
      'Analisis Penilaian & Kalkulasi Nilai Pasar & Likuidasi Rumah Tinggal KPR BTN',
      '2026-10-25',
      '2026-10-28',
      '',
      'Aktif',
      'https://drive.google.com/drive/folders/btn-kpr-retail'
    ],
    // Skenario 2: Gudang Logistik Komersial Pulogadung Bank BTN (M-03 Selesai Survei)
    [
      'JO-JKT-2026-0002',
      'TRK-JKT-2026-C42B',
      '048/BTN-CBC/KOM-SPK/X/2026',
      'PT Bank Tabungan Negara (Persero) Tbk',
      'PT Bangun Prima Perkasa',
      '081299881122',
      'Gudang Logistik Komersial',
      'Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur',
      'Kantor Pusat Jakarta',
      'Kantor Pusat Jakarta',
      'Ahmad Fauzi, S.T.',
      'Danny Taufik Hidayat, S.E., S.H.',
      'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
      'M-03',
      'Inspeksi Lapangan Selesai. Pengukuran luas tanah 4.850 m² dan gudang 3.200 m² selesai diverifikasi.',
      '2026-10-24',
      '2026-10-31',
      '',
      'Aktif',
      'https://drive.google.com/drive/folders/btn-gudang-pulogadung'
    ]
  ];
  sheetData.getRange(2, 1, seedData.length, headersData.length).setValues(seedData);

  // 2. Tab LOG_PROGRESS
  let sheetLog = ss.getSheetByName(CONFIG_TRACKING.SHEET_LOG);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(CONFIG_TRACKING.SHEET_LOG);
  }
  const headersLog = [
    'id_log', 'id_jo', 'milestone_tujuan', 'timestamp', 'eksekutor_nik', 'catatan_internal', 'pesan_publik'
  ];
  sheetLog.getRange(1, 1, 1, headersLog.length).setValues([headersLog])
    .setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  sheetLog.setFrozenRows(1);

  const initialLogs = [
    ['LOG-JO-JKT-2026-0001-M01', 'JO-JKT-2026-0001', 'M-01', '2026-10-25 09:15:00', 'ADMIN-JKT', 'Verifikasi berkas SPK BTN KPR', 'SPK KPR Rumah Tinggal diverifikasi resmi.'],
    ['LOG-JO-JKT-2026-0001-M02', 'JO-JKT-2026-0001', 'M-02', '2026-10-25 14:00:00', 'ADMIN-JKT', 'Penetapan Penilai Pelaksana', 'Penetapan Penilai Pelaksana / Surveyor terkonfirmasi.'],
    ['LOG-JO-JKT-2026-0001-M03', 'JO-JKT-2026-0001', 'M-03', '2026-10-26 16:30:00', 'PENILAI-01', 'Survei fisik rumah selesai', 'Inspeksi fisik tanah & bangunan rumah tinggal tuntas.'],
    ['LOG-JO-JKT-2026-0001-M04', 'JO-JKT-2026-0001', 'M-04', '2026-10-27 10:00:00', 'PENILAI-01', 'Kalkulasi nilai pasar', 'Sedang analisis perbandingan pasar dan penilaian properti.'],

    ['LOG-JO-JKT-2026-0002-M01', 'JO-JKT-2026-0002', 'M-01', '2026-10-24 10:00:00', 'ADMIN-JKT', 'Verifikasi SPK Gudang Komersial', 'SPK Komersial Bank BTN lengkap diverifikasi.'],
    ['LOG-JO-JKT-2026-0002-M02', 'JO-JKT-2026-0002', 'M-02', '2026-10-24 15:30:00', 'ADMIN-JKT', 'Jadwal survei koordinasi PIC', 'Jadwal survei fisik disepakati dengan PIC debitur.'],
    ['LOG-JO-JKT-2026-0002-M03', 'JO-JKT-2026-0002', 'M-03', '2026-10-26 17:00:00', 'PENILAI-02', 'Inspeksi fisik gudang & tapak', 'Inspeksi fisik tapak industri 4.850 m² tuntas. Menyiapkan kalkulasi nilai.']
  ];
  sheetLog.getRange(2, 1, initialLogs.length, headersLog.length).setValues(initialLogs);

  // 3. Tab MITRA_DAN_SLA
  let sheetMitra = ss.getSheetByName(CONFIG_TRACKING.SHEET_MITRA);
  if (!sheetMitra) {
    sheetMitra = ss.insertSheet(CONFIG_TRACKING.SHEET_MITRA);
  }
  const headersMitra = ['kode_mitra', 'nama_mitra', 'sla_hari_ps', 'sla_hari_non_ps', 'email_pelaporan'];
  sheetMitra.getRange(1, 1, 1, headersMitra.length).setValues([headersMitra])
    .setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
  sheetMitra.setFrozenRows(1);

  const mitraData = [
    ['BTN', 'PT Bank Tabungan Negara (Persero) Tbk', 3, 5, 'appraisal.btn@btn.co.id'],
    ['MDR', 'PT Bank Mandiri (Persero) Tbk', 3, 5, 'appraisal.mandiri@bankmandiri.co.id'],
    ['BRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 3, 5, 'appraisal.bri@bri.co.id'],
    ['BCA', 'PT Bank Central Asia Tbk', 3, 4, 'appraisal.bca@bca.co.id'],
    ['BNI', 'PT Bank Negara Indonesia (Persero) Tbk', 3, 5, 'appraisal.bni@bni.co.id'],
    ['BSI', 'PT Bank Syariah Indonesia Tbk', 3, 5, 'appraisal.bsi@bankbsi.co.id'],
    ['DKI', 'PT Bank DKI', 3, 5, 'appraisal@bankdki.co.id']
  ];
  sheetMitra.getRange(2, 1, mitraData.length, headersMitra.length).setValues(mitraData);

  // 4. Tab DASHBOARD_KONTROL
  let sheetDash = ss.getSheetByName(CONFIG_TRACKING.SHEET_DASHBOARD);
  if (!sheetDash) {
    sheetDash = ss.insertSheet(CONFIG_TRACKING.SHEET_DASHBOARD);
  }
  sheetDash.clear();
  sheetDash.getRange('A1:E1').merge().setValue('DASHBOARD KONTROL MONITORING PENUGASAN - KJPP NSR')
    .setBackground('#0b132b').setFontColor('#f59e0b').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');

  const dashLabels = [
    ['METRIK OPERASIONAL', 'NILAI FORMULA', '', 'REKAPITULASI MILESTONE', 'JUMLAH'],
    ['Total Penugasan Terdaftar', '=COUNTA(DATA_PENUGASAN!A2:A)', '', 'M-01: Registrasi Berkas SPK', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-01")'],
    ['Penugasan Aktif Berjalan', '=COUNTIF(DATA_PENUGASAN!S2:S, "Aktif")', '', 'M-02: Penetapan Tim Survei', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-02")'],
    ['Penugasan Tuntas Selesai', '=COUNTIF(DATA_PENUGASAN!S2:S, "Selesai")', '', 'M-03: Inspeksi Lapangan Selesai', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-03")'],
    ['Penugasan Tahap M-04 (Kalkulasi)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-04")', '', 'M-04: Analisis & Kalkulasi Nilai', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-04")'],
    ['Penugasan Tahap M-05 (Review SPM)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-05")', '', 'M-05: Kendali Mutu Reviewer SPM', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-05")'],
    ['Penugasan Tahap M-06 (Penilai Publik)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-06")', '', 'M-06: Otorisasi Penilai Publik', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-06")'],
    ['Kepatuhan SLA Rata-rata', '100% On-Time', '', 'M-07: Penyerahan Laporan Final', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-07")']
  ];
  sheetDash.getRange(3, 1, dashLabels.length, 5).setValues(dashLabels);
  sheetDash.getRange('A3:E3').setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');

  return createJsonResponse_({
    status: 'success',
    message: 'Database 4 Tab Google Spreadsheet "DATABASE TRACING PENUGASAN" berhasil diinisialisasi lengkap 20 kolom (kode_lacak) & mock data.'
  });
}`;

if (oldSetupRegex.test(gas)) {
  gas = gas.replace(oldSetupRegex, newSetupFunc);
  fs.writeFileSync(gasPath, gas, 'utf8');
  console.log('✓ gas-job-tracking.gs updated with clean 20-col setup!');
} else {
  console.warn('⚠️ oldSetupRegex not matched');
}
