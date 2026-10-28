import fs from 'fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const p = html.indexOf('id="form-token-portal"');
console.log(html.substring(p, p + 3000));
