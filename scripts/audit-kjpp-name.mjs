import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.php') || f.endsWith('.mjs') || f.endsWith('.js'));

console.log('Searching for KJPP name variations...');
const matches = [];

const patterns = [
  /KJPP\s+NANANG\s+RAHAYU\s*&\s*REKAN/gi,
  /KJPP\s+NANANG\s+RAHAYU\s+SIGIT\s+PARYANTO\s*&\s*REKAN/gi,
  /KJPP\s+NANANG\s+RAHAYU\s+DAN\s+REKAN/gi,
  /KJPP\s+Nanang\s+Rahayu\s*&\s*Rekan/gi
];

for (const file of files) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const p of patterns) {
        if (p.test(lines[i])) {
          matches.push({ file, line: i + 1, text: lines[i].trim() });
          break;
        }
      }
    }
  } catch(e) {}
}

console.log(`Found ${matches.length} matches:`);
matches.slice(0, 30).forEach(m => console.log(`[${m.file}:${m.line}] ${m.text.slice(0, 110)}`));
if (matches.length > 30) {
  console.log(`... and ${matches.length - 30} more`);
}
