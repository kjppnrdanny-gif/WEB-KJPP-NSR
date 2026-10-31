import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// Remove all hard-page-break divs
html = html.replace(/<div class="hard-page-break"[^>]*><\/div>\s*/g, '');

// Clean inline styles on section and div
html = html.replace(
  'style="break-before: page !important; page-break-before: always !important;"',
  ''
);
html = html.replace(
  'style="break-before: page !important; page-break-before: always !important;"',
  ''
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Cleaned duplicate breaks!');
