import fs from 'node:fs';

const content = fs.readFileSync('portal-tracking.html', 'utf8');
const lines = content.split(/\r?\n/);

let newLines = [];
let added = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  newLines.push(line);
  if (line.includes("const isInProgress = item.status === 'in_progress';") && !added) {
    newLines.push("        const picInfo = getPicAssignment(key, activeJob || {});");
    added = true;
  }
}

fs.writeFileSync('portal-tracking.html', newLines.join('\n'), 'utf8');
console.log('Added picInfo line:', added);
