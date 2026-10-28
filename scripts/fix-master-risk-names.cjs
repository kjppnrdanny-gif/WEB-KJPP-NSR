const fs = require('fs');

const path = 'data/masters/master_risk_register.json';
const list = JSON.parse(fs.readFileSync(path, 'utf8'));

const riskNames = {
  'R1-IND-01': 'Benturan Kepentingan & Afiliasi Finansial',
  'R1-AUTH-02': 'Kewenangan Pemberi Tugas & Legal Standing Klien',
  'R1-COMP-03': 'Kesesuaian Izin Penilai Publik & Kapasitas Penugasan',
  'R1-PRESS-04': 'Tekanan Nilai / Fee Kontinjensi',
  'R2-HAK-01': 'Kepemilikan & Status Hak Atas Objek',
  'R2-SENG-02': 'Keberadaan Sengketa Hukum / Sita Jaminan',
  'R2-IZIN-03': 'Perizinan Bangunan (IMB/PBG) & Zonasi Tata Ruang',
  'R2-PENGAD-04': 'Legalitas Dokumen Pengadaan Tanah (DPPT/Penlok)',
  'R3-TUJ-01': 'Kesesuaian Maksud & Tujuan Penilaian',
  'R3-PENG-02': 'Pembatasan Pengguna Laporan Sah',
  'R3-DASAR-03': 'Ketepatan Penetapan Dasar Nilai (SPI 101/102)',
  'R4-DATA-01': 'Kecukupan Data Awal & Akses Survei Lapangan',
  'R4-DEV-LUAS-02': 'Deviasi Luas Fisik vs Yuridis',
  'R4-INSP-03': 'Validitas Inspeksi Fisik & Foto Geotagging',
  'R4-MESIN-04': 'Verifikasi Pelat Nama (Nameplate) & Kondisi Mesin',
  'R5-MET-01': 'Penerapan Minimal 2 Pendekatan Penilaian',
  'R5-PEMBANDING-02': 'Kecukupan & Keandalan 3 Data Pembanding Pasar',
  'R5-DEPR-03': 'Estimasi Biaya Pengganti Baru & Perhitungan Penyusutan',
  'R6-LAP-01': 'Kelengkapan Struktur Laporan & Pengungkapan Deviasi',
  'R6-NOLAP-02': 'Kesesuaian 7 Segmen NoLap & Validasi Register',
  'R6-TTD-03': 'Otoritas Tanda Tangan Penilai Publik Berlisensi Sah',
  'R6-ELSA-04': 'Kepatuhan Pelaporan e-Layanan Penilai Publik (ELSA)'
};

list.forEach(r => {
  r.risk_name = riskNames[r.risk_id] || r.risk_id;
});

fs.writeFileSync(path, JSON.stringify(list, null, 2), 'utf8');
console.log('Successfully added risk_name to all entries in master_risk_register.json');
