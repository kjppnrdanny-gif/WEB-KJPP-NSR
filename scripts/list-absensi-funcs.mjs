import fs from 'fs';

const absensiHtml = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');

// Check all function declarations in portal-absensi.html
const funcs = absensiHtml.match(/function\s+([a-zA-Z0-9_]+)\s*\(/g) || [];
console.log('All functions in portal-absensi.html:');
funcs.forEach(f => console.log(' - ' + f.replace('function ', '').replace('(', '').trim()));
