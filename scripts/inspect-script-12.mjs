import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  if (count === 12) {
    console.log('Script #12 content preview:');
    console.log(match[2].substring(0, 500));
  }
}
