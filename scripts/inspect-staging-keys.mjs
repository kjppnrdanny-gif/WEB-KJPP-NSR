import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');

function inspectKey(key) {
  let idx = 0;
  console.log(`\n================= KEY: ${key} =================`);
  while ((idx = text.indexOf(key, idx)) !== -1) {
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + 180);
    const snippet = text.slice(start, end).replace(/[\x00-\x1f]/g, ' ');
    console.log(snippet);
    idx += key.length;
  }
}

inspectKey('1X7kJ8tJbb');
inspectKey('1rhoSmiU');
inspectKey('1SP1qV6ky');
