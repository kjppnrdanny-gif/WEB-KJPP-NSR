import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const matches = [];
let pos = 0;
while (true) {
  const f = php.indexOf('$dualGateDbFile', pos);
  if (f === -1) break;
  matches.push(f);
  pos = f + 15;
}

console.log('Found $dualGateDbFile occurrences:', matches.length);
if (matches.length > 0) {
  console.log(php.substring(matches[0] - 200, matches[0] + 300));
}
