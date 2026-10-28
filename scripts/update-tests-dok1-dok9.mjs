import fs from 'fs';

// 1. Update tests/test-master-template-alignment.mjs
{
  const file = 'tests/test-master-template-alignment.mjs';
  let content = fs.readFileSync(file, 'utf8');
  const isCrlf = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  const oldDocChecks = `const docChecks = [
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
];`;

  const newDocChecks = `const docChecks = [
  { id: 'DOK1', name: 'Dokumen 1: Lingkup Penugasan (SPK 23 Klausul Master)', tag: 'klausul-item avoid-break' },
  { id: 'LAMP1', name: 'Lampiran 1: Daftar Objek Penilaian dan Kepemilikan', tag: 'LAMPIRAN 1: DAFTAR OBJEK PENILAIAN DAN KEPEMILIKAN' },
  { id: 'DOK2', name: 'Dokumen 2: Surat Representasi (Kebenaran Dokumen & Bebas Penilaian Ulang)', tag: 'Perihal : Surat Representasi Kebenaran Informasi, Data &amp; Dokumen' },
  { id: 'DOK3', legacyId: 'DOK3A', name: 'Dokumen 3: Isian UMUM (Form Standar Lingkup Penugasan)', tag: '3A. LEMBAR ISIAN UMUM (ADMINISTRASI PENUGASAN)' },
  { id: 'DOK4', legacyId: 'DOK3B', name: 'Dokumen 4: Lembar Order (JO / Job Order 2026)', tag: 'FORM ORDER KJPP NSR TAHUN 2026' },
  { id: 'DOK5', legacyId: 'DOK3C', name: 'Dokumen 5: Kartu Proyek (Kendali Mutu Berjenjang)', tag: 'KARTU PROYEK' },
  { id: 'DOK6', legacyId: 'DOK3D', name: 'Dokumen 6: Surat Tugas Penilaian Resmi', tag: 'SURAT TUGAS' },
  { id: 'DOK7', legacyId: 'DOK3E', name: 'Dokumen 7: Berita Acara Pemeriksaan (BAP / Inspeksi)', tag: 'BERITA ACARA INSPEKSI LAPANGAN (BAP)' },
  { id: 'DOK8', legacyId: 'DOK3F', name: 'Dokumen 8: Evaluasi Tingkat Independensi (ETI KEPI 5.8)', tag: 'EVALUASI TINGKAT INDEPENDENSI (ETI)' },
  { id: 'DOK9', legacyId: 'DOK3G', name: 'Dokumen 9: Pernyataan Independensi (PI Multi-Personel)', tag: 'PERNYATAAN INDEPENDENSI (PI)' }
];`;

  if (content.includes(oldDocChecks)) {
    content = content.replace(oldDocChecks, newDocChecks);
    if (isCrlf) content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log('✓ test-master-template-alignment.mjs updated');
  } else {
    console.error('Failed to match oldDocChecks in test-master-template-alignment.mjs');
    process.exit(1);
  }
}

// 2. Update tests/test-targeted-hotfix-c0bb02e.mjs
{
  const file = 'tests/test-targeted-hotfix-c0bb02e.mjs';
  let content = fs.readFileSync(file, 'utf8');
  const isCrlf = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  const oldTargetedPart = `let allNineFound = true;
nineMasterDocs.forEach((d, idx) => {
  const cleanTitle = d.split('(')[0].trim();
  if (!html.includes(cleanTitle)) {
    allNineFound = false;
    assert(false, \`1.3.\${idx+1} Dokumen master "\${cleanTitle}" terdaftar\`);
  }
});
assert(allNineFound, '1.3 Sembilan Dokumen Master terdaftar berurutan tanpa digantikan dokumen operasional');`;

  const newTargetedPart = `let allNineFound = true;
nineMasterDocs.forEach((d, idx) => {
  const cleanTitle = d.split('(')[0].trim();
  const dokKey = 'DOK' + (idx + 1);
  const optPattern = \`value="\${dokKey}"\`;
  if (!html.includes(cleanTitle) || !html.includes(optPattern)) {
    allNineFound = false;
    assert(false, \`1.3.\${idx+1} Dokumen master "\${cleanTitle}" dengan value "\${dokKey}" terdaftar\`);
  }
});
assert(allNineFound, '1.3 Sembilan Dokumen Master terdaftar berurutan dengan key DOK1-DOK9 tanpa digantikan dokumen operasional');

// Verifikasi penghapusan permanen opsi placeholder yang tidak memiliki renderer
assert(
  !html.includes('value="SUPP_PENAWARAN"') &&
  !html.includes('value="SUPP_DISPOSISI"') &&
  !html.includes('value="SUPP_REVIEW"'),
  '1.4 Opsi placeholder tidak terpakai (SUPP_*) telah dibersihkan secara permanen dari antarmuka'
);

// Verifikasi pemetaan renderer presisi DOK1-DOK9 individual dan fallback DOK3A-DOK3G
assert(
  html.includes('selDok === "DOK3" || selDok === "DOK3A"') &&
  html.includes('selDok === "DOK4" || selDok === "DOK3B"') &&
  html.includes('selDok === "DOK5" || selDok === "DOK3C"') &&
  html.includes('selDok === "DOK6" || selDok === "DOK3D"') &&
  html.includes('selDok === "DOK7" || selDok === "DOK3E"') &&
  html.includes('selDok === "DOK8" || selDok === "DOK3F"') &&
  html.includes('selDok === "DOK9" || selDok === "DOK3G"'),
  '1.5 Percabangan renderer renderSemuaDokumen() memetakan DOK1-DOK9 secara presisi individual dengan fallback DOK3A-DOK3G'
);`;

  if (content.includes(oldTargetedPart)) {
    content = content.replace(oldTargetedPart, newTargetedPart);
    if (isCrlf) content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log('✓ test-targeted-hotfix-c0bb02e.mjs updated');
  } else {
    console.error('Failed to match oldTargetedPart in test-targeted-hotfix-c0bb02e.mjs');
    process.exit(1);
  }
}
