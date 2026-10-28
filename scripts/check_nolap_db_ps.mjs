import fs from 'fs';

const p = 'data/nolap_database.json';
if (fs.existsSync(p)) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log('Total records in nolap_database.json:', data.length);
  data.forEach((r, idx) => {
    if (r.klasifikasiJasa === 'PS' || (r.nomorLaporan && r.nomorLaporan.includes('/PS/'))) {
      console.log(`Record ${idx}: noPermintaan=${r.noPermintaan}, nomorLaporan=${r.nomorLaporan}, klasifikasiJasa=${r.klasifikasiJasa}`);
    }
  });
}
