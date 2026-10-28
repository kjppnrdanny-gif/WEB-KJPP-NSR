import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

const targetOld = `      } else {
        selDok.innerHTML = \`
          <option value="ALL">Semua 9 Dokumen (Bundel Lengkap A4)</option>
          <option value="DOK1">Dokumen 1: Lingkup Penugasan (SPK 23 Klausul)</option>
          <option value="LAMP1">Lampiran 1: Daftar Objek Penilaian (Khusus Multi-Objek)</option>
          <option value="DOK2">Dokumen 2: Surat Representasi Klien (KEPI 5.8.c.4)</option>
          <option value="DOK3">Bundel JO Lengkap (7 Lembar Kerja Internal)</option>
          <option value="DOK3A">3A. Isian UMUM</option>
          <option value="DOK3B">3B. Form Order (JO 2026)</option>
          <option value="DOK3C">3C. Kartu Proyek (Kendali Mutu Berjenjang)</option>
          <option value="DOK3D">3D. Surat Tugas Resmi</option>
          <option value="DOK3E">3E. Berita Acara Inspeksi (BAP)</option>
          <option value="DOK3F">3F. Evaluasi Tingkat Independensi (ETI)</option>
          <option value="DOK3G">3G. Pernyataan Independensi (PI)</option>
        \`;
      }`;

const targetNew = `      } else {
        selDok.innerHTML = \`
          <option value="ALL">Semua 9 Dokumen Master (Bundel Lengkap A4)</option>
          <option value="DOK1">Dokumen 1: Lingkup Penugasan (SPK 23 Klausul Master)</option>
          <option value="DOK2">Dokumen 2: Surat Representasi (Kebenaran Dokumen &amp; Bebas Penilaian Ulang)</option>
          <option value="DOK3">Dokumen 3: Isian UMUM (Form Standar Lingkup Penugasan)</option>
          <option value="DOK4">Dokumen 4: Lembar Order (JO / Job Order 2026)</option>
          <option value="DOK5">Dokumen 5: Kartu Proyek (Kendali Mutu Berjenjang)</option>
          <option value="DOK6">Dokumen 6: Surat Tugas Penilaian Resmi</option>
          <option value="DOK7">Dokumen 7: Berita Acara Pemeriksaan (BAP / Inspeksi)</option>
          <option value="DOK8">Dokumen 8: Evaluasi Tingkat Independensi (ETI KEPI 5.8)</option>
          <option value="DOK9">Dokumen 9: Pernyataan Independensi (PI Multi-Personel)</option>
          <!-- Dokumen Operasional Pendukung -->
          <option value="SUPP_PENAWARAN">Dokumen Pendukung: Surat Penawaran Biaya Penilaian</option>
          <option value="SUPP_DISPOSISI">Dokumen Pendukung: Disposisi Approval SPK &amp; JO</option>
          <option value="SUPP_REVIEW">Dokumen Pendukung: Lembar Review Pengajuan Pusat</option>
        \`;
      }`;

// Normalize line breaks for matching
const isCrlf = content.includes('\r\n');
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetOld.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  let replaced = normalizedContent.replace(normalizedTarget, targetNew.replace(/\r\n/g, '\n'));
  if (isCrlf) {
    replaced = replaced.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, replaced, 'utf8');
  console.log('Successfully updated updateFilterDokumenByRole in portal-penugasan-jo.html');
} else {
  console.error('Target snippet not found in portal-penugasan-jo.html');
  process.exit(1);
}
