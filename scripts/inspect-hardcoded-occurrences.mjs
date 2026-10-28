import fs from 'fs';

function inspectOccurrences(file, term) {
  const c = fs.readFileSync(file, 'utf8');
  const lines = c.split('\n');
  lines.forEach((l, i) => {
    if (l.includes(term)) {
      console.log(`${file}:${i+1}: ${l.trim().slice(0, 120)}`);
    }
  });
}

inspectOccurrences('portal-penugasan-jo.html', 'NSR-SPM-');
inspectOccurrences('portal-kwitansi.html', (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"));
