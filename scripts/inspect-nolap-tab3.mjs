import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

// Find tab-btn-approval and its corresponding container
const btnIdx = content.indexOf('tab-btn-approval');
console.log('--- tab-btn-approval ---');
console.log(content.slice(btnIdx - 200, btnIdx + 400));

// Find modal-terbitkan-nolap-manual
const modalIdx = content.indexOf('id="modal-terbitkan-nolap-manual"');
console.log('\n--- modal-terbitkan-nolap-manual ---');
console.log(content.slice(modalIdx, modalIdx + 2000));
