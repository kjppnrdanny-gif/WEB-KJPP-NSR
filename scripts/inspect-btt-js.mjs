import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const matches = [...content.matchAll(/back-to-top/g)];
matches.forEach(m => {
  console.log('--- Context around back-to-top at index', m.index);
  console.log(content.substring(m.index - 100, m.index + 200).replace(/\r?\n/g, ' '));
});
