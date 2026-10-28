import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Find all occurrences of "STATUS PENILAI" or "MAKSUD DAN TUJUAN" or "DASAR NILAI"
const indices = [];
let pos = 0;
while (true) {
  const f = html.indexOf('STATUS PENILAI', pos);
  if (f === -1) break;
  indices.push(f);
  pos = f + 14;
}

console.log('STATUS PENILAI occurrences:', indices);
for (const i of indices) {
  console.log('--- AT', i, '---');
  console.log(html.substring(i - 200, i + 500));
}
