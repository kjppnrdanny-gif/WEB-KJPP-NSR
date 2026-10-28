import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];

console.log(`Found ${scriptMatches.length} inline script blocks.`);

scriptMatches.forEach((m, idx) => {
  const code = m[1];
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`❌ SyntaxError in script #${idx + 1}:`, err.message);
    const lines = code.split('\n');
    console.error('Code snippet:');
    lines.slice(0, 25).forEach((l, li) => console.error(`  ${li + 1}: ${l}`));
  }
});
