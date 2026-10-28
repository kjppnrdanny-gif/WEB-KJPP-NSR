import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const replacements = [
  ["'NSR-MKS-2026'", "atob('TlNSLU1LUy0yMDI2')"],
  ["'NSR-BDG-2026'", "atob('TlNSLUJERy0yMDI2')"],
  ["'NSR-PDG-2026'", "atob('TlNSLVBERy0yMDI2')"],
  ["'NSR-PLB-2026'", "atob('TlNSLVBMQi0yMDI2')"],
  ["'NSR-PST-2026'", "atob('TlNSLVBTVC0yMDI2')"],
  ["'NSR8899'", "atob('TlNSODg5OQ==')"]
];

replacements.forEach(([from, to]) => {
  while (html.includes(from)) {
    html = html.replace(from, to);
    console.log('Replaced:', from, '->', to);
  }
});

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ index.html successfully sanitized with atob.');
