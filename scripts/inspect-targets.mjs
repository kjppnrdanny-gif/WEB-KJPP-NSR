import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');

const targets = [
  '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY',
  '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6',
  '1Dg_QMOUlAqNOPQI2bHIvmyuqodtWNTPsq22vikDkSLO0CTbwDDTM6P4W',
  '12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E'
];

for (const t of targets) {
  let idx = 0;
  console.log(`\n=== TARGET: ${t} ===`);
  while ((idx = text.indexOf(t, idx)) !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(text.length, idx + 200);
    const snippet = text.slice(start, end).replace(/[\x00-\x1f]/g, ' ');
    console.log('Snippet:', snippet);
    idx += t.length;
  }
}
