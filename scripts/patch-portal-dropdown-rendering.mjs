import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean dropdown in HTML (remove placeholder options SUPP_*)
const oldDropdownHtml = `<select id="pilih_tampilan_dokumen" onchange="gantiTampilanDokumen()" class="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none">
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
            </select>`;

const newDropdownHtml = `<select id="pilih_tampilan_dokumen" onchange="gantiTampilanDokumen()" class="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none">
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
            </select>`;

// 2. Clean updateFilterDokumenByRole
const oldRoleDefault = `      } else {
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

const newRoleDefault = `      } else {
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
        \`;
      }`;

// 3. Margin dynamic style check
const oldStyleCheck = `if (selDok === "DOK3A" || selDok === "DOK3B" || selDok === "DOK3C") {`;
const newStyleCheck = `if (selDok === "DOK3" || selDok === "DOK3A" || selDok === "DOK4" || selDok === "DOK3B" || selDok === "DOK5" || selDok === "DOK3C") {`;

// 4. Renderer branch conditions & page breaks
// DOK 3 (3A)
const oldDok3A = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3A") {\n        const dok3A = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}">`;
const newDok3A = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK3" || selDok === "DOK3A") {\n        const dok3A = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}">`;

// DOK 4 (3B)
const oldDok3B = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3B") {\n        const dok3B = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[11px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}">`;
const newDok3B = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK4" || selDok === "DOK3B") {\n        const dok3B = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[11px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}">`;

// DOK 5 (3C)
const oldDok3C = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3C") {\n        const dok3C = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[10px] leading-snug text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}" style="page-break-inside: avoid; break-inside: avoid;">`;
const newDok3C = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK5" || selDok === "DOK3C") {\n        const dok3C = \`\n          <div class="doc-page sheet-a4 sheet-internal doc-page-internal halaman-cetak text-[10px] leading-snug text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}" style="page-break-inside: avoid; break-inside: avoid;">`;

// DOK 6 (3D)
const oldDok3D = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3D") {\n        const dok3D = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[11.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}">`;
const newDok3D = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK6" || selDok === "DOK3D") {\n        const dok3D = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[11.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}">`;

// DOK 7 (3E)
const oldDok3E = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3E") {\n        const assetCompBAP = detectAssetComposition(listObjekLengkap);\n        const dok3E = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}">`;
const newDok3E = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK7" || selDok === "DOK3E") {\n        const assetCompBAP = detectAssetComposition(listObjekLengkap);\n        const dok3E = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}">`;

// DOK 8 (3F)
const oldDok3F = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3F") {\n        const dok3F = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'DOK3') ? 'page-break mb-12' : ''}">`;
const newDok3F = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK8" || selDok === "DOK3F") {\n        const dok3F = \`\n          <div class="doc-page sheet-a4 halaman-cetak text-[10.5px] leading-relaxed text-slate-900 font-sans \${(selDok === 'ALL' || selDok === 'BUNDEL_JO') ? 'page-break mb-12' : ''}">`;

// DOK 9 (3G)
const oldDok3G = `if (selDok === "ALL" || selDok === "DOK3" || selDok === "DOK3G") {\n        const dok3G = \``;
const newDok3G = `if (selDok === "ALL" || selDok === "BUNDEL_JO" || selDok === "DOK9" || selDok === "DOK3G") {\n        const dok3G = \``;

const isCrlf = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

function doReplace(target, replacement, desc) {
  const normT = target.replace(/\r\n/g, '\n');
  const normR = replacement.replace(/\r\n/g, '\n');
  if (!norm.includes(normT)) {
    console.error('Target not found for:', desc);
    process.exit(1);
  }
  norm = norm.replace(normT, normR);
  console.log('✓ Success:', desc);
}

doReplace(oldDropdownHtml, newDropdownHtml, 'Dropdown HTML clean placeholder options');
doReplace(oldRoleDefault, newRoleDefault, 'updateFilterDokumenByRole clean placeholder options');
doReplace(oldStyleCheck, newStyleCheck, 'Dynamic style margin check');
doReplace(oldDok3A, newDok3A, 'Dokumen 3 (3A) renderer branch');
doReplace(oldDok3B, newDok3B, 'Dokumen 4 (3B) renderer branch');
doReplace(oldDok3C, newDok3C, 'Dokumen 5 (3C) renderer branch');
doReplace(oldDok3D, newDok3D, 'Dokumen 6 (3D) renderer branch');
doReplace(oldDok3E, newDok3E, 'Dokumen 7 (3E) renderer branch');
doReplace(oldDok3F, newDok3F, 'Dokumen 8 (3F) renderer branch');
doReplace(oldDok3G, newDok3G, 'Dokumen 9 (3G) renderer branch');

if (isCrlf) {
  norm = norm.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, norm, 'utf8');
console.log('✨ All portal-penugasan-jo.html patches successfully written!');
