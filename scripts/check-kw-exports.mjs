import fs from 'fs';
const kwCode = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/netlify/functions/kwitansi-data-proxy.mjs', 'utf8');
const exp = kwCode.match(/export\s+[^;{\n]+/g);
console.log('Exports in kwitansi-data-proxy.mjs:', exp);
