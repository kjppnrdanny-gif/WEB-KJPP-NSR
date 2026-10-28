import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

console.log('\n--- Searching submitRequest ---');
lines.forEach((l, i) => {
  if (l.includes('submitRequest') || l.includes('form-pengajuan') || l.includes('simpanPengajuan')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});

console.log('\n--- Searching sinkronkanDariServerProxy ---');
lines.forEach((l, i) => {
  if (l.includes('sinkronkanDariServerProxy')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});

console.log('\n--- Searching /api/nolap-data-proxy ---');
lines.forEach((l, i) => {
  if (l.includes('/api/nolap-data-proxy') || l.includes('nolap-data-handler')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});
