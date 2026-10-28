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
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  console.log(`\n=== ${f} ===`);
  lines.forEach((line, idx) => {
    if (line.includes('fetch(')) {
      // print context
      const snippet = lines.slice(Math.max(0, idx - 1), Math.min(lines.length, idx + 10)).join('\n');
      console.log(`Line ${idx + 1}:`);
      console.log(snippet);
      console.log('---');
    }
  });
});
