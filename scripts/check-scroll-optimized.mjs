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
    const start = lines.findIndex(l => l.includes('function handleScrollOptimized()'));
    console.log(lines.slice(start, start + 35).join('\n'));
  }
}
