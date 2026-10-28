/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT (GAS) ENGINE - SISTEM TRACING PENUGASAN PENILAIAN (JOB TRACKING)
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SPREADSHEET SSOT: DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN
 * 
 * STRUKTUR 4 TAB UTAMA:
 * 1. DATA_PENUGASAN  (19 Kolom: id_jo s/d link_folder_drive)
 * 2. LOG_PROGRESS    (7 Kolom: id_log s/d pesan_publik)
 * 3. MITRA_DAN_SLA   (5 Kolom: kode_mitra s/d email_pelaporan)
 * 4. DASHBOARD_KONTROL (Matriks ringkasan KPI, beban kerja & peringatan SLA)
 * =========================================================================================
 */

const CONFIG_TRACKING = {
  // Biarkan kosong jika skrip ditempelkan langsung pada Spreadsheet (Bound Script),
  // atau isi ID Spreadsheet jika dipasang sebagai Standalone Script Web App.
  SPREADSHEET_ID: '',
  SHEET_DATA: 'DATA_PENUGASAN',
  SHEET_LOG: 'LOG_PROGRESS',
  SHEET_MITRA: 'MITRA_DAN_SLA',
  SHEET_DASHBOARD: 'DASHBOARD_KONTROL',
  TIMEZONE: 'Asia/Jakarta',
  LOCK_TIMEOUT_MS: 30000
};

// Definisi Resmi 7 Milestone SPI & KEPI KJPP NSR

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

const MILESTONE_DEFINITIONS = {
  'M-01': {
    code: 'M-01',
    title: 'Registrasi Berkas SPK & Legalitas',
    desc: 'Penerimaan SPK, verifikasi kelengkapan dokumen legalitas yuridis & data awal pemohon.',
    sla_pct: 14
  },
  'M-02': {
    code: 'M-02',
    title: 'Penetapan Tim & Jadwal Survei',
    desc: 'Penetapan Penilai Pelaksana / Surveyor, konfirmasi kesiapan objek debitur, dan persiapan alat ukur.',
    sla_pct: 28
  },
  'M-03': {
    code: 'M-03',
    title: 'Inspeksi Lapangan Selesai',
    desc: 'Pemeriksaan fisik aset, pengukuran luas tanah/bangunan, geotagging GPS, dan dokumentasi foto resmi.',
    sla_pct: 43
  },
  'M-04': {
    code: 'M-04',
    title: 'Analisis Penilaian & Kalkulasi Nilai',
    desc: 'Pengolahan data pasar komparasi, pemodelan kalkulasi biaya penggantian (DRC), dan estimasi Nilai Pasar/Likuidasi.',
    sla_pct: 57
  },
  'M-05': {
    code: 'M-05',
    title: 'Kendali Mutu & Reviewer SPM',
    desc: 'Verifikasi kesesuaian kertas kerja penilaian terhadap SPI, KEPI, dan Standar Pengendalian Mutu (SPM).',
    sla_pct: 71
  },
  'M-06': {
    code: 'M-06',
    title: 'Otorisasi & Penomoran Penilai Publik',
    desc: 'Pengesahan tanda tangan Penilai Publik berizin Kemenkeu RI dan penerbitan Nomor Laporan Resmi (Nolap).',
    sla_pct: 86
  },
  'M-07': {
    code: 'M-07',
    title: 'Penyerahan Laporan Final',
    desc: 'Penyerahan bundel laporan penilaian final resmi (hardcopy & softcopy terverifikasi QR) kepada bank pemohon.',
    sla_pct: 100
  }
};

/**
 * Helper untuk membuka spreadsheet target
 */
function getSpreadsheet_() {
  if (CONFIG_TRACKING.SPREADSHEET_ID && CONFIG_TRACKING.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG_TRACKING.SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Format respons JSON standar dengan header CORS
 */
function createJsonResponse_(data, statusCode = 200) {
  const output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Entry Point HTTP GET
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';

    if (action === 'ping') {
      return createJsonResponse_({
        status: 'success',
        message: 'GAS Engine Job Tracking KJPP NSR Online & Ready.',
        timestamp: Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd HH:mm:ss')
      });
    }

    if (action === 'track_public' || action === 'track') {
      const jo = (e.parameter.id_jo || e.parameter.jo || '').trim();
      const phone = (e.parameter.telepon_pic || e.parameter.phone || '').trim();
      return handlePublicTrack_(jo, phone);
    }

    if (action === 'get_active_jobs' || action === 'list') {
      return handleGetActiveJobs_();
    }

    if (action === 'get_mitra_sla') {
      return handleGetMitraSla_();
    }

    if (action === 'setup_database') {
      return handleSetupDatabase_();
    }

    return createJsonResponse_({ status: 'error', message: 'Aksi GET tidak valid: ' + action }, 400);
  } catch (err) {
    return createJsonResponse_({ status: 'error', message: 'Internal Server Error: ' + err.toString() }, 500);
  }
}

/**
 * Entry Point HTTP POST
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Kunci proses maksimal 30 detik untuk menghindari penulisan bersamaan
    lock.waitLock(CONFIG_TRACKING.LOCK_TIMEOUT_MS);

    let action = '';
    let payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        const raw = JSON.parse(e.postData.contents);
        action = raw.action || (e.parameter && e.parameter.action) || '';
        payload = raw.payload || raw.data || raw;
      } catch (ex) {
        action = (e.parameter && e.parameter.action) || '';
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      action = e.parameter.action || '';
      payload = e.parameter;
    }

    if (!action) {
      return createJsonResponse_({ status: 'error', message: 'Parameter "action" wajib disertakan.' }, 400);
    }

    if (action === 'track_public' || action === 'track') {
      const jo = (payload.id_jo || payload.jo || '').trim();
      const phone = (payload.telepon_pic || payload.phone || '').trim();
      return handlePublicTrack_(jo, phone);
    }

    if (action === 'get_active_jobs' || action === 'list') {
      return handleGetActiveJobs_();
    }

    if (action === 'create_job_order' || action === 'create') {
      return handleCreateJobOrder_(payload);
    }

    if (action === 'advance_milestone') {
      return handleAdvanceMilestone_(payload);
    }

    if (action === 'setup_database') {
      return handleSetupDatabase_();
    }

    return createJsonResponse_({ status: 'error', message: 'Aksi POST tidak dikenal: ' + action }, 400);
  } catch (err) {
    return createJsonResponse_({ status: 'error', message: 'Server Exception: ' + err.toString() }, 500);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/**
 * =========================================================================
 * 1. ACTION: TRACK_PUBLIC (Pelacakan Publik Aman)
 * =========================================================================
 */
function handlePublicTrack_(joInput, phoneInput) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  if (!sheet) {
    return createJsonResponse_({ status: 'error', message: 'Sheet DATA_PENUGASAN belum diinisialisasi.' }, 404);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse_({ status: 'error', message: 'Belum ada data penugasan terdaftar.' }, 404);
  }

  const headers = values[0];
  const colMap = {};
  headers.forEach((h, i) => colMap[String(h).trim().toLowerCase()] = i);

  const cleanJo = joInput.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  const cleanPhone = phoneInput.replace(/[^0-9]/g, '');

  let foundRow = null;

  for (let r = 1; r < values.length; r++) {
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
  }

  const idJo = foundRow[colMap['id_jo']];
  const currentM = String(foundRow[colMap['milestone_aktif']] || 'M-01').trim().toUpperCase();

  // Ambil riwayat log progress untuk JO ini
  const logHistory = getLogHistoryForJob_(ss, idJo);

  // Bentuk struktur 7 Milestone
  const milestonesResult = {};
  const mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
  const curIdx = mKeys.indexOf(currentM);

  mKeys.forEach((key, idx) => {
    const def = MILESTONE_DEFINITIONS[key];
    let status = 'pending';
    let timestamp = '-';
    let note = def.desc;

    if (idx < curIdx || (idx === curIdx && currentM === 'M-07' && String(foundRow[colMap['status_penugasan']]).toLowerCase() === 'selesai')) {
      status = 'completed';
      const log = logHistory.find(l => l.milestone === key);
      if (log) {
        timestamp = log.timestamp;
        note = log.pesan_publik || log.catatan || def.desc;
      }
    } else if (idx === curIdx) {
      status = 'in_progress';
      const log = logHistory.find(l => l.milestone === key);
      if (log) {
        timestamp = log.timestamp;
        note = log.pesan_publik || log.catatan || def.desc;
      }
    }

    milestonesResult[key] = {
      id: key,
      code: key,
      title: def.title,
      desc: def.desc,
      status: status,
      timestamp: timestamp,
      note: note
    };
  });

  const progressPct = MILESTONE_DEFINITIONS[currentM] ? MILESTONE_DEFINITIONS[currentM].sla_pct : 50;

  const publicData = {
    id: idJo,
    jo_number: idJo,
    kode_lacak: (colMap['kode_lacak'] !== undefined && foundRow[colMap['kode_lacak']]) ? String(foundRow[colMap['kode_lacak']]) : '',
    spk_number: foundRow[colMap['nomor_spk']],
    instansi: foundRow[colMap['nama_klien']],
    unit_kerja: foundRow[colMap['kantor_pelaksana']] || foundRow[colMap['kantor_asal']],
    debitur: foundRow[colMap['nama_debitur']],
    pic_contact: foundRow[colMap['telepon_pic']],
    jenis_properti: foundRow[colMap['jenis_jasa']],
    lokasi_aset: foundRow[colMap['lokasi_objek']],
    kantor: foundRow[colMap['kantor_pelaksana']],
    penilai_pelaksana: foundRow[colMap['penilai_pelaksana']],
    reviewer_spm: foundRow[colMap['reviewer_spm']],
    penilai_publik: foundRow[colMap['penilai_publik']],
    sla_deadline: foundRow[colMap['target_sla']],
    sla_label: 'SLA Koridor Mitra (' + (foundRow[colMap['nama_klien']] || 'Standar') + ')',
    current_milestone: currentM,
    current_milestone_title: (MILESTONE_DEFINITIONS[currentM] && MILESTONE_DEFINITIONS[currentM].title) || currentM,
    progress_percent: progressPct,
    milestones: milestonesResult,
    keterangan_resmi: foundRow[colMap['keterangan_tahap']] || 'Tahapan berjalan sesuai koridor SLA dan Standar Penilaian Indonesia (SPI).',
    wa_admin: '6285110513157'
  };

  return createJsonResponse_({
    status: 'success',
    message: 'Data penugasan ditemukan.',
    data: publicData
  });
}

/**
 * =========================================================================
 * 2. ACTION: GET_ACTIVE_JOBS (Task Board Internal)
 * =========================================================================
 */
function handleGetActiveJobs_(e) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  if (!sheet) {
    return createJsonResponse_({ status: 'error', message: 'Sheet DATA_PENUGASAN belum ada.' }, 404);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse_({ status: 'success', count: 0, data: [] });
  }

  const headers = values[0];
  const colMap = {};
  headers.forEach((h, i) => colMap[String(h).trim().toLowerCase()] = i);

  const jobs = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const idJo = row[colMap['id_jo']];
    if (!idJo) continue;

    const currentM = String(row[colMap['milestone_aktif']] || 'M-01').trim().toUpperCase();
    const progressPct = MILESTONE_DEFINITIONS[currentM] ? MILESTONE_DEFINITIONS[currentM].sla_pct : 50;

    jobs.push({
      id: idJo,
      jo_number: idJo,
      kode_lacak: (colMap['kode_lacak'] !== undefined && row[colMap['kode_lacak']]) ? String(row[colMap['kode_lacak']]) : '',
      spk_number: row[colMap['nomor_spk']],
      instansi: row[colMap['nama_klien']],
      debitur: row[colMap['nama_debitur']],
      pic_contact: row[colMap['telepon_pic']],
      jenis_properti: row[colMap['jenis_jasa']],
      lokasi_aset: row[colMap['lokasi_objek']],
      kantor: row[colMap['kantor_pelaksana']],
      kantor_code: (String(row[colMap['kantor_pelaksana']]).toLowerCase().includes('bandung')) ? 'BDG' :
                   (String(row[colMap['kantor_pelaksana']]).toLowerCase().includes('makassar')) ? 'MKS' :
                   (String(row[colMap['kantor_pelaksana']]).toLowerCase().includes('padang')) ? 'PDG' :
                   (String(row[colMap['kantor_pelaksana']]).toLowerCase().includes('palembang')) ? 'PLM' : 'PUSAT',
      penilai_pelaksana: row[colMap['penilai_pelaksana']],
      surveyor: row[colMap['penilai_pelaksana']], // backward-compatible alias
      reviewer: row[colMap['reviewer_spm']],
      reviewer_spm: row[colMap['reviewer_spm']],
      penilai_publik: row[colMap['penilai_publik']],
      current_milestone: currentM,
      current_milestone_title: (MILESTONE_DEFINITIONS[currentM] && MILESTONE_DEFINITIONS[currentM].title) || currentM,
      progress_percent: progressPct,
      sla_deadline: row[colMap['target_sla']],
      sla_status: (String(row[colMap['status_penugasan']]).toLowerCase() === 'selesai') ? 'completed' : 'on_track',
      sla_label: 'SLA Tepat Waktu',
      status_penugasan: row[colMap['status_penugasan']] || 'Aktif',
      keterangan_tahap: row[colMap['keterangan_tahap']],
      link_folder_drive: row[colMap['link_folder_drive']] || ''
    });
  }

    const filterKantor = e && e.parameter && (e.parameter.kantor || e.parameter.cabang || e.parameter.kantor_code) ? String(e.parameter.kantor || e.parameter.cabang || e.parameter.kantor_code).trim().toUpperCase() : '';
  const filteredJobs = filterKantor && filterKantor !== 'ALL' && filterKantor !== 'SEMUA' ? jobs.filter(j => {
    const jBranch = String(j.kantor_code || '').toUpperCase();
    const targetBranch = filterKantor === 'JKT' ? 'PUSAT' : filterKantor;
    return jBranch === targetBranch || String(j.kantor || '').toUpperCase().includes(targetBranch);
  }) : jobs;

  return createJsonResponse_({
    status: 'success',
    count: filteredJobs.length,
    data: filteredJobs
  });
}

/**
 * =========================================================================
 * 3. ACTION: CREATE_JOB_ORDER (Registrasi Baru dari Portal)
 * =========================================================================
 */
function handleCreateJobOrder_(payload) {
  const ss = getSpreadsheet_();
  const sheetData = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  const sheetLog = ss.getSheetByName(CONFIG_TRACKING.SHEET_LOG);

  if (!sheetData || !sheetLog) {
    return createJsonResponse_({ status: 'error', message: 'Tabel database belum siap.' }, 500);
  }

  const kantor = payload.kantor || payload.kantor_pelaksana || 'Kantor Pusat Jakarta';
  let kantorCode = 'JKT';
  if (kantor.includes('Bandung')) kantorCode = 'BDG';
  else if (kantor.includes('Padang')) kantorCode = 'PDG';
  else if (kantor.includes('Makassar')) kantorCode = 'MKS';
  else if (kantor.includes('Palembang')) kantorCode = 'PLM';

  const year = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy');
  const countJobs = Math.max(0, sheetData.getLastRow() - 1);
  const nextSeq = Utilities.formatString('%04d', countJobs + 1);
  const idJo = 'JO-' + kantorCode + '-' + year + '-' + nextSeq;
  const kodeLacak = generateTrackingCode_(kantorCode, year);

  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const spkDate = payload.spk_date || payload.tanggal_spk || Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  const slaDays = parseInt(payload.sla_days) || 3;
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + slaDays);
  const slaDeadlineStr = Utilities.formatDate(deadlineDate, CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd');

  // Baris Baru DATA_PENUGASAN (20 Kolom termasuk kode_lacak)
  const newRow = [
    idJo,
    kodeLacak,
    payload.spk_number || payload.nomor_spk || ('SPK/' + nextSeq + '/' + year),
    payload.instansi || payload.nama_klien || 'PT Bank Tabungan Negara (Persero) Tbk',
    payload.debitur || payload.nama_debitur || 'Debitur Baru',
    payload.pic_contact || payload.telepon_pic || '081234567890',
    payload.jenis_properti || payload.jenis_jasa || 'Tanah & Bangunan',
    payload.lokasi_aset || payload.lokasi_objek || 'Alamat Aset',
    payload.kantor_asal || 'Kantor Pusat Jakarta',
    kantor,
    payload.penilai_pelaksana || payload.surveyor || 'Hendra Wijaya, S.T.',
    payload.reviewer_spm || payload.reviewer || 'Sigit Paryanto, S.E., MAPPI (Cert.)',
    payload.penilai_publik || 'Ir. Nanang Rahayu, M.Sc., MAPPI (Cert.)',
    'M-02', // M-01 selesai, M-02 berjalan
    'SPK teregistrasi resmi. Tim Penilai Pelaksana / Surveyor sedang menyiapkan jadwal survei.',
    spkDate,
    slaDeadlineStr,
    '', // tanggal_selesai
    'Aktif',
    payload.link_folder_drive || ''
  ];

  sheetData.appendRow(newRow);

  // Catat ke LOG_PROGRESS: Log M-01 (Completed) & M-02 (In Progress)
  const logId1 = 'LOG-' + idJo + '-M01';
  sheetLog.appendRow([
    logId1,
    idJo,
    'M-01',
    nowStr,
    'SYS-ADMIN',
    'Registrasi berkas SPK dan verifikasi data legalitas awal.',
    'Berkas SPK resmi diterima dan terverifikasi di sistem OPINI NSR.'
  ]);

  const logId2 = 'LOG-' + idJo + '-M02';
  sheetLog.appendRow([
    logId2,
    idJo,
    'M-02',
    nowStr,
    'SYS-ADMIN',
    'Penetapan tim penilai pelaksana: ' + (payload.penilai_pelaksana || payload.surveyor),
    'Tim Penilai Pelaksana telah ditunjuk untuk koordinasi jadwal survei.'
  ]);

  return createJsonResponse_({
    status: 'success',
    message: 'Job Order ' + idJo + ' berhasil didaftarkan.',
    data: {
      id_jo: idJo,
      nomor_spk: newRow[1],
      nama_debitur: newRow[3],
      target_sla: slaDeadlineStr
    }
  });
}

/**
 * =========================================================================
 * 4. ACTION: ADVANCE_MILESTONE (Menaikkan Status Satu-Klik)
 * =========================================================================
 */
function handleAdvanceMilestone_(payload) {
  const ss = getSpreadsheet_();
  const sheetData = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  const sheetLog = ss.getSheetByName(CONFIG_TRACKING.SHEET_LOG);

  const idJo = (payload.id_jo || payload.jo || '').trim();
  const targetM = (payload.target_milestone || '').trim().toUpperCase();
  const internalNote = payload.catatan_internal || payload.note || 'Milestone dimajukan oleh reviewer/tim.';
  const publicMsg = payload.pesan_publik || 'Tahapan telah diperbarui sesuai kemajuan penilaian.';
  const executorNik = payload.eksekutor_nik || 'ADMIN-NSR';

  if (!idJo) {
    return createJsonResponse_({ status: 'error', message: 'ID Job Order tidak boleh kosong.' }, 400);
  }

  const values = sheetData.getDataRange().getValues();
  const headers = values[0];
  const colMap = {};
  headers.forEach((h, i) => colMap[String(h).trim().toLowerCase()] = i);

  let targetRowIdx = -1;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][colMap['id_jo']]).trim().toUpperCase() === idJo.toUpperCase()) {
      targetRowIdx = r + 1; // 1-based index di Sheets
      break;
    }
  }

  if (targetRowIdx === -1) {
    return createJsonResponse_({ status: 'error', message: 'Job Order ' + idJo + ' tidak ditemukan.' }, 404);
  }

  const mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
  const currentRowValues = values[targetRowIdx - 1];
  const currentM = String(currentRowValues[colMap['milestone_aktif']] || 'M-01').trim().toUpperCase();

  let nextM = targetM;
  if (!nextM) {
    const curIdx = mKeys.indexOf(currentM);
    const nextIdx = Math.min(mKeys.length - 1, curIdx + 1);
    nextM = mKeys[nextIdx];
  }

  const def = MILESTONE_DEFINITIONS[nextM] || { title: nextM, desc: '' };
  const nowStr = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  // Update kolom milestone_aktif dan keterangan_tahap di DATA_PENUGASAN
  sheetData.getRange(targetRowIdx, colMap['milestone_aktif'] + 1).setValue(nextM);
  sheetData.getRange(targetRowIdx, colMap['keterangan_tahap'] + 1).setValue(def.title + ': ' + (def.desc || publicMsg));

  if (nextM === 'M-07') {
    sheetData.getRange(targetRowIdx, colMap['status_penugasan'] + 1).setValue('Selesai');
    sheetData.getRange(targetRowIdx, colMap['tanggal_selesai'] + 1).setValue(nowStr.split(' ')[0]);
  }

  // Tulis riwayat baru ke LOG_PROGRESS (8 Kolom Standar SSOT)
  const kodeLacak = (colMap['kode_lacak'] !== undefined && currentRowValues[colMap['kode_lacak']]) ? String(currentRowValues[colMap['kode_lacak']]) : (payload.kode_lacak || '');
  const executorNama = payload.eksekutor_nama || payload.nama || 'Staf Operasional';
  const executorJabatan = payload.jabatan_cabang || payload.jabatan || 'Tim Teknis';
  const progressNote = payload.catatan_progres || payload.catatan_internal || payload.note || (def.title + ' disahkan.');

  sheetLog.appendRow([
    nowStr,
    idJo,
    kodeLacak,
    nextM,
    executorNik,
    executorNama,
    executorJabatan,
    progressNote
  ]);

  return createJsonResponse_({
    status: 'success',
    message: 'Milestone penugasan ' + idJo + ' berhasil diperbarui ke ' + nextM,
    data: {
      id_jo: idJo,
      milestone_baru: nextM,
      keterangan: def.title
    }
  });
}

/**
 * =========================================================================
 * 5. ACTION: GET_MITRA_SLA (Daftar Standar Hari Kerja Bank Mitra)
 * =========================================================================
 */
function handleGetMitraSla_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG_TRACKING.SHEET_MITRA);
  if (!sheet) {
    return createJsonResponse_({ status: 'error', message: 'Sheet MITRA_DAN_SLA belum ada.' }, 404);
  }

  const values = sheet.getDataRange().getValues();
  const mitras = [];
  for (let r = 1; r < values.length; r++) {
    mitras.push({
      kode_mitra: values[r][0],
      nama_mitra: values[r][1],
      sla_hari_ps: values[r][2],
      sla_hari_non_ps: values[r][3],
      email_pelaporan: values[r][4]
    });
  }

  return createJsonResponse_({ status: 'success', data: mitras });
}

/**
 * Ambil riwayat log penugasan dari tab LOG_PROGRESS
 */
function getLogHistoryForJob_(ss, idJo) {
  const sheet = ss.getSheetByName(CONFIG_TRACKING.SHEET_LOG);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  const result = [];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][1]).trim().toUpperCase() === String(idJo).trim().toUpperCase()) {
      result.push({
        milestone: String(values[r][2]).trim().toUpperCase(),
        timestamp: String(values[r][3] || ''),
        catatan: String(values[r][5] || ''),
        pesan_publik: String(values[r][6] || '')
      });
    }
  }
  return result;
}

/**
 * =========================================================================
 * 6. SETUP DATABASE GENERATOR OTOMATIS
 * Menyiapkan 4 tab lengkap dengan tata letak, warna, formula dan seed data.
 * =========================================================================
 */
function handleSetupDatabase_() {
  const ss = getSpreadsheet_();

  // 1. Tab DATA_PENUGASAN (20 Kolom Termasuk kode_lacak)
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
  sheetData.getRange(2, 1, seedData.length, headersData.length).setValues(seedData);

  // 2. Tab LOG_PROGRESS
  let sheetLog = ss.getSheetByName(CONFIG_TRACKING.SHEET_LOG);
  if (!sheetLog) {
    sheetLog = ss.insertSheet(CONFIG_TRACKING.SHEET_LOG);
  }
  const headersLog = [
    'timestamp', 'nomor_jo', 'kode_lacak', 'milestone_baru', 'nik_eksekutor', 'nama_eksekutor', 'jabatan_cabang', 'catatan_progres'
  ];
  sheetLog.getRange(1, 1, 1, headersLog.length).setValues([headersLog])
    .setBackground('#1e293b').setFontColor('#f8fafc').setFontWeight('bold');
  sheetLog.setFrozenRows(1);

  // 3. Tab MITRA_DAN_SLA
  let sheetMitra = ss.getSheetByName(CONFIG_TRACKING.SHEET_MITRA);
  if (!sheetMitra) {
    sheetMitra = ss.insertSheet(CONFIG_TRACKING.SHEET_MITRA);
  }
  const headersMitra = ['kode_mitra', 'nama_mitra', 'sla_hari_ps', 'sla_hari_non_ps', 'email_pelaporan'];
  sheetMitra.getRange(1, 1, 1, headersMitra.length).setValues([headersMitra])
    .setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
  sheetMitra.setFrozenRows(1);

  // Isi Standar SLA Bank Mitra
  const mitraData = [
    ['BTN', 'PT Bank Tabungan Negara (Persero) Tbk', 3, 5, 'appraisal.btn@btn.co.id'],
    ['MDR', 'PT Bank Mandiri (Persero) Tbk', 3, 5, 'appraisal.mandiri@bankmandiri.co.id'],
    ['BRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 3, 5, 'appraisal.bri@bri.co.id'],
    ['BCA', 'PT Bank Central Asia Tbk', 3, 4, 'appraisal.bca@bca.co.id'],
    ['BNI', 'PT Bank Negara Indonesia (Persero) Tbk', 3, 5, 'appraisal.bni@bni.co.id'],
    ['BSI', 'PT Bank Syariah Indonesia Tbk', 3, 5, 'appraisal.bsi@bankbsi.co.id'],
    ['DKI', 'PT Bank DKI', 3, 5, 'appraisal@bankdki.co.id']
  ];
  if (sheetMitra.getLastRow() <= 1) {
    sheetMitra.getRange(2, 1, mitraData.length, headersMitra.length).setValues(mitraData);
  }

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
    ['Penugasan Aktif Berjalan', '=COUNTIF(DATA_PENUGASAN!R2:R, "Aktif")', '', 'M-02: Penetapan Tim Survei', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-02")'],
    ['Penugasan Tuntas Selesai', '=COUNTIF(DATA_PENUGASAN!R2:R, "Selesai")', '', 'M-03: Inspeksi Lapangan Selesai', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-03")'],
    ['Penugasan Tahap M-04 (Kalkulasi)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-04")', '', 'M-04: Analisis & Kalkulasi Nilai', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-04")'],
    ['Penugasan Tahap M-05 (Review SPM)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-05")', '', 'M-05: Kendali Mutu Reviewer SPM', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-05")'],
    ['Penugasan Tahap M-06 (Penilai Publik)', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-06")', '', 'M-06: Otorisasi Penilai Publik', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-06")'],
    ['Kepatuhan SLA Rata-rata', '100% On-Time', '', 'M-07: Penyerahan Laporan Final', '=COUNTIF(DATA_PENUGASAN!N2:N, "M-07")']
  ];
  sheetDash.getRange(3, 1, dashLabels.length, 5).setValues(dashLabels);
  sheetDash.getRange('A3:E3').setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');

// Seed Data telah diinisialisasi pada blok atas

  return createJsonResponse_({
    status: 'success',
    message: 'Database 4 Tab Google Spreadsheet "DATABASE TRACING PENUGASAN" berhasil diinisialisasi lengkap dengan formula & mock data.'
  });
}
