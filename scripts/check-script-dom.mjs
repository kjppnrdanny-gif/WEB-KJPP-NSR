import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

// Find all document.getElementById or document.querySelector in Script #3
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  if (count === 3) {
    const body = match[2];
    const queries = [...body.matchAll(/document\.(?:getElementById|querySelector\w*)\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
    console.log('DOM queries in Script #3:', Array.from(new Set(queries)));
  }
}
