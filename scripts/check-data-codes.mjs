import fs from 'fs';

const files = fs.readdirSync('data').filter(f => f.endsWith('.json'));
files.forEach(f => {
  const c = fs.readFileSync('data/' + f, 'utf8');
  if (c.includes('2.0160')) {
    console.log('Found 2.0160 in data/' + f);
  }
});
