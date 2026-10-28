import fs from 'node:fs';

let content = fs.readFileSync('scripts/build-production.mjs', 'utf8');
const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const target = '  "portal-tracking.html",\n  "verifikasi-dokumen.html",';
const replacement = '  "portal-tracking.html",\n  "portal-spk.html",\n  "portal-bop.html",\n  "portal-keuangan.html",\n  "verifikasi-dokumen.html",';

if (norm.includes(target)) {
  norm = norm.replace(target, replacement);
  fs.writeFileSync('scripts/build-production.mjs', isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
  console.log('✓ Successfully added portal-spk, portal-bop, portal-keuangan to build allowlist');
} else {
  console.log('Target not found in build-production.mjs');
}
