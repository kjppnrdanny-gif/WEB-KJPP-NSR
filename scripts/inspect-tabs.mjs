import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== TAB NAVIGATION IN HTML (Around lines 240-300) ===');
for (let i = 230; i < 280; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== PANEL SPM HEADER (Around lines 1125-1175) ===');
for (let i = 1125; i < 1175; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
