import fs from 'fs';

function findOccurrences(filename) {
  if (!fs.existsSync(filename)) return;
  const lines = fs.readFileSync(filename, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('nanang rahayu')) {
      console.log(`${filename}:${idx + 1}: ${line.trim()}`);
    }
  });
}

console.log('=== Checking occurrences of Nanang Rahayu ===');
findOccurrences('portal-nolap.html');
findOccurrences('portal-kwitansi.html');
findOccurrences('nolap-data-handler.php');
findOccurrences('process-mail-queue.php');
