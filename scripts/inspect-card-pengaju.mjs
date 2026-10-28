import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const cardIdx = content.indexOf('id="card-identitas-pengaju"');
console.log(content.slice(cardIdx, cardIdx + 2000));
