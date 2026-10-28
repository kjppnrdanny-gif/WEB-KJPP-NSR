import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idx = content.indexOf('34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2');
console.log(content.slice(idx, idx + 1400));
