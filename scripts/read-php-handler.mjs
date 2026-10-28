import fs from 'fs';
const php = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/absensi-data-handler.php', 'utf8');
console.log('PHP lines:', php.split('\n').length);
console.log('PHP start:\n', php.substring(0, 1000));
