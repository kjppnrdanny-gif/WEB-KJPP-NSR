import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');

const matches = content.match(/res\.[a-zA-Z0-9_]+/g) || [];
console.log('res.xxx occurrences:', [...new Set(matches)]);
