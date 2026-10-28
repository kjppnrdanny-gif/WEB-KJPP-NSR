import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

let pos = 0;
while (true) {
  const idx = content.indexOf('modal-pengaturan-register', pos);
  if (idx === -1) break;
  console.log(`modal-pengaturan-register at index ${idx}:`);
  console.log(content.slice(idx - 50, idx + 200));
  pos = idx + 26;
}
