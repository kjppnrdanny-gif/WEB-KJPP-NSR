import fs from 'node:fs';

const pngBuf = fs.readFileSync('images/logos/bank-sampoerna.png');
const b64 = pngBuf.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 66" width="200" height="66" fill="none">
  <!-- PT Bank Sahabat Sampoerna - Logo Resmi -->
  <image href="data:image/png;base64,${b64}" width="200" height="66" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

fs.writeFileSync('images/logos/bank-sampoerna.svg', svgContent);
console.log('Successfully updated images/logos/bank-sampoerna.svg!');
