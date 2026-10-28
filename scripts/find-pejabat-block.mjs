import fs from 'fs';

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const needle = "$pejabatPengesah = [";
const pos = php.indexOf(needle);
console.log('Pos:', pos);
if (pos !== -1) {
  console.log(php.substring(pos, pos + 500));
}
