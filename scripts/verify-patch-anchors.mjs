import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

function printRange(title, start, end) {
  console.log(`=== ${title} (Lines ${start}-${end}) ===`);
  for (let i = start - 1; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printRange('Form Start', 310, 318);
printRange('Between Step 1 and Seksi D', 972, 982);
printRange('End of Form', 1105, 1125);
printRange('SPM Umum Bagian F', 6005, 6015);
printRange('SPM Tanah Bagian G', 7734, 7744);
printRange('SPM Ruislagh Bagian 8', 12956, 12966);
