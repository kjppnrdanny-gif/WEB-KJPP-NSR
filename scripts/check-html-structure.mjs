import fs from 'fs';
const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');

const pHeader = html.indexOf('<header');
const pMain = html.indexOf('<main');
const pScript = html.indexOf('<script>');

console.log('pHeader:', pHeader, 'pMain:', pMain, 'pScript:', pScript);
console.log('Header to Main preview:\n', html.substring(pHeader, pHeader + 600));
