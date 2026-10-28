import fs from 'fs';

const html = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = html.split(/\r?\n/);

console.log('--- FINDING [REDACTED_SUPER_ADMIN_TOKEN] ---');
lines.forEach((l, i) => {
  if (l.includes((process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"))) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});

console.log('\n--- FINDING TAB NAVIGATION BUTTONS ---');
lines.forEach((l, i) => {
  if (l.includes('bukaTab') || l.includes('tab-btn') || l.includes('tab-')) {
    if (i < 300) {
      console.log(`${i + 1}: ${l.trim()}`);
    }
  }
});

console.log('\n--- FINDING LOGIN HANDLER ---');
lines.forEach((l, i) => {
  if (l.includes('loginKeServer') || l.includes('TOKEN_PUSAT') || l.includes('USER_ROLES')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
