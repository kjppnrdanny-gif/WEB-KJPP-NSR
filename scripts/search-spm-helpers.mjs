import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (
    line.includes('isSuperOrAdminPusat') ||
    line.includes('isSpm') ||
    line.includes('KEPALA_SPM') ||
    line.includes('reviewDanny') ||
    line.includes('getQueueDanny')
  ) {
    console.log(`${i + 1}: ${line.trim().slice(0, 100)}`);
  }
}
