import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idxModal = content.indexOf('id="modal-terbitkan-nolap-manual"');
console.log('--- HTML of modal-terbitkan-nolap-manual ---');
console.log(content.slice(idxModal, idxModal + 3200));

const idxJs = content.indexOf('function bukaModalTerbitkanManual');
console.log('\n--- JS of bukaModalTerbitkanManual ---');
console.log(content.slice(idxJs, idxJs + 2500));
