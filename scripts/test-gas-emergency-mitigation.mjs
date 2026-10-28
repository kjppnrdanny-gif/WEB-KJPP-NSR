/**
 * TEST SUITE: MITIGASI KEAMANAN ENDPOINT GOOGLE APPS SCRIPT (GAS)
 * KJPP Nanang Rahayu Sigit Paryanto & Rekan
 * 
 * Menguji:
 * 1. Anonymous GET ke Code.gs?action=GET_SURAT_UMUM_LIST -> Wajib 403 Forbidden / Fail-Closed.
 * 2. Anonymous GET ke Code.gs (Penugasan JO) -> Wajib HANYA counter publik, tanpa submissions / personil.
 * 3. GET ke Code.gs dengan dummy query token/tokenHash -> Wajib ditolak/diabaikan, TIDAK boleh mereturn data sensitif via GET.
 * 4. Anonymous POST ke Code.gs -> Wajib 401 Unauthorized (Otorisasi Ditolak).
 * 5. Unauthorized Role POST (e.g. Cabang Bandung mencoba GET_SURAT_UMUM_LIST) -> Wajib 403 Forbidden.
 * 6. Authorized Super Admin POST -> Wajib berhasil mengakses data dengan benar via POST body.
 * 7. NoLap doGet -> Wajib mengembalikan pesan status operasional tanpa kebocoran data.
 * 8. Absensi doGet -> Wajib mengembalikan HTML template tanpa kebocoran data JSON.
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

// Simulasi lingkungan Google Apps Script untuk pengujian kode lokal Code.gs
function createMockGASEnvironment() {
  const mockCache = new Map();
  const mockSheetCounter = {
    getLastRow: () => 5,
    getLastColumn: () => 2,
    getDataRange: () => ({
      getValues: () => [
        ['KEY', 'VALUE'],
        ['TAHUN_BERJALAN', 2026],
        ['LAST_NO_ADM_JO', 415],
        ['LAST_NO_LP_SPK', 415]
      ]
    }),
    getRange: () => ({
      getValues: () => [
        ['KEY', 'VALUE'],
        ['TAHUN_BERJALAN', 2026],
        ['LAST_NO_ADM_JO', 415],
        ['LAST_NO_LP_SPK', 415]
      ]
    })
  };

  const mockSheetSU = {
    getLastRow: () => 4,
    getLastColumn: () => 10,
    getDataRange: () => ({
      getValues: () => [
        ['Timestamp', 'No_Agenda', 'Nomor_Surat', 'Perihal', 'Tujuan', 'File_Link', 'Tahun'],
        ['2026-01-01', 1, '001/SU-NSR/I/2026', 'Surat Dummy 1', 'Klien A', 'http://dummy/1', 2026],
        ['2026-01-02', 2, '002/SU-NSR/I/2026', 'Surat Dummy 2', 'Klien B', 'http://dummy/2', 2026],
        ['2026-01-03', 3, '003/SU-NSR/I/2026', 'Surat Dummy 3', 'Klien C', 'http://dummy/3', 2026]
      ]
    }),
    getRange: () => ({
      getValues: () => [
        ['Timestamp', 'No_Agenda', 'Nomor_Surat', 'Perihal', 'Tujuan', 'File_Link', 'Tahun'],
        ['2026-01-01', 1, '001/SU-NSR/I/2026', 'Surat Dummy 1', 'Klien A', 'http://dummy/1', 2026],
        ['2026-01-02', 2, '002/SU-NSR/I/2026', 'Surat Dummy 2', 'Klien B', 'http://dummy/2', 2026],
        ['2026-01-03', 3, '003/SU-NSR/I/2026', 'Surat Dummy 3', 'Klien C', 'http://dummy/3', 2026]
      ]
    })
  };

  const mockSpreadsheet = {
    getSheetByName(name) {
      if (name === 'Config_Counter') return mockSheetCounter;
      if (name === 'Buku_Surat_Umum' || name === 'Buku_Agenda_SU') return mockSheetSU;
      return null;
    },
    insertSheet(name) {
      return mockSheetSU;
    }
  };

  return {
    CacheService: {
      getScriptCache: () => ({
        get: (k) => mockCache.get(k) || null,
        put: (k, v) => mockCache.set(k, v),
        remove: (k) => mockCache.delete(k)
      })
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => true,
        releaseLock: () => true
      })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (str) => {
        const out = {
          setMimeType: function() { return out; },
          getContent: () => str
        };
        return out;
      }
    },
    SpreadsheetApp: {
      openById: () => mockSpreadsheet,
      getActiveSpreadsheet: () => mockSpreadsheet
    },
    mockSpreadsheet
  };
}

// Sandbox execution of Code.gs
function loadLocalCodeGS() {
  const codePath = path.resolve('Code.gs');
  const codeContent = fs.readFileSync(codePath, 'utf8');

  const env = createMockGASEnvironment();

  // Sandbox helper
  const sandbox = {
    CacheService: env.CacheService,
    LockService: env.LockService,
    ContentService: env.ContentService,
    SpreadsheetApp: env.SpreadsheetApp,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  // Run Code.gs in function scope
  const evaluator = new Function(
    'CacheService',
    'LockService',
    'ContentService',
    'SpreadsheetApp',
    'console',
    codeContent + `
      return {
        doGet,
        doPost,
        verifikasiAksesToken,
        bacaConfigCounter,
        respondJSON
      };
    `
  );

  return evaluator(
    sandbox.CacheService,
    sandbox.LockService,
    sandbox.ContentService,
    sandbox.SpreadsheetApp,
    sandbox.console
  );
}

console.log('===============================================================');
console.log('   PENGUJIAN MITIGASI KEAMANAN GOOGLE APPS SCRIPT (LOCAL CODE)   ');
console.log('===============================================================\n');

try {
  const gas = loadLocalCodeGS();

  // TEST 1: Anonymous GET ke GET_SURAT_UMUM_LIST
  console.log('[UJI 1] Akses Anonim GET ke Modul Surat Umum:');
  const resSUAnon = JSON.parse(gas.doGet({ parameter: { action: 'GET_SURAT_UMUM_LIST' } }).getContent());
  assert(resSUAnon.status === 'error', 'Anonymous GET Surat Umum mengembalikan status error');
  assert(resSUAnon.authenticated === false, 'Anonymous GET Surat Umum authenticated bernilai false');
  assert(resSUAnon.code === 'FORBIDDEN_GET', 'Anonymous GET Surat Umum memiliki code FORBIDDEN_GET');
  assert(!resSUAnon.data, 'Anonymous GET Surat Umum TIDAK menyertakan data array surat');

  // TEST 2: Anonymous GET ke Penugasan JO
  console.log('\n[UJI 2] Akses Anonim GET ke Penugasan JO:');
  const resJOAnon = JSON.parse(gas.doGet({ parameter: {} }).getContent());
  assert(resJOAnon.status === 'success', 'Anonymous GET Penugasan JO mengembalikan status success (endpoint status)');
  assert(resJOAnon.public === true, 'Anonymous GET Penugasan JO menandai response sebagai publik');
  assert(resJOAnon.authenticated === false, 'Anonymous GET Penugasan JO authenticated bernilai false');
  assert(resJOAnon.counter !== undefined, 'Anonymous GET Penugasan JO menyertakan metadata counter');
  assert(resJOAnon.submissions === undefined, 'Anonymous GET Penugasan JO TIDAK membocorkan submissions');
  assert(resJOAnon.masterPersonil === undefined, 'Anonymous GET Penugasan JO TIDAK membocorkan masterPersonil');

  // TEST 3: GET dengan query parameter ?token= atau ?tokenHash=
  console.log('\n[UJI 3] Upaya Mengirim Kredensial via Query String URL GET:');
  const resJOGETWithToken = JSON.parse(gas.doGet({
    parameter: {
      token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
      tokenHash: '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0'
    }
  }).getContent());
  assert(resJOGETWithToken.submissions === undefined, 'Token di URL GET diabaikan; submissions TETAP terproteksi');
  assert(resJOGETWithToken.authenticated === false, 'Token di URL GET tidak mengautentikasi pengambilan data sensitif via GET');

  // TEST 4: Anonymous POST ke doPost(e)
  console.log('\n[UJI 4] Akses Anonim POST ke doPost(e):');
  const resPostAnon = JSON.parse(gas.doPost({
    postData: { contents: JSON.stringify({ action: 'GET_DATA' }) }
  }).getContent());
  assert(resPostAnon.status === 'error', 'Anonymous POST ditolak dengan status error');
  assert(resPostAnon.success === false, 'Anonymous POST success bernilai false');

  // TEST 5: Unauthorized Role POST (Cabang Makassar mengakses GET_SURAT_UMUM_LIST)
  console.log('\n[UJI 5] Hak Akses Terbatas Cabang pada Modul Surat Umum via POST:');
  const resPostCabangSU = JSON.parse(gas.doPost({
    postData: {
      contents: JSON.stringify({
        action: 'GET_SURAT_UMUM_LIST',
        tokenHash: '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e', // Hash resmi Cabang Makassar
        target_year: 2026
      })
    }
  }).getContent());
  assert(resPostCabangSU.status === 'error', 'Cabang mengakses Surat Umum ditolak');
  assert(resPostCabangSU.code === 'FORBIDDEN', 'Kode error adalah FORBIDDEN');

  // TEST 6: Authorized Super Admin POST ke GET_SURAT_UMUM_LIST
  console.log('\n[UJI 6] Authorized Super Admin via POST ke GET_SURAT_UMUM_LIST:');
  const resPostAdminSU = JSON.parse(gas.doPost({
    postData: {
      contents: JSON.stringify({
        action: 'GET_SURAT_UMUM_LIST',
        tokenHash: '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0', // Hash resmi Super Admin Pusat
        target_year: 2026
      })
    }
  }).getContent());
  assert(resPostAdminSU.status === 'success' || resPostAdminSU.success === true, 'Super Admin berhasil mengambil data Surat Umum via POST');
  assert(Array.isArray(resPostAdminSU.data), 'Array data surat umum dikembalikan ke Admin Pusat berwenang');

  // TEST 7: gas-nolap-Code.gs doGet(e)
  console.log('\n[UJI 7] Verifikasi File gas-nolap-Code.gs:');
  const nolapCode = fs.readFileSync('gas-nolap-Code.gs', 'utf8');
  assert(nolapCode.includes('function doGet(e)'), 'gas-nolap-Code.gs memiliki doGet');
  assert(!nolapCode.includes('bacaSemuaSubmissions'), 'gas-nolap-Code.gs doGet tidak membocorkan penugasan');

  // TEST 8: gas-absensi-Code.gs doGet(e)
  console.log('\n[UJI 8] Verifikasi File gas-absensi-Code.gs:');
  const absensiCode = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
  assert(absensiCode.includes("HtmlService.createTemplateFromFile('GPS')"), 'gas-absensi-Code.gs menyajikan GPS template');
  assert(!absensiCode.includes('return respondJSON(submissions'), 'gas-absensi-Code.gs tidak mengekspos database presensi via GET');

} catch (err) {
  console.error('Fatal error dalam test suite:', err);
  failed++;
}

console.log('\n===============================================================');
console.log(`HASIL AKHIR: ${passed} PASS / ${failed} FAIL`);
console.log('===============================================================');

if (failed > 0) process.exit(1);
