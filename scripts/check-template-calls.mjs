import fs from 'fs';
const template = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-portal-absensi-template.html', 'utf8');

const matches = template.match(/mintaOTP[\s\S]{1,200}/g) || [];
console.log('Matches for mintaOTP in template:\n', matches.slice(0, 3));
