import fs from 'fs';

const html = fs.readFileSync('portal-kwitansi.html', 'utf8');
const fnMatch = html.match(/function resolveUnifiedToken\([\s\S]*?\n    \}/);
const resolveUnifiedToken = new Function(fnMatch[0] + '; return resolveUnifiedToken;')();

console.log('[REDACTED_ADMIN_PUSAT_TOKEN]:');
console.log(resolveUnifiedToken((process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN")));

console.log('\nNSR-KEU-2026:');
console.log(resolveUnifiedToken('NSR-KEU-2026'));

console.log('\n[REDACTED_CAB_BDG_TOKEN]:');
console.log(resolveUnifiedToken((process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN")));
