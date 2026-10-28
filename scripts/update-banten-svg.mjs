import fs from 'node:fs';

const pngBuf = fs.readFileSync('images/logos/bank-banten-2026.png');
const b64 = pngBuf.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 388" width="200" height="78" fill="none">
  <!-- PT Bank Pembangunan Daerah Banten (Perseroda) Tbk - Logo Resmi Baru 1 Agustus 2026 -->
  <image href="data:image/png;base64,${b64}" width="1000" height="388" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

fs.writeFileSync('images/logos/bank-banten.svg', svgContent);
console.log('Successfully updated images/logos/bank-banten.svg with official 2026 logo!');
