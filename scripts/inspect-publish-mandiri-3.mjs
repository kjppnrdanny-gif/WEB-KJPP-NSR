import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const idx = php.indexOf("if ($action === 'publishMandiriCabangLP')");
console.log(php.substring(idx + 7500, idx + 12000));
