/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SISTEM PRESENSI & LAYANAN MANDIRI KARYAWAN (GOOGLE APPS SCRIPT)
 * 
 * Modul Backend: Code.gs (HTMLService: memanggil "GPS.html")
 * 
 * PERBAIKAN KEAMANAN & INTEGRASI:
 * 1. Multi-Office Geofencing: Mendukung 5 kantor resmi (Jakarta, Bandung, Padang, Makassar, Palembang).
 * 2. Distinksi Status Validasi: Membedakan presensi 'VALID' vs 'TIDAK VALID (DI LUAR RADIUS)'.
 * 3. Drive Folder Terisolasi: Menggunakan FOLDER_ID khusus pengujian / subfolder spreadsheet.
 * 4. Proteksi Hak Akses Dokumen: Menghapus sharing publik ANYONE_WITH_LINK (file berstatus Private/Internal).
 * 5. Validasi Server File: Memeriksa ukuran (maks 5 MB) dan whitelist tipe MIME (PDF, PNG, JPG).
 * 6. Rendering Aman: Kompatibel dengan frontend GPS.html tanpa XSS innerHTML.
 */

const CONFIG = {
  SPREADSHEET_ID: '', // Kosongkan jika script terikat langsung pada Google Spreadsheet (Container-bound)
  SHEET_KARYAWAN: 'MASTER_KARYAWAN',
  SHEET_ABSENSI: 'ABSENSI',
  SHEET_WFH: 'MASTER_WFH',
  SHEET_CUTI: 'PENGAJUAN_CUTI',
  
  // Folder Drive untuk lampiran surat sakit/bukti cuti
  // PENTING: Gunakan ID Folder pengujian khusus, jangan mencari nama global "BUKTI_CUTI_KJPP"
  APP_ENV: 'STAGING', // PENGUJIAN TERISOLASI
  IS_PRODUCTION: false,
  SPREADSHEET_ID: '', // ID Spreadsheet Staging Pengujian (Container-bound jika kosong)
  SHEET_KARYAWAN: 'MASTER_KARYAWAN',
  SHEET_ABSENSI: 'ABSENSI',
  SHEET_WFH: 'MASTER_WFH',
  SHEET_CUTI: 'PENGAJUAN_CUTI',
  
  // Folder Drive untuk lampiran surat sakit/bukti cuti (Terisolasi di staging)
  DRIVE_FOLDER_ID: '', 
  
  // Radius toleransi kehadiran resmi (dalam meter)
  RADIUS_KANTOR_METER: 150,
  RADIUS_WFH_METER: 100,

  // Daftar Koordinat RESMI Kantor KJPP NSR (Terverifikasi dari Google Maps resmi)
  KANTOR_CABANG: [
    { nama: "Pusat Jakarta", lat: -6.287972658138783, lng: 106.82477864308436 },
    { nama: "Cabang Bandung", lat: -6.8597817, lng: 107.5604289 },
    { nama: "Cabang Padang", lat: -0.94932, lng: 100.376055 },
    { nama: "Cabang Makassar", lat: -5.1582, lng: 119.4095 },
    { nama: "Cabang Palembang", lat: -2.929044, lng: 104.695981 }
  ]
};

/**
 * Endpoint Utama Web App (HTML Service)
 * Memanggil file template bernama 'GPS'
 */
function doGet() {
  return HtmlService.createTemplateFromFile('GPS')
    .evaluate()
    .setTitle('Absensi Online KJPP NSR')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Mendapatkan Spreadsheet Database Aktif
 */
function getSS_() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Setup struktur sheet pengujian otomatis
 * KEAMANAN TINGGI: Hanya boleh dijalankan pada Database Pengujian / Staging
 */
function setupTestingSheet() {
  const ss = getSS_();
  let ssName = '';
  try { ssName = ss.getName().toUpperCase(); } catch(e) {}

  // GUARD: Menolak eksekusi pada database produksi
  if (CONFIG.IS_PRODUCTION === true || ssName.indexOf('PRODUKSI') !== -1 || ssName.indexOf('LIVE') !== -1) {
    throw new Error('KEAMANAN: setupTestingSheet() DIBLOKIR! Dilarang mengeksekusi setup dummy pada database produksi asli!');
  }
  
  // 1. MASTER KARYAWAN
  ensureSheet_(ss, CONFIG.SHEET_KARYAWAN, ['NIK', 'Nama', 'Jabatan', 'Divisi', 'Email', 'StatusAktif']);
  
  // 2. ABSENSI
  ensureSheet_(ss, CONFIG.SHEET_ABSENSI, [
    'Timestamp', 'Tanggal', 'Jam', 'NIK', 'Nama', 'Jabatan', 'Divisi',
    'JenisPresensi', 'LokasiPresensi', 'KoordinatGPS', 'KantorTerdekat', 'JarakMeter', 'StatusValidasi'
  ]);
  
  // 3. MASTER WFH
  ensureSheet_(ss, CONFIG.SHEET_WFH, ['Timestamp', 'NIK', 'Nama', 'AlamatRumah', 'KoordinatGPS', 'Status']);
  
  // 4. PENGAJUAN CUTI
  ensureSheet_(ss, CONFIG.SHEET_CUTI, [
    'Timestamp', 'NIK', 'Nama', 'KategoriCuti', 'TanggalMulai', 'TanggalSelesai',
    'Alasan', 'FileUrl', 'FileName', 'StatusPersetujuan'
  ]);

  // Isi data dummy pengujian jika sheet karyawan masih kosong
  const shKaryawan = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (shKaryawan.getLastRow() <= 1) {
    shKaryawan.getRange(2, 1, 4, 6).setValues([
      ['NSR-001', 'Budi Santoso, S.T.', 'Penilai Properti', 'Divisi Penilaian Properti', 'budi@kjppnsr.id', 'AKTIF'],
      ['NSR-002', 'Siti Aminah, S.E.', 'Penilai Bisnis', 'Divisi Penilaian Bisnis', 'siti@kjppnsr.id', 'AKTIF'],
      ['NSR-003', 'Ahmad Fauzi', 'Staf Teknis Inspeksi', 'Divisi Operasional', 'ahmad@kjppnsr.id', 'AKTIF'],
      ['NSR-004', 'Dewi Lestari', 'Administrasi & Keuangan', 'Divisi Keuangan', 'dewi@kjppnsr.id', 'AKTIF']
    ]);
  }

  return 'Setup Spreadsheet Pengujian Berhasil!';
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * 1. Verifikasi Data Karyawan via NIK
 */
function cekKaryawan(nik) {
  if (!nik) return null;
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === cleanNik) {
      if (String(data[i][5]).toUpperCase() !== 'AKTIF') {
        throw new Error('Status karyawan tidak aktif. Hubungi bagian HR/Operasional.');
      }
      return {
        nama: String(data[i][1]).trim(),
        jabatan: String(data[i][2]).trim(),
        divisi: String(data[i][3]).trim()
      };
    }
  }
  return null;
}

/**
 * 2. Cek Titik Lokasi Rumah WFH Terdaftar
 */
function cekLokasiWFH(nik) {
  if (!nik) return null;
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_WFH);
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  // Cari dari baris terbawah (terbaru)
  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][1]).trim().toUpperCase() === cleanNik) {
      return {
        alamat: data[i][3],
        gps: String(data[i][4]).trim()
      };
    }
  }
  return null;
}

/**
 * 3. Mencegah Presensi Ganda pada Hari yang Sama
 */
function cekDoubleAbsensi(nik, jenis, tglStr) {
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
  if (!sh || sh.getLastRow() < 2) return false;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = data.length - 1; i >= 0; i--) {
    const rowTgl = String(data[i][1]).trim();
    const rowNik = String(data[i][3]).trim().toUpperCase();
    const rowJenis = String(data[i][7]).trim();

    if (rowNik === cleanNik && rowTgl === tglStr && rowJenis === jenis) {
      return true;
    }
  }
  return false;
}

/**
 * 4. Hitung Jarak Geografis Menggunakan Formula Haversine (Hasil dalam Meter)
 */
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 5. SIMPAN PRESENSI (DENGAN DISTINKSI VALID vs TIDAK VALID)
 * Parameter: { nik, jenis, lokasi, gps }
 */
function simpanAbsensi(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    if (!params || !params.nik || !params.jenis || !params.lokasi || !params.gps) {
      throw new Error('Parameter data presensi tidak lengkap.');
    }

    const nik = String(params.nik).trim();
    const jenis = String(params.jenis).trim();   // "Masuk", "Pulang", "Dinas Luar"
    const lokasi = String(params.lokasi).trim(); // "KANTOR", "WFH", "DINAS LUAR"
    const gps = String(params.gps).trim();

    // Verifikasi identitas karyawan
    const profil = cekKaryawan(nik);
    if (!profil) {
      throw new Error('NIK [' + nik + '] tidak terdaftar di database Master Karyawan.');
    }

    const now = new Date();
    const tglStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
    const jamStr = Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm:ss') + ' WIB';

    // Cek double submission
    if (cekDoubleAbsensi(nik, jenis, tglStr)) {
      throw new Error('Anda sudah melakukan presensi ' + jenis + ' untuk hari ini (' + tglStr + ').');
    }

    // Parse koordinat GPS user
    const coords = gps.split(',');
    if (coords.length < 2) {
      throw new Error('Format koordinat GPS tidak valid.');
    }
    const userLat = parseFloat(coords[0].trim());
    const userLng = parseFloat(coords[1].trim());

    if (isNaN(userLat) || isNaN(userLng)) {
      throw new Error('Nilai latitude/longitude GPS tidak dapat dibaca.');
    }

    let statusValidasi = 'VALID';
    let kantorTerdekat = '-';
    let jarakMeter = 0;

    // Evaluasi Lokasi & Geofence Multi-Kantor
    if (lokasi === 'KANTOR') {
      let minJarak = Infinity;
      let namaKantor = '';

      CONFIG.KANTOR_CABANG.forEach(function(k) {
        const d = hitungJarak(userLat, userLng, k.lat, k.lng);
        if (d < minJarak) {
          minJarak = d;
          namaKantor = k.nama;
        }
      });

      kantorTerdekat = namaKantor;
      jarakMeter = minJarak;

      if (minJarak > CONFIG.RADIUS_KANTOR_METER) {
        statusValidasi = 'TIDAK VALID';
      }
    } else if (lokasi === 'WFH') {
      const dataWFH = cekLokasiWFH(nik);
      if (!dataWFH || !dataWFH.gps) {
        kantorTerdekat = 'Rumah (Belum Terdaftar)';
        jarakMeter = 999999;
        statusValidasi = 'TIDAK VALID';
      } else {
        const wCoords = dataWFH.gps.split(',');
        const wLat = parseFloat(wCoords[0].trim());
        const wLng = parseFloat(wCoords[1].trim());
        const d = hitungJarak(userLat, userLng, wLat, wLng);
        kantorTerdekat = 'Rumah WFH';
        jarakMeter = d;

        if (d > CONFIG.RADIUS_WFH_METER) {
          statusValidasi = 'TIDAK VALID';
        }
      }
    } else if (lokasi === 'DINAS LUAR') {
      kantorTerdekat = 'Lokasi Penugasan Lapangan';
      jarakMeter = 0;
      statusValidasi = 'VALID';
    }

    // Tulis ke spreadsheet
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    sh.appendRow([
      ts,
      tglStr,
      jamStr,
      nik,
      profil.nama,
      profil.jabatan,
      profil.divisi,
      jenis,
      lokasi,
      gps,
      kantorTerdekat,
      jarakMeter,
      statusValidasi
    ]);

    return {
      success: true,
      status: statusValidasi,
      nama: profil.nama,
      jarak: jarakMeter,
      kantor: kantorTerdekat,
      pesan: (statusValidasi === 'VALID')
        ? 'Presensi ' + jenis + ' berhasil diverifikasi VALID.'
        : 'Presensi tersimpan, namun berada di luar radius (' + jarakMeter + ' meter). Status: TIDAK VALID.'
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. DAFTARKAN LOKASI RUMAH WFH
 * Parameter: { nik, alamat, gps }
 */
function simpanWFH(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    if (!params || !params.nik || !params.alamat || !params.gps) {
      throw new Error('Data pendaftaran WFH tidak lengkap.');
    }

    const nik = String(params.nik).trim();
    const profil = cekKaryawan(nik);
    if (!profil) {
      throw new Error('NIK [' + nik + '] tidak terdaftar di database Master Karyawan.');
    }

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_WFH);

    sh.appendRow([
      ts,
      nik,
      profil.nama,
      String(params.alamat).trim(),
      String(params.gps).trim(),
      'AKTIF'
    ]);

    return {
      success: true,
      pesan: 'Titik koordinat domisili WFH untuk ' + profil.nama + ' berhasil dikunci.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 7. SIMPAN PENGAJUAN IZIN / CUTI DENGAN ISOLASI FOLDER & VALIDASI FILE SERVER
 * Parameter: { nik, jenisCuti, tglMulai, tglSelesai, alasan, fileData, fileName }
 */
function simpanPengajuanCuti(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!params || !params.nik || !params.jenisCuti || !params.tglMulai || !params.tglSelesai) {
      throw new Error('Lengkapi NIK, Kategori Cuti, dan rentang tanggal pengajuan.');
    }

    const nik = String(params.nik).trim();
    const profil = cekKaryawan(nik);
    if (!profil) {
      throw new Error('NIK [' + nik + '] tidak terdaftar di database Master Karyawan.');
    }

    let fileUrl = '-';
    let storedFileName = '-';

    // Proses Lampiran File (Jika ada)
    if (params.fileData && params.fileName) {
      const parts = String(params.fileData).split(';base64,');
      if (parts.length === 2) {
        const mimeType = parts[0].replace('data:', '').toLowerCase();
        const base64Data = parts[1];

        // Validasi Whitelist Tipe File di Sisi Server
        const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedMimes.indexOf(mimeType) === -1) {
          throw new Error('Tipe file tidak diizinkan di server. Hanya PDF, JPG, dan PNG yang diperbolehkan.');
        }

        // Validasi Ukuran File di Sisi Server (Maks 5 MB)
        const fileSizeEstimate = (base64Data.length * 3) / 4;
        if (fileSizeEstimate > 5 * 1024 * 1024) {
          throw new Error('Ukuran lampiran melebihi batas server (Maksimal 5 MB).');
        }

        const decoded = Utilities.base64Decode(base64Data);
        const cleanName = 'CUTI_' + nik + '_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + params.fileName.replace(/[^a-zA-Z0-9._-]/g, '');
        const blob = Utilities.newBlob(decoded, mimeType, cleanName);

        // Ambil folder pengujian terisolasi (BUKAN pencarian nama global BUKTI_CUTI_KJPP)
        let folder;
        if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim() !== '') {
          folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        } else {
          // Buat folder terisolasi di bawah file spreadsheet aktif
          const ss = getSS_();
          const ssFile = DriveApp.getFileById(ss.getId());
          const parents = ssFile.getParents();
          const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
          
          const folderIter = parentFolder.getFoldersByName('LAMPIRAN_CUTI_TESTING');
          if (folderIter.hasNext()) {
            folder = folderIter.next();
          } else {
            folder = parentFolder.createFolder('LAMPIRAN_CUTI_TESTING');
          }
        }

        const uploadedFile = folder.createFile(blob);
        
        // KEAMANAN TINGGI: Jangan gunakan ANYONE_WITH_LINK! File tetap privat/terbatas hak aksesnya
        // uploadedFile.setSharing(...) dihapus. Hanya pemegang hak akses Drive yang bisa melihat file.

        fileUrl = uploadedFile.getUrl();
        storedFileName = cleanName;
      }
    }

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_CUTI);

    sh.appendRow([
      ts,
      nik,
      profil.nama,
      String(params.jenisCuti).trim(),
      String(params.tglMulai).trim(),
      String(params.tglSelesai).trim(),
      params.alasan ? String(params.alasan).trim() : '-',
      fileUrl,
      storedFileName,
      'MENUNGGU_PERSETUJUAN'
    ]);

    return {
      success: true,
      pesan: 'Permohonan ' + params.jenisCuti + ' untuk ' + profil.nama + ' berhasil terkirim.'
    };

  } finally {
    lock.releaseLock();
  }
}
