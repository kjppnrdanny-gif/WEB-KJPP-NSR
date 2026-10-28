import fs from 'fs';
import path from 'path';

const rootDir = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// 1. Check absensi-data-handler.php
const phpFile = path.join(rootDir, 'absensi-data-handler.php');
if (fs.existsSync(phpFile)) {
  const php = fs.readFileSync(phpFile, 'utf8');
  console.log('absensi-data-handler.php size:', php.length);
  const gasInPhp = php.match(/https:\/\/script\.google\.com\/macros\/s\/[^\s'"\)]+/g);
  console.log('GAS in PHP:', gasInPhp);
  const actionsInPhp = php.match(/case\s+['"][^'"]+['"]/g);
  console.log('Actions in PHP:', actionsInPhp);
}

// 2. Check netlify.toml for /api/absensi-data-proxy
const netlifyToml = fs.readFileSync(path.join(rootDir, 'netlify.toml'), 'utf8');
console.log('\n--- netlify.toml absensi redirects ---');
const tomlLines = netlifyToml.split('\n');
tomlLines.forEach((l, idx) => {
  if (l.includes('absensi') || l.includes('presensi')) {
    console.log(`${idx+1}: ${l}`);
  }
});
