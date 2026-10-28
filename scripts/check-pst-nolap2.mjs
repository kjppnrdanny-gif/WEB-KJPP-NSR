import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const pstRawHash = '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2';
const idx = content.indexOf(pstRawHash);
const endIdx = content.indexOf('}', idx);
console.log(content.slice(idx, endIdx + 2));
