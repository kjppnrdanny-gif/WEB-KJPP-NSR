import fs from 'fs';
const template = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-portal-absensi-template.html', 'utf8');

const lines = template.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('PRIVACY_NOTICE_VERSION')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
