import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const _ID_ALIAS_MAP = {
  'nomor_lp': 'no_lingkup_penugasan',
  'nomor_adm': 'no_adm_jo',
  'form-mode-banner': 'banner-mode-akses',
  'tujuan_penilaian': 'maksud_tujuan_penilaian',
  'tbody-dashboard': 'tbody_antrean',
  'tab-content-preview': 'tab-3',
  'tab-btn-2': 'btn-tab-dashboard',
  'marketing_nama': 'pic_marketing',
  'filter-kantor-wilayah': 'filter_wilayah',
  'tab-1': 'tab-content-form',
  'tab-2': 'tab-content-dashboard'
};

const missing = [
  'nomor_lp', 'nomor_adm', 'form-mode-banner', 'tujuan_penilaian',
  'tbody-dashboard', 'tab-content-preview', 'tab-btn-2', 'marketing_nama',
  'filter-kantor-wilayah', 'tab-1', 'tab-2'
];

let allGood = true;
missing.forEach(id => {
  const targetId = _ID_ALIAS_MAP[id];
  const exists = html.includes(`id="${targetId}"`);
  console.log(`ID alias '${id}' -> '${targetId}' (exists in HTML: ${exists})`);
  if (!exists) allGood = false;
});

console.log('\nALL ALIASES RESOLVE TO REAL DOM NODES:', allGood);
