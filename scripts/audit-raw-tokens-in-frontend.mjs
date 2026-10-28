import fs from 'fs';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html',
  'lib/opini-nsr-modal-engine.js'
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

files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  patterns.forEach(p => {
    if (c.includes(p)) {
      console.log(`[ALERT] ${f} contains ${p}`);
    }
  });
});
