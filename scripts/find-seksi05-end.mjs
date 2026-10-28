import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const sIdx = html.indexOf('5. SUSUNAN TIM PENILAI & AUTO-VLOOKUP KREDENSIAL');
const nextIdx = html.indexOf('<!-- 6.', sIdx);
if (nextIdx !== -1) {
  console.log('Next section comment:', html.substring(nextIdx, nextIdx + 80));
} else {
  const nextDiv = html.indexOf('<!--', sIdx + 100);
  console.log('Next comment:', html.substring(nextDiv, nextDiv + 80));
}
