import fs from 'fs';

console.log('--- Inspecting kwitansi-data-handler.php ---');
const php = fs.readFileSync('kwitansi-data-handler.php', 'utf8');
const phpLines = php.split('\n');
console.log('Total lines in kwitansi-data-handler.php:', phpLines.length);

phpLines.forEach((l, i) => {
  if (l.includes("action === '") || l.includes('action === "') || l.includes('function ') || l.includes('$userRole')) {
    console.log(`${i+1}: ${l.trim().substring(0, 100)}`);
  }
});

console.log('\n--- Inspecting portal-kwitansi.html ---');
const html = fs.readFileSync('portal-kwitansi.html', 'utf8');
const htmlLines = html.split('\n');
console.log('Total lines in portal-kwitansi.html:', htmlLines.length);

const targets = [
  'resolveUnifiedToken',
  'simpanKwitansi',
  'sinkronkan',
  'setujui',
  'batalkan',
  'cetak',
  'unduh',
  'GAS_PENUGASAN_ENDPOINT',
  'tarikData'
];

targets.forEach(t => {
  const matches = [];
  htmlLines.forEach((l, i) => {
    if (l.includes(t)) matches.push(i+1);
  });
  console.log(`${t} found at: ${matches.slice(0, 8).join(', ')} (${matches.length} total)`);
});
