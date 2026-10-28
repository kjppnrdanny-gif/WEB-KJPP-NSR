import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

let pos = 0;
while (true) {
  const idx = content.indexOf('tabel-body-pending', pos);
  if (idx === -1) break;
  console.log(`tabel-body-pending at index ${idx}:`);
  console.log(content.slice(idx - 100, idx + 400));
  pos = idx + 20;
}
