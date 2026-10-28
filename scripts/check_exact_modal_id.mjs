import fs from 'fs';

const c = fs.readFileSync('index.html', 'utf8');
const regex = /id=["']modal-portal[^"']*["']/gi;
console.log('Matches for modal-portal:', c.match(regex));

const regex2 = /id=["'][^"']*portal[^"']*["']/gi;
console.log('Matches for *portal* ids:', c.match(regex2));
