import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');
const modals = content.match(/id=\"modal[^\"]*\"/g);
console.log('Modals in portal-absensi.html:', modals);
