import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Find where $action is checked before publishMandiriCabangLP
const pos = php.indexOf("if ($action === 'publishMandiriCabangLP')");
console.log('Pos:', pos);
console.log(php.substring(pos - 300, pos));
