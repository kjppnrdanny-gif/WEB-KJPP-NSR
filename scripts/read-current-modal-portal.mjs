import fs from 'fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const p = html.indexOf('id="modal-portal"');
console.log('Index of id="modal-portal":', p);
// find end of modal
const pEnd = html.indexOf('</div>\n  </div>', p);
console.log(html.substring(p - 80, p + 4000));
