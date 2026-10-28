import fs from 'fs';
import crypto from 'crypto';

const html = fs.readFileSync('index.html', 'utf8');
const fnMatch = html.match(/function resolveUnifiedToken\([\s\S]*?\n    \}/);
const resolveUnifiedToken = new Function(fnMatch[0] + '; return resolveUnifiedToken;')();

const wordList = [
  'NSR8899', 'NSR8888', 'NSR9999', 'NSR2026', 'NSR-2026',
  'NSR-PST-2026', 'NSR-BDG-2026', 'NSR-PDG-2026', 'NSR-MKS-2026', 'NSR-PLB-2026', 'NSR-KEU-2026',
  'NSR-ADM-2026', 'NSR-MGT-2026', 'NSR-MANAJEMEN-2026', 'NSR-SUPERADMIN-2026',
  'TOKEN PUSAT', 'TOKEN MAKASSAR', 'TOKEN BANDUNG', 'TOKEN PADANG', 'TOKEN PALEMBANG',
  'TOKEN CABANG MAKASSAR', 'TOKEN CABANG BANDUNG', 'TOKEN CABANG PADANG', 'TOKEN CABANG PALEMBANG',
  'TOKEN ADMIN PUSAT', 'TOKEN MANAJEMEN',
  'OPINI-PUSAT-2026', 'OPINI-BDG-2026', 'OPINI-PDG-2026', 'OPINI-MKS-2026', 'OPINI-PLB-2026',
  'NSR-OPINI-2026', 'OPINI-2026', 'OPINI2026',
  'ADMIN_PUSAT', 'ADMIN_MAKASSAR', 'ADMIN_BANDUNG', 'ADMIN_PADANG', 'ADMIN_PALEMBANG',
  'ADMIN-PUSAT', 'ADMIN-MAKASSAR', 'ADMIN-BANDUNG', 'ADMIN-PADANG', 'ADMIN-PALEMBANG',
  'MAKASSAR-2026', 'BANDUNG-2026', 'PADANG-2026', 'PALEMBANG-2026', 'PUSAT-2026',
  'MAKASSAR', 'BANDUNG', 'PADANG', 'PALEMBANG', 'PUSAT'
];

for (const w of wordList) {
  const res = resolveUnifiedToken(w);
  if (res && res.valid) {
    console.log('VALID:', w, '=>', res.role, res.wilayah || res.cabang);
  }
}
