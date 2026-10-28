import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const modalIdx = content.indexOf('id="modal-terbitkan-nolap-manual"');
console.log(content.slice(modalIdx + 1500, modalIdx + 4500));
