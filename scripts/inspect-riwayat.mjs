import fs from 'fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split(/\r?\n/);

console.log('--- FINDING RIWAYAT RENDERING ---');
lines.forEach((l, i) => {
  if (l.includes('function muatUlangTabel') || l.includes('function renderTabel') || l.includes('filterCabangRiwayat') || l.includes('tabel-riwayat') || l.includes('tabel-daftar-permohonan')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
