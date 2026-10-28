import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.php') || f.endsWith('.gs') || f.endsWith('.js'));
files.forEach(f => {
  try {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes('Ragunan Raya No. 8')) {
      console.log(`${f} has Ragunan Raya No. 8`);
    }
  } catch (e) {}
});
