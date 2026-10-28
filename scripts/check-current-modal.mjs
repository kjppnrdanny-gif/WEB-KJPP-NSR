import fs from 'fs';

const indexHtml = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

// Find modal login container in index.html
const pModal = indexHtml.indexOf('id="modal-token"');
console.log('Index of id="modal-token" in index.html:', pModal);
if (pModal !== -1) {
  console.log('--- Current modal-token in index.html ---');
  console.log(indexHtml.substring(pModal - 100, pModal + 2500));
}
