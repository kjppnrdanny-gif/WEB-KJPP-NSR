import fs from 'fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const pStart = html.indexOf('id="modal-portal"');
const pPanel = html.indexOf('id="panel-layanan"');

console.log('--- Current Modal Login in index.html ---');
console.log(html.substring(pStart - 100, pPanel));
