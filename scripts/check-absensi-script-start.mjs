import fs from 'fs';
const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/portal-absensi.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('Script tag starts at:', lines.findIndex(l => l.includes('<script>') || (l.includes('<script') && !l.includes('src='))));
const scriptStart = lines.findIndex(l => l.includes('<script>') || (l.includes('<script') && !l.includes('src=')));
console.log(lines.slice(scriptStart, scriptStart + 60).join('\n'));
