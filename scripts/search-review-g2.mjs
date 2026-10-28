import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (
    line.includes('bukaModalReviewGerbang2') ||
    line.includes('reviewDannyGerbang2') ||
    line.includes('bukaModalSubmitGerbang2') ||
    line.includes('modal-review-g2') ||
    line.includes('g2ActiveReviewItem')
  ) {
    console.log(`${i + 1}: ${line.trim().slice(0, 100)}`);
  }
}
