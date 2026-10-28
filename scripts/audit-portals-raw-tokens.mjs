import fs from 'fs';

const portalFiles = [
  'portal-nolap.html',
  'portal-nolap-cabang.html',
  'portal-penugasan-jo.html',
  'portal-kwitansi.html',
  'portal-operasional.html',
  'portal-surat-umum.html'
];

const patterns = [
  (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
  (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"),
  'NSR-PDG-2026',
  'NSR-MKS-2026',
  'NSR-PLB-2026',
  'NSR-SPM-',
  'NSR-TEK-',
  'NSR-NARA-',
  'NSR-DUS-',
  'KING-PST-'
];

portalFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  const c = fs.readFileSync(f, 'utf8');
  patterns.forEach(p => {
    if (c.includes(p)) {
      console.log(`[ALERT] ${f} contains ${p}`);
    }
  });
});
