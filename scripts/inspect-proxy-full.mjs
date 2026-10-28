import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/netlify/functions/absensi-data-proxy.mjs', 'utf8');
console.log('Size:', content.length, 'lines:', content.split('\n').length);
console.log(content.substring(0, 1500));
