import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'gas-absensi-Code.gs');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add action getMasterKaryawanFull
if (!code.includes("action === 'getMasterKaryawanFull'")) {
  const target = `} else if (action === 'getRiwayatPresensi') {
      res = getRiwayatPresensi(payload.nik, payload.sessionToken);
    } else {`;
  const replacement = `} else if (action === 'getRiwayatPresensi') {
      res = getRiwayatPresensi(payload.nik, payload.sessionToken);
    } else if (action === 'getMasterKaryawanFull') {
      res = getMasterKaryawanFull();
    } else {`;
  code = code.replace(target, replacement);
  if (!code.includes("action === 'getMasterKaryawanFull'")) {
    // Try with CRLF
    const targetCRLF = `} else if (action === 'getRiwayatPresensi') {\r\n      res = getRiwayatPresensi(payload.nik, payload.sessionToken);\r\n    } else {`;
    const repCRLF = `} else if (action === 'getRiwayatPresensi') {\r\n      res = getRiwayatPresensi(payload.nik, payload.sessionToken);\r\n    } else if (action === 'getMasterKaryawanFull') {\r\n      res = getMasterKaryawanFull();\r\n    } else {`;
    code = code.replace(targetCRLF, repCRLF);
  }
}

// 2. Strict NIK matching (no partial, no trailing digits)
code = code.replace(
  /function isNikMatch_\(dbNik, inputNik\) \{[\s\S]*?return false;\s*\}/,
  `function isNikMatch_(dbNik, inputNik) {
  const normDb = normalizeNikKey_(dbNik);
  const normInp = normalizeNikKey_(inputNik);
  // STRICT SSOT: Wajib NIK lengkap yang unik, larangan pencocokan parsial/digit terakhir
  return normDb === normInp;
}`
);

// 3. Add getMasterKaryawanFull function at the end
if (!code.includes('function getMasterKaryawanFull()')) {
  code += `\n\n/**
 * SSOT Master Karyawan Retrieval
 * Mengambil seluruh data MASTER KARYAWAN dari Google Spreadsheet resmi
 */
function getMasterKaryawanFull() {
  const ss = getSS_();
  const sheets = ss.getSheets().map(function(s) { return s.getName(); });
  let sh = ss.getSheetByName('MASTER KARYAWAN') || ss.getSheetByName('MASTER_KARYAWAN');
  if (!sh) {
    return {
      status: 'error',
      success: false,
      message: 'Sheet MASTER KARYAWAN tidak ditemukan pada spreadsheet ' + ss.getName(),
      availableSheets: sheets
    };
  }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return {
      status: 'success',
      success: true,
      headers: [],
      rows: [],
      availableSheets: sheets,
      sheetName: sh.getName()
    };
  }
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  return {
    status: 'success',
    success: true,
    spreadsheetTitle: ss.getName(),
    sheetName: sh.getName(),
    availableSheets: sheets,
    headers: values[0],
    rows: values.slice(1)
  };
}\n`;
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('gas-absensi-Code.gs updated successfully');
