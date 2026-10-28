import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const scriptBlocks = [...content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
console.log('Total script blocks:', scriptBlocks.length);

const ids = ['sistem-mutu', 'layanan', 'galeri', 'kontak'];

ids.forEach(id => {
  console.log(`\n=== References to "${id}" in scripts ===`);
  scriptBlocks.forEach((sb, idx) => {
    const code = sb[1];
    if (code.includes(id)) {
      console.log(`In script #${idx + 1}:`);
      const lines = code.split('\n');
      lines.forEach((l, lineIdx) => {
        if (l.includes(id)) {
          console.log(`  Line ${lineIdx + 1}: ${l.trim()}`);
        }
      });
    }
  });
});
