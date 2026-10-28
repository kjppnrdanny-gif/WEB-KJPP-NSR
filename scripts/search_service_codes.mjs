import fs from 'fs';

const files = [
  'portal-penugasan-jo.html',
  'portal-nolap.html',
  'portal-nolap-cabang.html',
  'nolap-data-handler.php',
  'gas-nolap-Code.gs',
  'merge-tags-engine.php',
  'data/masters/master_risk_register.json',
  'data/masters/master_spi_kepi_compliance.json',
  'data/masters/master_legal_regulations.json',
  'data/masters/master_dual_gate_consistency.json',
  'data/masters/master_google_drive_databases.json',
  'data/masters/master_penilai_publik.json'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('Properti Sederhana') || l.includes('value="PS"') || l.includes("value='PS'") || l.includes("'PS'") || l.includes('"PS"') || (l.toLowerCase().includes('klasifikasi') && l.toLowerCase().includes('jasa'))) {
      console.log(`${f}:${idx + 1}: ${l.trim()}`);
    }
  });
});
