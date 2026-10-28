import fs from 'fs';

console.log('=== CHECKING TOKEN MAPPINGS IN PORTALS & BACKEND ===');

const joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
const authPhp = fs.readFileSync('auth-handler.php', 'utf8');

// Search for [REDACTED_SUPER_ADMIN_TOKEN] and [REDACTED_ADMIN_PUSAT_TOKEN]
function findTokenInfo(content, name) {
  const lines = content.split('\n');
  const found = [];
  lines.forEach((l, i) => {
    if (l.includes((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN")) || l.includes((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN")) || l.includes('SUPER_ADMIN') || l.includes('ADMIN_PUSAT')) {
      if (l.includes((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN")) || l.includes((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"))) {
        found.push(`L${i+1}: ${l.trim().slice(0, 100)}`);
      }
    }
  });
  return found;
}

console.log('--- JO HTML ---');
console.log(findTokenInfo(joHtml, 'JO'));

console.log('--- NOLAP HTML ---');
console.log(findTokenInfo(nolapHtml, 'NOLAP'));

console.log('--- AUTH PHP ---');
console.log(findTokenInfo(authPhp, 'PHP'));
