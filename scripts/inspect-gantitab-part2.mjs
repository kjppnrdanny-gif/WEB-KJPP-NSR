import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const gantiTabIdx = content.indexOf('function gantiTab(');
console.log(content.slice(gantiTabIdx + 1200, gantiTabIdx + 3500));
