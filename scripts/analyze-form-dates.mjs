import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('=== SEARCH ALL DATE INPUTS IN FORM ===');
const matches = jo.match(/<input[^>]*type=["']date["'][^>]*>/g) || [];
matches.forEach(m => console.log(m));

console.log('\n=== DRAFT BUILDER DATES ===');
const bIdx = jo.indexOf('function bangunDraftDariForm');
if (bIdx !== -1) {
  const bSnippet = jo.substring(bIdx, bIdx + 3000);
  const dateLines = bSnippet.split('\n').filter(l => l.includes('tgl') || l.includes('tanggal') || l.includes('Date'));
  dateLines.forEach(l => console.log(l.trim()));
}
