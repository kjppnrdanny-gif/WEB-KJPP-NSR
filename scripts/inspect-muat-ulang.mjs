import fs from 'fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split(/\r?\n/);

console.log('--- muatUlangTabel (lines 14830-14920) ---');
for (let i = 14830; i < 14920 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
