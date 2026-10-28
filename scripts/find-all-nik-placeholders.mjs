import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('placeholder=') || line.includes('cth:') || line.includes('Contoh:') || line.includes('contoh:')) && (line.includes('NSR') || line.includes('nik') || line.includes('NIK') || line.includes('token') || line.includes('Token'))) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
});
