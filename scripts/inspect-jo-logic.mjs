import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

const targets = [
  'function validasiDuplikatLive',
  'function updateNomorOtomatisPreview',
  'function onTujuanPenilaianJoChange',
  'function getResolvedTujuanPenilaian',
  'function setWilayahDropdown'
];

targets.forEach(t => {
  lines.forEach((l, i) => {
    if (l.includes(t)) {
      console.log(`Found ${t} at line ${i+1}`);
    }
  });
});
