import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('function applyRBAC(')) {
    console.log(`applyRBAC at line ${i + 1}`);
  }
  if (line.includes('window.applyRBAC = applyRBAC;')) {
    console.log(`window.applyRBAC at line ${i + 1}`);
  }
  if (line.includes('async function ajukanPermohonanNoLap(')) {
    console.log(`ajukanPermohonanNoLap at line ${i + 1}`);
  }
}
