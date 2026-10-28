import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Find occurrences of publishMandiriCabangLP, signLaporanPenilaiPublik, approvePengajuanNomorJO
const actions = ['publishMandiriCabangLP', 'approvePengajuanNomorJO', 'signLaporanPenilaiPublik', 'verifyPengesahKing'];
for (const a of actions) {
  const idx = php.indexOf(a);
  console.log(`Action ${a}: idx=${idx}`);
  if (idx !== -1) {
    console.log(php.substring(idx - 50, idx + 800));
  }
}
