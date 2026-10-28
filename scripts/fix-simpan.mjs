import fs from 'fs';

let c = fs.readFileSync('portal-nolap.html', 'utf8');

const bad1 = `      if (!inputNoLap) {
        alert('Harap masukkan Nomor Laporan Resmi.');
        return;

      // Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1'`;

const good1 = `      if (!inputNoLap) {
        alert('Harap masukkan Nomor Laporan Resmi.');
        return;
      }

      // Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1'`;

const badEnd = `          return;
        }
      }
      }`;

const goodEnd = `          return;
        }
      }`;

c = c.replace(bad1, good1);
c = c.replace(bad1.replace(/\n/g, '\r\n'), good1.replace(/\n/g, '\r\n'));

c = c.replace(badEnd, goodEnd);
c = c.replace(badEnd.replace(/\n/g, '\r\n'), goodEnd.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-nolap.html', c, 'utf8');
console.log('Fixed nesting in simpanPenerbitanManual');
