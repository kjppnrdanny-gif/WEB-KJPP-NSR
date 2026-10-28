import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

console.log('=== FORM STEPPER & START (Lines 310-370) ===');
for (let i = 310; i < 370; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}

console.log('=== SECTION C 3 LINKS (Lines 890-950) ===');
for (let i = 890; i < 950; i++) {
  if (lines[i].includes('link_laporan') || lines[i].includes('link_pembanding') || lines[i].includes('link_bai') || lines[i].includes('Tautan')) {
    for (let j = Math.max(0, i - 4); j <= Math.min(lines.length - 1, i + 25); j++) {
      console.log(`[${j+1}] ${lines[j]}`);
    }
    break;
  }
}

console.log('=== SECTION D CHECKLIST & DELTA (Lines 1000-1120) ===');
for (let i = 1000; i < 1120; i++) {
  if (lines[i].includes('chk_mitigasi') || lines[i].includes('delta') || lines[i].includes('Delta')) {
    console.log(`[${i+1}] ${lines[i].slice(0, 100)}`);
  }
}
