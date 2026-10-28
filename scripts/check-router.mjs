import fs from 'fs';
const router = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/router.php', 'utf8');
const lines = router.split('\n');
console.log(lines.slice(25, 55).join('\n'));
