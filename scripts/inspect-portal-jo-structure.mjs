import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Find sections
const regex = /<section[^>]*>|<!--\s*(?:SECTION|BAGIAN|Section)\s*([0-9A-Za-z]+)[^>]*-->/gi;
let match;
const found = [];
while ((match = regex.exec(html)) !== null) {
  found.push({ index: match.index, text: match[0] });
  if (found.length >= 25) break;
}
console.log('Sections found:', found);

// Search for Nomor SPK or Nomor JO inputs
const inputRegex = /<input[^>]+name=["']([^"']*(?:spk|jo|nomor|surat)[^"']*)["'][^>]*>/gi;
const inputs = [];
while ((match = inputRegex.exec(html)) !== null) {
  inputs.push(match[0]);
  if (inputs.length >= 20) break;
}
console.log('Inputs found:', inputs);
