import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  if (count === 3) {
    const body = match[2];
    const lines = body.split('\n');
    console.log('=== L15-L35 ===');
    console.log(lines.slice(14, 35).join('\n'));
    console.log('=== L1197-L1250 ===');
    console.log(lines.slice(1196, 1250).join('\n'));
  }
}
