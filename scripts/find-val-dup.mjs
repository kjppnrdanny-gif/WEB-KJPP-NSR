import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('function validasiDuplikatLive(')) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
