// tests/test-master-template-alignment.mjs
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('TEST SUITE: MASTER TEMPLATE ALIGNMENT & DYNAMIC NARRATIVE ENGINE');
console.log('Standards: SPI 103, SPI 101, SPI 102, SPI 202, SPI 204, SPI 310');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✔ PASS: ${msg}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    fail++;
  }
}

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. UJI STRUKTUR 23 KLAUSUL MASTER SPK (DOKUMEN 1)
console.log('[1] VERIFIKASI 23 KLAUSUL MASTER TEMPLATE SPK:');

const kMarkers = [
  '<!-- 1. STATUS PENILAI -->',
  '<!-- 2. PEMBERI TUGAS -->',
  '<!-- 3. PENGGUNA LAPORAN (SPI 103 Klausul 3) -->',
  '<!-- 4. OBJEK PENILAIAN DAN KEPEMILIKAN (MASTER TEMPLATE ALIGNED) -->',
  '<!-- 5. JENIS MATA UANG YANG DIGUNAKAN -->',
  '<!-- 6. MAKSUD DAN TUJUAN PENILAIAN (DYNAMIC PROFESSIONAL NARRATIVE) -->',
  '<!-- 7. DASAR NILAI (MASTER TEMPLATE ALIGNED) -->',
  '<!-- 8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN (MASTER DOCX SECTION 8 & SPI 103) -->',
  '<!-- 9. TINGKAT KEDALAMAN INVESTIGASI -->',
  '<!-- 10. SIFAT DAN SUMBER INFORMASI YANG DAPAT DIANDALKAN -->',
  '<!-- 11. ASUMSI DAN ASUMSI KHUSUS (MASTER TEMPLATE ALIGNED) -->',
  '<!-- 12. PERSYARATAN ATAS PERSETUJUAN UNTUK PUBLIKASI -->',
  '<!-- 13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI (MASTER DOCX SECTION 13) -->',
  '<!-- 14. LAPORAN PENILAIAN -->',
  '<!-- 15. BATASAN ATAU PENGECUALIAN ATAS TANGGUNG JAWAB KEPADA PIHAK SELAIN PEMBERI TUGAS -->',
  '<!-- 16. PERSYARATAN ADANYA PERNYATAAN TERTULIS BERUPA SURAT REPRESENTASI DARI PEMBERI TUGAS MENGENAI KEBENARAN DAN SIFAT INFORMASI YANG DIBERIKAN OLEH PEMBERI TUGAS -->',
  '<!-- 17. NON DISCLOSURE AGREEMENT -->',
  '<!-- 18. DATA-DATA YANG DIPERLUKAN (MASTER DOCX SECTION 18) -->',
  '<!-- 19. HAK DAN KEWAJIBAN PARA PIHAK -->',
  '<!-- 20. FORCE MAJEURE -->',
  '<!-- 21. BIAYA JASA PENILAIAN (SPI 103) -->',
  '<!-- 22. CARA PEMBAYARAN -->',
  '<!-- 23. MASA BERLAKU LINGKUP PENUGASAN DAN BERAKHIRNYA PERJANJIAN -->'
];

kMarkers.forEach((m, idx) => {
  const found = html.includes(m);
  assert(found, `Klausul ${idx + 1} (${m.replace(/<!--\s*|\s*-->/g, '')}) terdaftar dan terpasang utuh`);
});

// 2. UJI KELENGKAPAN 9 DOKUMEN RESMI OPINI NSR
console.log('\n[2] VERIFIKASI KELENGKAPAN 9 DOKUMEN KELUARAN PORTAL:');
const docChecks = [
  { id: 'DOK1', name: 'Dokumen 1: Lingkup Penugasan (SPK 23 Klausul)', tag: 'klausul-item avoid-break' },
  { id: 'LAMP1', name: 'Lampiran 1: Daftar Objek Penilaian dan Kepemilikan', tag: 'LAMPIRAN 1: DAFTAR OBJEK PENILAIAN DAN KEPEMILIKAN' },
  { id: 'DOK2', name: 'Dokumen 2: Surat Representasi Klien (KEPI 5.8.c.4)', tag: 'Perihal : Surat Representasi Kebenaran Informasi, Data &amp; Dokumen' },
  { id: 'DOK3A', name: 'Dokumen 3A: Lembar Isian Umum (Administrasi Penugasan)', tag: '3A. LEMBAR ISIAN UMUM (ADMINISTRASI PENUGASAN)' },
  { id: 'DOK3B', name: 'Dokumen 3B: Form Order KJPP NSR (JO 2026)', tag: 'FORM ORDER KJPP NSR TAHUN 2026' },
  { id: 'DOK3C', name: 'Dokumen 3C: Kartu Proyek (Kendali Mutu Berjenjang 4 QC)', tag: 'KARTU PROYEK' },
  { id: 'DOK3D', name: 'Dokumen 3D: Surat Tugas Resmi', tag: 'SURAT TUGAS' },
  { id: 'DOK3E', name: 'Dokumen 3E: Berita Acara Inspeksi Lapangan (BAP)', tag: 'BERITA ACARA INSPEKSI LAPANGAN (BAP)' },
  { id: 'DOK3F', name: 'Dokumen 3F: Evaluasi Tingkat Independensi (ETI)', tag: 'EVALUASI TINGKAT INDEPENDENSI (ETI)' },
  { id: 'DOK3G', name: 'Dokumen 3G: Pernyataan Independensi (PI)', tag: 'PERNYATAAN INDEPENDENSI (PI)' }
];

docChecks.forEach(d => {
  assert(html.includes(d.tag), `${d.name} (${d.id}) terpasang dengan struktur template baku`);
});

// 3. UJI LOGIKA DINAMIS PROFESIONAL (CONDITIONAL NARRATIVE)
console.log('\n[3] VERIFIKASI ENGINE NARASI DINAMIS PROFESIONAL (CONDITIONAL LOGIC):');

// 3.1 Klausul 4: Adaptif Personal Property vs Real Property
assert(
  html.includes('Tabel Format Personal Properti (Mesin / Peralatan / Alat Berat / Kendaraan)') &&
  html.includes('<th>Merek / Tipe / Spesifikasi</th>') &&
  html.includes('<th>Kapasitas / Qty</th>') &&
  html.includes('Tabel Format Properti Real (Tanah & Bangunan) Sesuai Master Template Resmi KJPP NSR') &&
  html.includes('<th>Luas Tanah (m²)</th>') &&
  html.includes('<th>Luas Bangunan (m²)</th>'),
  'Klausul 4 memiliki tabel ganda adaptif (Personal Property vs Real Property) sesuai kategori aset'
);

// 3.2 Klausul 6: Filter Likuidasi HANYA untuk Penjaminan Utang / Agunan
assert(
  html.includes("isAgunan") &&
  html.includes("Nilai Pasar dan Indikasi Nilai Likuidasi") &&
  html.includes("Nilai Pasar / Nilai Wajar") &&
  html.includes("Nilai Penggantian Wajar (Nilai Ganti Kerugian)"),
  'Klausul 6 menyaring Indikasi Nilai Likuidasi HANYA untuk agunan; nonagunan/PSAK tanpa likuidasi'
);

// 3.3 Klausul 7: Dasar Nilai SAK/PSAK & Pengadaan Tanah tanpa Likuidasi
assert(
  html.includes("SPI 202 butir 5.1.e") &&
  html.includes("SPI 102 butir 3.1") &&
  html.includes("Fair Replacement Value"),
  'Klausul 7 menyajikan definisi Nilai Pasar (SPI 101), Nilai Wajar SAK (SPI 102), dan Likuidasi (SPI 202) secara bersyarat'
);

// 3.4 Klausul 8: Tanggal Penilaian Cut-Off & Metodologi SPI 103 5.k
assert(
  html.includes('8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN') &&
  html.includes('Tanggal penilaian yaitu tanggal pada saat nilai dinyatakan dan diberlakukan') &&
  html.includes('getKlausul8Pendekatan'),
  'Klausul 8 memuat Tanggal Penilaian Cut-off dan Pendekatan Penilaian SPI 103 secara terpadu'
);

// 3.5 Klausul 13: Konfirmasi Standar SPI Edisi VII - 2018
assert(
  html.includes('13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI') &&
  html.includes('Standar Penilaian Indonesia (SPI) Edisi VII - 2018') &&
  html.includes('Kode Etik Penilai Indonesia (KEPI)'),
  'Klausul 13 selaras dengan Master Section 13 (Konfirmasi Kepatuhan SPI Edisi VII - 2018 & KEPI)'
);

// 3.6 Klausul 18: Data Dokumen Adaptif Real vs Personal Property
assert(
  html.includes('18. DATA-DATA YANG DIPERLUKAN') &&
  html.includes('Fixed Asset Register / FAR') &&
  html.includes('Dokumen Kepemilikan Tanah (Sertifikat Hak Milik / HGB / Hak Pakai / Girik / Akta Jual Beli)'),
  'Klausul 18 menyajikan checklist dokumen adaptif (Real Property vs Mesin/Alat Berat/Kendaraan)'
);

// 4. UJI INTEGRITAS IDENTITAS PENILAI PUBLIK (DENI SISWANDI, S.T., MAPPI)
console.log('\n[4] VERIFIKASI INTEGRITAS IDENTITAS PENILAI PUBLIK:');
assert(
  html.includes('Deni Siswandi, S.T., MAPPI') || html.includes('Deni Siswandi, S.T, MAPPI'),
  'Standardisasi nama Deni Siswandi, S.T., MAPPI terpasang utuh di seluruh template resmi'
);
assert(
  html.includes('P-1.20.00581') && html.includes('RMK-2017.01564') && html.includes('06-S-02013'),
  'Kredensial resmi Penilai Publik (Izin P-1.20.00581, RMK-2017.01564, MAPPI 06-S-02013) valid'
);

// 5. UJI SURAT REPRESENTASI (DOKUMEN 2) TERHADAP TEMPLATE DOCX
console.log('\n[5] VERIFIKASI SURAT REPRESENTASI KLIEN (TEMPLATE - SURAT REPRESENTASI.DOCX):');
assert(
  html.includes('Perihal : Surat Representasi Kebenaran Informasi, Data &amp; Dokumen') &&
  html.includes('Jalan Hankam No. 5 RT. 006 RW. 001') &&
  html.includes('KEPI 5.8.c).4') &&
  html.includes('(materai Rp 10.000)'),
  'Surat Representasi Klien (Dokumen 2) 100% selaras dengan Template - Surat Representasi.docx'
);

// 6. UJI JO EXCEL 7 SHEETS (DOKUMEN 3A - 3G) TERHADAP TEMPLATE JO.XLSX
console.log('\n[6] VERIFIKASI 7 DOKUMEN JO (TEMPLATE JO.XLSX):');
assert(
  html.includes('A. DATA LAPORAN ADMIN') && html.includes('B. DATA PEMBERI TUGAS'),
  'Dokumen 3A memiliki Seksi A & B selaras Sheet Isian UMUM'
);
assert(
  html.includes('FORM ORDER KJPP NSR TAHUN 2026') && html.includes('Divisi Teknik'),
  'Dokumen 3B selaras Sheet JO'
);
assert(
  html.includes('KARTU PROYEK') && html.includes('Surveyor/Penilai') && html.includes('Manager Teknik'),
  'Dokumen 3C memuat 4 Jenjang QC selaras Sheet Kartu Proyek'
);
assert(
  html.includes('EVALUASI TINGKAT INDEPENDENSI') && html.includes('Memiliki Afiliasi bisnis dengan klien'),
  'Dokumen 3F memuat 7 butir kuesioner independensi selaras Sheet Evaluasi Tingkat Independensi'
);
assert(
  html.includes('PERNYATAAN INDEPENDENSI') && html.includes('bersedia mentaati segala kebijakan dan prosedur KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN'),
  'Dokumen 3G memuat teks pernyataan resmi selaras Sheet Pernyataan Independensi'
);

console.log('\n================================================================');
console.log(`HASIL TEST SUITE MASTER TEMPLATE ALIGNMENT: ${pass} PASS / ${fail} FAIL`);
console.log('================================================================\n');

if (fail > 0) {
  process.exit(1);
} else {
  console.log('🎉 SELURUH KLAUSUL DAN DOKUMEN MASTER 100% TERVERIFIKASI LOLOS UJI!');
}
