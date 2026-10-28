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
  const c = fs.readFileSync(f, 'utf8');
  // find fetch calls that call /api/ or data proxy
  const apiFetchRegex = /fetch\(\s*[`'"][^`'"]*(?:api\/|\.php)[^`'"]*[`'"][^)]*\)/g;
  let match;
  let count = 0;
  let withCreds = 0;
  while ((match = apiFetchRegex.exec(c)) !== null) {
    count++;
    if (match[0].includes('credentials')) {
      withCreds++;
    } else {
      console.log(`[NO CREDS] ${f}: ${match[0].slice(0, 80).replace(/\s+/g, ' ')}`);
    }
  }
  console.log(`${f}: Total API fetches = ${count}, with credentials = ${withCreds}`);
});
