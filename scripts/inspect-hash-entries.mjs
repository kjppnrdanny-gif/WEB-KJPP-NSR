import crypto from 'crypto';
import fs from 'fs';

function sha256(str) {
  return crypto.createHash('sha256').update(str.trim().toUpperCase()).digest('hex');
}

const kingHash = sha256((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"));
const adminPusatHash = sha256((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"));

console.log('[REDACTED_SUPER_ADMIN_TOKEN] SHA256:', kingHash);
console.log('[REDACTED_ADMIN_PUSAT_TOKEN] SHA256:', adminPusatHash);

const joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');

function findHashEntry(html, hash, label) {
  const idx = html.indexOf(hash);
  if (idx > -1) {
    console.log(`\nFound ${label} in HTML:`);
    console.log(html.slice(idx, idx + 600));
  } else {
    console.log(`\n${label} NOT found in HTML`);
  }
}

findHashEntry(joHtml, kingHash, 'JO KING');
findHashEntry(joHtml, adminPusatHash, 'JO Admin Pusat');
findHashEntry(nolapHtml, kingHash, 'NOLAP KING');
findHashEntry(nolapHtml, adminPusatHash, 'NOLAP Admin Pusat');
