import fs from 'fs';
const php = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/absensi-data-handler.php', 'utf8');
const lines = php.split('\n');
console.log('Search action handling in absensi-data-handler.php:');
lines.forEach((l, idx) => {
  if (l.includes("action === '") || l.includes('case "') || l.includes("case '") || l.includes('$action ===')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});
