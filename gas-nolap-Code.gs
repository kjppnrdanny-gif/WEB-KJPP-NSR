/**
 * =========================================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SISTEM PENGAJUAN NOMOR LAPORAN (NOLAP)
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SPREADSHEET DATABASE: Pengajuan Nomor Laporan v1
 * SHEET TARGET: PENGAJUAN (53 Kolom: A s/d BA)
 * =========================================================================================
 * 
 * Spesifikasi Sinkronisasi Berkas Terstruktur:
 * - Kolom 51 (AY): "File Laporan Penilaian"
 * - Kolom 52 (AZ): "File Data Pembanding"
 * - Kolom 53 (BA): "File Berita Acara Inspeksi"
 * 
 * Fitur Integritas & Keandalan:
 * 1. LockService Atomic Safe Guard: Menghindari race condition pengajuan bersamaan.
 * 2. Dynamic Column Header Mapping: Menjamin nilai tertulis ke kolom AY, AZ, BA secara presisi.
 * 3. Fallback Nilai Ganda: Kompatibel baik dengan key header maupun properti payload camelCase.
 * 4. Respon JSON Terstandar dengan penanganan CORS mode.
 * =========================================================================================
 */

const CONFIG_NOLAP = {
  SPREADSHEET_ID: '1q1KpKRrNvvT_nD8D0y9dgZzuz8CpCFCNi6oQtoz7sc4',
  SHEET_PENGAJUAN: 'PENGAJUAN',
  SHEET_AUDIT: 'AUDIT_LOG',
  SHEET_USER: 'MASTER_USER',
  SHEET_TOKEN: 'MASTER_TOKEN',
  MASTER_ADMIN_SPREADSHEET_ID: '1Aob9oFvOObV7Nz0bt3DDsTrWCoFKd233FFYkdBCSFTg'
};

/**
 * Entry point HTTP POST dari formulir portal-nolap.html
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Kunci proses maksimal 30 detik untuk mencegah tumpang tindih nomor permintaan / baris
    lock.waitLock(30000);

    let action = '';
    let payload = null;

    // Parsing payload dari format x-www-form-urlencoded atau JSON body
    if (e && e.parameter && e.parameter.payload) {
      action = e.parameter.action || 'submitRequest';
      try {
        payload = JSON.parse(e.parameter.payload);
      } catch (err) {
        payload = e.parameter.payload;
      }
    } else if (e && e.postData && e.postData.contents) {
      try {
        const raw = JSON.parse(e.postData.contents);
        action = raw.action || (raw.payload && raw.payload.action) || 'submitRequest';
        payload = raw.payload || raw.data || raw;
      } catch (err) {
        action = (e.parameter && e.parameter.action) || 'submitRequest';
        payload = e.postData.contents;
      }
    }

    if (!payload) {
      return jsonResponse({ success: false, error: 'Payload kosong atau tidak terdefinisi' });
    }

    // Router Tindakan
    if (action === 'submitRequest') {
      return handleSubmitPengajuanNoLap(payload);
    } else if (action === 'approveRequest') {
      return handleApproveNoLap(payload);
    } else if (action === 'requestRevision') {
      return handleRequestRevision(payload);
    } else if (action === 'issueCabangDraftNoLap') {
      return handleIssueCabangDraftNoLap(payload);
    } else if (action === 'issueCabangDefinitiveNoLap') {
      return handleIssueCabangDefinitiveNoLap(payload);
    } else if (action === 'finalizeBookingReport') {
      return handleFinalizeBookingReport(payload);
    } else if (action === 'saveSmartMitigasiTanah' || action === 'saveSmartMitigasiUmum' || action === 'saveSmartMitigasiRuislagh' || action === 'saveMitigasi') {
      return handleSaveMitigasiRisiko(action, payload);
    } else {
      return jsonResponse({ success: false, error: 'Aksi "' + action + '" tidak dikenali' });
    }

  } catch (error) {
    Logger.log('Error doPost NoLap: ' + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Entry point HTTP GET untuk health-check
 */
function doGet(e) {
  return jsonResponse({
    success: true,
    message: 'Backend Google Apps Script Portal NoLap KJPP NSR Aktif & Siap Operasional.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handler Khusus untuk Menyimpan Pengajuan Nomor Laporan Baru
 * Memetakan seluruh data ke Sheet PENGAJUAN (Kolom A s/d BA / 1 s/d 53)
 */
function handleSubmitPengajuanNoLap(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan pada database.');
  }

  // 1. Ambil 3 Link Berkas Terstruktur (Sesuai Persis dengan Header Sheet PENGAJUAN)
  const fileLaporan = (data['File Laporan Penilaian'] || data.linkLaporan || data.linkDrive || '').toString().trim();
  const filePembanding = (data['File Data Pembanding'] || data.linkPembanding || '').toString().trim();
  const fileBai = (data['File Berita Acara Inspeksi'] || data.linkBai || '').toString().trim();

  // 2. Baca Header Sheet untuk Dynamic Column Matching
  const lastCol = Math.max(sheet.getLastColumn(), 53);
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  const headers = headerRange.getValues()[0];

  // =========================================================================
  // ATURAN KHUSUS PENANDATANGAN DENI SISWANDI (SINGLE-BRANCH DAILY EXCLUSIVITY)
  // Regulasi Kepatuhan P2PK Kemenkeu: Mencegah multi-yurisdiksi cabang pada hari yang sama.
  // =========================================================================
  const payloadPenilai = (data.penilai || data.namaPenandatangan || data.Rekan_Penilai_Publik || '').toString();
  const payloadCabang = (data.cabang || data.namaCabang || data.Kantor_Wilayah || 'Pusat').toString().trim();
  const isDeniSiswandi = payloadPenilai.toLowerCase().includes('deni siswandi');

  if (isDeniSiswandi) {
    const todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    const dataRows = sheet.getDataRange().getValues(); // Sheet PENGAJUAN

    // Dynamic Header Index Detection
    let idxCabang = headers.findIndex(h => /cabang|kantor/i.test(String(h || '')));
    let idxPenilai = headers.findIndex(h => /penilai|penandatangan|rekan/i.test(String(h || '')));
    let idxStatus = headers.findIndex(h => /^status$/i.test(String(h || '')));
    let idxTimestamp = headers.findIndex(h => /timestamp|waktu|tanggal/i.test(String(h || '')));

    if (idxCabang === -1) idxCabang = 1;     // Kolom B / C
    if (idxPenilai === -1) idxPenilai = 16;  // Kolom Q / R
    if (idxStatus === -1) idxStatus = 20;    // Kolom U
    if (idxTimestamp === -1) idxTimestamp = 0; // Kolom A

    // Loop data pengajuan pada hari ini
    for (let i = 1; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowTimestamp = row[idxTimestamp] !== undefined ? row[idxTimestamp] : row[0];
      const rowCabang = String(row[idxCabang] || row[1] || row[2] || '').trim();
      const rowPenilai = String(row[idxPenilai] || row[16] || row[17] || '').toLowerCase();
      const rowStatus = String(row[idxStatus] || row[20] || '');

      // Abaikan baris yang DITOLAK atau VOID / DIBATALKAN
      if (rowStatus.toUpperCase().includes('DITOLAK') || rowStatus.toUpperCase().includes('VOID') || rowStatus.toUpperCase().includes('BATAL')) continue;

      let rowDateStr = '';
      if (rowTimestamp instanceof Date) {
        rowDateStr = Utilities.formatDate(rowTimestamp, "Asia/Jakarta", "yyyy-MM-dd");
      } else if (typeof rowTimestamp === 'string' && rowTimestamp.trim()) {
        const parsedD = new Date(rowTimestamp);
        if (!isNaN(parsedD.getTime())) {
          rowDateStr = Utilities.formatDate(parsedD, "Asia/Jakarta", "yyyy-MM-dd");
        } else {
          const parts = rowTimestamp.trim().split(/[\s,]+/)[0];
          if (parts.includes('-')) {
            rowDateStr = parts;
          } else if (parts.includes('/')) {
            const segs = parts.split('/');
            if (segs.length === 3) {
              if (parseInt(segs[0], 10) > 12) {
                rowDateStr = `${segs[2]}-${String(segs[1]).padStart(2, '0')}-${String(segs[0]).padStart(2, '0')}`;
              } else if (parseInt(segs[1], 10) > 12) {
                rowDateStr = `${segs[2]}-${String(segs[0]).padStart(2, '0')}-${String(segs[1]).padStart(2, '0')}`;
              } else if (parseInt(segs[2], 10) > 1000) {
                rowDateStr = `${segs[2]}-${String(segs[0]).padStart(2, '0')}-${String(segs[1]).padStart(2, '0')}`;
              }
            }
          }
        }
      }

      // Jika tanggalnya sama DAN penilainya Deni Siswandi
      if (rowDateStr === todayStr && rowPenilai.includes('deni siswandi')) {
        const cleanRowCabang = rowCabang.replace(/kantor|cabang/gi, '').trim().toLowerCase();
        const cleanPayloadCabang = payloadCabang.replace(/kantor|cabang/gi, '').trim().toLowerCase();

        // Jika diajukan oleh CABANG LAIN yang berbeda:
        if (cleanRowCabang && cleanPayloadCabang && cleanRowCabang !== cleanPayloadCabang) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            success: false,
            code: 'DENI_SISWANDI_DAILY_BRANCH_LOCKED',
            cabangPengguna: rowCabang,
            error: `Mohon maaf, kewenangan tanda tangan Penilai Publik Deni Siswandi untuk hari ini (${todayStr}) telah digunakan oleh ${rowCabang.toUpperCase()}. Sesuai regulasi kepatuhan P2PK, cabang lain tidak dapat mengajukan tanda tangan Deni Siswandi pada hari yang sama. Silakan alihkan penandatangan ke Nanang Rahayu atau ajukan untuk jadwal tanggal berikutnya.`,
            message: `Mohon maaf, kewenangan tanda tangan Penilai Publik Deni Siswandi untuk hari ini (${todayStr}) telah digunakan oleh ${rowCabang.toUpperCase()}. Sesuai regulasi kepatuhan P2PK, cabang lain tidak dapat mengajukan tanda tangan Deni Siswandi pada hari yang sama. Silakan alihkan penandatangan ke Nanang Rahayu atau ajukan untuk jadwal tanggal berikutnya.`
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
  }

  // Cari index kolom (1-indexed) atau fallback ke nomor kolom standar (51, 52, 53)
  let colIndexLaporan = headers.indexOf('File Laporan Penilaian') + 1;
  let colIndexPembanding = headers.indexOf('File Data Pembanding') + 1;
  let colIndexBai = headers.indexOf('File Berita Acara Inspeksi') + 1;

  if (colIndexLaporan <= 0) colIndexLaporan = 51;     // Kolom AY
  if (colIndexPembanding <= 0) colIndexPembanding = 52; // Kolom AZ
  if (colIndexBai <= 0) colIndexBai = 53;               // Kolom BA

  // Format Catatan Pemohon & Parameter Yuridis Pengadaan Tanah & Booking NoLap
  const isBooking = data.modePengajuan === 'BOOKING' || Boolean(data.isBooking);
  const targetFinalisasi = data.targetFinalisasi || data.targetTanggalFinalisasi || '';

  let catatanPemohon = (data.catatanPemohon || '').toString().trim();
  if (data.catatanYuridisTanah && !catatanPemohon.includes(data.catatanYuridisTanah)) {
    catatanPemohon = (catatanPemohon ? (catatanPemohon + ' | ') : '') + data.catatanYuridisTanah;
  }
  if (isBooking && targetFinalisasi && !catatanPemohon.includes('TARGET FINALISASI')) {
    catatanPemohon = (catatanPemohon ? (catatanPemohon + ' | ') : '') + `[BOOKING NOLAP - TARGET FINALISASI: ${targetFinalisasi}]`;
  }

  // Format Pengguna Laporan Terstruktur (SPI 103)
  let penggunaLaporan = (data.penggunaLaporan || data['Pengguna Laporan'] || '').toString().trim();
  if (!penggunaLaporan && (data.penggunaLapANama || data.namaA)) {
    const namaA = (data.penggunaLapANama || data.namaA || '').toString().trim();
    const alamatA = (data.penggunaLapAAlamat || data.alamatA || '').toString().trim();
    const namaB = (data.penggunaLapBNama || data.namaB || '').toString().trim();
    const alamatB = (data.penggunaLapBAlamat || data.alamatB || '').toString().trim();
    if (namaB) {
      penggunaLaporan = `a. ${namaA}${alamatA ? ', Alamat: ' + alamatA : ''}; b. ${namaB}${alamatB ? ', Alamat: ' + alamatB : ''}`;
    } else if (namaA) {
      penggunaLaporan = `a. ${namaA}${alamatA ? ', Alamat: ' + alamatA : ''}`;
    }
  }

  // 3. Susun Baris Data Baru (53 Kolom)
  const now = new Date();
  const timestampStr = Utilities.formatDate(now, "Asia/Jakarta", "M/d/yyyy HH:mm:ss");

  const row = new Array(Math.max(lastCol, 53)).fill('');

  // Kolom 1 - 20
  row[0]  = timestampStr;                                   // 1 (A): Timestamp
  row[1]  = data.cabang || data.namaCabang || 'Pusat';      // 2 (B): Nama Cabang
  row[2]  = data.namaPemohon || '';                         // 3 (C): Nama Pemohon
  row[3]  = data.jabatanPemohon || '';                      // 4 (D): Jabatan Pemohon
  row[4]  = data.emailPemohon || '';                        // 5 (E): Email Pemohon
  row[5]  = data.waPemohon || data.nomorWhatsAppPemohon || ''; // 6 (F): Nomor WhatsApp Pemohon
  row[6]  = data.namaKlien || data.namaInstansi || data.namaLengkapKtp || ''; // 7 (G): Nama Klien (Badan Usaha / KTP)
  row[7]  = data.statusKlien || data.statusKepemilikan || (data.entitasKlien ? (data.entitasKlien === 'Perorangan' ? 'Perorangan' : 'Badan Usaha') : 'Badan Usaha'); // 8 (H): Status Kepemilikan Pemberi Tugas
  row[8]  = data.alamatKlien || '';                         // 9 (I): Alamat Lengkap Pemberi Tugas
  row[9]  = data.emailKlien || data.emailPemberiTugas || '';// 10 (J): Email Pemberi Tugas
  row[10] = data.kontakKlien || data.nomorKontakKlien || '';// 11 (K): Nomor Kontak Klien
  row[11] = data.service_classification_name || data.service_classification_id || data.klasifikasiJasa || data.klasifikasiObjek || 'Penilaian Properti'; // 12 (L): Klasifikasi Objek
  row[12] = data.tujuanPenilaian || '';                     // 13 (M): Tujuan Penilaian
  row[13] = data.jenisObjek || '';                          // 14 (N): Jenis Objek
  row[14] = data.lokasiObjek || '';                         // 15 (O): Lokasi Objek
  row[15] = data.deadline || data.deadlineLaporan || '';    // 16 (P): Deadline Laporan
  row[16] = data.penilai || data.namaPenandatangan || '';   // 17 (Q): Nama Penandatangan
  row[17] = data.kodeIndustri || '';                        // 18 (R): Kode Industri
  row[18] = data.npwp || data.nikKtp || '';                 // 19 (S): NPWP (NPWP Badan / NIK 16 Digit)
  row[19] = data.noPermintaan || '';                        // 20 (T): No Permintaan

  // Kolom 21 - 34 (Status Operasional & ELSA)
  row[20] = isBooking ? 'BOOKING DIAJUKAN' : (data.status || 'DIAJUKAN');                      // 21 (U): Status
  row[21] = data.nomorLaporan || '';                        // 22 (V): Nomor Laporan
  row[22] = data.tglTerbit || '';                           // 23 (W): Tanggal Terbit
  row[23] = isBooking ? 'MENUNGGU BERKAS FINAL' : (data.statusElsa || 'BELUM INPUT');         // 24 (X): Status ELSA
  row[24] = data.idElsa || '';                              // 25 (Y): Nomor/ID ELSA
  row[25] = data.qrCodeElsa || '';                          // 26 (Z): QR Code ELSA
  row[26] = data.linkQrElsa || data.linkElsa || '';         // 27 (AA): Link QR ELSA
  row[27] = data.tglQrElsa || '';                           // 28 (AB): Tanggal QR ELSA
  row[28] = data.tglPenyampaianQr || '';                    // 29 (AC): Tanggal Penyampaian QR
  row[29] = data.statusPenyampaianQr || 'BELUM DISAMPAIKAN';// 30 (AD): Status Penyampaian QR
  row[30] = data.catatanElsa || '';                         // 31 (AE): Catatan ELSA
  row[31] = catatanPemohon;                                 // 32 (AF): Catatan Pemohon
  row[32] = data.catatanAdmin || '';                        // 33 (AG): Catatan Admin
  row[33] = data.waPemohon ? ('https://wa.me/' + data.waPemohon.toString().replace(/\D/g, '')) : ''; // 34 (AH): Link WhatsApp

  // Kolom 35 - 50 (Parameter Teknis & Finansial Penugasan)
  row[34] = data.noLingkup || data.noLingkupPenugasan || '';// 35 (AI): No Lingkup Penugasan
  row[35] = data.tglLingkup || '';                          // 36 (AJ): Tanggal Lingkup Penugasan
  row[36] = data.noSpk || '';                               // 37 (AK): No SPK
  row[37] = data.tglSpk || '';                              // 38 (AL): Tanggal SPK
  row[38] = data.tglPenilaian || '';                        // 39 (AM): Tanggal Penilaian (Cut-off Survei / Penlok)
  row[39] = penggunaLaporan;                                // 40 (AN): Pengguna Laporan (SPI 103 klausul 3)
  row[40] = data.pendekatan || data.pendekatanPenilaian || ''; // 41 (AO): Pendekatan Penilaian
  row[41] = data.metode || data.metodePenilaian || '';      // 42 (AP): Metode Penilaian
  row[42] = data.dasarNilai || '';                          // 43 (AQ): Dasar Nilai (NPW / Nilai Pasar)
  row[43] = data.bentukLaporan || '';                       // 44 (AR): Bentuk Laporan
  row[44] = data.kesimpulanNilai || '';                     // 45 (AS): Kesimpulan Nilai
  row[45] = data.biayaJasa || data.totalBayar || 0;         // 46 (AT): Biaya Jasa
  row[46] = data.luasTanah || 0;                            // 47 (AU): Luas Tanah
  row[47] = data.luasBangunan || 0;                         // 48 (AV): Luas Bangunan
  row[48] = data.pemilikObjek || data.namaPemilikObjek || '';// 49 (AW): Nama Pemilik Objek
  row[49] = data.reviewer || data.namaReviewer || '';       // 50 (AX): Nama Reviewer

  // =========================================================================
  // KOLOM AY, AZ, BA (51, 52, 53) - 3 BERKAS PENILAIAN TERSTRUKTUR
  // =========================================================================
  row[colIndexLaporan - 1]    = fileLaporan;    // Kolom AY (51): File Laporan Penilaian
  row[colIndexPembanding - 1] = filePembanding; // Kolom AZ (52): File Data Pembanding
  row[colIndexBai - 1]        = fileBai;        // Kolom BA (53): File Berita Acara Inspeksi

  // 4. Tulis ke Baris Baru di Spreadsheet
  sheet.appendRow(row);

  const nextRow = sheet.getLastRow();

  // Pastikan kembali isi kolom AY, AZ, BA tertulis secara presisi (Double-Lock Assertion)
  sheet.getRange(nextRow, colIndexLaporan).setValue(fileLaporan);
  sheet.getRange(nextRow, colIndexPembanding).setValue(filePembanding);
  sheet.getRange(nextRow, colIndexBai).setValue(fileBai);

  // Kirim Notifikasi Email HTML Resmi ke admin@kjppnanangrahayu.com
  sendEmailNotificationNoLap(data, nextRow, fileLaporan, filePembanding, fileBai, penggunaLaporan, catatanPemohon);

  return jsonResponse({
    success: true,
    message: 'Pengajuan nomor laporan berhasil direkam ke Google Sheets PENGAJUAN pada baris ke-' + nextRow,
    noPermintaan: data.noPermintaan,
    rowIndex: nextRow,
    columnsMapped: {
      kolomAY: { col: colIndexLaporan, name: 'File Laporan Penilaian', value: fileLaporan },
      kolomAZ: { col: colIndexPembanding, name: 'File Data Pembanding', value: filePembanding },
      kolomBA: { col: colIndexBai, name: 'File Berita Acara Inspeksi', value: fileBai }
    }
  });
}

/**
 * Pengiriman Notifikasi Email HTML Resmi ke admin@kjppnanangrahayu.com
 * Dilengkapi Tombol Tindakan Cepat WhatsApp Konfirmasi (Mba Siti & Admin Resmi)
 */
function sendEmailNotificationNoLap(data, rowIndex, fileLaporan, filePembanding, fileBai, penggunaLaporan, catatanPemohon) {
  try {
    const recipient = 'admin@kjppnanangrahayu.com';
    const noReq = data.noPermintaan || ('REQ-' + Date.now());
    const namaKlien = data.namaKlien || data.namaInstansi || data.namaLengkapKtp || 'Klien';
    const cabang = data.cabang || data.namaCabang || 'Pusat';
    const subject = `[PENGAJUAN NOLAP] ${noReq} - ${namaKlien} (${cabang})`;

    const waTextMbaSiti = encodeURIComponent(`Halo Mba Siti, konfirmasi pengajuan NoLap:\n• No Permintaan: ${noReq}\n• Klien: ${namaKlien}\n• Cabang: ${cabang}\n• Objek: ${data.jenisObjek || '-'}\nMohon diverifikasi di sheet PENGAJUAN baris ke-${rowIndex}. Terima kasih.`);
    const waUrlMbaSiti = `https://wa.me/628871336710?text=${waTextMbaSiti}`;

    const waTextAdmin = encodeURIComponent(`Halo Admin Resmi KJPP NSR, konfirmasi pengajuan NoLap:\n• No Permintaan: ${noReq}\n• Klien: ${namaKlien}\n• Cabang: ${cabang}\n• Objek: ${data.jenisObjek || '-'}\nMohon diproses untuk penerbitan NoLap. Terima kasih.`);
    const waUrlAdmin = `https://wa.me/6285110513157?text=${waTextAdmin}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; color: #f8fafc; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #f59e0b; font-size: 19px; letter-spacing: 0.5px;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Notifikasi Permohonan Nomor Laporan (NoLap) Baru</p>
        </div>
        <div style="padding: 22px;">
          <p style="font-size: 13.5px; color: #334155; margin-top: 0; line-height: 1.5;">
            Permohonan Nomor Laporan baru telah berhasil dicatat pada Google Sheets <strong>PENGAJUAN</strong> pada baris ke-<strong>${rowIndex}</strong>:
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 16px 0;">
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; width: 34%; border: 1px solid #e2e8f0;">No. Permintaan</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: bold;">${noReq}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Cabang / Pemohon</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${cabang} &bull; ${data.namaPemohon || '-'} (${data.jabatanPemohon || '-'})</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Pemberi Tugas (Klien)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;"><strong>${namaKlien}</strong> [${data.statusKlien || data.statusKepemilikan || 'Badan Usaha'}]</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Pengguna Laporan (SPI 103)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${penggunaLaporan || '-'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Tujuan & Dasar Nilai</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${data.tujuanPenilaian || '-'} &bull; <strong>${data.dasarNilai || '-'}</strong></td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Objek & Lokasi</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${data.jenisObjek || '-'} (${data.lokasiObjek || '-'})</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Tgl Penilaian (Cut-off)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${data.tglPenilaian || '-'}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Catatan / Yuridis Tanah</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11.5px; color: #475569;">${catatanPemohon || '-'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Berkas Terstruktur (Drive)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px;">
              • File Laporan: ${fileLaporan ? ('<a href="' + fileLaporan + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka Laporan</a>') : '-'}<br>
              • Data Pembanding: ${filePembanding ? ('<a href="' + filePembanding + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka Pembanding</a>') : '-'}<br>
              • Berita Acara Inspeksi: ${fileBai ? ('<a href="' + fileBai + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka BAI</a>') : '-'}
            </td></tr>
          </table>

          <div style="margin-top: 22px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 13px; font-weight: bold; color: #1e293b;">Tombol Konfirmasi Cepat WhatsApp:</p>
            <div style="margin: 6px 0;">
              <a href="${waUrlMbaSiti}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 12.5px; font-weight: bold; margin: 4px;">
                💬 Konfirmasi ke Mba Siti (08871336710)
              </a>
              <a href="${waUrlAdmin}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 12.5px; font-weight: bold; margin: 4px;">
                💬 Konfirmasi ke Admin Resmi (085110513157)
              </a>
            </div>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 10px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Email otomatis ini diterbitkan oleh Backend Google Apps Script KJPP NSR Portal NoLap.
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log('Notifikasi email berhasil dikirim ke ' + recipient);
  } catch (err) {
    Logger.log('Gagal mengirim notifikasi email: ' + err.toString());
  }
}

/**
 * Handler Khusus untuk Finalisasi Berkas Booking Nomor Laporan
 * Mengupdate Kolom AS (45 - Kesimpulan Nilai), W (23 - Tanggal Terbit/Laporan),
 * Kolom AY, AZ, BA (51, 52, 53 - 3 File Berkas),
 * Mengubah Status ke 'FINAL - SIAP ELSA' dan Status ELSA ke 'BELUM INPUT'
 */
function handleFinalizeBookingReport(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan pada database.');
  }

  const noReq = (data.noPermintaan || '').toString().trim();
  const noLap = (data.nomorLaporan || '').toString().trim();
  const noSpk = (data.noSpk || '').toString().trim();

  if (!noReq && !noLap && !noSpk) {
    return jsonResponse({ success: false, error: 'Nomor Permintaan, Nomor Laporan, atau Nomor SPK wajib disertakan untuk finalisasi booking.' });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ success: false, error: 'Database pengajuan kosong.' });
  }

  const lastCol = Math.max(sheet.getLastColumn(), 53);
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  const headers = headerRange.getValues()[0];

  let colIndexLaporan = headers.indexOf('File Laporan Penilaian') + 1;
  let colIndexPembanding = headers.indexOf('File Data Pembanding') + 1;
  let colIndexBai = headers.indexOf('File Berita Acara Inspeksi') + 1;

  if (colIndexLaporan <= 0) colIndexLaporan = 51;
  if (colIndexPembanding <= 0) colIndexPembanding = 52;
  if (colIndexBai <= 0) colIndexBai = 53;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const values = dataRange.getValues();

  let targetRowIndex = -1;
  let targetRowData = null;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNoReq = (row[19] || '').toString().trim(); // Kolom 20 (T)
    const rowNoLap = (row[21] || '').toString().trim(); // Kolom 22 (V)
    const rowNoSpk = (row[36] || '').toString().trim(); // Kolom 37 (AK)

    if ((noReq && rowNoReq === noReq) ||
        (noLap && rowNoLap === noLap) ||
        (noSpk && rowNoSpk === noSpk)) {
      targetRowIndex = i + 2; // 1-indexed (header is row 1)
      targetRowData = row;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Data pengajuan dengan identitas (' + (noReq || noLap || noSpk) + ') tidak ditemukan di sheet PENGAJUAN.' });
  }

  const fileLaporan = (data['File Laporan Penilaian'] || data.linkLaporan || data.linkDrive || '').toString().trim();
  const filePembanding = (data['File Data Pembanding'] || data.linkPembanding || '').toString().trim();
  const fileBai = (data['File Berita Acara Inspeksi'] || data.linkBai || '').toString().trim();
  const kesimpulanNilai = data.kesimpulanNilai || data.nilaiKesimpulan || '';
  const tglLaporan = data.tglLaporan || data.tglTerbit || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");

  const now = new Date();
  const timestampStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  // Update Status Operasional (Kolom 21 U -> 'FINAL - SIAP ELSA')
  sheet.getRange(targetRowIndex, 21).setValue('FINAL - SIAP ELSA');

  // Update Status ELSA (Kolom 24 X -> 'BELUM INPUT')
  sheet.getRange(targetRowIndex, 24).setValue('BELUM INPUT');

  // Update Tanggal Terbit / Laporan (Kolom 23 W) jika ada
  if (tglLaporan) {
    sheet.getRange(targetRowIndex, 23).setValue(tglLaporan);
  }

  // Update Kesimpulan Nilai (Kolom 45 AS)
  if (kesimpulanNilai) {
    sheet.getRange(targetRowIndex, 45).setValue(kesimpulanNilai);
  }

  // Update 3 File Berkas Terstruktur (Kolom AY, AZ, BA)
  sheet.getRange(targetRowIndex, colIndexLaporan).setValue(fileLaporan);
  sheet.getRange(targetRowIndex, colIndexPembanding).setValue(filePembanding);
  sheet.getRange(targetRowIndex, colIndexBai).setValue(fileBai);

  // Append catatan log finalisasi di Catatan Pemohon (Kolom 32 AF)
  const oldCatatan = (sheet.getRange(targetRowIndex, 32).getValue() || '').toString();
  const logFinal = `[FINALISASI BERKAS SELESAI PADA: ${timestampStr}]`;
  if (!oldCatatan.includes('FINALISASI BERKAS SELESAI')) {
    const updatedCatatan = oldCatatan ? (oldCatatan + ' | ' + logFinal) : logFinal;
    sheet.getRange(targetRowIndex, 32).setValue(updatedCatatan);
  }

  // Kirim notifikasi email finalisasi booking ke admin@kjppnanangrahayu.com
  sendEmailNotificationFinalizeBooking(targetRowData, targetRowIndex, fileLaporan, filePembanding, fileBai, kesimpulanNilai, tglLaporan);

  return jsonResponse({
    success: true,
    message: 'Berkas booking NoLap berhasil difinalisasi dan status diperbarui menjadi FINAL - SIAP ELSA.',
    rowIndex: targetRowIndex,
    noPermintaan: targetRowData[19] || noReq,
    nomorLaporan: targetRowData[21] || noLap,
    status: 'FINAL - SIAP ELSA',
    statusElsa: 'BELUM INPUT'
  });
}

/**
 * Pengiriman Notifikasi Email HTML Finalisasi Berkas Booking ke admin@kjppnanangrahayu.com
 */
function sendEmailNotificationFinalizeBooking(targetRowData, rowIndex, fileLaporan, filePembanding, fileBai, kesimpulanNilai, tglLaporan) {
  try {
    const recipient = 'admin@kjppnanangrahayu.com';
    const noReq = targetRowData[19] || '-';
    const noLap = targetRowData[21] || 'DIBOOKING';
    const namaKlien = targetRowData[6] || 'Klien';
    const cabang = targetRowData[1] || 'Pusat';
    const subject = `[FINALISASI BERKAS BOOKING] ${noReq} / ${noLap} - ${namaKlien} (${cabang})`;

    const waTextMbaSiti = encodeURIComponent(`Halo Mba Siti, konfirmasi Finalisasi Berkas Booking NoLap:\n• No Permintaan: ${noReq}\n• No Laporan: ${noLap}\n• Klien: ${namaKlien}\n• Cabang: ${cabang}\n• Status: FINAL - SIAP ELSA (eLSa dibuka)\nMohon diverifikasi di sheet PENGAJUAN baris ke-${rowIndex}. Terima kasih.`);
    const waUrlMbaSiti = `https://wa.me/628871336710?text=${waTextMbaSiti}`;

    const waTextAdmin = encodeURIComponent(`Halo Admin Resmi KJPP NSR, konfirmasi Finalisasi Berkas Booking NoLap:\n• No Permintaan: ${noReq}\n• No Laporan: ${noLap}\n• Klien: ${namaKlien}\n• Status: FINAL - SIAP ELSA\nMohon lakukan input eLSa PPPK. Terima kasih.`);
    const waUrlAdmin = `https://wa.me/6285110513157?text=${waTextAdmin}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; color: #f8fafc; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #38bdf8; font-size: 19px; letter-spacing: 0.5px;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Notifikasi Finalisasi Berkas Booking Nomor Laporan (NoLap)</p>
        </div>
        <div style="padding: 22px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 16px; color: #166534; font-size: 13px;">
            ✅ <strong>Berkas Final Berhasil Diunggah!</strong> Status NoLap telah dinaikkan menjadi <strong>FINAL - SIAP ELSA</strong> dan status eLSa telah dibuka ke <strong>BELUM INPUT</strong>.
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 16px 0;">
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; width: 34%; border: 1px solid #e2e8f0;">No. Permintaan / No. Laporan</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0284c7; font-weight: bold;">${noReq} &bull; ${noLap}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Cabang / Klien</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${cabang} &bull; <strong>${namaKlien}</strong></td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Kesimpulan Nilai Final</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">Rp ${kesimpulanNilai || '-'}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">Tanggal Laporan Final</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${tglLaporan || '-'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #e2e8f0;">3 Berkas Final (Drive)</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px;">
              • File Laporan: ${fileLaporan ? ('<a href="' + fileLaporan + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka Laporan Final</a>') : '-'}<br>
              • Data Pembanding: ${filePembanding ? ('<a href="' + filePembanding + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka Pembanding</a>') : '-'}<br>
              • Berita Acara Inspeksi: ${fileBai ? ('<a href="' + fileBai + '" target="_blank" style="color: #0284c7; font-weight: bold;">Buka BAI</a>') : '-'}
            </td></tr>
          </table>

          <div style="margin-top: 22px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 13px; font-weight: bold; color: #1e293b;">Tindakan Verifikasi WhatsApp:</p>
            <div style="margin: 6px 0;">
              <a href="${waUrlMbaSiti}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 12.5px; font-weight: bold; margin: 4px;">
                💬 Konfirmasi ke Mba Siti (08871336710)
              </a>
              <a href="${waUrlAdmin}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 12.5px; font-weight: bold; margin: 4px;">
                💬 Konfirmasi ke Admin Resmi (085110513157)
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log('Notifikasi email finalisasi booking berhasil dikirim ke ' + recipient);
  } catch (err) {
    Logger.log('Gagal mengirim email finalisasi: ' + err.toString());
  }
}

/**
 * Handler Khusus untuk Approval dan Penetapan Nomor Laporan Resmi oleh Admin Pusat
 * Memvalidasi keunikan nomor laporan, mencegah duplikasi, dan mengupdate baris di Sheet PENGAJUAN
 */
function handleApproveNoLap(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan pada database.');
  }

  const noReq = (data.noPermintaan || '').toString().trim();
  const noLap = (data.nomorLaporan || '').toString().trim();
  const tglTerbit = (data.tglTerbit || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd")).toString().trim();
  const catatanAdmin = (data.catatanAdmin || 'Disetujui dan ditetapkan resmi oleh Admin Pusat.').toString().trim();

  if (!noReq || !noLap) {
    return jsonResponse({ success: false, error: 'Nomor Permintaan dan Nomor Laporan wajib diisi untuk approval resmi.' });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonResponse({ success: false, error: 'Database pengajuan kosong.' });
  }

  const lastCol = Math.max(sheet.getLastColumn(), 53);
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const values = dataRange.getValues();

  // 1. Validasi Anti-Duplikasi Nomor Laporan Resmi di Spreadsheet
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNoReq = (row[19] || '').toString().trim(); // Kolom 20 (T)
    const rowNoLap = (row[21] || '').toString().trim(); // Kolom 22 (V)
    const rowStatus = (row[20] || '').toString().trim().toUpperCase(); // Kolom 21 (U)

    if (rowNoReq !== noReq && rowNoLap && rowNoLap.toLowerCase() === noLap.toLowerCase() && !rowStatus.includes('VOID') && !rowStatus.includes('DIBATALKAN')) {
      return jsonResponse({
        success: false,
        error: 'Nomor Laporan "' + noLap + '" sudah terdaftar pada permohonan ' + rowNoReq + '. Duplikasi nomor laporan ditolak sistem.',
        code: 'DUPLICATE_REPORT_NUMBER'
      });
    }
  }

  // 2. Cari baris permohonan yang akan di-approve
  let targetRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNoReq = (row[19] || '').toString().trim();
    if (rowNoReq === noReq) {
      targetRowIndex = i + 2; // header is row 1
      break;
    }
  }

  if (targetRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Data permohonan ' + noReq + ' tidak ditemukan di sheet PENGAJUAN.' });
  }

  // 3. Update Status (Kolom 21 U), Nomor Laporan (Kolom 22 V), Tanggal Terbit (Kolom 23 W), Catatan Admin (Kolom 33 AG)
  sheet.getRange(targetRowIndex, 21).setValue('NOMOR DITERBITKAN');
  sheet.getRange(targetRowIndex, 22).setValue(noLap);
  sheet.getRange(targetRowIndex, 23).setValue(tglTerbit);
  sheet.getRange(targetRowIndex, 33).setValue(catatanAdmin);

  return jsonResponse({
    success: true,
    message: 'Nomor Laporan resmi ' + noLap + ' berhasil disetujui dan dicatat pada baris ke-' + targetRowIndex,
    noPermintaan: noReq,
    nomorLaporan: noLap,
    tglTerbit: tglTerbit,
    rowIndex: targetRowIndex
  });
}

/**
 * Handler Khusus untuk Pengembalian Permohonan Revisi oleh Admin Pusat
 */
function handleRequestRevision(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan pada database.');
  }

  const noReq = (data.noPermintaan || '').toString().trim();
  const catatanAdmin = (data.catatanAdmin || 'Status Dikembalikan untuk Revisi.').toString().trim();

  if (!noReq) {
    return jsonResponse({ success: false, error: 'Nomor Permintaan wajib diisi.' });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonResponse({ success: false, error: 'Database kosong.' });

  const values = sheet.getRange(2, 20, lastRow - 1, 1).getValues(); // Kolom 20 (T): noPermintaan
  let targetRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    if ((values[i][0] || '').toString().trim() === noReq) {
      targetRowIndex = i + 2;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Data permohonan ' + noReq + ' tidak ditemukan.' });
  }

  sheet.getRange(targetRowIndex, 21).setValue('PERLU REVISI');
  sheet.getRange(targetRowIndex, 33).setValue(catatanAdmin);

  return jsonResponse({
    success: true,
    message: 'Permohonan ' + noReq + ' berhasil dikembalikan untuk revisi.',
    noPermintaan: noReq,
    rowIndex: targetRowIndex
  });
}

/**
 * Handler untuk Menyimpan Data Mitigasi Risiko SPM
 */
function handleSaveMitigasiRisiko(action, payload) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('MITIGASI_RISIKO');
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Sheet MITIGASI_RISIKO tidak ditemukan' });
  }

  const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  const noReq = payload.noPermintaan || (payload.data && payload.data.linkedNoReq) || '';
  const tipe = action || payload.tipeMitigasi || 'SPM';
  const dataJson = JSON.stringify(payload.data || payload);

  sheet.appendRow([timestamp, noReq, tipe, dataJson]);

  return jsonResponse({
    success: true,
    message: 'Data Mitigasi Risiko berhasil disinkronkan ke Google Sheets',
    noPermintaan: noReq
  });
}

/**
 * Handler Khusus Penerbitan Nomor Draf Kerja Mandiri Cabang
 * Menghasilkan format DRAFT-NSR/[KODE_CABANG]/[TAHUN]/[BULAN]/[NO_URUT]
 * Kewenangan: CABANG_MANDIRI (Tanpa PIN)
 */
function handleIssueCabangDraftNoLap(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan.');
  }

  const cabang = (data.cabang || data.namaCabang || 'Bandung').toString().trim();
  const KODE_CABANG_MAP = {
    'Bandung': 'BDG', 'Padang': 'PDG', 'Makassar': 'MKS', 'Palembang': 'PLB',
    'BDG': 'BDG', 'PDG': 'PDG', 'MKS': 'MKS', 'PLB': 'PLB'
  };
  const kodeCabang = KODE_CABANG_MAP[cabang] || 'BDG';

  const now = new Date();
  const thn = Utilities.formatDate(now, "Asia/Jakarta", "yyyy");
  const bln = Utilities.formatDate(now, "Asia/Jakarta", "MM");
  const timestampStr = Utilities.formatDate(now, "Asia/Jakarta", "M/d/yyyy HH:mm:ss");

  // Hitung sequence draf cabang berjalan
  const dataRows = sheet.getDataRange().getValues();
  let countDraft = 0;
  for (let i = 1; i < dataRows.length; i++) {
    const rowNoLap = String(dataRows[i][21] || '').trim();
    if (rowNoLap.startsWith('DRAFT-NSR/' + kodeCabang)) {
      countDraft++;
    }
  }
  const seqStr = String(countDraft + 1).padStart(4, '0');
  const noDraft = 'DRAFT-NSR/' + kodeCabang + '/' + thn + '/' + bln + '/' + seqStr;

  const lastCol = Math.max(sheet.getLastColumn(), 53);
  const row = new Array(Math.max(lastCol, 53)).fill('');

  row[0]  = timestampStr;
  row[1]  = cabang;
  row[2]  = data.namaPemohon || 'Admin Cabang ' + cabang;
  row[6]  = data.namaKlien || data.pemberi_tugas_nama || '';
  row[8]  = data.alamatKlien || data.pemberi_tugas_alamat || '';
  row[13] = data.jenisObjek || data.debitur_nama || '';
  row[14] = data.lokasiObjek || data.objek_lokasi || '';
  row[16] = data.penilai || data.rekan || '';
  row[18] = data.npwp || data.pemberi_tugas_npwp || '';
  row[19] = data.noPermintaan || ('DRAFT-REQ-' + Date.now());
  row[20] = 'DRAFT KERJA (CABANG MANDIRI)';
  row[21] = noDraft;
  row[31] = '[CABANG_MANDIRI] ' + (data.catatanPemohon || 'Draf Kerja Internal Cabang');
  row[36] = data.noSpk || '';
  row[39] = data.penggunaLaporan || '';

  sheet.appendRow(row);
  const nextRow = sheet.getLastRow();

  return jsonResponse({
    success: true,
    status: 'success',
    nomorDraft: noDraft,
    kewenangan: 'CABANG_MANDIRI',
    cabang: cabang,
    rowIndex: nextRow,
    message: 'Nomor Draf Kerja Cabang ' + noDraft + ' berhasil diterbitkan.'
  });
}

/**
 * Handler Khusus Penerbitan Nomor Laporan Definitif Mandiri Cabang
 * Memverifikasi PIN Admin Cabang, Penegakan Rekan Cabang, dan Exclusivity Deni Siswandi
 * Format: [NO_URUT]/2.0160-[KODE_CBG]/[KLASIFIKASI]/[BIDANG]/[IZIN_REKAN]/1/[BULAN_ROMAWI]/[TAHUN]
 */
function handleIssueCabangDefinitiveNoLap(data) {
  const ss = SpreadsheetApp.openById(CONFIG_NOLAP.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG_NOLAP.SHEET_PENGAJUAN);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG_NOLAP.SHEET_PENGAJUAN + '" tidak ditemukan.');
  }

  const cabang = (data.cabang || data.namaCabang || 'Bandung').toString().trim();
  const pinInput = (data.pinAdmin || data.pin || '').toString().trim();

  // 1. Validasi PIN Admin Cabang (In-Memory Security)
  const PIN_ADMIN_CABANG = {
    'Bandung': 'BDG-ADM-11',
    'Padang': 'PDG-ADM-22',
    'Makassar': 'MKS-ADM-33',
    'Palembang': 'PLB-ADM-44',
    'BDG': 'BDG-ADM-11',
    'PDG': 'PDG-ADM-22',
    'MKS': 'MKS-ADM-33',
    'PLB': 'PLB-ADM-44'
  };

  const expectedPin = PIN_ADMIN_CABANG[cabang];
  if (!expectedPin || pinInput !== expectedPin) {
    return jsonResponse({
      success: false,
      status: 'error',
      code: 'INVALID_BRANCH_ADMIN_PIN',
      error: 'Otorisasi Gagal: PIN Admin Cabang untuk ' + cabang + ' salah atau tidak valid.'
    });
  }

  // 2. Konfigurasi Rekan Cabang & Exclusivity Guard
  const CABANG_CONFIG_GAS = {
    'Bandung': { kodeKemenkeu: '2.0160-04', kodeCabang: 'BDG', izin: '00581', rekan: 'Deni Siswandi, S.T., MAPPI (Cert.)' },
    'Padang': { kodeKemenkeu: '2.0160-02', kodeCabang: 'PDG', izin: 'PS.0046', rekan: 'Hernita, S.E., MAPPI (Cert.)' },
    'Makassar': { kodeKemenkeu: '2.0160-03', kodeCabang: 'MKS', izin: 'PS.0126', rekan: 'M. Amin Sade, S.T., MAPPI (Cert.)' },
    'Palembang': { kodeKemenkeu: '2.0160-05', kodeCabang: 'PLB', izin: 'PS.0249', rekan: 'Dharma Priyanto, S.T., MAPPI (Cert.)' }
  };

  const conf = CABANG_CONFIG_GAS[cabang] || CABANG_CONFIG_GAS['Bandung'];
  const penilaiReq = (data.penilai || conf.rekan).toString();

  // Nanang Rahayu strictly prohibited in Cabang Mandiri
  if (penilaiReq.toLowerCase().includes('nanang rahayu')) {
    return jsonResponse({
      success: false,
      status: 'error',
      code: 'FORBIDDEN_PARTNER_SIGNER',
      error: 'Pelanggaran Kewenangan: Ir. Nanang Rahayu hanya berwenang menandatangani laporan Kantor Pusat (Layanan Pusat).'
    });
  }

  // Deni Siswandi Daily Single-Branch Exclusivity Rule
  const now = new Date();
  const todayStr = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  if (penilaiReq.toLowerCase().includes('deni siswandi')) {
    if (cabang !== 'Bandung' && cabang !== 'BDG') {
      return jsonResponse({
        success: false,
        status: 'error',
        code: 'DENI_SISWANDI_DAILY_BRANCH_LOCKED',
        error: 'Pelanggaran P2PK: Penilai Publik Deni Siswandi memiliki batas wilayah kerja eksklusif Cabang Bandung.'
      });
    }
    // Check if Deni Siswandi was already used by another branch today
    const dataRows = sheet.getDataRange().getValues();
    for (let i = 1; i < dataRows.length; i++) {
      const rowTimestamp = dataRows[i][0];
      const rowCabang = String(dataRows[i][1] || '').trim();
      const rowPenilai = String(dataRows[i][16] || '').toLowerCase();
      const rowStatus = String(dataRows[i][20] || '');
      if (rowStatus.toUpperCase().includes('DITOLAK') || rowStatus.toUpperCase().includes('BATAL')) continue;

      let rowDateStr = '';
      if (rowTimestamp instanceof Date) {
        rowDateStr = Utilities.formatDate(rowTimestamp, "Asia/Jakarta", "yyyy-MM-dd");
      }
      if (rowDateStr === todayStr && rowPenilai.includes('deni siswandi')) {
        const cleanRow = rowCabang.replace(/kantor|cabang/gi, '').trim().toLowerCase();
        if (cleanRow && cleanRow !== 'bandung' && cleanRow !== 'bdg') {
          return jsonResponse({
            success: false,
            status: 'error',
            code: 'DENI_SISWANDI_DAILY_BRANCH_LOCKED',
            error: 'Kewenangan Deni Siswandi untuk hari ini telah digunakan oleh ' + rowCabang + '.'
          });
        }
      }
    }
  }

  // 3. Hitung Sequence Definitif Cabang
  const dataRows = sheet.getDataRange().getValues();
  let maxSeq = 0;
  for (let i = 1; i < dataRows.length; i++) {
    const rowNoLap = String(dataRows[i][21] || '').trim();
    if (rowNoLap.includes(conf.kodeKemenkeu)) {
      const match = rowNoLap.match(/^(\d{5})\//);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  }
  const nextSeqStr = String(maxSeq + 1).padStart(5, '0');
  const thn = Utilities.formatDate(now, "Asia/Jakarta", "yyyy");
  const blnIndex = now.getMonth();
  const romawiBln = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][blnIndex] || 'X';
  const rawJasa = (data.report_service_code || data.service_classification_id || data.klasifikasi || data.jenisJasa || 'PI').toString().trim().toUpperCase();
  // P0 GUARD & SE-6/PPPK/2018: Segmen 3 HANYA PI, BS, atau PP (DILARANG PS!)
  const reportCode = (rawJasa === 'PS' || rawJasa === 'PROPERTY_SIMPLE' || rawJasa.indexOf('SEDERHANA') !== -1) ? 'PI' : ((rawJasa === 'BS' || rawJasa === 'BUSINESS') ? 'BS' : ((rawJasa === 'PP' || rawJasa === 'PERSONAL_PROPERTY') ? 'PP' : 'PI'));
  const rawSektor = (data.sektorIndustri || data.kodeIndustri || '').toString().trim();
  const cleanSektor = rawSektor.replace(/\D/g, '').padStart(2, '0');
  const numSektor = parseInt(cleanSektor, 10);
  if (!rawSektor || isNaN(numSektor) || numSektor < 1 || numSektor > 12) {
    return { status: 'error', success: false, error: 'VALIDASI GAGAL: Kode Industri Kemenkeu wajib dipilih dan valid (01–12).' };
  }
  const sektor = cleanSektor;
  const rawNpwp = (data.npwp || data.pemberi_tugas_npwp || data.klien_npwp || data.kodeNpwp || '').toString().trim();
  const cleanNpwp = rawNpwp.replace(/\D/g, '');
  const kodeNpwp = (cleanNpwp.length >= 10 || data.statusNpwp === '1' || data.kodeNpwp === '1') ? '1' : '0';

  // 7 Segmen Format Resmi: 00045/2.0160-04/PI/07/00581/1/X/2026 (Segmen 6 dinamis 1/0)
  const noDefinitif = `${nextSeqStr}/${conf.kodeKemenkeu}/${reportCode}/${sektor}/${conf.izin}/${kodeNpwp}/${romawiBln}/${thn}`;

  // 4. Catat ke sheet PENGAJUAN
  const lastCol = Math.max(sheet.getLastColumn(), 53);
  const row = new Array(Math.max(lastCol, 53)).fill('');
  const timestampStr = Utilities.formatDate(now, "Asia/Jakarta", "M/d/yyyy HH:mm:ss");

  row[0]  = timestampStr;
  row[1]  = cabang;
  row[2]  = data.namaPemohon || 'Admin Cabang ' + cabang;
  row[6]  = data.namaKlien || data.pemberi_tugas_nama || '';
  row[8]  = data.alamatKlien || data.pemberi_tugas_alamat || '';
  row[11] = klasifikasi;
  row[13] = data.jenisObjek || data.debitur_nama || '';
  row[14] = data.lokasiObjek || data.objek_lokasi || '';
  row[16] = conf.rekan;
  row[17] = sektor;
  row[18] = data.npwp || data.pemberi_tugas_npwp || '';
  row[19] = data.noPermintaan || ('DEF-REQ-' + Date.now());
  row[20] = 'NOMOR DITERBITKAN';
  row[21] = noDefinitif;
  row[22] = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  row[31] = '[CABANG_MANDIRI] ' + (data.catatanPemohon || 'Penerbitan Definitif Mandiri Cabang');
  row[36] = data.noSpk || '';
  row[39] = data.penggunaLaporan || '';

  sheet.appendRow(row);
  const nextRow = sheet.getLastRow();

  return jsonResponse({
    success: true,
    status: 'success',
    nomorDefinitif: noDefinitif,
    kewenangan: 'CABANG_MANDIRI',
    penilai: conf.rekan,
    cabang: cabang,
    rowIndex: nextRow,
    message: 'Nomor Laporan Definitif Cabang ' + noDefinitif + ' berhasil diterbitkan.'
  });
}

/**
 * Helper Pembungkus Respon JSON dengan Header Standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
