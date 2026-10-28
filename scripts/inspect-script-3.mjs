import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  if (count === 3) {
    const body = match[2];
    console.log('Script #3 length:', body.length);
    // Find functions or major sections in Script #3
    const lines = body.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('function') || line.includes('addEventListener') || line.includes('//') && line.length < 80) {
        if (line.trim().startsWith('//') || line.trim().startsWith('function') || line.includes('document.addEventListener')) {
          console.log(`L${idx+1}: ${line.trim()}`);
        }
      }
    });
  }
}
