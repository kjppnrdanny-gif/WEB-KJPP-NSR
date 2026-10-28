import fs from 'fs';

const lines = fs.readFileSync('portal-nolap-dev.html', 'utf8').split(/\r?\n/);

console.log('--- FINDING FUNCTIONS IN DEV ---');
lines.forEach((l, i) => {
  if (l.includes('function periksaSesiServer') || l.includes('function loginKeServer') || l.includes('function filterTabelRiwayat') || l.includes('function bukaTabMonitoringEksekutif')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
