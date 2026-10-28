import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let txt = fs.readFileSync(filePath, 'utf8');

const target = `<div class="flex items-center gap-4">
                  <!-- Logo Vektor Resmi NSR -->
                  <div class="flex-shrink-0">`;

const repl = `<div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <!-- Logo Vektor Resmi NSR -->
                  <div class="flex-shrink-0">`;

const targetBorder = `<div class="border-l-2 border-slate-800 pl-3.5 space-y-0.5 text-left">`;
const replBorder = `<div class="sm:border-l-2 border-slate-800 sm:pl-3.5 space-y-0.5 text-center sm:text-left">`;

if (txt.includes(target) && txt.includes(targetBorder)) {
  txt = txt.replace(target, repl);
  txt = txt.replace(targetBorder, replBorder);
  fs.writeFileSync(filePath, txt, 'utf8');
  console.log('✓ Polished kop surat mobile responsiveness in portal-surat-umum.html');
} else {
  console.log('Target not found for mobile polish');
}
