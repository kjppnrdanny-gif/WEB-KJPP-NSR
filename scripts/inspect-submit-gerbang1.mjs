import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const idx = php.indexOf("if ($action === 'submitGerbang1Awal')");
console.log(php.substring(idx, idx + 2000));
