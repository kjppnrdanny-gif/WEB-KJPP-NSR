import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Extract script contents
const scriptRegex = /<script(?:\s+type="text\/javascript"|\s+defer|\s+id="[^"]*")*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const code = match[1];
  try {
    // Test parsing syntax
    new vm.Script(code);
    console.log(`Script #${count} syntax OK (${code.length} chars)`);
  } catch (err) {
    console.error(`Script #${count} syntax ERROR:`, err.message);
    const lines = code.split('\n');
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
console.log('All scripts parsed successfully!');
