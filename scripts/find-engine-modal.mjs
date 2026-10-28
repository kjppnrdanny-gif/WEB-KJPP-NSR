import fs from 'fs';

const engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');
const lines = engine.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('modal-portal') || line.includes('form-token-portal') || line.includes('OPINI NSR') || line.includes('KMK No.')) {
    console.log(`Line ${idx+1}: ${line.trim().slice(0, 120)}`);
  }
});
