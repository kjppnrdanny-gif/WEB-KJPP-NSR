/**
 * ============================================================================
 * MODUL BACKEND GOOGLE APPS SCRIPT: TECHNICAL REVIEW & QA AUDIT INTERLOCK
 * KJPP Nanang Rahayu Sigit Paryanto & Rekan (NSR)
 * ============================================================================
 * 
 * Petunjuk Integrasi:
 * 1. Buka Google Spreadsheet Master Ekosistem KJPP NSR.
 * 2. Masuk ke Extensions > Apps Script (Ekstensi > Apps Script).
 * 3. Salin dan tempelkan seluruh fungsi di bawah ini ke dalam file 'Code.gs'.
 * 4. Tab 'LOG_QA_AUDIT' dan 'DB_PENUGASAN_JO_NSR' dikelola secara otomatis/terpusat.
 * 5. Deploy sebagai Web App (Akses: Anyone / Siapa saja).
 * 6. Masukkan URL Web App ke konstanta GAS_QA_ENDPOINT_URL pada portal-qa-review.html.
 */

/**
 * Menyimpan hasil audit QA & menentukan status Gerbang NoLap secara atomik
 * Dilengkapi dengan LockService untuk mencegah tabrakan data (race condition)
 * antar cabang yang mengunggah draf laporan secara bersamaan.
 * 
 * @param {Object} payload - Objek audit dari portal-qa-review.html
 * @return {Object} Status eksekusi dan kondisi Gerbang NoLap
 */
function recordQAAuditLog(payload) {
  const lock = LockService.getScriptLock();
  try {
    // Tunggu maksimal 15 detik untuk mencegah tabrakan penulisan antar cabang
    lock.waitLock(15000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("LOG_QA_AUDIT");
    
    // Buat sheet otomatis dengan header standar jika belum tersedia
    if (!sheet) {
      sheet = ss.insertSheet("LOG_QA_AUDIT");
      sheet.appendRow([
        "AUDIT_ID",        // A: ID unik log
        "TIMESTAMP",       // B: Waktu eksekusi audit (WIB)
        "JO_NUMBER",       // C: Nomor Job Order
        "NAMA_DOKUMEN",    // D: Nama file gabungan PDF + Excel
        "SHA256_HASH",     // E: Sidik jari kriptografi berkas PDF
        "SKOR_MUTU",       // F: Nilai numerik (0 - 100)
        "STATUS_QA",       // G: ACCEPTABLE / NOT_ACCEPTABLE / dll.
        "TEMUAN_KRITIS",   // H: Jumlah temuan kritis (SPI 105 / #REF!)
        "TEMUAN_MAYOR",    // I: Jumlah temuan mayor
        "TEMUAN_MODERAT",  // J: Jumlah temuan moderat
        "RINGKASAN_TEMUAN",// K: JSON daftar butir temuan
        "AUDITOR_NIK",     // L: NIK / Nama eksekutor
        "GERBANG_NOLAP"    // M: TERBUKA / TERKUNCI
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
      sheet.setFrozenRows(1);
    }

    const now = new Date();
    const dateStamp = Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const auditId = `QA-${dateStamp}-${randomSuffix}`;

    const skor = Number(payload.skorMutu) || 0;
    const kritis = Number(payload.temuanKritis) || 0;
    const mayor = Number(payload.temuanMayor) || 0;
    const moderat = Number(payload.temuanModerat) || 0;

    // Aturan Interlock Gerbang NoLap: Lulus jika Skor >= 85% dan Temuan Kritis = 0 (atau Override Pimpinan Rekan)
    const isUnlocked = (skor >= 85 && kritis === 0) || payload.isOverrideAuthorized === true;
    const gateStatus = isUnlocked ? "TERBUKA" : "TERKUNCI";

    const rowData = [
      auditId,
      Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      payload.joNumber || "UNASSIGNED-JO",
      payload.namaDokumen || "-",
      payload.sha256Hash || "-",
      skor,
      payload.statusQa || "NOT_ACCEPTABLE",
      kritis,
      mayor,
      moderat,
      JSON.stringify(payload.daftarTemuan || []),
      payload.auditorName || "SYSTEM",
      gateStatus
    ];

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();

    return {
      status: "success",
      auditId: auditId,
      gateStatus: gateStatus,
      isUnlocked: isUnlocked,
      joNumber: payload.joNumber,
      sha256Hash: payload.sha256Hash,
      message: isUnlocked
        ? `Audit lolos (${skor}%). Gerbang NoLap TERBUKA untuk ${payload.joNumber}.`
        : `Audit tertahan (${skor}%). Gerbang NoLap TERKUNCI hingga cacat diperbaiki.`
    };

  } catch (err) {
    return {
      status: "error",
      message: "Gagal mencatat log audit QA: " + err.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 1. Mengambil daftar penugasan aktif dari DB_PENUGASAN_JO_NSR untuk Auto-Populate Portal QA & NoLap
 */
function getActiveJobOrdersForQA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("DB_PENUGASAN_JO_NSR");
  if (!sheet) {
    sheet = ss.getSheetByName("Data_Penugasan") || ss.getSheetByName("DATA_PENUGASAN");
  }
  if (!sheet || sheet.getLastRow() < 2) {
    return { status: "success", data: [] };
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h).trim().toUpperCase(); });

  // Pemetaan indeks kolom dinamis agar aman terhadap pergeseran kolom
  const idxJo = headers.indexOf("NO_JO") !== -1 ? headers.indexOf("NO_JO") : (headers.indexOf("ID_JO") !== -1 ? headers.indexOf("ID_JO") : 0);
  const idxKlien = headers.indexOf("PEMBERI_TUGAS") !== -1 ? headers.indexOf("PEMBERI_TUGAS") : (headers.indexOf("INSTANSI") !== -1 ? headers.indexOf("INSTANSI") : 2);
  const idxObjek = headers.indexOf("OBJEK_PENILAIAN") !== -1 ? headers.indexOf("OBJEK_PENILAIAN") : (headers.indexOf("OBJEK") !== -1 ? headers.indexOf("OBJEK") : 3);
  const idxCabang = headers.indexOf("CABANG") !== -1 ? headers.indexOf("CABANG") : (headers.indexOf("KANTOR_CABANG") !== -1 ? headers.indexOf("KANTOR_CABANG") : 4);
  const idxPenilai = headers.indexOf("PENILAI_PELAKSANA") !== -1 ? headers.indexOf("PENILAI_PELAKSANA") : (headers.indexOf("PENILAI") !== -1 ? headers.indexOf("PENILAI") : 5);
  const idxNikPenilai = headers.indexOf("NIK_PENILAI") !== -1 ? headers.indexOf("NIK_PENILAI") : (headers.indexOf("NIK") !== -1 ? headers.indexOf("NIK") : 6);
  const idxMilestone = headers.indexOf("MILESTONE_AKTIF") !== -1 ? headers.indexOf("MILESTONE_AKTIF") : (headers.indexOf("CURRENT_MILESTONE") !== -1 ? headers.indexOf("CURRENT_MILESTONE") : 7);
  const idxStatusQa = headers.indexOf("STATUS_QA") !== -1 ? headers.indexOf("STATUS_QA") : 8;

  const activeList = [];
  for (let i = 1; i < values.length; i++) {
    const noJo = String(values[i][idxJo] || "").trim();
    if (!noJo) continue;

    activeList.push({
      noJo: noJo,
      pemberiTugas: String(values[i][idxKlien] || "").trim(),
      objekPenilaian: String(values[i][idxObjek] || "").trim(),
      cabang: String(values[i][idxCabang] || "Pusat Jakarta").trim(),
      penilaiPelaksana: String(values[i][idxPenilai] || "").trim(),
      nikPenilai: String(values[i][idxNikPenilai] || "").trim(),
      milestoneAktif: String(values[i][idxMilestone] || "M-04").trim(),
      statusQa: String(values[i][idxStatusQa] || "BELUM_REVIEW").trim()
    });
  }

  return { status: "success", total: activeList.length, data: activeList.reverse() };
}

/**
 * 2. Memperbarui Status Tracking 7 Milestone (M-05 Technical Review & M-06 Gerbang NoLap) secara Atomik
 */
function updateJobOrderMilestoneFromQA(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("DB_PENUGASAN_JO_NSR");
    if (!sheet) {
      sheet = ss.getSheetByName("Data_Penugasan") || ss.getSheetByName("DATA_PENUGASAN");
    }
    if (!sheet || sheet.getLastRow() < 2) {
      return { status: "error", message: "Sheet DB_PENUGASAN_JO_NSR tidak ditemukan." };
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h).trim().toUpperCase(); });

    const idxJo = headers.indexOf("NO_JO") !== -1 ? headers.indexOf("NO_JO") : (headers.indexOf("ID_JO") !== -1 ? headers.indexOf("ID_JO") : 0);
    const idxMilestone = headers.indexOf("MILESTONE_AKTIF") !== -1 ? headers.indexOf("MILESTONE_AKTIF") : headers.indexOf("CURRENT_MILESTONE");
    const idxStatusQa = headers.indexOf("STATUS_QA");
    const idxSkorQa = headers.indexOf("SKOR_QA");
    const idxHashPdf = headers.indexOf("SHA256_FINAL");
    const idxUpdatedAt = headers.indexOf("LAST_UPDATED") !== -1 ? headers.indexOf("LAST_UPDATED") : headers.indexOf("UPDATED_AT");

    const targetJo = String(payload.joNumber || "").trim();
    const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxJo]).trim() === targetJo) {
        const rowNum = i + 1;

        // Tentukan perpindahan Milestone otomatis berdasarkan event QA
        // Event: 'UPLOADED_DRAFT' -> M-05 (Dalam Telaah SPM)
        // Event: 'REVISION_RETURNED' -> M-05 (Dikembalikan ke Penilai / Revisi)
        // Event: 'QA_APPROVED' / 'QA_OVERRIDE' -> M-06 (Lolos QA - Siap Terbit NoLap)
        // Event: 'KWITANSI_ISSUED' -> M-07 (Penagihan & Kwitansi Terbit)
        let nextMilestone = "M-05";
        if (payload.event === "QA_APPROVED" || payload.event === "QA_OVERRIDE") {
          nextMilestone = "M-06";
        } else if (payload.event === "KWITANSI_ISSUED" || payload.milestoneAktif === "M-07" || payload.event === "PAYMENT_SETTLED") {
          nextMilestone = "M-07";
        }

        if (idxMilestone !== -1) sheet.getRange(rowNum, idxMilestone + 1).setValue(nextMilestone);
        if (idxStatusQa !== -1) sheet.getRange(rowNum, idxStatusQa + 1).setValue(payload.statusQa || "IN_REVIEW");
        if (idxSkorQa !== -1 && payload.skorMutu !== undefined) sheet.getRange(rowNum, idxSkorQa + 1).setValue(payload.skorMutu);
        if (idxHashPdf !== -1 && payload.sha256Hash) sheet.getRange(rowNum, idxHashPdf + 1).setValue(payload.sha256Hash);
        if (idxUpdatedAt !== -1) sheet.getRange(rowNum, idxUpdatedAt + 1).setValue(nowStr);

        SpreadsheetApp.flush();
        return {
          status: "success",
          joNumber: targetJo,
          milestoneAktif: nextMilestone,
          statusQa: payload.statusQa,
          updatedAt: nowStr
        };
      }
    }

    return { status: "not_found", message: `Nomor JO ${targetJo} tidak ditemukan di DB_PENUGASAN_JO_NSR.` };
  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. Mengarsipkan Bundel Laporan Final, KKP Excel, dan Lembar Kendali Mutu SPM ke Google Drive
 * Struktur Folder: ARSIP_LAPORAN_NSR/[TAHUN]/[CABANG]/[NO_JO]_[NAMA_KLIEN]/
 */
function archiveFinalReportToDrive(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("DB_PENUGASAN_JO_NSR");
    if (!sheet) {
      sheet = ss.getSheetByName("Data_Penugasan") || ss.getSheetByName("DATA_PENUGASAN");
    }

    const joNumber = String(payload.joNumber || payload.noJo || "").trim();
    if (!joNumber) {
      return { status: "error", message: "Nomor JO (joNumber) wajib diisi." };
    }

    const tahun = String(payload.tahun || new Date().getFullYear()).trim();
    const cabang = String(payload.cabang || "Pusat Jakarta").trim().replace(/[\/\\:*?"<>|]/g, "_");
    const namaKlien = String(payload.namaKlien || payload.pemberiTugas || "Klien").trim().replace(/[\/\\:*?"<>|]/g, "_").substring(0, 50);
    const cleanJo = joNumber.replace(/[\/\\:*?"<>|]/g, "_");
    const noLap = String(payload.noLap || payload.nomorLaporan || "").trim();

    // 1. Dapatkan atau buat Folder Induk ARSIP_LAPORAN_NSR
    let rootFolders = DriveApp.getFoldersByName("ARSIP_LAPORAN_NSR");
    let rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder("ARSIP_LAPORAN_NSR");

    // 2. Subfolder Tahun
    let yearFolders = rootFolder.getFoldersByName(tahun);
    let yearFolder = yearFolders.hasNext() ? yearFolders.next() : rootFolder.createFolder(tahun);

    // 3. Subfolder Cabang
    let branchFolders = yearFolder.getFoldersByName(cabang);
    let branchFolder = branchFolders.hasNext() ? branchFolders.next() : yearFolder.createFolder(cabang);

    // 4. Folder Spesifik Penugasan: [NO_JO]_[NAMA_KLIEN]
    const targetFolderName = `${cleanJo}_${namaKlien}`;
    let jobFolders = branchFolder.getFoldersByName(targetFolderName);
    let jobFolder = jobFolders.hasNext() ? jobFolders.next() : branchFolder.createFolder(targetFolderName);

    let savedFilesCount = 0;

    // 5. Simpan file jika dilampirkan dalam payload (base64 blob)
    if (payload.files && Array.isArray(payload.files)) {
      payload.files.forEach(function(f) {
        if (f.name && f.base64) {
          const contentType = f.type || "application/pdf";
          const decoded = Utilities.base64Decode(f.base64);
          const blob = Utilities.newBlob(decoded, contentType, f.name);
          jobFolder.createFile(blob);
          savedFilesCount++;
        }
      });
    }

    // Buat berkas manifest / Lembar Bukti Arsip Final
    const manifestContent = JSON.stringify({
      nomorJo: joNumber,
      nomorLaporanResmi: noLap,
      klien: namaKlien,
      cabang: cabang,
      tahun: tahun,
      tanggalArsip: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      arsipOleh: payload.arsipOleh || "Sistem Kendali Mutu SPM KJPP NSR",
      statusQa: payload.statusQa || "Lolos Uji Mutu (M-06)",
      sha256Hash: payload.sha256Hash || "",
      catatan: payload.catatan || "Arsip digital bundel laporan penilaian & kertas kerja tervalidasi."
    }, null, 2);

    jobFolder.createFile(`MANIFEST_ARSIP_${cleanJo}.json`, manifestContent, MimeType.PLAIN_TEXT);
    savedFilesCount++;

    const folderUrl = jobFolder.getUrl();
    const folderId = jobFolder.getId();
    const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    // 6. Catat URL Folder ke Kolom LINK_ARSIP_GDRIVE di DB_PENUGASAN_JO_NSR
    if (sheet && sheet.getLastRow() >= 2) {
      const values = sheet.getDataRange().getValues();
      const headers = values[0].map(function(h) { return String(h).trim().toUpperCase(); });

      const idxJo = headers.indexOf("NO_JO") !== -1 ? headers.indexOf("NO_JO") : (headers.indexOf("ID_JO") !== -1 ? headers.indexOf("ID_JO") : 0);
      let idxLinkDrive = headers.indexOf("LINK_ARSIP_GDRIVE");
      if (idxLinkDrive === -1) {
        idxLinkDrive = headers.indexOf("LINK_FOLDER_DRIVE") !== -1 ? headers.indexOf("LINK_FOLDER_DRIVE") : headers.indexOf("DRIVE_FOLDER_URL");
      }
      if (idxLinkDrive === -1) {
        const lastCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, lastCol).setValue("LINK_ARSIP_GDRIVE");
        idxLinkDrive = lastCol - 1;
      }

      let idxStatusArsip = headers.indexOf("STATUS_ARSIP");
      if (idxStatusArsip === -1) {
        const lastCol2 = sheet.getLastColumn() + 1;
        sheet.getRange(1, lastCol2).setValue("STATUS_ARSIP");
        idxStatusArsip = lastCol2 - 1;
      }

      const idxUpdatedAt = headers.indexOf("LAST_UPDATED") !== -1 ? headers.indexOf("LAST_UPDATED") : headers.indexOf("UPDATED_AT");

      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idxJo]).trim() === joNumber) {
          const rowNum = i + 1;
          sheet.getRange(rowNum, idxLinkDrive + 1).setValue(folderUrl);
          sheet.getRange(rowNum, idxStatusArsip + 1).setValue("TERARSIP");
          if (idxUpdatedAt !== -1) sheet.getRange(rowNum, idxUpdatedAt + 1).setValue(nowStr);
          break;
        }
      }
      SpreadsheetApp.flush();
    }

    return {
      status: "success",
      joNumber: joNumber,
      noLap: noLap,
      folderUrl: folderUrl,
      folderId: folderId,
      folderPath: `ARSIP_LAPORAN_NSR/${tahun}/${cabang}/${targetFolderName}`,
      savedFilesCount: savedFilesCount,
      archivedAt: nowStr
    };

  } catch (err) {
    return { status: "error", message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 4. Memvalidasi Kelayakan Penugasan untuk Penerbitan Kwitansi Pelunasan
 * Memastikan penugasan telah lulus QA (M-06) dan memiliki Nomor Laporan Resmi
 */
function getEligibleJobsForKwitansi(joNumber) {
  const cleanJo = String(joNumber || "").trim();
  if (!cleanJo) {
    return { status: "error", eligible: false, message: "Nomor Job Order (JO) wajib diberikan." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("DB_PENUGASAN_JO_NSR");
  if (!sheet) {
    sheet = ss.getSheetByName("Data_Penugasan") || ss.getSheetByName("DATA_PENUGASAN");
  }

  let jobFound = null;

  if (sheet && sheet.getLastRow() >= 2) {
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h).trim().toUpperCase(); });

    const idxJo = headers.indexOf("NO_JO") !== -1 ? headers.indexOf("NO_JO") : (headers.indexOf("ID_JO") !== -1 ? headers.indexOf("ID_JO") : 0);
    const idxKlien = headers.indexOf("PEMBERI_TUGAS") !== -1 ? headers.indexOf("PEMBERI_TUGAS") : (headers.indexOf("INSTANSI") !== -1 ? headers.indexOf("INSTANSI") : 2);
    const idxObjek = headers.indexOf("OBJEK_PENILAIAN") !== -1 ? headers.indexOf("OBJEK_PENILAIAN") : (headers.indexOf("OBJEK") !== -1 ? headers.indexOf("OBJEK") : 3);
    const idxNoLap = headers.indexOf("NOMOR_LAPORAN") !== -1 ? headers.indexOf("NOMOR_LAPORAN") : (headers.indexOf("NO_LAP") !== -1 ? headers.indexOf("NO_LAP") : headers.indexOf("NO_LAPORAN"));
    const idxTglLap = headers.indexOf("TANGGAL_LAPORAN") !== -1 ? headers.indexOf("TANGGAL_LAPORAN") : headers.indexOf("TGL_LAPORAN");
    const idxMilestone = headers.indexOf("MILESTONE_AKTIF") !== -1 ? headers.indexOf("MILESTONE_AKTIF") : headers.indexOf("CURRENT_MILESTONE");
    const idxStatusQa = headers.indexOf("STATUS_QA");
    const idxFee = headers.indexOf("FEE_PENILAIAN") !== -1 ? headers.indexOf("FEE_PENILAIAN") : (headers.indexOf("NILAI_KONTRAK") !== -1 ? headers.indexOf("NILAI_KONTRAK") : headers.indexOf("DPP"));

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idxJo]).trim() === cleanJo) {
        jobFound = {
          noJo: cleanJo,
          pemberiTugas: String(values[i][idxKlien] || "").trim(),
          objekPenilaian: String(values[i][idxObjek] || "").trim(),
          nomorLaporan: idxNoLap !== -1 ? String(values[i][idxNoLap] || "").trim() : "",
          tanggalLaporan: idxTglLap !== -1 ? String(values[i][idxTglLap] || "").trim() : "",
          milestoneAktif: idxMilestone !== -1 ? String(values[i][idxMilestone] || "").trim() : "M-05",
          statusQa: idxStatusQa !== -1 ? String(values[i][idxStatusQa] || "").trim() : "",
          feePenilaian: idxFee !== -1 ? Number(values[i][idxFee] || 0) : 0
        };
        break;
      }
    }
  }

  // Jika tidak ditemukan di sheet penugasan, periksa tab LOG_QA_AUDIT
  if (!jobFound) {
    const sheetQa = ss.getSheetByName("LOG_QA_AUDIT");
    if (sheetQa && sheetQa.getLastRow() >= 2) {
      const qaVals = sheetQa.getDataRange().getValues();
      for (let i = qaVals.length - 1; i >= 1; i--) {
        if (String(qaVals[i][2]).trim() === cleanJo) {
          jobFound = {
            noJo: cleanJo,
            pemberiTugas: "PT Bank Tabungan Negara (Persero) Tbk",
            objekPenilaian: String(qaVals[i][3] || ""),
            nomorLaporan: "",
            tanggalLaporan: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
            milestoneAktif: qaVals[i][12] === "TERBUKA" ? "M-06" : "M-05",
            statusQa: String(qaVals[i][6] || "")
          };
          break;
        }
      }
    }
  }

  if (!jobFound) {
    return {
      status: "not_found",
      eligible: false,
      message: `Nomor Job Order ${cleanJo} tidak ditemukan dalam database.`
    };
  }

  const hasNoLap = Boolean(jobFound.nomorLaporan && jobFound.nomorLaporan.length > 5);

  if (hasNoLap) {
    return {
      status: "success",
      eligible: true,
      joNumber: cleanJo,
      nomorLaporan: jobFound.nomorLaporan,
      tanggalLaporan: jobFound.tanggalLaporan || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
      pemberiTugas: jobFound.pemberiTugas,
      objekPenilaian: jobFound.objekPenilaian,
      feePenilaian: jobFound.feePenilaian,
      statusQa: jobFound.statusQa,
      milestoneAktif: jobFound.milestoneAktif
    };
  } else {
    return {
      status: "warning",
      eligible: false,
      message: `Nomor Laporan resmi belum terbit untuk JO ${cleanJo}. Kwitansi pelunasan diblokir hingga NoLap diterbitkan (M-06).`,
      joNumber: cleanJo,
      pemberiTugas: jobFound.pemberiTugas,
      objekPenilaian: jobFound.objekPenilaian,
      statusQa: jobFound.statusQa,
      milestoneAktif: jobFound.milestoneAktif
    };
  }
}

/**
 * Pengecekan status Gerbang NoLap berdasarkan JO Number atau SHA-256 Hash
 */
function checkNoLapGateStatus(identifier) {
  if (!identifier) return { status: "not_found", gateStatus: "TERKUNCI" };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("LOG_QA_AUDIT");
  if (!sheet) return { status: "not_found", gateStatus: "TERKUNCI" };

  const data = sheet.getDataRange().getValues();
  // Cari dari baris terbawah (terbaru)
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const jo = String(row[2]);
    const hash = String(row[4]);
    if (jo === identifier || hash === identifier || hash.startsWith(identifier)) {
      return {
        status: "found",
        auditId: row[0],
        timestamp: row[1],
        joNumber: jo,
        namaDokumen: row[3],
        sha256Hash: hash,
        skorMutu: row[5],
        statusQa: row[6],
        gateStatus: row[12]
      };
    }
  }
  return { status: "not_found", gateStatus: "TERKUNCI" };
}

/**
 * Endpoint HTTP POST (terintegrasi dengan doPost utama ekosistem KJPP NSR)
 */
function handleQAAuditPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "SAVE_QA_AUDIT") {
      const result = recordQAAuditLog(data.payload);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "GET_ACTIVE_JO_QA") {
      const result = getActiveJobOrdersForQA();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "UPDATE_JO_MILESTONE_QA") {
      const result = updateJobOrderMilestoneFromQA(data.payload);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "CHECK_GATE_STATUS") {
      const result = checkNoLapGateStatus(data.identifier || data.joNumber || data.sha256Hash);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "ARCHIVE_FINAL_GDRIVE") {
      const result = archiveFinalReportToDrive(data.payload || data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "VERIFY_KWITANSI_ELIGIBILITY") {
      const result = getEligibleJobsForKwitansi(data.joNumber || data.noJo || data.jo);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aksi tidak dikenal" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return handleQAAuditPost(e);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "GET_ACTIVE_JO_QA";
  if (action === "GET_ACTIVE_JO_QA") {
    const result = getActiveJobOrdersForQA();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "CHECK_GATE_STATUS") {
    const id = e.parameter.identifier || e.parameter.joNumber || e.parameter.sha256Hash;
    const result = checkNoLapGateStatus(id);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "VERIFY_KWITANSI_ELIGIBILITY") {
    const id = e.parameter.identifier || e.parameter.joNumber || e.parameter.noJo || e.parameter.jo;
    const result = getEligibleJobsForKwitansi(id);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "GAS QA Audit Endpoint Ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}
