import fs from 'fs';

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

console.log('Searching for Presensi links in HTML files...');
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('presensi') && (line.includes('href=') || line.includes('onclick='))) {
      console.log(`[${file}:${i + 1}] ${line.trim()}`);
    }
  }
}
