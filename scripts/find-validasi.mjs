import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('function validasiFormDanMitigasiLive') || line.includes('function ajukanPermohonanNoLap')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
