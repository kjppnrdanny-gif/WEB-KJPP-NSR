import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Find action dispatcher
const actionPos = php.indexOf("if ($action === 'publishMandiriCabangLP')");
console.log('Action position:', actionPos);
console.log(php.substring(actionPos - 500, actionPos));
