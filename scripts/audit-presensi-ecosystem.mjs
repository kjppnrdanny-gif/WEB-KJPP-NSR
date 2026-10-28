import fs from 'fs';
import path from 'path';

const rootDir = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

console.log('=== AUDIT PRESENSI ECOSYSTEM ===');

// 1. Check portal-absensi.html
const absensiHtml = fs.readFileSync(path.join(rootDir, 'portal-absensi.html'), 'utf8');
console.log('portal-absensi.html size:', absensiHtml.length, 'bytes, lines:', absensiHtml.split('\n').length);

// Extract GAS URL or API endpoints in portal-absensi.html
const gasUrlsAbsensi = absensiHtml.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_\-]+(\/exec)?/g) || [];
console.log('GAS URLs in portal-absensi.html:', [...new Set(gasUrlsAbsensi)]);

const fetchCallsAbsensi = absensiHtml.match(/fetch\s*\([^)]+\)/g) || [];
console.log('Fetch calls count in portal-absensi.html:', fetchCallsAbsensi.length);

// 2. Check portal-presensi.html
const presensiHtml = fs.readFileSync(path.join(rootDir, 'portal-presensi.html'), 'utf8');
console.log('\nportal-presensi.html size:', presensiHtml.length, 'bytes, lines:', presensiHtml.split('\n').length);
const gasUrlsPresensi = presensiHtml.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_\-]+(\/exec)?/g) || [];
console.log('GAS URLs in portal-presensi.html:', [...new Set(gasUrlsPresensi)]);

// 3. Check gas-absensi-Code.gs
if (fs.existsSync(path.join(rootDir, 'gas-absensi-Code.gs'))) {
  const gasCode = fs.readFileSync(path.join(rootDir, 'gas-absensi-Code.gs'), 'utf8');
  console.log('\ngas-absensi-Code.gs size:', gasCode.length, 'bytes, lines:', gasCode.split('\n').length);
  const sheetIds = gasCode.match(/SPREADSHEET_ID\s*=\s*['"][^'"]+['"]/g) || [];
  console.log('Spreadsheet IDs in gas-absensi-Code.gs:', sheetIds);
  const actions = gasCode.match(/action\s*===?\s*['"][a-zA-Z0-9_]+['"]/g) || [];
  console.log('Supported actions in GAS:', actions);
}

// 4. Check netlify function absensi-data-proxy.mjs
if (fs.existsSync(path.join(rootDir, 'netlify/functions/absensi-data-proxy.mjs'))) {
  const proxyCode = fs.readFileSync(path.join(rootDir, 'netlify/functions/absensi-data-proxy.mjs'), 'utf8');
  console.log('\nabsensi-data-proxy.mjs size:', proxyCode.length);
  const gasInProxy = proxyCode.match(/https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_\-]+(\/exec)?/g) || [];
  console.log('GAS URLs in proxy:', [...new Set(gasInProxy)]);
}

// 5. Check links in public HTML files
const publicHtmls = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html',
  'disclaimer.html',
  'kebijakan-privasi.html'
];

console.log('\n--- Link Analysis in Public Pages ---');
publicHtmls.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const presensiMatches = content.match(/href=["'][^"']*(?:presensi|absensi|AKfycbwI)[^"']*["']/gi) || [];
    console.log(`${file}:`, presensiMatches);
  }
});
