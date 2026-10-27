import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SPREADSHEET_TITLE = 'DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN';

async function main() {
  console.log('=================================================================');
  console.log('🚀 OTOMASI PEMBUATAN SSOT SPREADSHEET & DEPLOYMENT GAS JOB TRACKING');
  console.log('=================================================================\n');

  console.log('1. Menginisialisasi autentikasi Google API via Clasp...');
  const authInfo = await initAuth({});
  const auth = authInfo.credentials;

  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });
  const script = google.script({ version: 'v1', auth });

  console.log('2. Memeriksa keberadaan Spreadsheet di Google Drive...');
  const searchRes = await drive.files.list({
    q: `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name, webViewLink)'
  });

  let spreadsheetId = '';
  let webViewLink = '';

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    const existing = searchRes.data.files[0];
    spreadsheetId = existing.id;
    webViewLink = existing.webViewLink;
    console.log(`   ✓ Spreadsheet sudah ada: ${existing.name}`);
    console.log(`   ✓ Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   ✓ URL: ${webViewLink}`);
  } else {
    console.log('   Membuat spreadsheet baru...');
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: SPREADSHEET_TITLE,
          timeZone: 'Asia/Jakarta',
          locale: 'id_ID'
        }
      }
    });
    spreadsheetId = createRes.data.spreadsheetId;
    webViewLink = createRes.data.spreadsheetUrl;
    console.log(`   ✓ Berhasil membuat Spreadsheet baru!`);
    console.log(`   ✓ Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   ✓ URL: ${webViewLink}`);
  }

  console.log('\n3. Menyiapkan 4 Tab (DATA_PENUGASAN, LOG_PROGRESS, MITRA_DAN_SLA, DASHBOARD_KONTROL)...');
  // Ambil metadata sheet yang ada saat ini
  const ssMeta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = ssMeta.data.sheets.map(s => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId
  }));
  const sheetNames = existingSheets.map(s => s.title);

  // Buat tab yang belum ada
  const requiredTabs = ['DATA_PENUGASAN', 'LOG_PROGRESS', 'MITRA_DAN_SLA', 'DASHBOARD_KONTROL'];
  const addSheetRequests = [];
  for (const tab of requiredTabs) {
    if (!sheetNames.includes(tab)) {
      addSheetRequests.push({
        addSheet: {
          properties: { title: tab }
        }
      });
    }
  }

  if (addSheetRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: addSheetRequests }
    });
    console.log(`   ✓ Menambahkan tab baru: ${addSheetRequests.map(r => r.addSheet.properties.title).join(', ')}`);
  }

  // Hapus "Sheet1" bawaan jika ada dan tab lain sudah tersedia
  const defaultSheet = existingSheets.find(s => s.title === 'Sheet1' || s.title === 'Sheet 1');
  if (defaultSheet && sheetNames.some(t => requiredTabs.includes(t))) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ deleteSheet: { sheetId: defaultSheet.sheetId } }]
        }
      });
      console.log('   ✓ Menghapus sheet bawaan (Sheet1)');
    } catch (_) {}
  }

  console.log('\n4. Mengisi Header, Data Mitra SLA, Formula Dashboard & 2 Skenario Bank BTN...');
  
  // Headers DATA_PENUGASAN (19 Kolom)
  const headersData = [
    'id_jo', 'nomor_spk', 'nama_klien', 'nama_debitur', 'telepon_pic',
    'jenis_jasa', 'lokasi_objek', 'kantor_asal', 'kantor_pelaksana',
    'penilai_pelaksana', 'reviewer_spm', 'penilai_publik', 'milestone_aktif',
    'keterangan_tahap', 'tanggal_spk', 'target_sla', 'tanggal_selesai',
    'status_penugasan', 'link_folder_drive'
  ];

  // 2 Skenario Bank BTN
  const seedPenugasan = [
    headersData,
    [
      'JO-JKT-2026-0001',
      '042/BTN-JKT/KPR-SPK/X/2026',
      'PT Bank Tabungan Negara (Persero) Tbk',
      'Hendra Wijaya, S.T.',
      '081288997766',
      'KPR Retail (Rumah Tinggal)',
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
      '048/BTN-CBC/KOM-SPK/X/2026',
      'PT Bank Tabungan Negara (Persero) Tbk',
      'PT Bangun Prima Perkasa',
      '081299881122',
      'Gudang Logistik Komersial Pulogadung',
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

  // Headers LOG_PROGRESS (7 Kolom)
  const headersLog = [
    'id_log', 'id_jo', 'milestone_tujuan', 'timestamp', 'eksekutor_nik', 'catatan_internal', 'pesan_publik'
  ];
  const seedLogs = [
    headersLog,
    ['LOG-JO-JKT-2026-0001-M01', 'JO-JKT-2026-0001', 'M-01', '2026-10-25 09:15:00', 'ADMIN-JKT', 'Verifikasi berkas SPK BTN KPR', 'SPK KPR Rumah Tinggal diverifikasi resmi.'],
    ['LOG-JO-JKT-2026-0001-M02', 'JO-JKT-2026-0001', 'M-02', '2026-10-25 14:00:00', 'ADMIN-JKT', 'Penetapan Penilai Pelaksana', 'Penetapan Penilai Pelaksana / Surveyor terkonfirmasi.'],
    ['LOG-JO-JKT-2026-0001-M03', 'JO-JKT-2026-0001', 'M-03', '2026-10-26 16:30:00', 'PENILAI-01', 'Survei fisik rumah selesai', 'Inspeksi fisik tanah & bangunan rumah tinggal tuntas.'],
    ['LOG-JO-JKT-2026-0001-M04', 'JO-JKT-2026-0001', 'M-04', '2026-10-27 10:00:00', 'PENILAI-01', 'Kalkulasi nilai pasar', 'Sedang analisis perbandingan pasar dan penilaian properti.'],

    ['LOG-JO-JKT-2026-0002-M01', 'JO-JKT-2026-0002', 'M-01', '2026-10-24 10:00:00', 'ADMIN-JKT', 'Verifikasi SPK Gudang Komersial', 'SPK Komersial Bank BTN lengkap diverifikasi.'],
    ['LOG-JO-JKT-2026-0002-M02', 'JO-JKT-2026-0002', 'M-02', '2026-10-24 15:30:00', 'ADMIN-JKT', 'Jadwal survei koordinasi PIC', 'Jadwal survei fisik disepakati dengan PIC debitur.'],
    ['LOG-JO-JKT-2026-0002-M03', 'JO-JKT-2026-0002', 'M-03', '2026-10-26 17:00:00', 'PENILAI-02', 'Inspeksi fisik gudang & tapak', 'Inspeksi fisik tapak industri 4.850 m² tuntas. Menyiapkan kalkulasi nilai.']
  ];

  // Headers & Data MITRA_DAN_SLA
  const seedMitra = [
    ['kode_mitra', 'nama_mitra', 'sla_hari_ps', 'sla_hari_non_ps', 'email_pelaporan'],
    ['BTN', 'PT Bank Tabungan Negara (Persero) Tbk', 3, 7, 'appraisal.btn@btn.co.id'],
    ['MDR', 'PT Bank Mandiri (Persero) Tbk', 3, 5, 'appraisal.mandiri@bankmandiri.co.id'],
    ['BRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 3, 5, 'appraisal.bri@bri.co.id'],
    ['BCA', 'PT Bank Central Asia Tbk', 3, 4, 'appraisal.bca@bca.co.id'],
    ['BNI', 'PT Bank Negara Indonesia (Persero) Tbk', 3, 5, 'appraisal.bni@bni.co.id'],
    ['BSI', 'PT Bank Syariah Indonesia Tbk', 3, 5, 'appraisal.bsi@bankbsi.co.id'],
    ['DKI', 'PT Bank DKI', 3, 5, 'appraisal@bankdki.co.id']
  ];

  // Data DASHBOARD_KONTROL dengan Formula Live
  const seedDashboard = [
    ['DASHBOARD KONTROL MONITORING PENUGASAN - KJPP NSR', '', '', '', ''],
    ['', '', '', '', ''],
    ['METRIK OPERASIONAL', 'NILAI FORMULA', '', 'REKAPITULASI MILESTONE', 'JUMLAH'],
    ['Total Penugasan Terdaftar', '=COUNTA(DATA_PENUGASAN!A2:A)', '', 'M-01: Registrasi Berkas SPK', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-01")'],
    ['Penugasan Aktif Berjalan', '=COUNTIF(DATA_PENUGASAN!R2:R, "Aktif")', '', 'M-02: Penetapan Tim Survei', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-02")'],
    ['Penugasan Tuntas Selesai', '=COUNTIF(DATA_PENUGASAN!R2:R, "Selesai")', '', 'M-03: Inspeksi Lapangan Selesai', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-03")'],
    ['Penugasan Tahap M-04 (Kalkulasi)', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-04")', '', 'M-04: Analisis & Kalkulasi Nilai', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-04")'],
    ['Penugasan Tahap M-05 (Review SPM)', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-05")', '', 'M-05: Kendali Mutu Reviewer SPM', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-05")'],
    ['Penugasan Tahap M-06 (Penilai Publik)', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-06")', '', 'M-06: Otorisasi Penilai Publik', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-06")'],
    ['Kepatuhan SLA Rata-rata', '100% On-Time', '', 'M-07: Penyerahan Laporan Final', '=COUNTIF(DATA_PENUGASAN!M2:M, "M-07")']
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'DATA_PENUGASAN!A1:S3', values: seedPenugasan },
        { range: 'LOG_PROGRESS!A1:G8', values: seedLogs },
        { range: 'MITRA_DAN_SLA!A1:E8', values: seedMitra },
        { range: 'DASHBOARD_KONTROL!A1:E10', values: seedDashboard }
      ]
    }
  });
  console.log('   ✓ Berhasil mengisi struktur 4 tab dengan formula dan seed data');

  // Format styling dan beku baris
  const metaAfter = await sheets.spreadsheets.get({ spreadsheetId });
  const formatRequests = [];

  metaAfter.data.sheets.forEach(s => {
    const sId = s.properties.sheetId;
    const title = s.properties.title;

    if (title === 'DATA_PENUGASAN' || title === 'LOG_PROGRESS' || title === 'MITRA_DAN_SLA') {
      // Freeze row 1
      formatRequests.push({
        updateSheetProperties: {
          properties: { sheetId: sId, gridProperties: { frozenRowCount: 1 } },
          fields: 'gridProperties.frozenRowCount'
        }
      });
      // Header styling
      formatRequests.push({
        repeatCell: {
          range: { sheetId: sId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.05, green: 0.09, blue: 0.16 }, // Navy dark
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      });
    }
  });

  if (formatRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests }
    });
    console.log('   ✓ Format header & baris beku diterapkan');
  }

  // =========================================================================
  // 5. DEPLOYMENT GOOGLE APPS SCRIPT ENGINE
  // =========================================================================
  console.log('\n5. Menyiapkan Proyek Google Apps Script Mandiri...');
  
  // Baca isi gas-job-tracking.gs lokal
  const gasCodePath = path.join(ROOT_DIR, 'gas-job-tracking.gs');
  let gasSource = fs.readFileSync(gasCodePath, 'utf8');

  // Sisipkan SPREADSHEET_ID ke dalam konfigurasi skrip
  gasSource = gasSource.replace(
    "SPREADSHEET_ID: '',",
    `SPREADSHEET_ID: '${spreadsheetId}',`
  );

  const manifest = JSON.stringify({
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE'
    }
  }, null, 2);

  // Buat Proyek GAS Standalone untuk Job Tracking
  console.log('   Membuat project Google Apps Script...');
  const projCreate = await script.projects.create({
    requestBody: {
      title: 'GAS-ENGINE-JOB-TRACKING-NSR',
      parentId: spreadsheetId
    }
  }).catch(async (err) => {
    // Jika parentId gagal (misal hak akses bound), buat standalone
    console.log('   (Membuat standalone Apps Script project)');
    return await script.projects.create({
      requestBody: {
        title: 'GAS-ENGINE-JOB-TRACKING-NSR'
      }
    });
  });

  const scriptId = projCreate.data.scriptId;
  console.log(`   ✓ Proyek GAS berhasil dibuat! Script ID: ${scriptId}`);

  // Unggah files (appsscript.json + Code)
  console.log('   Mengunggah source code gas-job-tracking.gs...');
  await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        {
          name: 'appsscript',
          type: 'JSON',
          source: manifest
        },
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: gasSource
        }
      ]
    }
  });
  console.log('   ✓ Source code berhasil diunggah!');

  // Buat Versi Baru
  console.log('   Membuat versi baru (v1)...');
  const verRes = await script.projects.versions.create({
    scriptId,
    requestBody: {
      description: 'v1.0: Production Release 7-Milestone Job Tracking Engine KJPP NSR'
    }
  });
  const versionNumber = verRes.data.versionNumber;
  console.log(`   ✓ Versi terbuat: v${versionNumber}`);

  // Deploy sebagai Web App
  console.log('   Mempublikasikan sebagai Aplikasi Web (Web App)...');
  const deployRes = await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: versionNumber,
      description: 'Production Web App v1.0'
    }
  });

  const deploymentId = deployRes.data.deploymentId;
  const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  console.log(`   ✓ Deployment ID: ${deploymentId}`);
  console.log(`   ✓ Web App URL: ${webAppUrl}`);

  // Simpan data konfigurasi ke berkas lokal
  const configOutput = {
    spreadsheetTitle: SPREADSHEET_TITLE,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: webViewLink,
    scriptId: scriptId,
    deploymentId: deploymentId,
    webAppUrl: webAppUrl,
    deployedAt: new Date().toISOString()
  };

  const configPath = path.join(ROOT_DIR, 'data', 'job_tracking_cloud_config.json');
  fs.writeFileSync(configPath, JSON.stringify(configOutput, null, 2), 'utf8');
  console.log(`   ✓ Konfigurasi disimpan ke: data/job_tracking_cloud_config.json`);

  return configOutput;
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
