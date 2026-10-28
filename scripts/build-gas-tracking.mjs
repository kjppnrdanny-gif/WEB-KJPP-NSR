// scripts/build-gas-tracking.mjs
import fs from 'fs';

let gas = fs.readFileSync('gas-job-tracking.gs', 'utf8').replace(/\r\n/g, '\n');

// 1. Tambah generateTrackingCode_
const helperFunc = `
/**
 * Generator Kode Unik Pelacakan SPK / JO: TRK-[KANTOR]-[TAHUN]-[4 ALFANUMERIK]
 */
function generateTrackingCode_(kantorCode, year) {
  let kantor = 'JKT';
  const u = String(kantorCode || '').toUpperCase();
  if (u.includes('BDG') || u.includes('BANDUNG')) kantor = 'BDG';
  else if (u.includes('PDG') || u.includes('PADANG')) kantor = 'PDG';
  else if (u.includes('MKS') || u.includes('MAKASSAR')) kantor = 'MKS';
  else if (u.includes('PLM') || u.includes('PALEMBANG')) kantor = 'PLM';
  else if (u.includes('PUSAT') || u.includes('JAKARTA')) kantor = 'JKT';

  if (!year) year = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'TRK-' + kantor + '-' + year + '-' + rand;
}
`;

if (!gas.includes('function generateTrackingCode_(')) {
  gas = gas.replace('const MILESTONE_DEFINITIONS = {', helperFunc + '\nconst MILESTONE_DEFINITIONS = {');
}

// 2. Perbarui handlePublicTrack_
const oldTrackBlock = `  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowJo = String(row[colMap['id_jo'] || 0] || '').trim().toUpperCase();
    const rowPhone = String(row[colMap['telepon_pic'] || 4] || '').replace(/[^0-9]/g, '');

    if (cleanJo && rowJo === cleanJo) {
      foundRow = row;
      break;
    }

    if (cleanPhone && cleanPhone.length >= 6 && rowPhone.endsWith(cleanPhone.slice(-6))) {
      foundRow = row;
      break;
    }
  }

  // Jika input kosong atau tidak ketemu, berikan default sampel Bank BTN
  if (!foundRow && values.length > 1) {
    foundRow = values[1]; // Skenario Bank BTN Baris Pertama
  }

  if (!foundRow) {
    return createJsonResponse_({ status: 'error', message: 'Data penugasan tidak ditemukan.' }, 404);
  }`;

const newTrackBlock = `  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
    const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
    const rowPhone = String(row[colMap['telepon_pic'] !== undefined ? colMap['telepon_pic'] : 4] || '').replace(/[^0-9]/g, '');

    // Cocokkan JO resmi atau Kode Lacak
    if (cleanJo && (rowJo === cleanJo || (rowKode && rowKode === cleanJo))) {
      foundRow = row;
      break;
    }

    // Cocokkan nomor telepon PIC
    if (cleanPhone && cleanPhone.length >= 6 && rowPhone.endsWith(cleanPhone.slice(-6))) {
      foundRow = row;
      break;
    }
  }

  // Jika belum ditemukan, coba pencarian parsial
  if (!foundRow && cleanJo) {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
      const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
      if ((rowJo && rowJo.includes(cleanJo)) || (rowKode && rowKode.includes(cleanJo))) {
        foundRow = row;
        break;
      }
    }
  }

  // VALIDASI KETAT: Jika tidak ketemu, kembalikan respons 404 (Dilarang fallback ke mock data)
  if (!foundRow) {
    return createJsonResponse_({
      status: 'error',
      message: 'Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.'
    }, 404);
  }`;

gas = gas.replace(oldTrackBlock, newTrackBlock);

// 3. Sertakan kode_lacak di publicData
gas = gas.replace(
  '  const publicData = {\n    id: idJo,\n    jo_number: idJo,',
  '  const publicData = {\n    id: idJo,\n    jo_number: idJo,\n    kode_lacak: (colMap[\'kode_lacak\'] !== undefined && foundRow[colMap[\'kode_lacak\']]) ? String(foundRow[colMap[\'kode_lacak\']]) : \'\','
);

// 4. Sertakan kode_lacak di handleGetActiveJobs_
gas = gas.replace(
  '    jobs.push({\n      id: idJo,\n      jo_number: idJo,',
  '    jobs.push({\n      id: idJo,\n      jo_number: idJo,\n      kode_lacak: (colMap[\'kode_lacak\'] !== undefined && row[colMap[\'kode_lacak\']]) ? String(row[colMap[\'kode_lacak\']]) : \'\','
);

// 5. Terbitkan kode_lacak di handleCreateJobOrder_
gas = gas.replace(
  '  const idJo = \'JO-\' + kantorCode + \'-\' + year + \'-\' + nextSeq;\n\n  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, \'yyyy-MM-dd HH:mm:ss\');',
  '  const idJo = \'JO-\' + kantorCode + \'-\' + year + \'-\' + nextSeq;\n  const kodeLacak = generateTrackingCode_(kantorCode, year);\n\n  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, \'yyyy-MM-dd HH:mm:ss\');'
);

gas = gas.replace(
  '  // Baris Baru DATA_PENUGASAN (19 Kolom)\n  const newRow = [\n    idJo,\n    payload.spk_number ||',
  '  // Baris Baru DATA_PENUGASAN (20 Kolom termasuk kode_lacak)\n  const newRow = [\n    idJo,\n    kodeLacak,\n    payload.spk_number ||'
);

gas = gas.replace(
  '    data: {\n      id_jo: idJo,\n      jo_number: idJo,',
  '    data: {\n      id_jo: idJo,\n      jo_number: idJo,\n      kode_lacak: kodeLacak,'
);

// 6. Perbarui handleSetupDatabase_ dengan 20 kolom dan seedData terstruktur
const oldSetupBlock = `  // 1. Tab DATA_PENUGASAN
  let sheetData = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  if (!sheetData) {
    sheetData = ss.insertSheet(CONFIG_TRACKING.SHEET_DATA);
  }
  const headersData = [
    'id_jo', 'nomor_spk', 'nama_klien', 'nama_debitur', 'telepon_pic',
    'jenis_jasa', 'lokasi_objek', 'kantor_asal', 'kantor_pelaksana',
    'penilai_pelaksana', 'reviewer_spm', 'penilai_publik', 'milestone_aktif',
    'keterangan_tahap', 'tanggal_spk', 'target_sla', 'tanggal_selesai',
    'status_penugasan', 'link_folder_drive'
  ];
  sheetData.getRange(1, 1, 1, headersData.length).setValues([headersData])
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheetData.setFrozenRows(1);`;

const newSetupBlock = `  // 1. Tab DATA_PENUGASAN (20 Kolom Termasuk kode_lacak)
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

  // Set Seed Data 2 Skenario Bank BTN
  const seedData = [
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
  sheetData.getRange(2, 1, seedData.length, headersData.length).setValues(seedData);`;

gas = gas.replace(oldSetupBlock, newSetupBlock);

// Hapus blok seedData lama di bagian bawah handleSetupDatabase_ agar tidak dobel
const oldLowerSeedBlock = `  // Seed 2 Kasus Skenario Bank BTN jika DATA_PENUGASAN masih kosong
  if (sheetData.getLastRow() <= 1) {
    const seedData = [
      // Skenario 1: KPR Retail Rumah Tinggal Bank BTN (M-04 Kalkulasi)
      [
        'JO-JKT-2026-0001',
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

    // Tulis initial logs ke LOG_PROGRESS
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
  }`;

gas = gas.replace(oldLowerSeedBlock, '// Seed Data telah diinisialisasi pada blok atas');

// Perbarui formula di DASHBOARD_KONTROL (karena kolom bergeser dari M/R ke N/S)
gas = gas.replace('"M-01: Registrasi Berkas SPK", "=COUNTIF(DATA_PENUGASAN!M2:M, \\"M-01\\")"', '"M-01: Registrasi Berkas SPK", "=COUNTIF(DATA_PENUGASAN!N2:N, \\"M-01\\")"');
gas = gas.replace('"Penugasan Aktif Berjalan", "=COUNTIF(DATA_PENUGASAN!R2:R, \\"Aktif\\")"', '"Penugasan Aktif Berjalan", "=COUNTIF(DATA_PENUGASAN!S2:S, \\"Aktif\\")"');
gas = gas.replace('"Penugasan Tuntas Selesai", "=COUNTIF(DATA_PENUGASAN!R2:R, \\"Selesai\\")"', '"Penugasan Tuntas Selesai", "=COUNTIF(DATA_PENUGASAN!S2:S, \\"Selesai\\")"');
gas = gas.replace(/DATA_PENUGASAN!M2:M/g, 'DATA_PENUGASAN!N2:N');

fs.writeFileSync('gas-job-tracking.gs', gas, 'utf8');
console.log('✓ gas-job-tracking.gs successfully rebuilt!');
