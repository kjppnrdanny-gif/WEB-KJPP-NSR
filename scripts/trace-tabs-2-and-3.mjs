import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

const stack = [];
for (let i = 1775; i < 2080; i++) {
  const line = lines[i];
  const regex = /<\/?(div|form|main)\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    
    if (fullTag.startsWith('</')) {
      if (stack.length === 0) {
        console.log(`❌ Line ${i + 1}: Extra </${tagName}>: ${line.trim()}`);
      } else {
        const top = stack.pop();
        if (top.tag !== tagName) {
          console.log(`⚠️ Line ${i + 1}: Expected </${top.tag}> from line ${top.line}, got </${tagName}>`);
        }
      }
    } else {
      const idMatch = fullTag.match(/id="([^"]+)"/);
      stack.push({ line: i + 1, tag: tagName, id: idMatch ? idMatch[1] : '' });
    }
  }
}

console.log(`Unclosed from 1775 to 2080: ${stack.length}`);
stack.forEach(s => console.log(`- Line ${s.line}: <${s.tag} id="${s.id}">`));
