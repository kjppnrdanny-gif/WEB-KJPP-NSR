import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const fIdx = jo.indexOf('DOKUMEN 3F');
if (fIdx !== -1) {
  console.log('=== DOKUMEN 3F SNIPPET ===');
  console.log(jo.substring(fIdx, fIdx + 2500));
}

const gIdx = jo.indexOf('DOKUMEN 3G');
if (gIdx !== -1) {
  console.log('=== DOKUMEN 3G SNIPPET ===');
  console.log(jo.substring(gIdx, gIdx + 2500));
}
