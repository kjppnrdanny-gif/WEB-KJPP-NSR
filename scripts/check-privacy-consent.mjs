import fs from 'fs';
if (fs.existsSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/lib/privacy-consent.js')) {
  const pCode = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/lib/privacy-consent.js', 'utf8');
  console.log('privacy-consent.js size:', pCode.length, 'lines:', pCode.split('\n').length);
  console.log('privacy-consent.js preview:\n', pCode.substring(0, 800));
} else {
  console.log('privacy-consent.js does not exist');
}
