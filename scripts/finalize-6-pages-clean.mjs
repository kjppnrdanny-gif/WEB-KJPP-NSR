import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Line 504 - add print-page-break-before so Table Master starts on Page 2
html = html.replace(
  /<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI\s*-->\s*<section class="mb-12">/,
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->\n    <section class="mb-12 section-master-tokens print-page-break-before">'
);

// 2. Remove print-page-break-after from Slip 6 (since Slip 7 has print-page-break-before)
html = html.replace(
  'slip-reviewer-break print-page-break-after',
  ''
);

// 3. Ensure Slip 7 has print-page-break-before
if (!html.includes('print-slip-page-6')) {
  html = html.replace(
    /<!-- Slip Penilai Properti \(Valuer\) -->\s*<div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2\.5 cut-slip/,
    '<!-- Slip Penilai Properti (Valuer) -->\n        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 cut-slip print-slip-page-6 print-page-break-before'
  );
}

// 4. Update the CSS in <style>
const finalPrintCSS = `<style>
    body { font-family: 'Inter', sans-serif; }
    .font-mono-token { font-family: 'JetBrains Mono', monospace; }

    /* ================================================================= */
    /* STANDAR CETAK RESMI A4 (STANDAR 6 HALAMAN BAKU & PRESISI TINGGI)  */
    /* ================================================================= */
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm 8mm 10mm;
      }

      /* 1. Sembunyikan Navigasi Layar */
      .no-print, nav, .top-nav-bar, button {
        display: none !important;
      }

      /* 2. Format Body & Lembar A4 Bersih */
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

      /* Warna Aksen Pekat Kertas */
      .text-amber-400, .text-amber-300, .text-amber-500 { color: #92400e !important; }
      .text-sky-400, .text-sky-300, .text-blue-400 { color: #0369a1 !important; }
      .text-emerald-400, .text-emerald-300 { color: #047857 !important; }
      .text-rose-400, .text-rose-300, .text-rose-500 { color: #9f1239 !important; }
      .text-purple-400, .text-purple-300 { color: #581c87 !important; }
      .text-teal-400, .text-teal-300 { color: #0f766e !important; }
      .text-cyan-400, .text-cyan-300 { color: #0e7490 !important; }

      /* 4. Bersihkan Seluruh Latar Belakang Gelap */
      .bg-slate-950, .bg-slate-900, .bg-slate-950\\/80, .bg-slate-950\\/70, .bg-slate-950\\/60,
      .bg-slate-900\\/60, .bg-slate-900\\/80, .bg-slate-900\\/50, .bg-slate-900\\/40,
      .bg-slate-800, .bg-slate-800\\/60, .bg-slate-800\\/40,
      .bg-gradient-to-r, .bg-gradient-to-br, .from-slate-950, .to-slate-950, .via-slate-900 {
        background-color: #ffffff !important;
        background: #ffffff !important;
        background-image: none !important;
      }

      /* Garis Batas Kertas */
      .border, .border-2, .border-slate-800, .border-slate-700, .border-slate-800\\/80, .divide-slate-800 {
        border-color: #94a3b8 !important;
      }
      .border-amber-400\\/50, .border-amber-400\\/40, .border-amber-400\\/30 { border-color: #b45309 !important; }
      .border-sky-400\\/40, .border-sky-400\\/30 { border-color: #0284c7 !important; }
      .border-emerald-400\\/40, .border-emerald-400\\/30 { border-color: #059669 !important; }
      .border-rose-500\\/30 { border-color: #be123c !important; }
      .border-indigo-500\\/30 { border-color: #0284c7 !important; }

      /* Kotak Alert (Halaman 1) */
      div[class*="rose-500"] {
        background-color: #fff1f2 !important;
        border: 1.5px solid #f87171 !important;
        padding: 2.5mm 3.5mm !important;
        margin-bottom: 2.5mm !important;
        border-radius: 4px !important;
      }
      div[class*="rose-500"] p {
        font-size: 6.8pt !important;
        line-height: 1.2 !important;
      }

      /* Header Dokumen (Halaman 1) */
      header.border-b {
        padding-bottom: 2.5mm !important;
        margin-bottom: 3mm !important;
        border-bottom: 2px solid #0f172a !important;
      }

      /* Kotak Arsitektur 2-Lapis & Kunci Induk (Halaman 1) */
      section:has(.from-slate-950) > div {
        border: 1.5px solid #0284c7 !important;
        border-radius: 6px !important;
        padding: 3mm !important;
        background: #f8fafc !important;
      }
      section:has(.from-amber-500\\/15) > div {
        border: 1.5px solid #d97706 !important;
        border-radius: 6px !important;
        padding: 3mm !important;
        background: #fffbeb !important;
      }
      section:has(.from-slate-950) .p-4,
      section:has(.from-amber-500\\/15) .p-3\\.5 {
        background: #ffffff !important;
        border: 1px solid #cbd5e1 !important;
        padding: 2mm !important;
        border-radius: 4px !important;
      }
      section:has(.from-amber-500\\/15) .font-mono-token {
        color: #92400e !important;
        font-size: 13pt !important;
        font-weight: 900 !important;
      }

      /* 5. Kompresi Spasi Global */
      .mb-12, .mb-10, .mb-8 { margin-bottom: 3mm !important; }
      .mb-6, .mb-5, .mb-4 { margin-bottom: 2mm !important; }
      .pb-6, .pb-4 { padding-bottom: 1.5mm !important; }
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

      /* 7. Pemformatan Tabel Master (11 Token) - HALAMAN 2 UTUH */
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
        border: 1px solid #64748b !important;
        padding: 1.5mm 1.5mm !important;
        text-transform: uppercase !important;
        font-size: 6.8pt !important;
      }
      main table.table-master td {
        border: 1px solid #cbd5e1 !important;
        padding: 1.2mm 1.5mm !important;
        color: #1e293b !important;
        vertical-align: top !important;
        font-size: 6.8pt !important;
      }
      main table.table-master td:nth-child(5) {
        font-size: 6.4pt !important;
        line-height: 1.15 !important;
      }
      main table.table-master tbody tr:nth-child(even) {
        background-color: #f8fafc !important;
      }
      main table.table-master .font-mono-token span {
        font-size: 6.8pt !important;
        padding: 0.5mm 1mm !important;
      }

      /* 8. Pemformatan Tabel 48 Karyawan - HALAMAN 3 & 4 */
      main table.table-karyawan {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 6.2pt !important;
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
        border: 1px solid #475569 !important;
        padding: 1.2mm 1.2mm !important;
        text-transform: uppercase !important;
        font-size: 6.2pt !important;
      }
      main table.table-karyawan td {
        border: 1px solid #cbd5e1 !important;
        padding: 0.8mm 1.2mm !important;
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
        padding: 1mm 2mm !important;
        font-size: 6.8pt !important;
      }

      /* Token & Badge Dalam Tabel */
      .font-mono-token span, .font-mono-token code, code {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        border: 1px solid #64748b !important;
        font-weight: 800 !important;
        padding: 0.3mm 1mm !important;
        border-radius: 3px !important;
        font-size: 6.2pt !important;
      }
      td span[class*="rounded"] {
        background-color: #f8fafc !important;
        border: 1px solid #94a3b8 !important;
        color: #0f172a !important;
        font-weight: 700 !important;
        padding: 0.3mm 1mm !important;
        font-size: 5.8pt !important;
      }

      /* 9. Desain Slip Voucher Individual - HALAMAN 5 & 6 */
      .print-slips-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 2.5mm !important;
        width: 100% !important;
      }
      .cut-slip {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        border: 1.5px dashed #475569 !important;
        background: #ffffff !important;
        padding: 2mm 3mm !important;
        border-radius: 4px !important;
        margin-bottom: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .cut-slip .border-b {
        border-bottom: 1px solid #cbd5e1 !important;
        padding-bottom: 0.8mm !important;
        margin-bottom: 1mm !important;
      }
      .cut-slip .bg-slate-950 {
        background: #f8fafc !important;
        border: 1.5px solid #0f172a !important;
        padding: 1.2mm !important;
        border-radius: 4px !important;
        margin-top: 1mm !important;
        margin-bottom: 1mm !important;
      }
      .cut-slip .font-mono-token, .cut-slip .bg-slate-950 span {
        font-size: 9.5pt !important;
        font-weight: 900 !important;
        color: #0f172a !important;
        letter-spacing: 0.5px !important;
      }
      .cut-slip .text-[10px], .cut-slip .text-[11px] {
        font-size: 6.5pt !important;
        line-height: 1.2 !important;
      }

      /* Footer Dokumen */
      footer {
        border-top: 1.5px solid #0f172a !important;
        padding-top: 2mm !important;
        margin-top: 3mm !important;
      }
    }
  </style>`;

html = html.replace(/<style>[\s\S]*?<\/style>/, finalPrintCSS);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Final 6-page precision layout saved!');
