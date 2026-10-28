import fs from 'fs';

function searchString(pattern, files) {
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (pattern.test(l)) {
        console.log(`${f}:${i + 1}: ${l.trim()}`);
      }
    });
  }
}

searchString(/Cabang:\s*Pusat/i, [
  'portal-nolap.html',
  'merge-tags-engine.php',
  'nolap-data-handler.php',
  'portal-kwitansi.html'
]);
