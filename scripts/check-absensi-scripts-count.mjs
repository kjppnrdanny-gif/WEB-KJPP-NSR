import fs from 'fs';
const absensi = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');

console.log('Script tags count in absensi:', (absensi.match(/<script/g) || []).length);
console.log('Link tags count in absensi:', (absensi.match(/<link/g) || []).length);
console.log('Does it import privacy-consent.js?', absensi.includes('privacy-consent.js'));
