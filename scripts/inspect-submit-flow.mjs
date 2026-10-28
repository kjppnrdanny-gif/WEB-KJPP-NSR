import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

console.log('=== FORM ELEMENT ===');
lines.forEach((l, i) => {
  if (l.includes('<form') || l.includes('id="form-penugasan"')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

console.log('=== SUBMIT HANDLERS & VALIDATION ===');
lines.forEach((l, i) => {
  if (l.includes('form-penugasan') && (l.includes('submit') || l.includes('addEventListener'))) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
  if (l.includes('function handle') || l.includes('function submit') || l.includes('function kirim') || l.includes('function simpan')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
