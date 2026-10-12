// scripts/apply-sop.mjs
import fs from 'fs';
import path from 'path';
import { getSopComponentHtml } from './sop-component.mjs';

const rootDir = process.cwd();
const layananPath = path.join(rootDir, 'layanan.html');
const indexPath = path.join(rootDir, 'index.html');

const sopComponent = getSopComponentHtml();

// 1. Update layanan.html
console.log('Reading layanan.html...');
let layananContent = fs.readFileSync(layananPath, 'utf8');
const isLayananCrlf = layananContent.includes('\r\n');
const lineBreakLayanan = isLayananCrlf ? '\r\n' : '\n';

// Normalize component line endings to match file
const sopComponentLayanan = sopComponent.replace(/\r?\n/g, lineBreakLayanan);

// Find the target section in layanan.html
const startMarkerLayanan = '<!-- ==================== STANDARD OPERATING PROCEDURE';
const endMarkerLayanan = lineBreakLayanan + '    <!-- ==================== CALL TO ACTION ==================== -->';

const startIndexLayanan = layananContent.indexOf(startMarkerLayanan);
if (startIndexLayanan === -1) {
  console.error('Error: startMarkerLayanan not found!');
  process.exit(1);
}

const endIndexLayanan = layananContent.indexOf(endMarkerLayanan, startIndexLayanan);
if (endIndexLayanan === -1) {
  console.error('Error: endMarkerLayanan not found!');
  process.exit(1);
}

// Slice and replace
const newLayananContent = 
  layananContent.substring(0, startIndexLayanan) +
  sopComponentLayanan.trim() +
  lineBreakLayanan + lineBreakLayanan +
  layananContent.substring(endIndexLayanan + lineBreakLayanan.length);

fs.writeFileSync(layananPath, newLayananContent, 'utf8');
console.log('Successfully updated layanan.html!');

// 2. Update index.html
console.log('Reading index.html...');
let indexContent = fs.readFileSync(indexPath, 'utf8');
const isIndexCrlf = indexContent.includes('\r\n');
const lineBreakIndex = isIndexCrlf ? '\r\n' : '\n';

const sopComponentIndex = sopComponent.replace(/\r?\n/g, lineBreakIndex);

const startMarkerIndex = '<!-- ==================== STANDARD OPERATING PROCEDURE';
const endMarkerIndex = lineBreakIndex + '  <section id="faq"';

const startIndexIndex = indexContent.indexOf(startMarkerIndex);
if (startIndexIndex === -1) {
  console.error('Error: startMarkerIndex not found in index.html!');
  process.exit(1);
}

const endIndexIndex = indexContent.indexOf(endMarkerIndex, startIndexIndex);
if (endIndexIndex === -1) {
  console.error('Error: endMarkerIndex not found in index.html!');
  process.exit(1);
}

const newIndexContent = 
  indexContent.substring(0, startIndexIndex) +
  sopComponentIndex.trim() +
  lineBreakIndex + lineBreakIndex +
  indexContent.substring(endIndexIndex + lineBreakIndex.length);

fs.writeFileSync(indexPath, newIndexContent, 'utf8');
console.log('Successfully updated index.html!');
