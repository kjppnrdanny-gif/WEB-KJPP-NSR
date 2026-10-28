import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const fnMatch = html.match(/function resolveUnifiedToken\([\s\S]*?\n    \}/);
const resolveUnifiedToken = new Function(fnMatch[0] + '; return resolveUnifiedToken;')();

const candidates = [
  'NSR-KEU-2026', 'NSR8899', 'NSR-2019-005', 'NSR-KING-2026', 'NSR-PUSAT-2026',
  'NSR-BDG-2026', 'NSR-PDG-2026', 'NSR-MKS-2026', 'NSR-PLB-2026',
  'TOKEN CABANG MAKASSAR', 'TOKEN CABANG BANDUNG', 'TOKEN CABANG PADANG', 'TOKEN CABANG PALEMBANG',
  'TOKEN ADMIN PUSAT', 'TOKEN MANAJEMEN', 'NSR-ADMIN-PUSAT', 'NSR-SUPERADMIN',
  'CABANG MAKASSAR', 'CABANG BANDUNG', 'CABANG PADANG', 'CABANG PALEMBANG',
  'MAKASSAR', 'BANDUNG', 'PADANG', 'PALEMBANG', 'PUSAT',
  'NSR-ADMIN-MKS-2026', 'NSR-ADM-MKS-2026', 'NSR-ADM-BDG-2026', 'NSR-ADM-PDG-2026', 'NSR-ADM-PLB-2026',
  'NSR-MKS-2026', 'NSR-BDG-2026', 'NSR-PDG-2026', 'NSR-PLB-2026', 'NSR-PST-2026'
];

for (const c of candidates) {
  const res = resolveUnifiedToken(c);
  if (res && res.valid) {
    console.log('MATCH:', c, '-> Role:', res.role, 'Wilayah:', res.wilayah || res.cabang);
  }
}
