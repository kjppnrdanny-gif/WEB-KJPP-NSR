import fs from 'fs';
const gas = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-absensi-Code.gs', 'utf8');

const targets = ['function mintaOTP', 'function verifikasiOTP', 'function simpanAbsensi', 'function simpanWFH', 'function simpanPengajuanCuti', 'function getRiwayatPresensi'];

targets.forEach(t => {
  const p = gas.indexOf(t);
  if (p !== -1) {
    console.log(`\n=== ${t} ===`);
    const snippet = gas.substring(p, p + 1200);
    const returns = snippet.match(/return\s+\{[\s\S]*?\};/g) || [];
    console.log('Returns:', returns.slice(0, 3).map(r => r.replace(/\s+/g, ' ')));
  }
});
