import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const pos1 = php.indexOf("if ($action === 'verifyPengesahKing')");
const pos2 = php.indexOf("if ($action === 'approveProfesionalCabangLP')");
const pos3 = php.indexOf("if ($action === 'publishMandiriCabangLP')");

console.log('pos verifyPengesahKing:', pos1);
console.log('pos approveProfesionalCabangLP:', pos2);
console.log('pos publishMandiriCabangLP:', pos3);
