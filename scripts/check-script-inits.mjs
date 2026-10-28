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
    lines.forEach((line, idx) => {
      if (line.includes('window.addEventListener') || line.includes('document.addEventListener') || line.includes('initUIInteraktif')) {
        console.log(`L${idx+1}: ${line}`);
      }
    });
  }
}
