import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 VERIFIKASI: Generator Cetak Surat Tugas & Tanda Terima Lapangan (M-03)');
console.log('====================================================\n');

const html = fs.readFileSync(path.resolve('portal-tracking.html'), 'utf8');

const tests = [
  {
    name: 'Kop Surat Resmi Format Baku KMK 248/KM.1/2019',
    pass: html.includes('KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN') &&
          html.includes('Izin Usaha Menteri Keuangan RI No. 2.19.0160 (KMK No. 248/KM.1/2019)')
  },
  {
    name: 'Modal Container & Floating Toolbar (#modal-cetak-surat-tugas)',
    pass: html.includes('id="modal-cetak-surat-tugas"') &&
          html.includes('id="btn-mode-st-all"') &&
          html.includes('id="btn-mode-st-only"') &&
          html.includes('id="btn-mode-bai-only"') &&
          html.includes('tutupModalCetakSuratTugas()')
  },
  {
    name: 'Lembar 1: Surat Tugas Inspeksi Lapangan (#lembar-surat-tugas)',
    pass: html.includes('id="lembar-surat-tugas"') &&
          html.includes('SURAT TUGAS INSPEKSI LAPANGAN') &&
          html.includes('id="st-nomor-surat"') &&
          html.includes('id="st-petugas-nama"') &&
          html.includes('id="st-petugas-nik"') &&
          html.includes('id="st-jo-number"') &&
          html.includes('id="st-debitur"') &&
          html.includes('id="st-lokasi-aset"') &&
          html.includes('id="st-qrcode-box"') &&
          html.includes('id="st-pimpinan-nama"')
  },
  {
    name: 'Lembar 2: Berita Acara Inspeksi & Tanda Terima Fisik (#lembar-tanda-terima)',
    pass: html.includes('id="lembar-tanda-terima"') &&
          html.includes('BERITA ACARA INSPEKSI &amp; TANDA TERIMA LAPANGAN (BAI)') &&
          html.includes('id="bai-nomor-surat"') &&
          html.includes('1. IDENTITAS PENDAMPING LAPANGAN') &&
          html.includes('Hubungan / Kapasitas Pendamping:') &&
          html.includes('2. WAKTU PELAKSANAAN &amp; KONDISI LINGKUNGAN:') &&
          html.includes('3. LINGKUP AKSES FISIK &amp; VERIFIKASI BATAS LAPANGAN:') &&
          html.includes('Catatan Akses Lapangan / Kondisi Khusus Objek:') &&
          html.includes('Pihak Pendamping Lapangan,') &&
          html.includes('id="bai-ttd-surveyor"')
  },
  {
    name: 'Integrasi Tombol Aksi di Seluruh Antarmuka (Row, Modal M-03, Detail)',
    pass: html.includes('bukaModalCetakSuratTugas') &&
          html.includes('cetakSuratTugasAktif()') &&
          html.includes('cetakTandaTerimaAktif()') &&
          html.includes('📄 Tugas')
  },
  {
    name: 'Aturan CSS Print A4 & Isolasi Cetak',
    pass: html.includes('body.modal-surat-tugas-open') &&
          html.includes('#modal-cetak-surat-tugas:not(.hidden)') &&
          html.includes('.st-page-break')
  },
  {
    name: 'Engine JavaScript & Penomoran Otomatis Berbasis Cabang',
    pass: html.includes('function bukaModalCetakSuratTugas(') &&
          html.includes('function setModeCetakSuratTugas(') &&
          html.includes('window.bukaModalCetakSuratTugas = bukaModalCetakSuratTugas;') &&
          html.includes('window.setModeCetakSuratTugas = setModeCetakSuratTugas;') &&
          html.includes('window.cetakSuratTugasAktif = cetakSuratTugasAktif;') &&
          html.includes('window.cetakTandaTerimaAktif = cetakTandaTerimaAktif;')
  }
];

let allPassed = true;
tests.forEach((t, i) => {
  if (t.pass) {
    console.log(`✅ [${i + 1}/${tests.length}] ${t.name}: PASS`);
  } else {
    console.error(`❌ [${i + 1}/${tests.length}] ${t.name}: FAIL`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\n🎉 SELURUH SPESIFIKASI OPSI B (SURAT TUGAS & BAI) TERVERIFIKASI SEMPURNA!');
}
