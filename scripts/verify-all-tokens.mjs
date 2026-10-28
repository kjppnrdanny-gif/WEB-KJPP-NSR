import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const fnMatch = html.match(/function resolveUnifiedToken\([\s\S]*?\n    \}/);
const resolveUnifiedToken = new Function(fnMatch[0] + '; return resolveUnifiedToken;')();

const testTokens = [
  'NSR8899',
  'NSR-PST-2026',
  'NSR-BDG-2026',
  'NSR-PDG-2026',
  'NSR-MKS-2026',
  'NSR-PLB-2026',
  'NSR-KEU-2026',
  'TOKEN CABANG MAKASSAR',
  'TOKEN CABANG BANDUNG',
  'TOKEN CABANG PADANG',
  'TOKEN CABANG PALEMBANG',
  'TOKEN ADMIN PUSAT',
  'TOKEN MANAJEMEN'
];

console.log('--- TESTING TOKENS IN resolveUnifiedToken ---');
for (const t of testTokens) {
  const res = resolveUnifiedToken(t);
  console.log(t, '=>', res ? `VALID (Role: ${res.role}, Wilayah: ${res.wilayah || res.cabang})` : 'NULL');
}
