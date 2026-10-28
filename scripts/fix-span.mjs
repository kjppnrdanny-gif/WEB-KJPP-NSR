import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<span id="label-token-portal">TOKEN OTORISASI / NIK KARYAWAN <span class="text-rose-400">*</span></span></span>',
  '<span id="label-token-portal">TOKEN OTORISASI / NIK KARYAWAN <span class="text-rose-400">*</span></span>'
);
fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed extra span');
