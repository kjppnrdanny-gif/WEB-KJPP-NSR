import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Structure clean-up & semantic IDs/classes

// A. Wrap Page 1 content (Header, Alert, Arsitektur, Kunci Induk)
// Section Kunci Induk ends before Section Tabel Master 11 Token.
// We add class "print-page-break-after" to the Kunci Induk section.
html = html.replace(
  '<!-- BAGIAN 0: KUNCI INDUK MASTER PEMIMPIN REKAN (KHUSUS PEMILIK / PEMIMPIN REKAN)  -->\n    <section class="mb-10">',
  '<!-- BAGIAN 0: KUNCI INDUK MASTER PEMIMPIN REKAN (KHUSUS PEMILIK / PEMIMPIN REKAN)  -->\n    <section class="mb-10 print-page-break-after">'
);

// B. Section Tabel Master 11 Token has class "print-page-break-after"
html = html.replace(
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="section-master-tokens print-page-1">',
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="section-master-tokens print-page-break-after">'
);
html = html.replace(
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="mb-12 print-page-break-after">',
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="section-master-tokens print-page-break-after">'
);

// C. Section Direktori 48 Karyawan starts with "print-page-break-before"
html = html.replace(
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="section-karyawan print-page-break-before">',
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="section-karyawan print-page-break-before">'
);

// D. Inside Table 48 Karyawan:
// Row 23 (Cabang Padang) has "print-page-break-before"
if (!html.includes('branch-padang-break')) {
  html = html.replace(
    /<tr class="(?:branch-header-row\s*)?bg-slate-900\/90[^"]*">\s*<td colspan="7"[^>]*>([\s\S]*?🏢 Cabang Padang[\s\S]*?)<\/tr>/,
    `<tr class="branch-header-row branch-padang-break bg-slate-900/90 text-white font-bold border-y border-slate-700 print-page-break-before">
              <td colspan="7" class="py-1 px-3 text-xs tracking-wider uppercase">
                <div class="flex items-center justify-between">
                  <span>🏢 Cabang Padang</span>
                  <span class="text-[10px] text-slate-400 font-normal">Kredensial Resmi SSOT</span>
                </div>
              </td>
            </tr>`
  );
}

// E. Section 3 (Slips) starts with "print-page-break-before"
html = html.replace(
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="section-slips print-page-break-before">',
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="section-slips print-page-break-before">'
);
html = html.replace(
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="mb-8">',
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="section-slips print-page-break-before">'
);

// F. Slip 6 (Reviewer QA) has "print-page-break-after"
if (!html.includes('slip-reviewer-break')) {
  html = html.replace(
    /(<!-- Slip Reviewer Kendali Mutu \(QA\) -->\s*<div class="[^"]*cut-slip[^"]*")/g,
    '$1 slip-reviewer-break print-page-break-after"'
  );
}

// 2. Comprehensive High-Density Print CSS
const printCSS = `<style>
    body { font-family: 'Inter', sans-serif; }
    .font-mono-token { font-family: 'JetBrains Mono', monospace; }

    /* ================================================================= */
    /* STANDAR CETAK RESMI A4 (6 HALAMAN PROPORSIONAL & BEBAS CACAT)     */
    /* ================================================================= */
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm 8mm 10mm;
      }

      /* Sembunyikan navigasi interaktif */
      .no-print, nav, .top-nav-bar, button {
        display: none !important;
      }

      /* Reset Body ke Kertas Putih Bersih */
      html, body {
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 8pt !important;
        line-height: 1.25 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      main, .max-w-5xl {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      /* Penegakan Kontras Hitam Pekat */
      h1, h2, h3, h4, h5, h6, strong, b {
        color: #0f172a !important;
        font-weight: 800 !important;
      }
      p, span, div, li, td, th {
        color: #1e293b !important;
      }
      .text-white, .text-slate-100, .text-slate-200, .text-slate-300 {
        color: #0f172a !important;
      }
      .text-slate-400, .text-slate-500 {
        color: #334155 !important;
      }
      .text-slate-600, .text-slate-700 {
        color: #0f172a !important;
      }

      /* Aksen Warna Cetak Presisi */
      .text-amber-400, .text-amber-300, .text-amber-500 { color: #92400e !important; }
      .text-sky-400, .text-sky-300, .text-blue-400 { color: #0369a1 !important; }
      .text-emerald-400, .text-emerald-300 { color: #047857 !important; }
      .text-rose-400, .text-rose-300, .text-rose-500 { color: #9f1239 !important; }
      .text-purple-400, .text-purple-300 { color: #581c87 !important; }
      .text-teal-400, .text-teal-300 { color: #0f766e !important; }
      .text-cyan-400, .text-cyan-300 { color: #0e7490 !important; }

      /* Latar Belakang Kartu Terang */
      .bg-slate-950, .bg-slate-900, .bg-slate-950\\/80, .bg-slate-950\\/70, .bg-slate-950\\/60,
      .bg-slate-900\\/60, .bg-slate-900\\/80, .bg-slate-900\\/50, .bg-slate-900\\/40,
      .bg-slate-800, .bg-slate-800\\/60, .bg-slate-800\\/40 {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }

      /* Garis Batas Kertas */
      .border, .border-2, .border-slate-800, .border-slate-700, .border-slate-800\\/80, .divide-slate-800 {
        border-color: #94a3b8 !important;
      }
      .border-amber-400\\/50, .border-amber-400\\/40, .border-amber-400\\/30 { border-color: #b45309 !important; }
      .border-sky-400\\/40, .border-sky-400\\/30 { border-color: #0284c7 !important; }
      .border-emerald-400\\/40, .border-emerald-400\\/30 { border-color: #059669 !important; }
      .border-rose-500\\/30 { border-color: #be123c !important; }
      .border-indigo-500\\/30 { border-color: #4338ca !important; }

      /* Kotak Alert & Banner Peringatan */
      div[class*="rose-500"] {
        background-color: #fff1f2 !important;
        border: 1px solid #f87171 !important;
        padding: 2.5mm 3.5mm !important;
        margin-bottom: 2.5mm !important;
        border-radius: 4px !important;
      }

      /* Header Dokumen */
      header.border-b {
        padding-bottom: 2.5mm !important;
        margin-bottom: 3mm !important;
        border-bottom: 2px solid #0f172a !important;
      }

      /* Spasi & Padding Ringkas */
      .mb-12, .mb-10, .mb-8 { margin-bottom: 3.5mm !important; }
      .mb-6, .mb-5, .mb-4 { margin-bottom: 2mm !important; }
      .pb-6, .pb-4 { padding-bottom: 1.5mm !important; }
      .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 2mm !important; }
      .space-y-2 > :not([hidden]) ~ :not([hidden]),
      .space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 1mm !important; }

      /* Manajemen Pemotongan Halaman (Page Breaks) */
      .print-page-break-before {
        break-before: page !important;
        page-break-before: always !important;
      }
      .print-page-break-after {
        break-after: page !important;
        page-break-after: always !important;
      }
      .print-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Pemformatan Tabel Bersih & Tajam */
      .overflow-x-auto {
        overflow: visible !important;
        border: none !important;
      }
      main table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      main table thead {
        display: table-header-group !important;
      }
      main table tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Tabel Master (11 Token) - Halaman 2 */
      main table.table-master {
        font-size: 7.2pt !important;
        line-height: 1.2 !important;
      }
      main table.table-master th {
        background-color: #f1f5f9 !important;
        color: #0f172a !important;
        font-weight: 800 !important;
        border: 1px solid #64748b !important;
        padding: 2mm 2mm !important;
        text-transform: uppercase !important;
        font-size: 7pt !important;
      }
      main table.table-master td {
        border: 1px solid #cbd5e1 !important;
        padding: 2mm 2mm !important;
        color: #1e293b !important;
        vertical-align: top !important;
      }
      main table.table-master tbody tr:nth-child(even) {
        background-color: #f8fafc !important;
      }

      /* Tabel 48 Karyawan - Halaman 3 & 4 */
      main table.table-karyawan {
        font-size: 6.8pt !important;
        line-height: 1.15 !important;
      }
      main table.table-karyawan th {
        background-color: #e2e8f0 !important;
        color: #0f172a !important;
        font-weight: 800 !important;
        border: 1px solid #475569 !important;
        padding: 1.5mm 1.5mm !important;
        text-transform: uppercase !important;
        font-size: 6.5pt !important;
      }
      main table.table-karyawan td {
        border: 1px solid #cbd5e1 !important;
        padding: 1.2mm 1.5mm !important;
        color: #1e293b !important;
        vertical-align: middle !important;
      }
      main table.table-karyawan tbody tr:nth-child(even):not(.branch-header-row) {
        background-color: #f8fafc !important;
      }
      .branch-header-row {
        background-color: #e2e8f0 !important;
        color: #0f172a !important;
        font-weight: 900 !important;
      }
      .branch-header-row td {
        background-color: #e2e8f0 !important;
        border-top: 1.5px solid #334155 !important;
        border-bottom: 1.5px solid #334155 !important;
        padding: 1.5mm 2.5mm !important;
        font-size: 7.2pt !important;
      }

      /* Token & Badge Dalam Tabel */
      .font-mono-token span, .font-mono-token code, code {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        border: 1px solid #64748b !important;
        font-weight: 800 !important;
        padding: 0.5mm 1.5mm !important;
        border-radius: 3px !important;
        font-size: 6.8pt !important;
      }
      td span[class*="rounded"] {
        background-color: #f8fafc !important;
        border: 1px solid #94a3b8 !important;
        color: #0f172a !important;
        font-weight: 700 !important;
        padding: 0.5mm 1.5mm !important;
        font-size: 6.2pt !important;
      }

      /* Desain Slip Voucher Individual - Halaman 5 & 6 */
      .print-slips-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 3.5mm !important;
        width: 100% !important;
      }
      .cut-slip {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        border: 1.5px dashed #475569 !important;
        background: #ffffff !important;
        padding: 3mm 4mm !important;
        border-radius: 4px !important;
        margin-bottom: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .cut-slip .border-b {
        border-bottom: 1px solid #cbd5e1 !important;
        padding-bottom: 1.5mm !important;
        margin-bottom: 1.5mm !important;
      }
      .cut-slip .bg-slate-950 {
        background: #f8fafc !important;
        border: 1.5px solid #0f172a !important;
        padding: 2mm !important;
        border-radius: 4px !important;
        margin-top: 2mm !important;
        margin-bottom: 2mm !important;
      }
      .cut-slip .font-mono-token, .cut-slip .bg-slate-950 span {
        font-size: 11pt !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        letter-spacing: 0.5px !important;
      }
      .cut-slip .text-[10px], .cut-slip .text-[11px] {
        font-size: 7pt !important;
        line-height: 1.3 !important;
      }

      /* Footer Resmi */
      footer {
        border-top: 1.5px solid #0f172a !important;
        padding-top: 2.5mm !important;
        margin-top: 4mm !important;
      }
    }
  </style>`;

html = html.replace(/<style>[\s\S]*?<\/style>/, printCSS);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully enforced exact 6-page A4 structure!');
