import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

const driveIdx = lines.findIndex(l => l.includes('function muatMasterGoogleDrive'));
console.log('driveIdx:', driveIdx);
console.log(lines.slice(driveIdx, driveIdx + 10).join('\n'));
