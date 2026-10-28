// scripts/update-build-allowlist.mjs
import fs from 'fs';

const filePath = 'scripts/build-production.mjs';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('"portal-tracking.html"')) {
  content = content.replace(
    '"portal-governance.html",',
    '"portal-governance.html",\n  "portal-tracking.html",'
  );
}

if (!content.includes('"job-tracking-handler.php"')) {
  content = content.replace(
    '"status-terintegrasi-handler.php"',
    '"status-terintegrasi-handler.php",\n  "job-tracking-handler.php",\n  "backend/job-tracking-handler.php"'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ scripts/build-production.mjs updated with tracking files.');
