import fs from 'node:fs';
import path from 'node:path';

const files = ['Code.gs', 'gas-nolap-Code.gs', 'gas-absensi-Code.gs'];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n======================================================`);
  console.log(`FILE: ${file} (${content.length} bytes)`);
  console.log(`======================================================`);

  const lines = content.split('\n');

  // Check doGet & doPost locations
  lines.forEach((line, idx) => {
    if (line.includes('function doGet(') || line.includes('function doPost(')) {
      console.log(`\n[Line ${idx + 1}] ${line.trim()}`);
    }
  });

  // Find switch cases and action checks
  console.log(`\n--- Action Dispatches ---`);
  lines.forEach((line, idx) => {
    if (
      line.includes('action ===') ||
      line.includes('action ==') ||
      line.includes('params.action') ||
      line.includes('case \'') ||
      line.includes('case \"')
    ) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}
