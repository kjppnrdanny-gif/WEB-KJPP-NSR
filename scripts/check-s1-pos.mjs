import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const s1Idx = lines.findIndex(l => l.includes('<!-- 1. IDENTITAS WILAYAH & NOMOR SURAT -->'));
console.log('s1Idx:', s1Idx);
console.log(lines.slice(s1Idx - 20, s1Idx + 15).join('\n'));
