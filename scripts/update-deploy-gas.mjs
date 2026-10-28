// scripts/update-deploy-gas.mjs
import fs from 'fs';

let code = fs.readFileSync('scripts/deploy-integrated-gas.mjs', 'utf8');

const targetRegex = /\/\/ Hapus doGet dan doPost dari JobTracking[\s\S]*?doPost dipusatkan di Kode\.gs\\n'\s*\);/;

const replacement = `// Hindari bentrok doGet dan doPost dengan Kode.gs
  trackingSource = trackingSource.replace('function doGet(e)', 'function trackingDoGet_(e)');
  trackingSource = trackingSource.replace('function doPost(e)', 'function trackingDoPost_(e)');`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, replacement);
  fs.writeFileSync('scripts/deploy-integrated-gas.mjs', code, 'utf8');
  console.log('✓ Successfully replaced in deploy-integrated-gas.mjs');
} else {
  console.warn('⚠️ targetRegex not matched in deploy-integrated-gas.mjs');
}
