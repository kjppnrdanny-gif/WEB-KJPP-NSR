import fs from 'fs';
import vm from 'vm';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let scriptIdx = 0;
while ((m = scriptRegex.exec(content)) !== null) {
  scriptIdx++;
  const scriptContent = m[1];
  try {
    new vm.Script(scriptContent);
    console.log(`Script ${scriptIdx}: OK (length: ${scriptContent.length})`);
  } catch (e) {
    console.error(`Script ${scriptIdx}: SYNTAX ERROR!`, e.message);
    const line = e.stack.split('\n')[0];
    console.error(line);
  }
}
