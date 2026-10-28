import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const pos = php.indexOf("if ($action === 'verifyPengesahKing')");
console.log('verifyPengesahKing pos:', pos);
console.log('Length:', php.length);

// Also check where $_SERVER['REQUEST_METHOD'] is evaluated
console.log('Surrounding pos 345500:');
console.log(php.substring(pos - 200, pos + 200));
