import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Add class to Table 1 and Table 2
html = html.replace(
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="mb-12 print-page-break-after">',
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="section-master-tokens print-page-1">'
);
html = html.replace(
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="mb-12">',
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="section-master-tokens print-page-1">'
);

html = html.replace(
  '<table class="w-full text-left text-xs border-collapse">',
  '<table class="table-master w-full text-left text-xs border-collapse">'
);

// For Table 2:
html = html.replace(
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="mb-12 print-page-break-before">',
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="section-karyawan print-page-break-before">'
);
html = html.replace(
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="mb-12 page-break">',
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->\n    <section class="section-karyawan print-page-break-before">'
);

html = html.replace(
  /(<table class="w-full text-left text-xs border-collapse">)/,
  '<table class="table-karyawan w-full text-left text-xs border-collapse">'
);

// For Section 3:
html = html.replace(
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="mb-8">',
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="section-slips print-page-break-before">'
);
html = html.replace(
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="mb-8 print-page-break-before">',
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->\n    <section class="section-slips print-page-break-before">'
);

// Check if print-page-break-before on Cabang Padang is present
if (!html.includes('branch-padang-break')) {
  html = html.replace(
    '<span>🏢 Cabang Padang</span>',
    '<span>🏢 Cabang Padang</span>'
  );
  html = html.replace(
    /<tr class="(?:branch-header-row\s*)?bg-slate-900\/90[^"]*">\s*<td colspan="7"[^>]*>\s*<div class="flex items-center justify-between">\s*<span>🏢 Cabang Padang<\/span>/,
    `<tr class="branch-header-row branch-padang-break bg-slate-900/90 text-white font-bold border-y border-slate-700 print-page-break-before">
              <td colspan="7" class="py-1 px-3 text-xs tracking-wider uppercase">
                <div class="flex items-center justify-between">
                  <span>🏢 Cabang Padang</span>`
  );
}

// Check if print-page-break-after on Slip 6 (Reviewer QA) is present
if (!html.includes('slip-reviewer-break')) {
  html = html.replace(
    /(<!-- Slip Reviewer Kendali Mutu \(QA\) -->\s*<div class="[^"]*cut-slip[^"]*")/g,
    '$1 slip-reviewer-break print-page-break-after"'
  );
}

// 2. Specialized High-Density Print CSS
const printCSS = `<style>
    body { font-family: 'Inter', sans-serif; }
    .font-mono-token { font-family: 'JetBrains Mono', monospace; }

    /* ================================================================= */
    /* ATURAN CETAK A4 STANDAR DOKUMEN DIREKSI & AUDIT RESMI             */
    /* ================================================================= */
    @media print {
      @page {
        size: A4 portrait;
        margin: 7mm 8mm 7mm 8mm;
      }

      /* 1. Sembunyikan Kontrol Layar */
      .no-print, nav, .top-nav-bar, button {
        display: none !important;
      }

      /* 2. Format Body & Lembar A4 */
      html, body {
        background: #ffffff !important;
        color: #0f172a !important;
        font-size: 7.5pt !important;
        line-height: 1.2 !important;
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

      /* 3. Penegakan Kontras Tajam Teks (Anti-Bleaching di Kertas) */
      h1, h2, h3, h4, h5, h6, strong, b {
        color: #0f172a !important;
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
        color: #1e293b !important;
      }

      /* Aksen Kertas Pekat */
      .text-amber-400, .text-amber-300, .text-amber-500 { color: #92400e !important; }
      .text-sky-400, .text-sky-300, .text-blue-400 { color: #0369a1 !important; }
      .text-emerald-400, .text-emerald-300 { color: #047857 !important; }
      .text-rose-400, .text-rose-300, .text-rose-500 { color: #9f1239 !important; }
      .text-purple-400, .text-purple-300 { color: #581c87 !important; }
      .text-teal-400, .text-teal-300 { color: #0f766e !important; }
      .text-cyan-400, .text-cyan-300 { color: #0e7490 !important; }

      /* 4. Bersihkan Latar Belakang Gelap */
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

      /* Kotak Alert & Kunci Induk Ringkas */
      div[class*="rose-500"] {
        background-color: #fff1f2 !important;
        border: 1px solid #f87171 !important;
        padding: 2mm 3mm !important;
        margin-bottom: 2mm !important;
        border-radius: 4px !important;
      }
      div[class*="rose-500"] p {
        font-size: 6.8pt !important;
        line-height: 1.2 !important;
      }

      /* Header Dokumen */
      header.border-b {
        padding-bottom: 2mm !important;
        margin-bottom: 2mm !important;
        border-bottom: 1.5px solid #0f172a !important;
      }
      header.border-b h1 {
        font-size: 13pt !important;
        line-height: 1.15 !important;
      }

      /* Kotak Arsitektur 2-Lapis & Kunci Induk (Page 1) */
      .section-architecture, section:has(.bg-gradient-to-r) {
        margin-bottom: 2mm !important;
      }
      section:has(.bg-gradient-to-r) .rounded-3xl,
      section:has(.bg-gradient-to-br) .rounded-3xl {
        padding: 2.5mm 3.5mm !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 6px !important;
      }
      section:has(.bg-gradient-to-r) .grid,
      section:has(.bg-gradient-to-br) .grid {
        gap: 2mm !important;
      }
      section:has(.bg-gradient-to-r) .p-4,
      section:has(.bg-gradient-to-br) .p-3\\.5 {
        padding: 2mm 2.5mm !important;
        border: 1px solid #94a3b8 !important;
        border-radius: 4px !important;
      }

      /* 5. Kompresi Spasi Global */
      .mb-12, .mb-10, .mb-8 { margin-bottom: 2.5mm !important; }
      .mb-6, .mb-5, .mb-4 { margin-bottom: 1.5mm !important; }
      .pb-6, .pb-4 { padding-bottom: 1mm !important; }
      .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5mm !important; }
      .space-y-2 > :not([hidden]) ~ :not([hidden]),
      .space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.8mm !important; }

      /* 6. Manajemen Halaman (Page Breaks) */
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

      /* 7. Pemformatan Tabel Master (11 Token) */
      .overflow-x-auto {
        overflow: visible !important;
        border: none !important;
      }
      main table.table-master {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 6.8pt !important;
        line-height: 1.15 !important;
      }
      main table.table-master th {
        background-color: #f1f5f9 !important;
        color: #0f172a !important;
        font-weight: 800 !important;
        border: 1px solid #94a3b8 !important;
        padding: 2mm 1.5mm !important;
        font-size: 6.8pt !important;
        text-transform: uppercase !important;
      }
      main table.table-master td {
        border: 1px solid #cbd5e1 !important;
        padding: 1.5mm 1.5mm !important;
        color: #1e293b !important;
        vertical-align: middle !important;
      }
      main table.table-master tbody tr:nth-child(even) {
        background-color: #f8fafc !important;
      }

      /* 8. Pemformatan Tabel 48 Karyawan */
      main table.table-karyawan {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 6.5pt !important;
        line-height: 1.12 !important;
      }
      main table.table-karyawan thead {
        display: table-header-group !important;
      }
      main table.table-karyawan tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      main table.table-karyawan th {
        background-color: #e2e8f0 !important;
        color: #0f172a !important;
        font-weight: 800 !important;
        border: 1px solid #64748b !important;
        padding: 1.5mm 1.5mm !important;
        font-size: 6.5pt !important;
        text-transform: uppercase !important;
      }
      main table.table-karyawan td {
        border: 1px solid #cbd5e1 !important;
        padding: 1mm 1.5mm !important;
        color: #1e293b !important;
        vertical-align: middle !important;
      }
      main table.table-karyawan tbody tr:nth-child(even):not(.branch-header-row) {
        background-color: #f8fafc !important;
      }
      .branch-header-row {
        background-color: #cbd5e1 !important;
        color: #0f172a !important;
        font-weight: 900 !important;
      }
      .branch-header-row td {
        background-color: #e2e8f0 !important;
        border-top: 1.5px solid #475569 !important;
        border-bottom: 1.5px solid #475569 !important;
        padding: 1.5mm 2mm !important;
        font-size: 7.2pt !important;
      }

      /* Token & Badge Styling di Tabel */
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

      /* 9. Desain Slip Voucher Individual (2 Kolom Presisi Siap Gunting) */
      .print-slips-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 3mm !important;
        width: 100% !important;
      }
      .cut-slip {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        border: 1.5px dashed #475569 !important;
        background: #ffffff !important;
        padding: 2.5mm 3.5mm !important;
        border-radius: 4px !important;
        margin-bottom: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .cut-slip .border-b {
        border-bottom: 1px solid #cbd5e1 !important;
        padding-bottom: 1mm !important;
        margin-bottom: 1.5mm !important;
      }
      .cut-slip .bg-slate-950 {
        background: #f8fafc !important;
        border: 1.5px solid #0f172a !important;
        padding: 1.5mm !important;
        border-radius: 4px !important;
        margin-top: 1.5mm !important;
        margin-bottom: 1.5mm !important;
      }
      .cut-slip .font-mono-token, .cut-slip .bg-slate-950 span {
        font-size: 10pt !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        letter-spacing: 0.5px !important;
      }
      .cut-slip .text-[10px], .cut-slip .text-[11px] {
        font-size: 6.8pt !important;
        line-height: 1.25 !important;
      }

      /* Footer Resmi */
      footer {
        border-top: 1.5px solid #0f172a !important;
        padding-top: 2mm !important;
        margin-top: 3mm !important;
      }
    }
  </style>`;

html = html.replace(/<style>[\s\S]*?<\/style>/, printCSS);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully applied specialized print CSS and layout tags!');
