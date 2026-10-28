import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

const target = `<div class="flex items-center gap-4">\n                  <!-- Logo Vektor Resmi NSR -->`;
const repl = `<div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">\n                  <!-- Logo Vektor Resmi NSR -->`;

const targetBorder = `<div class="border-l-2 border-slate-800 pl-3.5 space-y-0.5 text-left">`;
const replBorder = `<div class="sm:border-l-2 border-slate-800 sm:pl-3.5 space-y-0.5 text-center sm:text-left">`;

if (normalized.includes(target) && normalized.includes(targetBorder)) {
  normalized = normalized.replace(target, repl);
  normalized = normalized.replace(targetBorder, replBorder);
  const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
  fs.writeFileSync(filePath, out, 'utf8');
  console.log('✓ Successfully polished kop surat mobile responsiveness!');
} else {
  console.log('Target still not matching, check exact string');
}
