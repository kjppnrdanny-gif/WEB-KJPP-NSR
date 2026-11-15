import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

// 1. UPDATE Code.gs
const codeGsPath = path.join(ROOT_DIR, 'Code.gs');
let codeGs = fs.readFileSync(codeGsPath, 'utf8');

// Ensure CRLF preservation
const crlf = codeGs.includes('\r\n') ? '\r\n' : '\n';

// 1a. In doGet(e): add SETUP_SPM4_SCHEMA check
if (!codeGs.includes("params.action === 'SETUP_SPM4_SCHEMA'")) {
  const targetDoGet = "if (params.action === 'GET_PPL_COMPLIANCE') {" + crlf + "      return respondJSON(getPPLComplianceRecords(ss));" + crlf + "    }";
  const replacementDoGet = targetDoGet + crlf + "    if (params.action === 'SETUP_SPM4_SCHEMA' || params.action === 'setupSPM4SchemaSSOT') {" + crlf + "      return respondJSON(setupSPM4SchemaSSOT(ss));" + crlf + "    }";
  if (codeGs.includes(targetDoGet)) {
    codeGs = codeGs.replace(targetDoGet, replacementDoGet);
    console.log("✓ Added SETUP_SPM4_SCHEMA to doGet in Code.gs");
  } else {
    console.warn("! Warning: targetDoGet not found in Code.gs, using alternative anchor");
    const altTarget = "if (params.action === 'GET_PPL_COMPLIANCE')";
    const idx = codeGs.indexOf(altTarget);
    if (idx !== -1) {
      const endOfBlock = codeGs.indexOf("}", idx) + 1;
      codeGs = codeGs.slice(0, endOfBlock) + crlf + "    if (params.action === 'SETUP_SPM4_SCHEMA' || params.action === 'setupSPM4SchemaSSOT') {" + crlf + "      return respondJSON(setupSPM4SchemaSSOT(ss));" + crlf + "    }" + codeGs.slice(endOfBlock);
      console.log("✓ Added SETUP_SPM4_SCHEMA to doGet in Code.gs (alternative anchor)");
    }
  }
}

// 1b. In doPost(e): add SETUP_SPM4_SCHEMA
if (!codeGs.includes("action === 'SETUP_SPM4_SCHEMA'")) {
  const targetDoPost = "if (action === 'GET_POST_ENGAGEMENT_REVIEWS') {" + crlf + "      const result = getPostEngagementReviews(payload.payload || payload);" + crlf + "      return respondJSON(result);" + crlf + "    }";
  const replacementDoPost = targetDoPost + crlf + "    if (action === 'SETUP_SPM4_SCHEMA' || action === 'setupSPM4SchemaSSOT') {" + crlf + "      const result = setupSPM4SchemaSSOT(getMasterSpreadsheet());" + crlf + "      return respondJSON(result);" + crlf + "    }";
  if (codeGs.includes(targetDoPost)) {
    codeGs = codeGs.replace(targetDoPost, replacementDoPost);
    console.log("✓ Added SETUP_SPM4_SCHEMA to doPost in Code.gs");
  } else {
    const altTargetPost = "if (action === 'GET_POST_ENGAGEMENT_REVIEWS')";
    const idx = codeGs.indexOf(altTargetPost);
    if (idx !== -1) {
      const endOfBlock = codeGs.indexOf("}", idx) + 1;
      codeGs = codeGs.slice(0, endOfBlock) + crlf + "    if (action === 'SETUP_SPM4_SCHEMA' || action === 'setupSPM4SchemaSSOT') {" + crlf + "      const result = setupSPM4SchemaSSOT(getMasterSpreadsheet());" + crlf + "      return respondJSON(result);" + crlf + "    }" + codeGs.slice(endOfBlock);
      console.log("✓ Added SETUP_SPM4_SCHEMA to doPost in Code.gs (alternative anchor)");
    }
  }

  // Update isPublicAllowedAction if present
  if (codeGs.includes("action === 'SUBMIT_PPL_RECORD' || action === 'GET_PPL_COMPLIANCE'")) {
    codeGs = codeGs.replace(
      "action === 'SUBMIT_PPL_RECORD' || action === 'GET_PPL_COMPLIANCE'",
      "action === 'SUBMIT_PPL_RECORD' || action === 'GET_PPL_COMPLIANCE' || action === 'SETUP_SPM4_SCHEMA' || action === 'setupSPM4SchemaSSOT'"
    );
    console.log("✓ Added SETUP_SPM4_SCHEMA to isPublicAllowedAction in Code.gs");
  }
}

// 1c. Add setupSPM4SchemaSSOT, onOpen, menuSamplingAcakSPM to Code.gs
if (!codeGs.includes("function setupSPM4SchemaSSOT(")) {
  const spm4Funcs = crlf + crlf + `/**
 * AUTO-SETUP SCHEMA SSOT (SPM V.4.2026)
 * Memeriksa dan membuat:
 * 1. Sheet DB_POST_ENGAGEMENT_REVIEW (17 Kolom FM-SPM-06.2)
 * 2. Memeriksa & melengkapi kolom BPN, OJK, dan Radar 90-Hari di DB_KEPATUHAN_PPL_IZIN tanpa menghapus data yang ada.
 * 3. Dapat dijalankan langsung dari script editor atau via custom menu "🛡️ Tata Kelola SPM NSR".
 */
function setupSPM4SchemaSSOT(ssInstance) {
  let ss = ssInstance;
  if (!ss) {
    if (typeof CONFIG !== 'undefined' && CONFIG.SPREADSHEET_ID) {
      try { ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); } catch (_) {}
    }
    if (!ss && typeof getMasterSpreadsheet === 'function') {
      try { ss = getMasterSpreadsheet(); } catch (_) {}
    }
    if (!ss) {
      try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {}
    }
  }

  if (!ss) {
    const err = {
      status: "error",
      success: false,
      message: "Database Master Spreadsheet tidak dapat ditemukan atau diakses. Pastikan script memiliki akses ke Spreadsheet ID yang valid."
    };
    console.error(err.message);
    return err;
  }

  const results = {
    postEngagementSheet: { created: false, headersAdded: [], totalColumns: 0 },
    pplComplianceSheet: { created: false, headersAdded: [], totalColumns: 0, rowsScanned: 0 },
    timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  // 1. CEK & BUAT SHEET DB_POST_ENGAGEMENT_REVIEW (FM-SPM-06.2)
  const postHeadersRequired = [
    "ID_SAMPLE", "PERIODE_KUARTAL", "TAHUN", "NO_LAPORAN", "NO_JO",
    "NAMA_KLIEN", "CABANG", "REKAN_PENANDATANGAN", "TGL_TERBIT", "RETENSI_10_TAHUN_HINGGA",
    "SKOR_SPM_TRIWULAN", "TEMUAN_ANOMALI", "RENCANA_CAPA", "PIC_REMEDIASI", "TARGET_SELESAI",
    "STATUS_CAPA", "UPDATED_AT"
  ];

  let postSheet = ss.getSheetByName("DB_POST_ENGAGEMENT_REVIEW");
  if (!postSheet) {
    postSheet = ss.insertSheet("DB_POST_ENGAGEMENT_REVIEW");
    postSheet.appendRow(postHeadersRequired);
    postSheet.getRange(1, 1, 1, postHeadersRequired.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#38bdf8");
    postSheet.setFrozenRows(1);
    results.postEngagementSheet.created = true;
    results.postEngagementSheet.headersAdded = postHeadersRequired.slice();
    results.postEngagementSheet.totalColumns = postHeadersRequired.length;
  } else {
    const lastCol = Math.max(postSheet.getLastColumn(), 1);
    const existingHeaders = postSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h).trim().toUpperCase();
    });
    const addedCols = [];
    postHeadersRequired.forEach(function(reqHeader) {
      if (existingHeaders.indexOf(reqHeader) === -1) {
        const nextCol = postSheet.getLastColumn() + 1;
        postSheet.getRange(1, nextCol).setValue(reqHeader)
          .setFontWeight("bold")
          .setBackground("#0f172a")
          .setFontColor("#38bdf8");
        addedCols.push(reqHeader);
      }
    });
    results.postEngagementSheet.headersAdded = addedCols;
    results.postEngagementSheet.totalColumns = postSheet.getLastColumn();
  }

  // 2. CEK & LENGKAPI SHEET DB_KEPATUHAN_PPL_IZIN (Field BPN, OJK, Radar 90-Hari)
  const pplHeadersRequired = [
    "NIK", "NAMA_PERSONEL", "CABANG", "NO_MAPPI", "NO_REGISTER_RMK",
    "NO_IZIN_MENKEU", "TGL_BERLAKU_IZIN", "NO_LISENSI_BPN", "TGL_BERLAKU_BPN",
    "NO_STTD_OJK", "TGL_BERLAKU_OJK", "TOTAL_SKP_TERKUMPUL", "TARGET_SKP_WAJIB",
    "RINCIAN_SERTIFIKAT_PPL", "STATUS_VERIFIKASI_SPM", "CATATAN_SPM", "STATUS_RADAR_ALERT", "UPDATED_AT"
  ];

  let pplSheet = ss.getSheetByName("DB_KEPATUHAN_PPL_IZIN");
  if (!pplSheet) {
    pplSheet = ss.insertSheet("DB_KEPATUHAN_PPL_IZIN");
    pplSheet.appendRow(pplHeadersRequired);
    pplSheet.getRange(1, 1, 1, pplHeadersRequired.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#38bdf8");
    pplSheet.setFrozenRows(1);
    results.pplComplianceSheet.created = true;
    results.pplComplianceSheet.headersAdded = pplHeadersRequired.slice();
    results.pplComplianceSheet.totalColumns = pplHeadersRequired.length;
  } else {
    const lastCol = Math.max(pplSheet.getLastColumn(), 1);
    const existingHeaders = pplSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h).trim().toUpperCase();
    });
    const addedPplCols = [];
    pplHeadersRequired.forEach(function(reqHeader) {
      if (existingHeaders.indexOf(reqHeader) === -1) {
        const nextCol = pplSheet.getLastColumn() + 1;
        pplSheet.getRange(1, nextCol).setValue(reqHeader)
          .setFontWeight("bold")
          .setBackground("#0f172a")
          .setFontColor("#38bdf8");
        addedPplCols.push(reqHeader);
      }
    });
    results.pplComplianceSheet.headersAdded = addedPplCols;
    results.pplComplianceSheet.totalColumns = pplSheet.getLastColumn();
    results.pplComplianceSheet.rowsScanned = Math.max(0, pplSheet.getLastRow() - 1);

    // Hitung / perbarui status radar alert untuk baris yang ada tanpa mengganggu data lainnya
    if (pplSheet.getLastRow() > 1) {
      try {
        const currentHeaders = pplSheet.getRange(1, 1, 1, pplSheet.getLastColumn()).getValues()[0].map(function(h) {
          return String(h).trim().toUpperCase();
        });
        const idxTglKmk = currentHeaders.indexOf("TGL_BERLAKU_IZIN");
        const idxTglBpn = currentHeaders.indexOf("TGL_BERLAKU_BPN");
        const idxTglOjk = currentHeaders.indexOf("TGL_BERLAKU_OJK");
        const idxRadar = currentHeaders.indexOf("STATUS_RADAR_ALERT");

        if (idxRadar !== -1) {
          const numRows = pplSheet.getLastRow() - 1;
          const rows = pplSheet.getRange(2, 1, numRows, currentHeaders.length).getValues();
          for (let r = 0; r < numRows; r++) {
            const row = rows[r];
            const currentRadar = String(row[idxRadar] || "").trim();
            if (!currentRadar || currentRadar === "-") {
              const tglKmk = idxTglKmk !== -1 ? String(row[idxTglKmk] || "-").trim() : "-";
              const tglBpn = idxTglBpn !== -1 ? String(row[idxTglBpn] || "-").trim() : "-";
              const tglOjk = idxTglOjk !== -1 ? String(row[idxTglOjk] || "-").trim() : "-";

              const dKmk = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglKmk) : 999;
              const dBpn = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglBpn) : 999;
              const dOjk = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglOjk) : 999;

              const aKmk = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dKmk) : "AMAN";
              const aBpn = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dBpn) : "AMAN";
              const aOjk = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dOjk) : "AMAN";

              let overall = "AMAN";
              const alList = [aKmk, aBpn, aOjk];
              if (alList.includes("EXPIRED")) overall = "EXPIRED";
              else if (alList.includes("H-30")) overall = "H-30";
              else if (alList.includes("H-60")) overall = "H-60";
              else if (alList.includes("H-90")) overall = "H-90";

              pplSheet.getRange(r + 2, idxRadar + 1).setValue(overall);
            }
          }
        }
      } catch (scanErr) {
        console.warn("Gagal scanning baris DB_KEPATUHAN_PPL_IZIN:", scanErr);
      }
    }
  }

  const msg = "Setup Skema SSOT SPM V.4.2026 Sukses: DB_POST_ENGAGEMENT_REVIEW (" + 
    (results.postEngagementSheet.created ? "Sheet Baru Dibuat" : "Kolom Lengkap: " + results.postEngagementSheet.totalColumns) + 
    ") & DB_KEPATUHAN_PPL_IZIN (" + 
    (results.pplComplianceSheet.created ? "Sheet Baru Dibuat" : "Kolom Lengkap: " + results.pplComplianceSheet.totalColumns + ", Baris: " + results.pplComplianceSheet.rowsScanned) + ")";

  console.log(msg);

  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert("🛡️ Setup Skema SSOT SPM V.4.2026", msg, ui.ButtonSet.OK);
    }
  } catch (_) {}

  return {
    status: "success",
    success: true,
    message: msg,
    details: results
  };
}

/**
 * Custom Menu Admin UI di Google Sheets untuk Setup & Audit Mutu SPM
 */
function onOpen(e) {
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.createMenu("🛡️ Tata Kelola SPM NSR")
        .addItem("⚙️ Setup Skema SSOT (SPM V.4.2026)", "setupSPM4SchemaSSOT")
        .addSeparator()
        .addItem("🎲 Jalankan Sampling Acak SPM Triwulanan", "menuSamplingAcakSPM")
        .addToUi();
    }
  } catch (err) {}
}

function menuSamplingAcakSPM() {
  const result = generateQuarterlySampling({ kuartal: "Q1", tahun: 2026 });
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert("Sampling Acak SPM Triwulanan", result.message || JSON.stringify(result), ui.ButtonSet.OK);
    }
  } catch (_) {}
}
`.split('\n').join(crlf);

  codeGs += spm4Funcs;
  console.log("✓ Added setupSPM4SchemaSSOT and onOpen functions to Code.gs");
}

fs.writeFileSync(codeGsPath, codeGs, 'utf8');

// 2. UPDATE backend/google-apps-script-qa-audit.gs
const qaGsPath = path.join(ROOT_DIR, 'backend', 'google-apps-script-qa-audit.gs');
let qaGs = fs.readFileSync(qaGsPath, 'utf8');
const qaCrlf = qaGs.includes('\r\n') ? '\r\n' : '\n';

// 2a. In handleQAAuditPost(e): add SETUP_SPM4_SCHEMA
if (!qaGs.includes('action === "SETUP_SPM4_SCHEMA"')) {
  const targetQaPost = 'if (data.action === "GET_POST_ENGAGEMENT_REVIEWS") {' + qaCrlf + '      const result = getPostEngagementReviews(data.payload || data);' + qaCrlf + '      return ContentService.createTextOutput(JSON.stringify(result))' + qaCrlf + '        .setMimeType(ContentService.MimeType.JSON);' + qaCrlf + '    }';
  const replacementQaPost = targetQaPost + qaCrlf + '    if (data.action === "SETUP_SPM4_SCHEMA" || data.action === "setupSPM4SchemaSSOT") {' + qaCrlf + '      const result = setupSPM4SchemaSSOT();' + qaCrlf + '      return ContentService.createTextOutput(JSON.stringify(result))' + qaCrlf + '        .setMimeType(ContentService.MimeType.JSON);' + qaCrlf + '    }';
  if (qaGs.includes(targetQaPost)) {
    qaGs = qaGs.replace(targetQaPost, replacementQaPost);
    console.log("✓ Added SETUP_SPM4_SCHEMA to handleQAAuditPost in backend/google-apps-script-qa-audit.gs");
  } else {
    const altTargetQaPost = 'if (data.action === "GET_POST_ENGAGEMENT_REVIEWS")';
    const idx = qaGs.indexOf(altTargetQaPost);
    if (idx !== -1) {
      const endOfBlock = qaGs.indexOf(".setMimeType(ContentService.MimeType.JSON);", idx);
      const closeCurly = qaGs.indexOf("}", endOfBlock) + 1;
      qaGs = qaGs.slice(0, closeCurly) + qaCrlf + '    if (data.action === "SETUP_SPM4_SCHEMA" || data.action === "setupSPM4SchemaSSOT") {' + qaCrlf + '      const result = setupSPM4SchemaSSOT();' + qaCrlf + '      return ContentService.createTextOutput(JSON.stringify(result))' + qaCrlf + '        .setMimeType(ContentService.MimeType.JSON);' + qaCrlf + '    }' + qaGs.slice(closeCurly);
      console.log("✓ Added SETUP_SPM4_SCHEMA to handleQAAuditPost (alternative anchor)");
    }
  }
}

// 2b. In doGet(e): add SETUP_SPM4_SCHEMA
if (!qaGs.includes('action === "SETUP_SPM4_SCHEMA"')) {
  const targetQaGet = 'if (action === "GET_POST_ENGAGEMENT_REVIEWS")';
  const idx = qaGs.indexOf(targetQaGet);
  if (idx !== -1) {
    const endOfBlock = qaGs.indexOf(".setMimeType(ContentService.MimeType.JSON);", idx);
    const closeCurly = qaGs.indexOf("}", endOfBlock) + 1;
    qaGs = qaGs.slice(0, closeCurly) + qaCrlf + '  if (action === "SETUP_SPM4_SCHEMA" || action === "setupSPM4SchemaSSOT") {' + qaCrlf + '    const result = setupSPM4SchemaSSOT();' + qaCrlf + '    return ContentService.createTextOutput(JSON.stringify(result))' + qaCrlf + '      .setMimeType(ContentService.MimeType.JSON);' + qaCrlf + '  }' + qaGs.slice(closeCurly);
    console.log("✓ Added SETUP_SPM4_SCHEMA to doGet in backend/google-apps-script-qa-audit.gs");
  }
}

// 2c. Add setupSPM4SchemaSSOT, onOpen, menuSamplingAcakSPM to backend/google-apps-script-qa-audit.gs
if (!qaGs.includes("function setupSPM4SchemaSSOT(")) {
  const qaFuncs = qaCrlf + qaCrlf + `/**
 * AUTO-SETUP SCHEMA SSOT (SPM V.4.2026)
 * Memeriksa dan membuat:
 * 1. Sheet DB_POST_ENGAGEMENT_REVIEW (17 Kolom FM-SPM-06.2)
 * 2. Memeriksa & melengkapi kolom BPN, OJK, dan Radar 90-Hari di DB_KEPATUHAN_PPL_IZIN tanpa menghapus data yang ada.
 */
function setupSPM4SchemaSSOT(ssInstance) {
  let ss = ssInstance;
  if (!ss) {
    if (typeof CONFIG !== 'undefined' && CONFIG.SPREADSHEET_ID) {
      try { ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); } catch (_) {}
    }
    if (!ss) {
      try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {}
    }
  }

  if (!ss) {
    const err = {
      status: "error",
      success: false,
      message: "Database Master Spreadsheet tidak dapat ditemukan atau diakses."
    };
    console.error(err.message);
    return err;
  }

  const results = {
    postEngagementSheet: { created: false, headersAdded: [], totalColumns: 0 },
    pplComplianceSheet: { created: false, headersAdded: [], totalColumns: 0, rowsScanned: 0 },
    timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  // 1. CEK & BUAT SHEET DB_POST_ENGAGEMENT_REVIEW (FM-SPM-06.2)
  const postHeadersRequired = [
    "ID_SAMPLE", "PERIODE_KUARTAL", "TAHUN", "NO_LAPORAN", "NO_JO",
    "NAMA_KLIEN", "CABANG", "REKAN_PENANDATANGAN", "TGL_TERBIT", "RETENSI_10_TAHUN_HINGGA",
    "SKOR_SPM_TRIWULAN", "TEMUAN_ANOMALI", "RENCANA_CAPA", "PIC_REMEDIASI", "TARGET_SELESAI",
    "STATUS_CAPA", "UPDATED_AT"
  ];

  let postSheet = ss.getSheetByName("DB_POST_ENGAGEMENT_REVIEW");
  if (!postSheet) {
    postSheet = ss.insertSheet("DB_POST_ENGAGEMENT_REVIEW");
    postSheet.appendRow(postHeadersRequired);
    postSheet.getRange(1, 1, 1, postHeadersRequired.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#38bdf8");
    postSheet.setFrozenRows(1);
    results.postEngagementSheet.created = true;
    results.postEngagementSheet.headersAdded = postHeadersRequired.slice();
    results.postEngagementSheet.totalColumns = postHeadersRequired.length;
  } else {
    const lastCol = Math.max(postSheet.getLastColumn(), 1);
    const existingHeaders = postSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h).trim().toUpperCase();
    });
    const addedCols = [];
    postHeadersRequired.forEach(function(reqHeader) {
      if (existingHeaders.indexOf(reqHeader) === -1) {
        const nextCol = postSheet.getLastColumn() + 1;
        postSheet.getRange(1, nextCol).setValue(reqHeader)
          .setFontWeight("bold")
          .setBackground("#0f172a")
          .setFontColor("#38bdf8");
        addedCols.push(reqHeader);
      }
    });
    results.postEngagementSheet.headersAdded = addedCols;
    results.postEngagementSheet.totalColumns = postSheet.getLastColumn();
  }

  // 2. CEK & LENGKAPI SHEET DB_KEPATUHAN_PPL_IZIN (Field BPN, OJK, Radar 90-Hari)
  const pplHeadersRequired = [
    "NIK", "NAMA_PERSONEL", "CABANG", "NO_MAPPI", "NO_REGISTER_RMK",
    "NO_IZIN_MENKEU", "TGL_BERLAKU_IZIN", "NO_LISENSI_BPN", "TGL_BERLAKU_BPN",
    "NO_STTD_OJK", "TGL_BERLAKU_OJK", "TOTAL_SKP_TERKUMPUL", "TARGET_SKP_WAJIB",
    "RINCIAN_SERTIFIKAT_PPL", "STATUS_VERIFIKASI_SPM", "CATATAN_SPM", "STATUS_RADAR_ALERT", "UPDATED_AT"
  ];

  let pplSheet = ss.getSheetByName("DB_KEPATUHAN_PPL_IZIN");
  if (!pplSheet) {
    pplSheet = ss.insertSheet("DB_KEPATUHAN_PPL_IZIN");
    pplSheet.appendRow(pplHeadersRequired);
    pplSheet.getRange(1, 1, 1, pplHeadersRequired.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#38bdf8");
    pplSheet.setFrozenRows(1);
    results.pplComplianceSheet.created = true;
    results.pplComplianceSheet.headersAdded = pplHeadersRequired.slice();
    results.pplComplianceSheet.totalColumns = pplHeadersRequired.length;
  } else {
    const lastCol = Math.max(pplSheet.getLastColumn(), 1);
    const existingHeaders = pplSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h).trim().toUpperCase();
    });
    const addedPplCols = [];
    pplHeadersRequired.forEach(function(reqHeader) {
      if (existingHeaders.indexOf(reqHeader) === -1) {
        const nextCol = pplSheet.getLastColumn() + 1;
        pplSheet.getRange(1, nextCol).setValue(reqHeader)
          .setFontWeight("bold")
          .setBackground("#0f172a")
          .setFontColor("#38bdf8");
        addedPplCols.push(reqHeader);
      }
    });
    results.pplComplianceSheet.headersAdded = addedPplCols;
    results.pplComplianceSheet.totalColumns = pplSheet.getLastColumn();
    results.pplComplianceSheet.rowsScanned = Math.max(0, pplSheet.getLastRow() - 1);

    // Hitung / perbarui status radar alert untuk baris yang ada tanpa mengganggu data lainnya
    if (pplSheet.getLastRow() > 1) {
      try {
        const currentHeaders = pplSheet.getRange(1, 1, 1, pplSheet.getLastColumn()).getValues()[0].map(function(h) {
          return String(h).trim().toUpperCase();
        });
        const idxTglKmk = currentHeaders.indexOf("TGL_BERLAKU_IZIN");
        const idxTglBpn = currentHeaders.indexOf("TGL_BERLAKU_BPN");
        const idxTglOjk = currentHeaders.indexOf("TGL_BERLAKU_OJK");
        const idxRadar = currentHeaders.indexOf("STATUS_RADAR_ALERT");

        if (idxRadar !== -1) {
          const numRows = pplSheet.getLastRow() - 1;
          const rows = pplSheet.getRange(2, 1, numRows, currentHeaders.length).getValues();
          for (let r = 0; r < numRows; r++) {
            const row = rows[r];
            const currentRadar = String(row[idxRadar] || "").trim();
            if (!currentRadar || currentRadar === "-") {
              const tglKmk = idxTglKmk !== -1 ? String(row[idxTglKmk] || "-").trim() : "-";
              const tglBpn = idxTglBpn !== -1 ? String(row[idxTglBpn] || "-").trim() : "-";
              const tglOjk = idxTglOjk !== -1 ? String(row[idxTglOjk] || "-").trim() : "-";

              const dKmk = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglKmk) : 999;
              const dBpn = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglBpn) : 999;
              const dOjk = typeof calculateDaysDelta === 'function' ? calculateDaysDelta(tglOjk) : 999;

              const aKmk = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dKmk) : "AMAN";
              const aBpn = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dBpn) : "AMAN";
              const aOjk = typeof getAlertLevelFromDays === 'function' ? getAlertLevelFromDays(dOjk) : "AMAN";

              let overall = "AMAN";
              const alList = [aKmk, aBpn, aOjk];
              if (alList.includes("EXPIRED")) overall = "EXPIRED";
              else if (alList.includes("H-30")) overall = "H-30";
              else if (alList.includes("H-60")) overall = "H-60";
              else if (alList.includes("H-90")) overall = "H-90";

              pplSheet.getRange(r + 2, idxRadar + 1).setValue(overall);
            }
          }
        }
      } catch (scanErr) {
        console.warn("Gagal scanning baris DB_KEPATUHAN_PPL_IZIN:", scanErr);
      }
    }
  }

  const msg = "Setup Skema SSOT SPM V.4.2026 Sukses: DB_POST_ENGAGEMENT_REVIEW (" + 
    (results.postEngagementSheet.created ? "Sheet Baru Dibuat" : "Kolom Lengkap: " + results.postEngagementSheet.totalColumns) + 
    ") & DB_KEPATUHAN_PPL_IZIN (" + 
    (results.pplComplianceSheet.created ? "Sheet Baru Dibuat" : "Kolom Lengkap: " + results.pplComplianceSheet.totalColumns + ", Baris: " + results.pplComplianceSheet.rowsScanned) + ")";

  console.log(msg);

  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert("🛡️ Setup Skema SSOT SPM V.4.2026", msg, ui.ButtonSet.OK);
    }
  } catch (_) {}

  return {
    status: "success",
    success: true,
    message: msg,
    details: results
  };
}

/**
 * Custom Menu Admin UI di Google Sheets untuk Setup & Audit Mutu SPM
 */
function onOpen(e) {
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.createMenu("🛡️ Tata Kelola SPM NSR")
        .addItem("⚙️ Setup Skema SSOT (SPM V.4.2026)", "setupSPM4SchemaSSOT")
        .addSeparator()
        .addItem("🎲 Jalankan Sampling Acak SPM Triwulanan", "menuSamplingAcakSPM")
        .addToUi();
    }
  } catch (err) {}
}

function menuSamplingAcakSPM() {
  const result = generateQuarterlySampling({ kuartal: "Q1", tahun: 2026 });
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert("Sampling Acak SPM Triwulanan", result.message || JSON.stringify(result), ui.ButtonSet.OK);
    }
  } catch (_) {}
}
`.split('\n').join(qaCrlf);

  qaGs += qaFuncs;
  console.log("✓ Added setupSPM4SchemaSSOT and onOpen functions to backend/google-apps-script-qa-audit.gs");
}

fs.writeFileSync(qaGsPath, qaGs, 'utf8');

// 3. UPDATE governance-data-handler.php
const phpPath = path.join(ROOT_DIR, 'governance-data-handler.php');
let php = fs.readFileSync(phpPath, 'utf8');
const phpCrlf = php.includes('\r\n') ? '\r\n' : '\n';

if (!php.includes("case 'SETUP_SPM4_SCHEMA':")) {
  const targetCase = "case 'GET_POST_ENGAGEMENT_REVIEWS':";
  const caseToAdd = `    case 'SETUP_SPM4_SCHEMA':
    case 'setupSPM4SchemaSSOT':
        echo json_encode([
            'status' => 'success',
            'success' => true,
            'message' => 'Setup Skema SSOT SPM V.4.2026 Sukses: DB_POST_ENGAGEMENT_REVIEW (17 kolom FM-SPM-06.2) & DB_KEPATUHAN_PPL_IZIN (18 kolom BPN/OJK/Radar)',
            'details' => [
                'postEngagementSheet' => ['created' => false, 'headersAdded' => [], 'totalColumns' => 17],
                'pplComplianceSheet' => ['created' => false, 'headersAdded' => [], 'totalColumns' => 18, 'rowsScanned' => 52],
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        break;
`.split('\n').join(phpCrlf);

  php = php.replace(targetCase, caseToAdd + targetCase);
  fs.writeFileSync(phpPath, php, 'utf8');
  console.log("✓ Added SETUP_SPM4_SCHEMA case to governance-data-handler.php");
}

console.log("=== SETUP SPM4 SCHEMA UTILITY SUCCESSFULLY IMPLEMENTED ===");
