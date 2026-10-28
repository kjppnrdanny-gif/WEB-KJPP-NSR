import fs from 'fs';

const c = fs.readFileSync('process-mail-queue.php', 'utf8');
const lines = c.split('\n');

lines.forEach((l, i) => {
  if (l.includes('mailQueueFile') || l.includes('$item') || l.includes('status') || l.includes('to') || l.includes('subject')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
