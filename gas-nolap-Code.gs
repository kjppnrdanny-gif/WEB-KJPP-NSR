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
  SHEET_TOKEN: 'MASTER_TOKEN'
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

  // Cari index kolom (1-indexed) atau fallback ke nomor kolom standar (51, 52, 53)
  let colIndexLaporan = headers.indexOf('File Laporan Penilaian') + 1;
  let colIndexPembanding = headers.indexOf('File Data Pembanding') + 1;
  let colIndexBai = headers.indexOf('File Berita Acara Inspeksi') + 1;

  if (colIndexLaporan <= 0) colIndexLaporan = 51;     // Kolom AY
  if (colIndexPembanding <= 0) colIndexPembanding = 52; // Kolom AZ
  if (colIndexBai <= 0) colIndexBai = 53;               // Kolom BA

  // Format Catatan Pemohon & Parameter Yuridis Pengadaan Tanah
  let catatanPemohon = (data.catatanPemohon || '').toString().trim();
  if (data.catatanYuridisTanah && !catatanPemohon.includes(data.catatanYuridisTanah)) {
    catatanPemohon = (catatanPemohon ? (catatanPemohon + ' | ') : '') + data.catatanYuridisTanah;
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
  row[11] = data.klasifikasiJasa || data.klasifikasiObjek || ''; // 12 (L): Klasifikasi Objek
  row[12] = data.tujuanPenilaian || '';                     // 13 (M): Tujuan Penilaian
  row[13] = data.jenisObjek || '';                          // 14 (N): Jenis Objek
  row[14] = data.lokasiObjek || '';                         // 15 (O): Lokasi Objek
  row[15] = data.deadline || data.deadlineLaporan || '';    // 16 (P): Deadline Laporan
  row[16] = data.penilai || data.namaPenandatangan || '';   // 17 (Q): Nama Penandatangan
  row[17] = data.kodeIndustri || '';                        // 18 (R): Kode Industri
  row[18] = data.npwp || data.nikKtp || '';                 // 19 (S): NPWP (NPWP Badan / NIK 16 Digit)
  row[19] = data.noPermintaan || '';                        // 20 (T): No Permintaan

  // Kolom 21 - 34 (Status Operasional & ELSA)
  row[20] = data.status || 'DIAJUKAN';                      // 21 (U): Status
  row[21] = data.nomorLaporan || '';                        // 22 (V): Nomor Laporan
  row[22] = data.tglTerbit || '';                           // 23 (W): Tanggal Terbit
  row[23] = data.statusElsa || 'BELUM INPUT';               // 24 (X): Status ELSA
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
 * Helper Pembungkus Respon JSON dengan Header Standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
