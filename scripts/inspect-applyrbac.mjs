import fs from 'fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split(/\r?\n/);

console.log('--- applyRBAC (lines 13315 - 13380) ---');
for (let i = 13314; i < 13380 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n--- aktifkanPanelUtama (lines 13900 - 13940) ---');
for (let i = 13899; i < 13940 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
