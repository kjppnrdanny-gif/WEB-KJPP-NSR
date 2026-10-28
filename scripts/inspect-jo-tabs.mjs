import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Find gantiTab function definition
const gantiTabIdx = content.indexOf('function gantiTab');
console.log('--- gantiTab function ---');
console.log(content.slice(gantiTabIdx, gantiTabIdx + 1200));

// Find tab-1, tab-2, tab-3 or tab-content-
console.log('\n--- Tab structure search ---');
const regex = /<(div|section)[^>]+id=["'](tab-[^"']+|tab-content-[^"']+)["'][^>]*>/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log(m[0]);
}
