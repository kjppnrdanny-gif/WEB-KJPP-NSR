import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// Clean up any existing divider divs first
html = html.replace(/<div class="hard-page-break"[^>]*><\/div>\s*/g, '');

// 1. Hard page break before Section 1 (Tabel Master 11 Token)
html = html.replace(
  '<!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->',
  '<div class="hard-page-break" style="break-before: page; page-break-before: always;"></div>\n    <!-- BAGIAN 1: TABEL MASTER 11 TOKEN OPERASIONAL RESMI                 -->'
);

// 2. Hard page break before Section 2 (48 Karyawan)
html = html.replace(
  '<!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->',
  '<div class="hard-page-break" style="break-before: page; page-break-before: always;"></div>\n    <!-- BAGIAN 2: DIREKTORI RESMI 48 KARYAWAN & MATRIKS WEWENANG 7-MILESTONE (LAPIS 2) -->'
);

// 3. Hard page break before Section 3 (Slips)
html = html.replace(
  '<!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->',
  '<div class="hard-page-break" style="break-before: page; page-break-before: always;"></div>\n    <!-- BAGIAN 3: SLIP PENYERAHAN KREDENSIAL INDIVIDUAL (SIAP POTONG)     -->'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Inserted hard page break divs!');
