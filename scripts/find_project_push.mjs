import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('projectDatabase') || l.includes('buatProyekBaru') || l.includes('tambahProyek') || l.includes('submitForm')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
