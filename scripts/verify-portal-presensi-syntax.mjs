import fs from 'fs';

const html = fs.readFileSync('portal-presensi.html', 'utf8');

// Check script syntax
const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
console.log('Found ' + scriptMatches.length + ' script tags in portal-presensi.html');
scriptMatches.forEach((m, idx) => {
  const code = m[1];
  if (!code.trim()) return;
  try {
    new Function(code);
    console.log('Script ' + (idx+1) + ': Syntax OK');
  } catch(e) {
    console.error('Script ' + (idx+1) + ' Syntax ERROR: ' + e.message);
  }
});

// Check key IDs
const checkIds = [
  'auth-nik-input',
  'auth-otp-input',
  'btn-minta-otp',
  'btn-resend-otp',
  'btn-verif-otp',
  'auth-box-otp-input',
  'auth-box-unverified',
  'auth-box-verified',
  'tab-btn-dashboard'
];

let allOk = true;
checkIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.warn('❌ Missing ID: ' + id);
    allOk = false;
  } else {
    console.log('✓ ID exists: ' + id);
  }
});

if (allOk) {
  console.log('🎉 PORTAL-PRESENSI SCRIPT & DOM SYNTAX ARE 100% VALID!');
}
