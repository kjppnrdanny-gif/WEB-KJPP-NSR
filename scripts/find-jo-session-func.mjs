import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

lines.forEach((l, i) => {
  if (l.includes('session-label') || l.includes('jo-current-role') || l.includes('userSession.role')) {
    console.log(`L${i+1}: ${l}`);
  }
});
