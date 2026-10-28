import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

console.log('--- POST actions in nolap-data-handler.php ---');
lines.forEach((l, i) => {
  if (l.includes("action'] === '") || l.includes('action"] === "') || l.includes("['action'] ==")) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});

console.log('--- GET actions in nolap-data-handler.php ---');
lines.forEach((l, i) => {
  if (l.includes("$_GET['action']") || l.includes('$_GET["action"]')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
  }
});
