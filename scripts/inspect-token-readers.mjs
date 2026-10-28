import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.js'));

const keys = [
  'TOKEN_AUTH_NSR',
  'CURRENT_AUTH_TOKEN',
  'NSR_AUTH_TOKEN',
  'NSR_AUTH_HASH',
  'NSR_SESSION_CHECKSUM'
];

keys.forEach(k => {
  console.log(`\n=== KEY: ${k} ===`);
  files.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes(k)) {
      // count occurrences of getItem
      const getMatches = (c.match(new RegExp(`getItem\\(['"]${k}['"]\\)`, 'g')) || []).length;
      const setMatches = (c.match(new RegExp(`setItem\\(['"]${k}['"]`, 'g')) || []).length;
      console.log(`${f}: getItem=${getMatches}, setMatches=${setMatches}`);
    }
  });
});
