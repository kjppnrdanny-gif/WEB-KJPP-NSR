import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('portal-tracking.html', 'utf-8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let errors = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const code = match[1].trim();
  if (!code) continue;
  try {
    new vm.Script(code);
    console.log(`Script #${count}: OK (${code.length} chars)`);
  } catch (e) {
    errors++;
    console.error(`Script #${count}: SYNTAX ERROR!`);
    console.error(e.stack || e.message);
  }
}

console.log(`\nChecked ${count} scripts. Errors: ${errors}`);
if (errors > 0) process.exit(1);
