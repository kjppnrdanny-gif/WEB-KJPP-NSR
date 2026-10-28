import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const tab3Idx = content.indexOf('id="tab-3"');
const nextTab = content.indexOf('<!-- END TAB 3 -->', tab3Idx);
console.log('tab-3 length/slice:');
console.log(content.slice(tab3Idx, tab3Idx + 2000));

// Also let's search for "Section 01" across the entire file
let pos = 0;
while (true) {
  const s = content.indexOf('Section 01', pos);
  if (s === -1) break;
  console.log(`\nFound "Section 01" at index ${s}:`);
  console.log(content.slice(Math.max(0, s - 100), s + 150));
  pos = s + 10;
}
