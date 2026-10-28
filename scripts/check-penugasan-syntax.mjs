import fs from 'fs';
import vm from 'vm';

function checkHtmlScripts(filename) {
  const html = fs.readFileSync(filename, 'utf8');
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1];
    // Ignore external scripts or empty ones
    if (!code.trim() || match[0].includes('src=')) continue;
    count++;
    try {
      new vm.Script(code);
      console.log(`[OK] Script block ${count} in ${filename} passed syntax check.`);
    } catch (err) {
      console.error(`[ERROR] Script block ${count} in ${filename} failed syntax check:`, err.message);
      process.exit(1);
    }
  }
}

checkHtmlScripts('portal-penugasan-jo.html');
