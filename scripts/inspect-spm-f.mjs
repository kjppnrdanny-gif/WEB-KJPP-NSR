import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== SEC-UMUM-F (Lines 6005-6035) ===');
for (let i = 6004; i < 6035; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== SEC-UMUM-F BUTTONS (Lines 6085-6115) ===');
for (let i = 6084; i < 6115; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== BOX-SUB-SPM-TANAH APPROVAL (Lines 7825-7855) ===');
for (let i = 7824; i < 7855; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== BOX-SUB-SPM-RUISLAGH APPROVAL (Lines 13035-13065) ===');
for (let i = 13034; i < 13065; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
