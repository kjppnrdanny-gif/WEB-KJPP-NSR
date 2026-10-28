import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('=== SNIPPET 1 (around 158000) ===');
console.log(html.substring(158000, 163000));

console.log('\n=== SNIPPET 2 (around 469900) ===');
console.log(html.substring(469800, 473000));
