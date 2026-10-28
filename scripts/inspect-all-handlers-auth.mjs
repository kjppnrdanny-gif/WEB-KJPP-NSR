import fs from 'fs';

const files = [
  'kwitansi-data-handler.php',
  'operasional-data-handler.php',
  'surat-umum-data-handler.php'
];

files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  console.log(`=== ${f} ===`);
  const sStart = c.indexOf('session_start');
  const nsrUser = c.indexOf('nsr_user');
  const authCheck = c.indexOf('http_response_code(401)');
  console.log({ sStart: sStart !== -1, nsrUser: nsrUser !== -1, authCheck: authCheck !== -1 });
});
