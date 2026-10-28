import fs from 'fs';

console.log('--- compare-presensi-pages.mjs ---');
if (fs.existsSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/scripts/compare-presensi-pages.mjs')) {
  console.log(fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/scripts/compare-presensi-pages.mjs', 'utf8'));
}

console.log('\n--- verify-live-portal-presensi-wrapper.mjs ---');
if (fs.existsSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/scripts/verify-live-portal-presensi-wrapper.mjs')) {
  console.log(fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/scripts/verify-live-portal-presensi-wrapper.mjs', 'utf8').substring(0, 1500));
}
