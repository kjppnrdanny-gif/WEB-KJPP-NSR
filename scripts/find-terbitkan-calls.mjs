import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

let pos = 0;
while (true) {
  const idx = content.indexOf('bukaModalTerbitkanManual', pos);
  if (idx === -1) break;
  console.log(`bukaModalTerbitkanManual at index ${idx}:`);
  console.log(content.slice(idx - 60, idx + 100));
  pos = idx + 25;
}
