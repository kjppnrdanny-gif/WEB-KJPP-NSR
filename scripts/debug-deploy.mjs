// scripts/debug-deploy.mjs
import fs from 'fs';

let raw = fs.readFileSync('gas-job-tracking.gs', 'utf8');
const lines = raw.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Spreadsheet_') || l.includes('function get')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
