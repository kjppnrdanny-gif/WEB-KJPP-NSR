import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

lines.slice(7999, 9500).forEach((l, idx) => {
  const lineNo = 8000 + idx;
  if (l.toLowerCase().includes('klasifikasi') || l.toLowerCase().includes('bidang jasa') || l.toLowerCase().includes('jenis jasa')) {
    console.log(`L${lineNo}: ${l.trim()}`);
  }
});
