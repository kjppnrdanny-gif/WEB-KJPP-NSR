import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const idx = php.indexOf('approveProfesionalCabangLP');
console.log(php.substring(idx + 1800, idx + 4000));
