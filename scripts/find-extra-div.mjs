import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idxTabForm = content.indexOf('id="tab-content-form"');
const idxTabDash = content.indexOf('id="tab-content-dashboard"');
const sliceForm = content.slice(idxTabForm, idxTabDash);

// Parse tags token by token
const tagRegex = /<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g;
let depth = 0;
let m;
let divDepth = 0;

const lines = sliceForm.split('\n');
let charCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divOpens = (line.match(/<div(\s|>)/gi) || []).length;
  const divCloses = (line.match(/<\/div>/gi) || []).length;
  
  const prevDepth = divDepth;
  divDepth += (divOpens - divCloses);
  
  if (divDepth <= 0 && prevDepth > 0) {
    console.log(`DIV DEPTH DROPPED TO 0 at line ${i + 1}:`);
    console.log('Line content:', line);
    console.log('Lines around:');
    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}

console.log('Final divDepth at end of sliceForm:', divDepth);
