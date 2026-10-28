import fs from 'fs';

const content = fs.readFileSync('merge-tags-engine.php', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 85; i < 95; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
