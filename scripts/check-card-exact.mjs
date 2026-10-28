import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const cardIdx = content.indexOf('pengaju_wa_display');
console.log(content.slice(cardIdx - 100, cardIdx + 400));
