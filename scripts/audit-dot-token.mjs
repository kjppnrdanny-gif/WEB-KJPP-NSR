import fs from 'fs';

const portalFiles = [
  'portal-nolap.html',
  'portal-nolap-cabang.html',
  'portal-penugasan-jo.html',
  'portal-kwitansi.html',
  'portal-operasional.html',
  'portal-surat-umum.html'
];

portalFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  console.log(`\n================== ${f} ==================`);
  lines.forEach((line, idx) => {
    if (/\b(?:auth|sess|session|userSession|currentUser|sesiAktif|tokenAuth)\.token\b/.test(line)) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  });
});
