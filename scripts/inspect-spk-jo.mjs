import fs from 'fs';

const portalContent = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = portalContent.split('\n');

console.log('Total lines in portal-penugasan-jo.html:', lines.length);

console.log('\n--- Searching for DB_PENUGASAN_JO_NSR ---');
lines.forEach((l, i) => {
  if (l.includes('DB_PENUGASAN_JO_NSR')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});

console.log('\n--- Searching for LAST_NO_LP_SPK or 415 in numbering context ---');
lines.forEach((l, i) => {
  if (l.includes('LAST_NO_LP_SPK') || l.includes('415') && (l.includes('SPK') || l.includes('JO') || l.includes('register') || l.includes('nomor') || l.includes('saran'))) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});

console.log('\n--- Searching for Section 01 elements ---');
lines.forEach((l, i) => {
  if (l.includes('no_lingkup_penugasan') || l.includes('no_adm_jo') || l.includes('helper-nomor-terakhir') || l.includes('btn-gunakan-saran')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});

console.log('\n--- Searching for Approval Modal elements ---');
lines.forEach((l, i) => {
  if (l.includes('modal-approval-pusat') || l.includes('appr-nomor-lp') || l.includes('appr-nomor-adm') || l.includes('eksekusiApprovalPusatSubmit') || l.includes('bukaModalApprovalPusat')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});
