import fs from 'fs';

let c = fs.readFileSync('scripts/build-production.mjs', 'utf8');
const target = '"panduan-operasional-portal-nolap.html",';
const replacement = '"panduan-operasional-portal-nolap.html",\r\n  "alur-kerja-penugasan-nolap-kwitansi.html",';
if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('scripts/build-production.mjs', c, 'utf8');
  console.log('Successfully added alur-kerja-penugasan-nolap-kwitansi.html to ALLOWED_FILES');
} else {
  console.error('Target not found in scripts/build-production.mjs');
}
