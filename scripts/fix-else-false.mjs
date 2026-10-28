import fs from 'fs';

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

php = php.replace('} else if (false) {', '} else {');
fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('Fixed else if (false) to else in nolap-data-handler.php!');
