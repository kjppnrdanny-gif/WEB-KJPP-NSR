import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const idx = content.indexOf('id="modal-terbitkan-nolap-manual"');
const end = content.indexOf('<!-- ==================== AREA CETAK', idx);
console.log(content.slice(idx, end));
