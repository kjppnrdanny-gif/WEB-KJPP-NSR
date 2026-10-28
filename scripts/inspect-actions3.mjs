import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 3440; i < lines.length; i++) {
  const l = lines[i];
  if (!l) continue;
  if (l.includes("if ($action === '") || l.includes('if ($action == "')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 120)}`);
  }
}
