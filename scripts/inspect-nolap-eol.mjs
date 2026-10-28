import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const p1 = content.indexOf('<div class="border-b border-slate-800 pb-4">');
console.log('EOL before p1:', JSON.stringify(content.slice(p1 - 10, p1)));
const p2 = content.lastIndexOf('</script>');
console.log('EOL before p2:', JSON.stringify(content.slice(p2 - 10, p2)));
