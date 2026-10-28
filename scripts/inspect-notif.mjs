import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('function kirimNotifikasiWorkflow') || (i > 1000 && i < 1200 && l.includes('kirimNotifikasiWorkflow'))) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 120)}`);
  }
});
