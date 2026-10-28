import fs from 'fs';
const php = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/absensi-data-handler.php', 'utf8');
const lines = php.split('\n');
lines.forEach((l, idx) => {
  if (/google|script\.google|spreadsheet|gas/i.test(l)) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
