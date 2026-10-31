import fs from 'fs';
import path from 'path';

const filePath = path.resolve('daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Lapis 1 description
html = html.replace(
  '<code class="text-sky-300">NSR-BDG-••••</code>, <code class="text-sky-300">NSR-PDG-••••</code>',
  '<code class="text-sky-300">NSR-BDG-2026</code>, <code class="text-sky-300">NSR-PDG-2026</code>'
);
html = html.replace(
  'token pusat (<code class="text-amber-300">NSR-PST-••••</code>) dan King Token (<code class="text-amber-300">NSR••••</code>)',
  'token pusat (<code class="text-amber-300">NSR-PST-JKT</code>) dan King Token (<code class="text-amber-300">NSR8899</code>)'
);

// 2. Kunci Induk Pemimpin Rekan
html = html.replace(
  '<span class="font-mono-token text-xl sm:text-2xl font-black text-amber-400 tracking-wider">NSR••••</span>',
  '<span class="font-mono-token text-xl sm:text-2xl font-black text-amber-400 tracking-wider">NSR8899</span>'
);
html = html.replace(
  'Staf operasional pusat cukup menggunakan token <code class="text-amber-300">NSR-PST-••••</code> agar pemegang kunci master hanya Anda sendiri.',
  'Staf operasional pusat cukup menggunakan token <code class="text-amber-300">NSR-PST-JKT</code> (atau <code class="text-amber-300">NSR-ADM-2026</code>) agar pemegang kunci master hanya Anda sendiri.'
);

// 3. Tabel Master 11 Token
// Row 1: Pusat
html = html.replace(
  /NSR-PST-••••\s*<\/span>\s*<span class="block text-\[10px\] text-slate-500 mt-1 text-center">Alt: NSR-ADM-••••<\/span>/,
  'NSR-PST-JKT</span>\n                <span class="block text-[10px] text-slate-400 mt-1 text-center font-bold">Alt: NSR-ADM-2026</span>'
);

// Row 2: Bandung
html = html.replace(
  /(<span class="font-bold text-sky-400 bg-slate-900 px-2\.5 py-1 rounded border border-sky-400\/30 text-\[11px\] block text-center">\s*)NSR-BDG-••••(\s*<\/span>)/,
  '$1NSR-BDG-2026$2'
);

// Row 3: Padang
html = html.replace(
  /(<span class="font-bold text-sky-400 bg-slate-900 px-2\.5 py-1 rounded border border-sky-400\/30 text-\[11px\] block text-center">\s*)NSR-PDG-••••(\s*<\/span>)/,
  '$1NSR-PDG-2026$2'
);

// Row 4: Makassar
html = html.replace(
  /(<span class="font-bold text-sky-400 bg-slate-900 px-2\.5 py-1 rounded border border-sky-400\/30 text-\[11px\] block text-center">\s*)NSR-MKS-••••(\s*<\/span>)/,
  '$1NSR-MKS-2026$2'
);

// Row 5: Palembang
html = html.replace(
  /(<span class="font-bold text-sky-400 bg-slate-900 px-2\.5 py-1 rounded border border-sky-400\/30 text-\[11px\] block text-center">\s*)NSR-PLB-••••(\s*<\/span>)/,
  '$1NSR-PLB-2026$2'
);

// Row 6: Reviewer
html = html.replace(
  /(<span class="font-bold text-emerald-400 bg-slate-900 px-2\.5 py-1 rounded border border-emerald-400\/30 text-\[11px\] block text-center">\s*)NSR-REV-••••(\s*<\/span>)/,
  '$1NSR-REV-2026$2'
);

// Row 9: Marketing
html = html.replace(
  /(<span class="font-bold text-amber-300 bg-slate-900 px-2\.5 py-1 rounded border border-amber-300\/30 text-\[11px\] block text-center">\s*)NSR-MKT-••••(\s*<\/span>)/,
  '$1NSR-MKT-2026$2'
);

// 4. Section 3 Slips
// Bandung Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-BDG-••••</span>',
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-BDG-2026</span>'
);

// Padang Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-PDG-••••</span>',
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-PDG-2026</span>'
);

// Makassar Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-MKS-••••</span>',
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-MKS-2026</span>'
);

// Palembang Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-PLB-••••</span>',
  '<span class="text-base sm:text-lg font-black text-sky-400 tracking-wider">NSR-PLB-2026</span>'
);

// Admin Operasional Pusat Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-amber-400 tracking-wider">NSR-PST-••••</span>',
  '<span class="text-base sm:text-lg font-black text-amber-400 tracking-wider">NSR-PST-JKT</span><span class="block text-[11px] text-slate-400 font-semibold mt-0.5">(Alt: NSR-ADM-2026)</span>'
);

// Reviewer Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-emerald-400 tracking-wider">NSR-REV-••••</span>',
  '<span class="text-base sm:text-lg font-black text-emerald-400 tracking-wider">NSR-REV-2026</span>'
);

// Marketing Slip
html = html.replace(
  '<span class="text-base sm:text-lg font-black text-amber-300 tracking-wider">NSR-MKT-••••</span>',
  '<span class="text-base sm:text-lg font-black text-amber-300 tracking-wider">NSR-MKT-2026</span>'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Explicit tokens updated successfully!');
