import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const regexes = [
  /function\s+generateNomor[^\(]*\(/g,
  /function\s+updateNomor[^\(]*\(/g,
  /function\s+formatNomor[^\(]*\(/g,
  /function\s+terapkanSaran[^\(]*\(/g,
  /NSR-PST/g,
  /\/NSR\//g,
  /PN-APP/g
];

for (const r of regexes) {
  const matches = [...html.matchAll(r)];
  console.log(`Regex ${r}: found ${matches.length} matches`);
  if (matches.length > 0) {
    const idx = matches[0].index;
    console.log(`Snippet at ${idx}:\n`, html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 400)));
    console.log('----------------------------------------------------');
  }
}
