import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf-8');

const firstModNeedle = '// 9B. MODUL MONITORING PENUGASAN, SLA & DEADLINE (TAHAP 2)\n';
const secondModNeedle = '// 9B. MODUL MONITORING PENUGASAN, SLA & DEADLINE (TAHAP 2 HARDENED)';

const idx1 = content.indexOf('// 9B. MODUL MONITORING PENUGASAN, SLA & DEADLINE (TAHAP 2)');
const idx2 = content.indexOf(secondModNeedle);

if (idx1 !== -1 && idx2 !== -1 && idx1 < idx2) {
  const preIdx1 = content.lastIndexOf('// ==========================================================', idx1);
  content = content.substring(0, preIdx1) + content.substring(idx2 - 67);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✔ Duplikasi modul 9B berhasil dibersihkan!');
} else {
  console.error('❌ Needle tidak cocok:', { idx1, idx2 });
}
