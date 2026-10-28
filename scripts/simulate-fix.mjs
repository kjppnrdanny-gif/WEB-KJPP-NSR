import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

// Check line 1282
console.log('Line 1281:', lines[1280]);
console.log('Line 1282:', lines[1281]);
console.log('Line 1283:', lines[1282]);

// Test removing line 1282 (index 1281)
const newLines = lines.filter((_, idx) => idx !== 1281);

let depth = 0;
let errors = [];

for (let i = 0; i < newLines.length; i++) {
  const line = newLines[i];
  const divOpens = (line.match(/<div\b/gi) || []).length;
  const divCloses = (line.match(/<\/div>/gi) || []).length;
  depth += divOpens - divCloses;

  if (newLines[i].includes('id="tab-content-form"')) {
    console.log(`tab-content-form opens at line ${i + 1}, depth = ${depth}`);
  }
  if (newLines[i].includes('id="tab-content-dashboard"')) {
    console.log(`tab-content-dashboard opens at line ${i + 1}, depth = ${depth}`);
  }
  if (newLines[i].includes('id="tab-3"')) {
    console.log(`tab-3 opens at line ${i + 1}, depth = ${depth}`);
  }
}

console.log(`Final total div balance: ${depth}`);
