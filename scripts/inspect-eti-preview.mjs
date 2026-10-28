import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log(html.substring(855000, 856500));
