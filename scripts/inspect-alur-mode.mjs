import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const queries = [
  'currentModeAlur',
  'mode_pengajuan_alur',
  'alur-pusat',
  'alur-cabang'
];

for (const q of queries) {
  let count = 0;
  let pos = 0;
  let firstIdx = -1;
  while ((pos = html.indexOf(q, pos)) !== -1) {
    if (count === 0) firstIdx = pos;
    count++;
    pos += q.length;
  }
  console.log(`Query "${q}": found ${count} times, first at index ${firstIdx}`);
  if (count > 0 && count <= 4) {
    console.log(`Snippet around "${q}":\n`, html.substring(Math.max(0, firstIdx - 100), Math.min(html.length, firstIdx + 200)));
    console.log('----------------------------------------------------');
  }
}
