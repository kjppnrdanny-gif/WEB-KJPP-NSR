import fs from 'node:fs';

const PREVIEW_PATH = 'preview-diagram-opini-nsr.html';
const INDEX_PATH = 'index.html';

const previewLines = fs.readFileSync(PREVIEW_PATH, 'utf8').split(/\r?\n/);
const indexLines = fs.readFileSync(INDEX_PATH, 'utf8').split(/\r?\n/);

// Find in preview
const pStart = previewLines.findIndex(l => l.includes('TAMPILAN 1: DESKTOP & TABLET'));
const pEnd = previewLines.findIndex(l => l.includes('Tombol Aksi Navigasi Bawah'));

if (pStart === -1 || pEnd === -1) {
  console.error('Markers not found in previewLines', { pStart, pEnd });
  process.exit(1);
}

// Slice out lines from preview (pStart - 1 to get the border comment)
const previewBlock = previewLines.slice(pStart - 1, pEnd).map(l => '      ' + l.trimStart()).join('\n');

// Find in index
const iStart = indexLines.findIndex(l => l.includes('TAMPILAN 1: DESKTOP & TABLET'));
const iEnd = indexLines.findIndex(l => l.includes('Tombol Aksi Navigasi Bawah'));

if (iStart === -1 || iEnd === -1) {
  console.error('Markers not found in indexLines', { iStart, iEnd });
  process.exit(1);
}

const before = indexLines.slice(0, iStart - 1).join('\n');
const after = indexLines.slice(iEnd).join('\n');

const newIndex = before + '\n' + previewBlock + '\n\n            ' + after;
fs.writeFileSync(INDEX_PATH, newIndex, 'utf8');
console.log('✔ index.html successfully updated with pixel-perfect precision diagram!');
