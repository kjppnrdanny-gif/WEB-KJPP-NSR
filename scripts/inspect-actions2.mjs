import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 2860; i < 3550; i++) {
  const l = lines[i];
  if (!l) continue;
  if (l.includes("action === '") || l.includes('action == "') || l.includes('case ') || l.includes('function ') || l.includes('if ($action')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 120)}`);
  }
}
