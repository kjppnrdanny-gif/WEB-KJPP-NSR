import fs from 'fs';

const filePath = 'portal-nolap.html';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = "const isBooking = Boolean(item.modePengajuan === 'BOOKING' || item.isBooking === true);";
const idx = content.indexOf(targetStr);
console.log('Index of targetStr:', idx);

if (idx !== -1) {
  const lineEnd = content.indexOf('const fullNo =', idx);
  console.log('Found fullNo at:', lineEnd);
  
  const snippetOld = content.slice(idx, lineEnd);
  console.log('Snippet to replace:\n', snippetOld);

  const snippetNew = `// Sesuai SE-6/PPPK/2018: Segmen 6 adalah Kode NPWP Klien, HANYA '0' (Non-NPWP) atau '1' (Ber-NPWP).
      // Dilarang keras menggunakan huruf 'B' atau kode status lain pada segmen NoLap Kemenkeu!
      let kodeNpwp = '0';
      if (item.kodeNpwp === '1' || item.kodeNpwp === 1) {
        kodeNpwp = '1';
      } else if (item.kodeNpwp === '0' || item.kodeNpwp === 0) {
        kodeNpwp = '0';
      } else if (item.npwp && String(item.npwp).trim() !== '' && String(item.npwp).trim() !== '-') {
        const cleanDigits = String(item.npwp).replace(/\\D/g, '');
        kodeNpwp = cleanDigits.length >= 10 ? '1' : '0';
      } else if (item.isPemerintahBumn) {
        kodeNpwp = '1';
      }

      const inputTgl = document.getElementById('input-manual-tgl-terbit');
      const refDate = inputTgl?.value ? new Date(inputTgl.value) : (item.tglPenilaian ? new Date(item.tglPenilaian) : new Date());
      const bulanRomawi = BULAN_ROMAWI[refDate.getMonth()] || 'X';
      const tahun = refDate.getFullYear() || 2026;
      const strWaktu = \`\${bulanRomawi}/\${tahun}\`;

      // Format 7 Segmen Baku Sesuai SE-6/PPPK/2018
      `;

  content = content.slice(0, idx) + snippetNew + content.slice(lineEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESSFULLY REPLACED SNIPPET!');
}
