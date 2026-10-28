import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('OFFICIAL_REGISTER_CONFIG');
console.log('OFFICIAL_REGISTER_CONFIG in portal-nolap.html:');
if (idx > -1) {
  console.log(content.slice(idx - 50, idx + 600));
} else {
  console.log('NOT FOUND');
}
