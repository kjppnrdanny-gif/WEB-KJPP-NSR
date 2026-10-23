import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let i = 0;
let errors = 0;
while ((match = regex.exec(html)) !== null) {
  i++;
  const code = match[1];
  if (!code.trim()) continue;
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`Script block #${i} syntax error:`, err.message);
    errors++;
  }
}
if (errors === 0) {
  console.log(`All ${i} script blocks in portal-penugasan-jo.html passed syntax check!`);
} else {
  process.exit(1);
}
