// scripts/fix-crlf-tracking.mjs
import fs from 'fs';
import path from 'path';

const phpPath = path.resolve('backend/job-tracking-handler.php');
let php = fs.readFileSync(phpPath, 'utf8');

// Replace using regex that handles \r?\n
const replacements = [
  {
    target: /'id'\s*=>\s*'JO-JKT-2026-0001',\s*\r?\n\s*'jo_number'\s*=>\s*'JO-JKT-2026-0001',/g,
    replace: "'id' => 'JO-JKT-2026-0001',\n        'jo_number' => 'JO-JKT-2026-0001',\n        'kode_lacak' => 'TRK-JKT-2026-A89F',"
  },
  {
    target: /'id'\s*=>\s*'JO-JKT-2026-0002',\s*\r?\n\s*'jo_number'\s*=>\s*'JO-JKT-2026-0002',/g,
    replace: "'id' => 'JO-JKT-2026-0002',\n        'jo_number' => 'JO-JKT-2026-0002',\n        'kode_lacak' => 'TRK-JKT-2026-C42B',"
  },
  {
    target: /'id'\s*=>\s*'JO-BDG-2026-0015',\s*\r?\n\s*'jo_number'\s*=>\s*'JO-BDG-2026-0015',/g,
    replace: "'id' => 'JO-BDG-2026-0015',\n        'jo_number' => 'JO-BDG-2026-0015',\n        'kode_lacak' => 'TRK-BDG-2026-M512',"
  },
  {
    target: /'id'\s*=>\s*'JO-MKS-2026-0008',\s*\r?\n\s*'jo_number'\s*=>\s*'JO-MKS-2026-0008',/g,
    replace: "'id' => 'JO-MKS-2026-0008',\n        'jo_number' => 'JO-MKS-2026-0008',\n        'kode_lacak' => 'TRK-MKS-2026-K734',"
  },
  {
    target: /'id'\s*=>\s*'JO-JKT-2026-0003',\s*\r?\n\s*'jo_number'\s*=>\s*'JO-JKT-2026-0003',/g,
    replace: "'id' => 'JO-JKT-2026-0003',\n        'jo_number' => 'JO-JKT-2026-0003',\n        'kode_lacak' => 'TRK-JKT-2026-B901',"
  }
];

replacements.forEach((r, idx) => {
  if (r.target.test(php)) {
    php = php.replace(r.target, r.replace);
    console.log(`✓ Replaced item ${idx + 1}`);
  } else {
    console.warn(`⚠️ Target ${idx + 1} not found`);
  }
});

fs.writeFileSync(phpPath, php, 'utf8');
console.log('✓ php file updated.');

// Delete data/job_tracking_staging.json so it is reloaded
const dataFile = path.resolve('data/job_tracking_staging.json');
if (fs.existsSync(dataFile)) {
  fs.unlinkSync(dataFile);
  console.log('✓ Removed cached json data');
}
