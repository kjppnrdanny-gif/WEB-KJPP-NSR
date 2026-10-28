import fs from 'fs';

['data/dual_gate_database.json', 'data/official_register_config.json'].forEach(p => {
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(p, Array.isArray(data) ? `Array(${data.length})` : Object.keys(data));
    if (Array.isArray(data)) {
      data.forEach((r, idx) => {
        const no = r.finalisasi?.nomorLaporanDefinitif || r.nomorLaporan || '';
        const kj = r.klasifikasiJasa || r.penugasan?.klasifikasiJasa || '';
        if (no.includes('/PS/') || kj === 'PS') {
          console.log(`[${p}] ${idx}: ${no} | ${kj}`);
        }
      });
    }
  }
});
