import fs from 'fs';
import vm from 'vm';

console.log('====================================================');
console.log('🧪 PENGUJIAN KELAYAKAN SINKRONISASI DATABASE PRODUKSI');
console.log('   SPREADSHEET ID: 12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E');
console.log('====================================================\n');

// Mock Environment Google Apps Script yang mencerminkan spreadsheet produksi asli
class MockRange {
  constructor(sheet, r, c, numR, numC) {
    this.sheet = sheet;
    this.r = r;
    this.c = c;
    this.numR = numR;
    this.numC = numC;
  }
  getValues() {
    const res = [];
    for (let i = 0; i < this.numR; i++) {
      const row = [];
      for (let j = 0; j < this.numC; j++) {
        row.push(this.sheet.data[this.r - 1 + i]?.[this.c - 1 + j] ?? '');
      }
      res.push(row);
    }
    return res;
  }
  setValues(vals) {
    for (let i = 0; i < vals.length; i++) {
      for (let j = 0; j < vals[i].length; j++) {
        const targetR = this.r - 1 + i;
        const targetC = this.c - 1 + j;
        if (!this.sheet.data[targetR]) this.sheet.data[targetR] = [];
        this.sheet.data[targetR][targetC] = vals[i][j];
      }
    }
  }
  setValue(val) {
    if (!this.sheet.data[this.r - 1]) this.sheet.data[this.r - 1] = [];
    this.sheet.data[this.r - 1][this.c - 1] = val;
  }
  setFontWeight() {}
}

class MockSheet {
  constructor(name, data) {
    this.name = name;
    this.data = JSON.parse(JSON.stringify(data));
  }
  getLastRow() { return this.data.length; }
  getLastColumn() {
    return this.data.reduce((max, r) => Math.max(max, r ? r.length : 0), 0);
  }
  getRange(r, c, numR, numC) {
    return new MockRange(this, r, c, numR, numC);
  }
  appendRow(row) {
    this.data.push([...row]);
  }
}

// Data Produksi Asli (Berdasarkan hasil inspeksi read-only)
const prodDB = {
  'MASTER_KARYAWAN': new MockSheet('MASTER_KARYAWAN', [
    ['NIK', 'Nama Karyawan', 'Jabatan', 'Divisi', 'Status', 'Alamat WFH', 'GPS WFH', 'Tanggal Registrasi WFH'],
    ['NSR-2019-001', 'Nanang Rahayu', 'Pemimpin Rekan', 'Manajemen', 'AKTIF', '', '', ''],
    ['NSR-2019-002', 'Deni Siswandi', 'Rekan', 'Manajemen', 'AKTIF', '', '', ''],
    ['NSR-2019-003', 'Mini Intan Cahyani', 'Rekan', 'Manajemen', 'AKTIF', '', '', ''],
    ['NSR-2019-004', 'Milda Hidayati Dewi', 'Manager Keuangan', 'Keuangan', 'AKTIF', '', '', ''],
    ['NSR-2019-005', 'Danny Taufik Hidayat', 'Manager Admin & Umum', 'Operasional', 'AKTIF', '', '', '']
  ]),
  'ABSENSI': new MockSheet('ABSENSI', [
    [
      'Timestamp', 'NIK', 'Nama Karyawan', 'Jabatan', 'Divisi', 'Jenis Absensi',
      'Lokasi', 'Koordinat GPS', 'Jarak', 'Status GPS', 'Jam Absensi', 'Status Kehadiran',
      'Validasi Lokasi', 'Keterangan'
    ],
    // Baris historis lama
    ['2026-10-09 08:00:00', 'NSR-2019-001', 'Nanang Rahayu', 'Pemimpin Rekan', 'Manajemen', 'Masuk', 'KANTOR', '-6.28797,106.82477', '0 m', 'VALID', '08:00:00 WIB', 'Hadir', 'Pusat Jakarta', 'Presensi Masuk Berhasil']
  ]),
  'MASTER_WFH': new MockSheet('MASTER_WFH', [
    ['NIK', 'Nama', 'Alamat WFH', 'Latitude', 'Longitude', 'Radius'],
    ['NSR-2019-001', 'Nanang Rahayu', 'Jl. Tebet Barat', -6.234, 106.852, 100]
  ]),
  'PENGAJUAN_CUTI': new MockSheet('PENGAJUAN_CUTI', [
    [
      'Timestamp', 'NIK', 'Nama', 'Jabatan', 'Divisi', 'Jenis Cuti',
      'Tanggal Mulai', 'Tanggal Selesai', 'Jumlah Hari', 'Alasan', 'Status Approval', 'Link Bukti'
    ]
  ])
};

const mockCacheData = {};
const mockSentEmails = [];

const sandbox = {
  SpreadsheetApp: {
    openById: (id) => ({
      getName: () => 'DATABASE ABSENSI KARYAWAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
      getSheetByName: (n) => prodDB[n],
      getSheets: () => Object.values(prodDB)
    })
  },
  MailApp: {
    getRemainingDailyQuota: () => 100,
    sendEmail: (p) => mockSentEmails.push(p)
  },
  CacheService: {
    getScriptCache: () => ({
      get: (k) => mockCacheData[k] || null,
      put: (k, v) => { mockCacheData[k] = v; },
      remove: (k) => { delete mockCacheData[k]; }
    })
  },
  Utilities: {
    formatDate: (d, tz, f) => {
      const pad = (n) => String(n).padStart(2, '0');
      if (f.includes('yyyy-MM-dd HH:mm:ss')) return '2026-10-11 13:30:00';
      if (f.includes('yyyy-MM-dd')) return '2026-10-11';
      if (f.includes('HH:mm:ss')) return '13:30:00';
      return '20261011_133000';
    },
    computeDigest: (algo, val) => {
      // Mock SHA-256
      return Array.from(Buffer.from('hash_' + val));
    },
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    base64Decode: (b64) => Buffer.from(b64, 'base64'),
    newBlob: (d, m, n) => ({ getData: () => d, getContentType: () => m, getName: () => n })
  },
  DriveApp: {
    getFileById: (id) => ({
      getName: () => 'DATABASE ABSENSI KARYAWAN',
      getParents: () => ({ hasNext: () => false, next: () => null }),
      makeCopy: (name) => ({ getId: () => 'backup_mock_id', getName: () => name })
    }),
    getRootFolder: () => ({
      getFoldersByName: () => ({ hasNext: () => false }),
      createFolder: () => ({
        createFile: () => ({ getUrl: () => 'https://drive.google.com/file/d/mock_cuti/view' })
      })
    })
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => {},
      releaseLock: () => {}
    })
  },
  Logger: { log: console.log },
  console: console
};

const codeSource = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
vm.createContext(sandbox);
vm.runInContext(codeSource, sandbox);

// 1. Uji Sinkronisasi Kolom Non-Destruktif
console.log('--- 1. Uji Sinkronisasi Non-Destruktif MASTER_KARYAWAN ---');
sandbox.syncProductionSchema_();
const masterHeaders = prodDB['MASTER_KARYAWAN'].data[0];
console.log('Headers MASTER_KARYAWAN saat ini:', masterHeaders);
if (masterHeaders.includes('Email') && masterHeaders.length === 9) {
  console.log('  [PASS] Kolom Email ditambahkan secara non-destruktif di posisi ke-9');
} else {
  throw new Error('Gagal sinkronisasi kolom Email');
}

// Cek data Danny (baris 6 / index 5)
const dannyRow = prodDB['MASTER_KARYAWAN'].data[5];
console.log('Data Danny Taufik Hidayat:', dannyRow[0], dannyRow[1], '| Email:', dannyRow[8]);
if (dannyRow[8] === 'kjppnr.danny@gmail.com') {
  console.log('  [PASS] Akun Danny Taufik Hidayat otomatis terhubung dengan kjppnr.danny@gmail.com');
} else {
  throw new Error('Email Danny gagal terpetakan');
}

// 2. Uji Cek Karyawan & Masking Email
console.log('\n--- 2. Uji cekKaryawan() ---');
const profFull = sandbox.cekKaryawan('NSR-2019-005');
console.log('Hasil cekKaryawan("NSR-2019-005"):', profFull);
const profShort = sandbox.cekKaryawan('NSR-005');
console.log('Hasil cekKaryawan("NSR-005") (Smart Matching):', profShort);
if (profFull && profShort && profFull.maskedEmail === 'k***y@gmail.com') {
  console.log('  [PASS] NIK valid diverifikasi & email disamarkan (k***y@gmail.com)');
} else {
  throw new Error('Gagal verifikasi NIK Danny');
}

// 3. Uji Minta OTP & Verifikasi
console.log('\n--- 3. Uji mintaOTP() & verifikasiOTP() ---');
const otpReq = sandbox.mintaOTP('NSR-2019-005');
console.log('Hasil mintaOTP:', otpReq);
if (otpReq.success && mockSentEmails.length === 1 && mockSentEmails[0].to === 'kjppnr.danny@gmail.com') {
  console.log('  [PASS] Email OTP terkirim ke kjppnr.danny@gmail.com');
} else {
  throw new Error('Gagal kirim email OTP');
}

// Dapatkan kode OTP dari email
const otpMatch = mockSentEmails[0].subject.match(/(\d{6})/);
const kodeOtp = otpMatch[1];
console.log('Kode OTP dari email sistem:', kodeOtp);

const verifyRes = sandbox.verifikasiOTP('NSR-2019-005', kodeOtp);
console.log('Hasil verifikasiOTP:', verifyRes);
if (verifyRes.success && verifyRes.sessionToken) {
  console.log('  [PASS] Verifikasi OTP sukses & Token Sesi Server diterbitkan');
} else {
  throw new Error('Gagal verifikasi OTP');
}

// 4. Uji Simpan Presensi Produksi (Pusat Jakarta)
console.log('\n--- 4. Uji simpanAbsensi() dengan Pemetaan 14 Kolom ---');
const absenRes = sandbox.simpanAbsensi({
  nik: 'NSR-2019-005',
  jenis: 'Masuk',
  lokasi: 'KANTOR',
  gps: '-6.287973, 106.824779',
  sessionToken: verifyRes.sessionToken
});
console.log('Hasil simpanAbsensi:', absenRes);
if (absenRes.success && absenRes.status === 'VALID') {
  console.log('  [PASS] Presensi Masuk diverifikasi VALID di Kantor Pusat Jakarta');
} else {
  throw new Error('Gagal simpan absensi');
}

// Cek struktur baris yang ditulis ke ABSENSI
const writtenRow = prodDB['ABSENSI'].data[prodDB['ABSENSI'].data.length - 1];
console.log('Baris yang ditulis ke ABSENSI (14 Kolom):');
console.log(JSON.stringify(writtenRow, null, 2));
if (writtenRow.length === 14 && writtenRow[1] === 'NSR-2019-005' && writtenRow[5] === 'Masuk' && writtenRow[12] === 'Pusat Jakarta') {
  console.log('  [PASS] 14 Kolom tabel ABSENSI terpetakan presisi tanpa celah!');
} else {
  throw new Error('Kolom tabel ABSENSI tidak sesuai!');
}

// 5. Uji Cek Presensi Ganda
console.log('\n--- 5. Uji Proteksi Presensi Ganda ---');
try {
  sandbox.simpanAbsensi({
    nik: 'NSR-2019-005',
    jenis: 'Masuk',
    lokasi: 'KANTOR',
    gps: '-6.287973, 106.824779',
    sessionToken: verifyRes.sessionToken
  });
  throw new Error('Gagal memblokir double submission');
} catch (e) {
  if (e.message.includes('Anda sudah melakukan presensi')) {
    console.log('  [PASS] Presensi ganda berhasil diblokir:', e.message);
  } else {
    throw e;
  }
}

// 6. Uji Simpan WFH
console.log('\n--- 6. Uji simpanWFH() ---');
const wfhRes = sandbox.simpanWFH({
  nik: 'NSR-2019-005',
  alamat: 'Jl. TB Simatupang No. 88, Jakarta Selatan',
  gps: '-6.295000, 106.830000',
  sessionToken: verifyRes.sessionToken
});
console.log('Hasil simpanWFH:', wfhRes);
if (wfhRes.success) {
  console.log('  [PASS] Pendaftaran titik WFH berhasil dikunci');
} else {
  throw new Error('Gagal simpan WFH');
}

// 7. Uji Simpan Pengajuan Cuti & Lampiran
console.log('\n--- 7. Uji simpanPengajuanCuti() ---');
const cutiRes = sandbox.simpanPengajuanCuti({
  nik: 'NSR-2019-005',
  jenisCuti: 'Cuti Tahunan',
  tglMulai: '2026-10-20',
  tglSelesai: '2026-10-22',
  alasan: 'Keperluan keluarga',
  fileData: 'data:application/pdf;base64,' + Buffer.from('PDF_DOKUMEN_RESMI').toString('base64'),
  fileName: 'surat_permohonan.pdf',
  sessionToken: verifyRes.sessionToken
});
console.log('Hasil simpanPengajuanCuti:', cutiRes);
if (cutiRes.success) {
  console.log('  [PASS] Pengajuan cuti dan lampiran dokumen berhasil tersimpan');
} else {
  throw new Error('Gagal simpan cuti');
}

console.log('\n====================================================');
console.log('🎉 SEMUA PENGUJIAN PRODUKSI & PEMETAAN HEADER LULUS 100%!');
console.log('====================================================');
