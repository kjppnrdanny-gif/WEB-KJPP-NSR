import fs from 'fs';

const lines = fs.readFileSync('portal-penugasan-jo.html', 'utf8').split(/\r?\n/);
console.log('Total lines:', lines.length);

function findLines(needle) {
  console.log('=== FIND:', needle, '===');
  lines.forEach((l, i) => {
    if (l.includes(needle)) {
      console.log(`Line ${i + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
}

findLines('entitas_badan_usaha');
findLines('entitas_perorangan');
findLines('onEntitasPemberiTugasChange');
findLines('mapProjectToSheetPayload');
findLines('Data_Penugasan');
findLines('Pengadaan Tanah');
findLines('Termin');
