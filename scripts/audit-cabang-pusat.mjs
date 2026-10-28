import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.php') || f.endsWith('.js') || f.endsWith('.mjs'));

console.log('Searching for "Cabang: Pusat" or similar...');
for (const file of files) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((l, i) => {
      if (l.includes('Cabang: Pusat') || l.includes('Cabang: {{') || l.includes('Cabang: [') || l.includes('| Cabang:')) {
        console.log(`[${file}:${i+1}] ${l.trim().slice(0, 110)}`);
      }
    });
  } catch(e) {}
}
