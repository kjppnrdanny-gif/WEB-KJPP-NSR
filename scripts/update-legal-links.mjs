import fs from 'fs';
import path from 'path';

const rootDir = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// 1. disclaimer.html
const disclaimerPath = path.join(rootDir, 'disclaimer.html');
let disclaimer = fs.readFileSync(disclaimerPath, 'utf8');
if (disclaimer.includes('portal-absensi.html')) {
  disclaimer = disclaimer.replaceAll('portal-absensi.html', 'portal-presensi.html');
  fs.writeFileSync(disclaimerPath, disclaimer, 'utf8');
  console.log('✅ Updated disclaimer.html links to portal-presensi.html');
} else {
  console.log('ℹ️ disclaimer.html already updated');
}

// 2. kebijakan-privasi.html
const privasiPath = path.join(rootDir, 'kebijakan-privasi.html');
let privasi = fs.readFileSync(privasiPath, 'utf8');
if (privasi.includes('portal-absensi.html')) {
  privasi = privasi.replaceAll('portal-absensi.html', 'portal-presensi.html');
  fs.writeFileSync(privasiPath, privasi, 'utf8');
  console.log('✅ Updated kebijakan-privasi.html links to portal-presensi.html');
} else {
  console.log('ℹ️ kebijakan-privasi.html already updated');
}
