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
  console.log(`=== ${f} ===`);
  const fetches = c.match(/fetch\([^)]+\)/g) || [];
  console.log(`Fetch count: ${fetches.length}`);
  const hasCredentialsInclude = c.includes("credentials: 'include'") || c.includes('credentials: "include"');
  console.log(`Has credentials include: ${hasCredentialsInclude}`);
});
