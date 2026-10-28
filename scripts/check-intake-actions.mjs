import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = php.split('\n');

function findAction(act) {
  const target = "if ($action === '" + act + "')";
  const idx = lines.findIndex(l => l.includes(target));
  if (idx !== -1) {
    console.log('=== ACTION:', act, 'at line', idx + 1, '===');
    console.log(lines.slice(idx, idx + 45).join('\n'));
  } else {
    console.log('Action not found:', act);
  }
}

findAction('submitPermintaanAwalJO');
findAction('submitPengajuanPusatLP');
findAction('submitGerbang1Awal');
