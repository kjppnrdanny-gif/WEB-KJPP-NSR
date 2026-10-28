import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const fnMatch = html.match(/function resolveUnifiedToken\([\s\S]*?\n    \}/);
let fnStr = fnMatch[0];
fnStr = fnStr.replace(
  'const clean = rawToken.trim().toUpperCase();',
  `let clean = rawToken.trim().toUpperCase();
   const ALIASES = {
     'TOKEN CABANG MAKASSAR': 'NSR-MKS-2026',
     'TOKEN MAKASSAR': 'NSR-MKS-2026',
     'TOKEN CABANG BANDUNG': 'NSR-BDG-2026',
     'TOKEN BANDUNG': 'NSR-BDG-2026',
     'TOKEN CABANG PADANG': 'NSR-PDG-2026',
     'TOKEN PADANG': 'NSR-PDG-2026',
     'TOKEN CABANG PALEMBANG': 'NSR-PLB-2026',
     'TOKEN PALEMBANG': 'NSR-PLB-2026',
     'TOKEN ADMIN PUSAT': 'NSR-PST-2026',
     'TOKEN PUSAT': 'NSR-PST-2026',
     'TOKEN MANAJEMEN': 'NSR-PST-2026',
     'TOKEN REKAN': 'NSR8899'
   };
   if (ALIASES[clean]) clean = ALIASES[clean];`
);

const resolveUnifiedToken = new Function(fnStr + '; return resolveUnifiedToken;')();

console.log('TOKEN CABANG MAKASSAR =>', resolveUnifiedToken('TOKEN CABANG MAKASSAR')?.wilayah);
console.log('TOKEN CABANG BANDUNG =>', resolveUnifiedToken('TOKEN CABANG BANDUNG')?.wilayah);
console.log('TOKEN MANAJEMEN =>', resolveUnifiedToken('TOKEN MANAJEMEN')?.role);
console.log('NSR-MKS-2026 =>', resolveUnifiedToken('NSR-MKS-2026')?.wilayah);
console.log('NSR8899 =>', resolveUnifiedToken('NSR8899')?.role);
