import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const idx = php.indexOf('MISSING_APPLICANT_NAME');
console.log(php.substring(idx - 600, idx));
