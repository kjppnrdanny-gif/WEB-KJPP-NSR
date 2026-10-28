import fs from 'fs';
const indexHtml = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');
const lines = indexHtml.split('\n');
lines.forEach((l, idx) => {
  if (/presensi|absensi/i.test(l)) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
