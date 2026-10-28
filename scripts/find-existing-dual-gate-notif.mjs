import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

lines.forEach((l, i) => {
  if (l.includes('function antrekanEmailDualGate') || l.includes('function generateWhatsAppNotificationLink')) {
    console.log(`L${i+1}: ${l}`);
  }
});
