import fs from 'node:fs';

const code = fs.readFileSync('nolap-data-handler.php', 'utf8');
const idx = code.indexOf("if ($action === 'approveRequest')");
if (idx !== -1) {
  console.log(code.substring(idx + 2400, idx + 5200));
}
