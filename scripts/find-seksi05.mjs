import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const sIdx = html.indexOf('5. SUSUNAN TIM PENILAI & AUTO-VLOOKUP KREDENSIAL');
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 1200));
}
