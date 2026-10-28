import fs from 'fs';

const joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const pStart = joHtml.indexOf('const DATABASE_PERSONIL = [');
const pEnd = joHtml.indexOf('];', pStart);
const rawList = joHtml.substring(pStart + 26, pEnd + 1);

// Convert js object literal to JSON
const jsonStr = rawList
  .replace(/(\w+):/g, '"$1":')
  .replace(/'/g, '"')
  .replace(/,\s*]/g, ']');

const personil = JSON.parse(jsonStr);
console.log('JO DATABASE_PERSONIL count:', personil.length);
personil.forEach(p => console.log(`- ${p.nama} (${p.peran}) | HP: ${p.hp} | MAPPI: ${p.mappi} | RMK: ${p.rmk}`));
