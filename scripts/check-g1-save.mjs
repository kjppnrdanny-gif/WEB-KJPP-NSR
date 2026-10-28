import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const sIdx = lines.findIndex(l => l.includes("action === 'submitGerbang1Awal'"));
for (let i = sIdx; i < sIdx + 120; i++) {
  if (lines[i].includes('simpan') || lines[i].includes('echo json_encode')) {
    console.log(`L${i+1}: ${lines[i]}`);
  }
}
