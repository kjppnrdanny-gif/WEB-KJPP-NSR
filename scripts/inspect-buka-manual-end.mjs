import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idxJs = content.indexOf('const nomorDraft = item.nomorLaporan');
console.log(content.slice(idxJs, idxJs + 1500));
