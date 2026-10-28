import fs from 'node:fs';
import path from 'node:path';

const buildPath = path.resolve('scripts/build-production.mjs');
let content = fs.readFileSync(buildPath, 'utf8');

content = content.replace(/,\r?\n\s*"data\/\.htaccess"/g, '');
content = content.replace(/\r?\n\s*"data\/\.htaccess",?/g, '');

fs.writeFileSync(buildPath, content, 'utf8');
console.log('Successfully removed data/.htaccess from ALLOWED_FILES');

const distData = path.resolve('dist/data');
if (fs.existsSync(distData)) {
  fs.rmSync(distData, { recursive: true, force: true });
  console.log('Removed dist/data directory.');
}
