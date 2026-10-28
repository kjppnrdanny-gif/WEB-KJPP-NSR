import fs from 'fs';

const template = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-portal-absensi-template.html', 'utf8');

const funcs = template.match(/function\s+([a-zA-Z0-9_]+)\s*\(/g) || [];
console.log('Functions in gas-portal-absensi-template.html:');
funcs.forEach(f => console.log(' - ' + f.replace('function ', '').replace('(', '').trim()));
