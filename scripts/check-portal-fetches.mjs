import fs from 'fs';

const files = [
  'portal-penugasan-jo.html',
  'portal-nolap.html',
  'portal-nolap-cabang.html',
  'portal-kwitansi.html',
  'portal-operasional.html',
  'portal-surat-umum.html'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const fetches = (content.match(/fetch\s*\(/g) || []).length;
  const creds = (content.match(/credentials:\s*['"]include['"]/g) || []).length;
  console.log(`${f} -> fetches: ${fetches}, credentials include: ${creds}`);
});
