import fs from 'fs';

const c1 = fs.readFileSync('portal-presensi.html', 'utf8');
const c2 = fs.readFileSync('absensi-data-handler.php', 'utf8');
const c3 = fs.readFileSync('gas-absensi-Code.gs', 'utf8');

console.log('portal-presensi.html WFH occurrences:');
c1.split('\n').forEach((l, i) => {
  if (l.includes('gps_wfh') || l.includes('tab-btn-wfh') || l.includes('wfh-gps-display') || l.includes('cekLokasiWFH')) {
    console.log(`  Line ${i+1}: ${l.trim()}`);
  }
});

console.log('\nabsensi-data-handler.php WFH occurrences:');
c2.split('\n').forEach((l, i) => {
  if (l.includes('gps_wfh') || l.includes('master_wfh') || l.includes('cekLokasiWFH')) {
    console.log(`  Line ${i+1}: ${l.trim()}`);
  }
});
