import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// Ensure section-master-tokens has break-before
html = html.replace(
  /<section class="mb-12 section-master-tokens[^"]*">/,
  '<section class="mb-12 section-master-tokens print-page-break-before" style="break-before: page !important; page-break-before: always !important;">'
);

// Ensure the heading div inside has break-before
html = html.replace(
  '<div class="flex items-center justify-between gap-3 mb-4">',
  '<div class="flex items-center justify-between gap-3 mb-4 print-page-break-before" style="break-before: page !important; page-break-before: always !important;">'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Fixed heading break!');
