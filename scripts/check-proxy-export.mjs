import fs from 'fs';
const kwCode = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/netlify/functions/kwitansi-data-proxy.mjs', 'utf8');
console.log('kwitansi-data-proxy.mjs header & handler:\n', kwCode.substring(0, 800));
