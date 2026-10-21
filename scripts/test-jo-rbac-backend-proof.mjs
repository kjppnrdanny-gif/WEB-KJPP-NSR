import fs from 'fs';
import path from 'path';
import vm from 'vm';
import crypto from 'crypto';

console.log('======================================================');
console.log('🛡️ PENGUJIAN BACKEND RBAC & ISOLASI DATA ANTAR-CABANG (Code.gs)');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, desc) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

// 1. Baca source Code.gs
const codeGsPath = path.join(process.cwd(), 'Code.gs');
const codeGsContent = fs.readFileSync(codeGsPath, 'utf-8');

// 2. Setup Mock Database Sheet dengan 5 kantor wilayah
const mockHeaders = [
  'ID_Penugasan', 'Kantor_Wilayah', 'Kode_Kantor', 'Nama_Debitur', 
  'Pemberi_Tugas', 'No_Lingkup_Penugasan', 'No_Adm_JO', 'Status', 'Target_Selesai'
];

const mockRows = [
  ['NSR-JKT-001', 'Kantor Pusat Jakarta', 'JKT', 'PT Prima Jakarta', 'Bank Mandiri', '001/LP/NSR-JKT/2026', '001/JO/NSR/2026', 'APPROVED', '2026-11-01'],
  ['NSR-BDG-002', 'Kantor Cabang Bandung', 'BDG', 'PT Maju Bandung', 'Bank BJB', '002/LP/NSR-BDG/2026', '002/JO/NSR/2026', 'WAITING_APPROVAL', '2026-10-25'],
  ['NSR-PDG-003', 'Kantor Cabang Padang', 'PDG', 'PT Semen Padang Sukses', 'Bank Nagari', '003/LP/NSR-PDG/2026', '003/JO/NSR/2026', 'APPROVED', '2026-10-18'],
  ['NSR-PKU-004', 'Kantor Cabang Pekanbaru', 'PKU', 'PT Sawit Riau', 'Bank Riau Kepri', '004/LP/NSR-PKU/2026', '004/JO/NSR/2026', 'WAITING_APPROVAL', '2026-11-10'],
  ['NSR-SBY-005', 'Kantor Cabang Surabaya', 'SBY', 'PT Pelabuhan Jatim', 'Bank Jatim', '005/LP/NSR-SBY/2026', '005/JO/NSR/2026', 'SELESAI', '2026-10-15']
];

// Mock Sheet Object
const mockSheet = {
  getLastRow: () => mockRows.length + 1,
  getLastColumn: () => mockHeaders.length,
  getDataRange: () => ({
    getValues: () => [
      ['Key', 'Value'],
      ['LAST_NO_ADM_JO', 415]
    ]
  }),
  getRange: (row, col, numRows, numCols) => {
    return {
      getValues: () => {
        if (row === 1 && numRows === 1) {
          return [mockHeaders];
        }
        return mockRows;
      }
    };
  }
};

const mockSpreadsheet = {
  getSheetByName: (name) => mockSheet
};

// Mock GAS Globals
const mockContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput: (text) => ({
    _text: text,
    _mime: '',
    setMimeType: function(mime) {
      this._mime = mime;
      return this;
    },
    getContent: function() {
      return this._text;
    },
    getJSON: function() {
      try {
        return JSON.parse(this._text);
      } catch (e) {
        return null;
      }
    }
  })
};

const mockPropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => null
  })
};

const mockUtilities = {
  computeDigest: (algo, str) => {
    const hash = crypto.createHash('sha256').update(str).digest();
    return Array.from(hash).map(b => (b > 127 ? b - 256 : b));
  },
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  formatDate: (date, tz, fmt) => '2026-10-22'
};

const sandbox = {
  console,
  ContentService: mockContentService,
  PropertiesService: mockPropertiesService,
  Utilities: mockUtilities,
  SpreadsheetApp: {
    flush: () => {},
    openById: () => mockSpreadsheet,
    getActiveSpreadsheet: () => mockSpreadsheet
  },
  CacheService: {
    getScriptCache: () => ({
      remove: () => {},
      put: () => {},
      get: () => null
    })
  },
  CONFIG: { SHEET_DATA: 'Database_Penugasan' },
  bacaConfigCounter: () => ({ LAST_NO_ADM_JO: 415 }),
  bacaMasterPersonil: () => ({ rekan: [], personil: [] }),
  getMasterSpreadsheet: () => mockSpreadsheet,
  LockService: {
    getScriptLock: () => ({
      waitLock: () => true,
      releaseLock: () => true
    })
  }
};

vm.createContext(sandbox);

// Eksekusi fungsi-fungsi dari Code.gs ke sandbox
vm.runInContext(codeGsContent, sandbox);

assert(typeof sandbox.bacaSemuaSubmissions === 'function', 'Fungsi backend bacaSemuaSubmissions() terdefinisi di Code.gs');
assert(typeof sandbox.doGet === 'function', 'Fungsi backend doGet() terdefinisi di Code.gs');
assert(typeof sandbox.doPost === 'function', 'Fungsi backend doPost() terdefinisi di Code.gs');

console.log('\n[TEST 1] Isolasi Data untuk Kantor Cabang Padang:');
const authPadang = {
  valid: true,
  role: 'ADMIN_CABANG',
  isCabang: true,
  mode: 'CABANG',
  wilayah: 'Kantor Cabang Padang',
  wilayahLabel: 'Kantor Cabang Padang',
  wilayahCode: 'PDG',
  kodeKantor: 'PDG'
};

const hasilPadang = sandbox.bacaSemuaSubmissions(mockSpreadsheet, authPadang);
assert(hasilPadang.length === 1, `Cabang Padang hanya menerima 1 data (aktual: ${hasilPadang.length})`);
assert(hasilPadang[0].ID_Penugasan === 'NSR-PDG-003', `Data yang diterima adalah milik Padang (NSR-PDG-003)`);
assert(!hasilPadang.some(item => item.Kode_Kantor !== 'PDG'), 'Tidak ada kebocoran data dari Jakarta, Bandung, Pekanbaru, atau Surabaya ke Padang');

console.log('\n[TEST 2] Isolasi Data untuk Kantor Cabang Bandung:');
const authBandung = {
  valid: true,
  role: 'ADMIN_CABANG',
  isCabang: true,
  mode: 'CABANG',
  wilayah: 'Kantor Cabang Bandung',
  wilayahLabel: 'Kantor Cabang Bandung',
  wilayahCode: 'BDG',
  kodeKantor: 'BDG'
};

const hasilBandung = sandbox.bacaSemuaSubmissions(mockSpreadsheet, authBandung);
assert(hasilBandung.length === 1, `Cabang Bandung hanya menerima 1 data (aktual: ${hasilBandung.length})`);
assert(hasilBandung[0].ID_Penugasan === 'NSR-BDG-002', `Data yang diterima adalah milik Bandung (NSR-BDG-002)`);
assert(!hasilBandung.some(item => item.Kode_Kantor !== 'BDG'), 'Tidak ada kebocoran data cabang lain ke Bandung');

console.log('\n[TEST 3] Akses Menyeluruh untuk Admin Pusat (Super Admin):');
const authPusat = {
  valid: true,
  role: 'ADMIN_PUSAT',
  isSuperAdmin: true,
  isCabang: false,
  mode: 'PUSAT'
};

const hasilPusat = sandbox.bacaSemuaSubmissions(mockSpreadsheet, authPusat);
assert(hasilPusat.length === 5, `Admin Pusat menerima seluruh 5 data penugasan dari semua cabang (aktual: ${hasilPusat.length})`);
const kantorWilayahSet = new Set(hasilPusat.map(i => i.Kode_Kantor));
assert(kantorWilayahSet.size === 5, 'Admin Pusat melihat data dari JKT, BDG, PDG, PKU, dan SBY');

console.log('\n[TEST 4] Uji Otorisasi Backend: Cabang Mencoba Request Approval (APPROVE)');
// Buat token hash valid untuk Padang agar lolos verifikasi autentikasi awal
// Di CONFIG.HASH_MATRIX Code.gs, cek token atau stub verifikasiAksesToken
const origVerifikasi = sandbox.verifikasiAksesToken;
sandbox.verifikasiAksesToken = (token, tokenHash, apiKey) => {
  if (token === 'TOKEN_PADANG' || tokenHash === 'HASH_PADANG') {
    return {
      valid: true,
      role: 'ADMIN_CABANG',
      isCabang: true,
      mode: 'CABANG',
      wilayah: 'Kantor Cabang Padang',
      token: 'TOKEN_PADANG'
    };
  }
  return { valid: false };
};

const postPayloadCabangApprove = {
  postData: {
    contents: JSON.stringify({
      action: 'APPROVE',
      token: 'TOKEN_PADANG',
      projectId: 'NSR-PDG-003',
      data: { status: 'APPROVED' }
    })
  }
};

const resApproveOutput = sandbox.doPost(postPayloadCabangApprove);
const resApprove = resApproveOutput.getJSON();
assert(resApprove.status === 'error', `Response status adalah 'error' (aktual: ${resApprove.status})`);
assert(resApprove.success === false, `Response success adalah false`);
assert(resApprove.error && resApprove.error.includes('Otorisasi Ditolak'), `Pesan error tegas menolak peran Cabang: "${resApprove.error}"`);

console.log('\n[TEST 5] Uji Backend Action SYNC / GET_DATA dengan Otorisasi Cabang:');
const postPayloadCabangSync = {
  postData: {
    contents: JSON.stringify({
      action: 'SYNC',
      token: 'TOKEN_PADANG'
    })
  }
};

const resSyncOutput = sandbox.doPost(postPayloadCabangSync);
const resSync = resSyncOutput.getJSON();
assert(resSync.status === 'success', 'Response SYNC berhasil');
assert(Array.isArray(resSync.submissions), 'Submissions berupa Array');
assert(resSync.submissions.length === 1, `Submissions yang dikembalikan doPost HANYA 1 (khusus Padang, bukan 5 data: aktual ${resSync.submissions.length})`);
assert(resSync.submissions[0].ID_Penugasan === 'NSR-PDG-003', 'Data penugasan murni milik Padang');

console.log('\n[TEST 6] Uji Keamanan Fail-Closed HTTP GET Publik (Tanpa Autentikasi)');
const getPublikOutput = sandbox.doGet({ parameter: {} });
const getPublik = getPublikOutput.getJSON();
assert(getPublik.public === true, 'Response doGet publik menandai public: true');
assert(getPublik.authenticated === false, 'Response doGet publik menandai authenticated: false');
assert(typeof getPublik.submissions === 'undefined', 'HTTP GET publik sama sekali TIDAK menyajikan daftar penugasan (submissions: undefined)');
assert(getPublik.message.includes('terproteksi otorisasi KJPP NSR'), 'Pesan kepatuhan keamanan Kemenkeu & UU PDP tampil');

console.log('\n======================================================');
console.log(`HASIL AKHIR RBAC BACKEND: ${passedTests} / ${totalTests} PENGUJIAN LULUS SEMPURNA! (100%)`);
console.log('======================================================');
