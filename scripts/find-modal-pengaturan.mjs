import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.mjs'));
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('bukaModalPengaturanRegister')) {
    console.log('Found in:', f);
  }
});
