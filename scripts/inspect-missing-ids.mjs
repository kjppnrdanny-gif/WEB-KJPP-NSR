import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const missing = [
  'nomor_lp', 'nomor_adm', 'radio-mode-central', 'radio-mode-private',
  'form-mode-banner', 'modal-auth-token', 'gerbang-otorisasi',
  'filter-kantor-wilayah', 'tab-btn-2', 'marketing_nama', 'tab-1', 'tab-2',
  'tab-content-preview', 'view_asisten_hp', 'tujuan_penilaian',
  'helper-draft-info', 'tbody-dashboard', 'dynamic-internal-page-style'
];

const lines = html.split('\n');
missing.forEach(id => {
  console.log(`\n=== ID: ${id} ===`);
  lines.forEach((line, idx) => {
    if (line.includes(`'${id}'`) || line.includes(`"${id}"`)) {
      console.log(`L${idx+1}: ${line.trim()}`);
    }
  });
});
