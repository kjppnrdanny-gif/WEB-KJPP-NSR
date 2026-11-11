// scripts/inspect-wawasan-dropdown.mjs
import fs from 'node:fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const needle = 'Wawasan &amp; Regulasi';
let pos = 0;
while ((pos = html.indexOf(needle, pos)) !== -1) {
  console.log(`=== Found at position ${pos} ===`);
  console.log(html.substring(pos - 150, pos + 800));
  pos += needle.length;
}
