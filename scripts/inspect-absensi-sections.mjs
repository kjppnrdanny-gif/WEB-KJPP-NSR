import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');

const sections = [
  'header',
  'live-clock',
  'gps-radar-box',
  'auth-card',
  'mode switcher',
  'panelAbsensi',
  'panelWFH',
  'panelCuti',
  'panelRiwayat',
  'modal-privasi',
  'modal-notif',
  'script'
];

sections.forEach(s => {
  const pos = content.toLowerCase().indexOf(s.toLowerCase());
  console.log(`Section [${s}] at index ${pos}`);
});
