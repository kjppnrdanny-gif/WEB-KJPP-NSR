import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('submitGerbang1Awal') || l.includes('action=submit') || l.includes('function simpan') || l.includes('function submit')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
