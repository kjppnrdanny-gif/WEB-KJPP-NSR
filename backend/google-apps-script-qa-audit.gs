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
 * 4. Tab 'LOG_QA_AUDIT' akan dibuat otomatis jika belum ada.
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
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aksi tidak dikenal" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
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
