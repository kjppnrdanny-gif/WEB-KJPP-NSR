import fs from 'fs';

const lines = fs.readFileSync('portal-penugasan-jo.html', 'utf8').split(/\r?\n/);

function showRange(title, start, end) {
  console.log(`\n==================== ${title} (lines ${start}-${end}) ====================`);
  for (let i = start - 1; i < end && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

showRange('Pemberi Tugas & Pengguna Laporan HTML', 560, 680);
showRange('Pengadaan Tanah HTML', 835, 930);
showRange('Termin HTML / Form Inputs', 931, 1030);
