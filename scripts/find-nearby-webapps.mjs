import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');

const key = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';
let idx = 0;
while ((idx = text.indexOf(key, idx)) !== -1) {
  const start = Math.max(0, idx - 200);
  const end = Math.min(text.length, idx + 400);
  const chunk = text.slice(start, end);
  const webApps = chunk.match(/AKfycb[a-zA-Z0-9_-]+/g);
  if (webApps) {
    console.log('Nearby Web Apps:', webApps);
  }
  idx += key.length;
}
