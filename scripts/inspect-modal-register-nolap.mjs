import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('id="modal-pengaturan-register"');
console.log(content.slice(idx, idx + 2000));
