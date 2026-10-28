import fs from 'fs';

const html = fs.readFileSync('portal-tracking.html', 'utf8');

const checks = [
  { name: 'Header brand & title', test: html.includes('PORTAL JOB TRACKING') && html.includes('7 MILESTONES') },
  { name: 'Workstation identity bar', test: html.includes('auth-workstation-bar') && html.includes('auth-badge-workstation') },
  { name: 'Branch isolation banner', test: html.includes('branch-isolation-banner') && html.includes('Isolasi Wilayah Cabang Aktif') },
  { name: 'Preset login pills (5 cabang)', test: html.includes('NSR-2019-005') && html.includes('NSR-BDG-2020-39') && html.includes('NSR-PDG-2019-23') && html.includes('NSR-MKS-2019-31') && html.includes('NSR-PLB-2022-45') },
  { name: 'Interactive update milestone modal', test: html.includes('modal-update-milestone') && html.includes('upd-nik') && html.includes('upd-pin') && html.includes('upd-note') },
  { name: 'Tarik Data JO modal & button', test: html.includes('Tarik Data dari Registrasi JO') && html.includes('modal-pilih-jo') && html.includes('isiFormulirDariJO') },
  { name: 'Open editable form fields', test: html.includes('id="reg-lingkup"') && html.includes('id="reg-tgl-lingkup"') && html.includes('id="reg-sla-days"') },
  { name: 'Branch-filtered Reviewer SPM', test: html.includes('REVIEWERS_BY_BRANCH') && html.includes('Tedi Setiadi') && html.includes('Ardi Nurmayadi') && html.includes('Rahmad Andika') && html.includes('Wawan Kurniawan') && html.includes('Rafdinal Ardhi') },
  { name: '5 Penilai Publik Berizin Kemenkeu RI', test: html.includes('P-1.09.00218') && html.includes('P-1.20.00581') && html.includes('PS-1.15.00046') && html.includes('PS-1.16.00126') && html.includes('PS-1.19.00249') },
  { name: 'Vertical Stepper 7 Milestone modal', test: html.includes('modal-tracking-stepper') && html.includes('stepper-items-container') }
];

console.log('=== VERIFIKASI HTML PORTAL TRACKING ===');
let allPass = true;
checks.forEach(c => {
  console.log(`${c.test ? '✓' : '✗'} ${c.name}: ${c.test ? 'PASS' : 'FAIL'}`);
  if (!c.test) allPass = false;
});

if (allPass) {
  console.log('\nSEMUA 10 ELEMEN TERVERIFIKASI SEMPURNA!');
} else {
  console.error('\nADA ELEMEN YANG GAGAL VERIFIKASI!');
  process.exit(1);
}
