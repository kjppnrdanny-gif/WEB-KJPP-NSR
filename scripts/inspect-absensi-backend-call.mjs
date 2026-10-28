import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(710, 830).join('\n'));
